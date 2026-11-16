import { deflateSync } from 'zlib';
import { describe, expect, it } from 'vitest';
import { extractDocxText, extractPdfText, unzipStored } from '../services/extract-text';
import {
  fetchRemoteFile,
  isAllowedResourceMime,
  normalizeResourceUrl,
  publicFileView,
  signFileToken,
  verifyFileToken,
  FILE_URL_TTL_MS,
} from '../services/resource-file';
import { captionResource } from '../services/resource-file';
import { createResourceService } from '../services/resource';
import { readFileSync } from 'fs';

function pdf(content: string, compress: boolean): Buffer {
  const raw = Buffer.from(`BT (${content}) Tj ET`);
  const stream = compress ? deflateSync(raw) : raw;
  const filter = compress ? '/Filter /FlateDecode ' : '';
  const objects = Buffer.concat([
    Buffer.from(
      '%PDF-1.4\n' +
        '1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj\n' +
        '2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj\n' +
        '3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 300 144] /Contents 4 0 R >> endobj\n' +
        `4 0 obj << ${filter}/Length ${stream.length} >> stream\n`
    ),
    stream,
    Buffer.from('\nendstream\nendobj\ntrailer << /Root 1 0 R >>\n%%EOF\n'),
  ]);
  return objects;
}

function storedZip(files: Record<string, string>): Buffer {
  const parts: Buffer[] = [];
  for (const [name, content] of Object.entries(files)) {
    const nameBuf = Buffer.from(name);
    const data = Buffer.from(content);
    const header = Buffer.alloc(30);
    header.writeUInt32LE(0x04034b50, 0);
    header.writeUInt16LE(20, 4);
    header.writeUInt16LE(0, 8);
    header.writeUInt32LE(data.length, 18);
    header.writeUInt32LE(data.length, 22);
    header.writeUInt16LE(nameBuf.length, 26);
    parts.push(header, nameBuf, data);
  }
  return Buffer.concat(parts);
}

describe('resource text extraction', () => {
  it('reads uncompressed and flate PDF text', () => {
    expect(extractPdfText(pdf('Hello from the pdf', false))).toContain('Hello from the pdf');
    expect(extractPdfText(pdf('Hello from the pdf', true))).toContain('Hello from the pdf');
  });

  it('reads docx paragraphs from word/document.xml', () => {
    const xml =
      '<?xml version="1.0"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">' +
      '<w:body><w:p><w:r><w:t>Hello from docx</w:t></w:r></w:p>' +
      '<w:p><w:r><w:t>Line &amp; two</w:t></w:r></w:p></w:body></w:document>';
    const buffer = storedZip({ 'word/document.xml': xml });
    expect(unzipStored(buffer).get('word/document.xml')?.toString('utf8')).toContain('Hello from docx');
    expect(extractDocxText(buffer)).toBe('Hello from docx\nLine & two');
  });
});

describe('private file access', () => {
  const strapi = { config: { get: () => ['test-secret'] } };

  it('normalizes page urls and hides upload urls', () => {
    expect(normalizeResourceUrl('HTTPS://Cursor.com/canvas/Example/')).toBe('https://cursor.com/canvas/Example');
    expect(
      publicFileView({
        id: 3,
        url: 'https://cdn.example/public/file.png',
        formats: { thumbnail: { url: 'https://cdn.example/thumb.png' } },
        previewUrl: 'https://cdn.example/preview.png',
        name: 'file.png',
        mime: 'image/png',
      })
    ).toEqual({ id: 3, name: 'file.png', mime: 'image/png' });
  });

  it('signs a file link and rejects a tampered or expired token', () => {
    const now = 1_700_000_000_000;
    const signed = signFileToken(strapi, 'doc-1', now);
    expect(verifyFileToken(strapi, signed.token, now + 1000)).toBe('doc-1');
    expect(signed.expiresAt).toBe(new Date(now + FILE_URL_TTL_MS).toISOString());
    expect(() => verifyFileToken(strapi, signed.token, now + FILE_URL_TTL_MS + 1)).toThrow(/expired/i);
    expect(() => verifyFileToken(strapi, `${signed.token}x`, now)).toThrow(/invalid or expired/i);
  });

  it('refuses private and local file URLs', async () => {
    await expect(fetchRemoteFile('http://127.0.0.1/secret.pdf', { fetchImpl: fetch })).rejects.toThrow(/private or local/i);
    await expect(fetchRemoteFile('http://169.254.169.254/latest', { fetchImpl: fetch })).rejects.toThrow(/private or local/i);
    await expect(fetchRemoteFile('http://localhost/file', { fetchImpl: fetch })).rejects.toThrow(/private or local/i);
    await expect(
      fetchRemoteFile('https://files.example/doc.pdf', {
        resolveHost: async () => ['10.1.1.1'],
        fetchImpl: fetch,
      })
    ).rejects.toThrow(/private or local/i);
  });

  it('fetches a public URL and stops at 25 MB', async () => {
    const fetchImpl = (async () =>
      new Response(Buffer.from('hello file'), {
        status: 200,
        headers: { 'content-type': 'text/plain' },
      })) as typeof fetch;
    const fetched = await fetchRemoteFile('https://files.example/note.txt', {
      resolveHost: async () => ['1.1.1.1'],
      fetchImpl,
    });
    expect(fetched.buffer.toString('utf8')).toBe('hello file');
    expect(fetched.mime).toBe('text/plain');

    const huge = (async () =>
      new Response('nope', { status: 200, headers: { 'content-length': String(26 * 1024 * 1024) } })) as typeof fetch;
    await expect(
      fetchRemoteFile('https://files.example/big.bin', { resolveHost: async () => ['1.1.1.1'], fetchImpl: huge })
    ).rejects.toThrow(/25 MB/);
  });

  it('allows documents, images, video, and audio, and rejects svg', () => {
    expect(isAllowedResourceMime('image/png')).toBe(true);
    expect(isAllowedResourceMime('video/mp4')).toBe(true);
    expect(isAllowedResourceMime('audio/mpeg')).toBe(true);
    expect(isAllowedResourceMime('application/pdf')).toBe(true);
    expect(isAllowedResourceMime('text/markdown')).toBe(true);
    expect(isAllowedResourceMime('image/svg+xml')).toBe(false);
    expect(isAllowedResourceMime('application/x-sh')).toBe(false);
  });

  it('captions an image when the API key is set and skips otherwise', async () => {
    const calls: string[] = [];
    const fetchImpl = (async (url: string) => {
      calls.push(url);
      return new Response(JSON.stringify({ content: [{ type: 'text', text: 'A red barn at dusk' }] }), { status: 200 });
    }) as typeof fetch;

    expect(await captionResource({ buffer: Buffer.from('png'), mime: 'image/png', env: {} })).toBeUndefined();
    expect(calls).toEqual([]);
    expect(
      await captionResource({
        buffer: Buffer.from('png'),
        mime: 'video/mp4',
        env: { ANTHROPIC_API_KEY: 'key' },
        fetchImpl,
      })
    ).toBeUndefined();
    expect(calls).toEqual([]);
    expect(
      await captionResource({
        buffer: Buffer.from('png'),
        mime: 'image/png',
        env: { ANTHROPIC_API_KEY: 'key', TANSTACK_AI_MODEL: 'claude-sonnet-5' },
        fetchImpl,
      })
    ).toBe('A red barn at dusk');
    expect(calls[0]).toContain('api.anthropic.com');
  });
});

describe('large resource files', () => {
  it('returns a signed access URL and not the public upload URL', async () => {
    const tables = new Map<string, any[]>();
    let seq = 0;
    const files = new Map<number, any>();
    const strapi = {
      tables,
      config: { get: (key: string) => (key === 'server.url' ? 'https://brain.example' : ['test-secret']) },
      log: { warn: () => undefined },
      plugin() {
        return {
          service: () => ({
            async upload({ files: file }: { files: { filepath: string; originalFilename: string; mimetype: string } }) {
              const buffer = readFileSync(file.filepath);
              const id = files.size + 1;
              const stored = {
                id,
                name: file.originalFilename,
                mime: file.mimetype,
                provider: 'local',
                url: 'https://cdn.example/uploads/huge.mp4',
                buffer,
              };
              files.set(id, stored);
              return [stored];
            },
            async findOne(id: number) {
              return files.get(id) ?? null;
            },
          }),
        };
      },
      documents(uid: string) {
        if (!tables.has(uid)) tables.set(uid, []);
        const rows = () => tables.get(uid)!;
        return {
          async findMany(params: any = {}) {
            const filters = params.filters || {};
            const list = rows().filter((row) => {
              if (Array.isArray(filters.$or)) {
                const matched = filters.$or.some((clause: any) => {
                  const [field, cond] = Object.entries(clause)[0] as [string, any];
                  return row[field] === cond?.$eq;
                });
                if (!matched) return false;
              }
              for (const [key, cond] of Object.entries(filters)) {
                if (key === '$or') continue;
                if (cond && typeof cond === 'object' && '$eq' in (cond as any) && row[key] !== (cond as any).$eq) {
                  return false;
                }
              }
              return true;
            });
            return list.map((row) => ({ ...row }));
          },
          async create({ data }: { data: any }) {
            seq += 1;
            const row = { documentId: `doc-${seq}`, id: seq, state: data.state, ...data };
            rows().push(row);
            return { ...row };
          },
          async update({ documentId, data }: { documentId: string; data: any }) {
            const row = rows().find((item) => item.documentId === documentId);
            Object.assign(row, data);
            return { ...row };
          },
        };
      },
    };

    const previousKey = process.env.ANTHROPIC_API_KEY;
    delete process.env.ANTHROPIC_API_KEY;
    try {
      const service = createResourceService(strapi as any);
      const saved = await service.save({ title: 'Clip', format: 'other' });
      const bytes = Buffer.alloc(130_000, 7);
      const attached = await service.attach({
        identifier: saved.documentId,
        filename: 'clip.mp4',
        mime: 'video/mp4',
        fileBase64: bytes.toString('base64'),
      });
      expect(attached.captioned).toBe(false);
      expect(attached.extractedTextStored).toBe(false);
      expect(JSON.stringify(attached)).not.toContain('cdn.example');

      const read = await service.readFile(saved.documentId);
      expect(read.encoding).toBe('signed-url');
      expect(read.accessUrl).toMatch(/^https:\/\/brain\.example\/api\/paul-brain\/resource-file\//);
      expect(JSON.stringify(read)).not.toContain('cdn.example');
      expect(JSON.stringify(read)).not.toContain('/uploads/');
    } finally {
      if (previousKey === undefined) delete process.env.ANTHROPIC_API_KEY;
      else process.env.ANTHROPIC_API_KEY = previousKey;
    }
  });
});
