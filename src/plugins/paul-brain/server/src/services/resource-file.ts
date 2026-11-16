import { createHash, createHmac, timingSafeEqual } from 'crypto';
import { lookup } from 'dns/promises';
import { existsSync, readFileSync } from 'fs';
import { isIP } from 'net';
import path from 'path';
import { extractResourceText } from './extract-text';

export const MAX_RESOURCE_FILE_BYTES = 25 * 1024 * 1024;

/**
 * MCP counts the payload twice against ~950KB. Keep inline base64 well under that.
 * Larger files are returned as a short-lived signed URL instead of bytes.
 */
export const BASE64_INLINE_LIMIT = 120_000;

export const FILE_URL_TTL_MS = 10 * 60 * 1000;

const IMAGE_CAPTION_MIMES = new Set(['image/jpeg', 'image/png', 'image/gif', 'image/webp']);

const EXT_MIME: Record<string, string> = {
  '.txt': 'text/plain',
  '.md': 'text/markdown',
  '.markdown': 'text/markdown',
  '.csv': 'text/csv',
  '.pdf': 'application/pdf',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.mov': 'video/quicktime',
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
  '.m4a': 'audio/mp4',
};

const DOCUMENT_MIMES = new Set([
  'text/plain',
  'text/markdown',
  'text/x-markdown',
  'text/csv',
  'text/html',
  'application/pdf',
  'application/msword',
  'application/rtf',
  'text/rtf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/vnd.oasis.opendocument.text',
  'application/vnd.oasis.opendocument.spreadsheet',
  'application/vnd.oasis.opendocument.presentation',
]);

const DENIED_MIMES = new Set([
  'image/svg+xml',
  'application/vnd.microsoft.portable-executable',
  'application/x-msdownload',
  'application/x-msdos-program',
  'application/x-executable',
  'application/x-dosexec',
  'application/x-sh',
  'text/x-shellscript',
  'application/x-mach-binary',
]);

export interface UploadFileRecord {
  id?: number;
  url?: string;
  name?: string;
  mime?: string;
  ext?: string;
  size?: number;
  hash?: string;
  provider?: string;
  alternativeText?: string;
  buffer?: Buffer;
  formats?: unknown;
  previewUrl?: string;
}

export function hashBuffer(buffer: Buffer): string {
  return createHash('sha256').update(buffer).digest('hex');
}

export function safeFilename(name: string): string {
  const base = name.split(/[/\\]/).pop() || 'file';
  const cleaned = base.replace(/[^\w.\-]+/g, '_').replace(/^\.+/, '');
  return (cleaned || 'file').slice(0, 180);
}

export function extensionMime(filename: string): string | undefined {
  const match = /(\.[A-Za-z0-9]+)$/.exec(filename.trim());
  if (!match) return undefined;
  return EXT_MIME[match[1].toLowerCase()];
}

export function normalizeMime(mime: string | undefined, filename: string): string {
  const declared = (mime || '').split(';')[0].trim().toLowerCase();
  if (!declared || declared === 'application/octet-stream') {
    return extensionMime(filename) || declared || 'application/octet-stream';
  }
  return declared;
}

export function isAllowedResourceMime(mime: string): boolean {
  if (!mime || DENIED_MIMES.has(mime)) return false;
  if (mime.startsWith('image/')) return mime !== 'image/svg+xml';
  if (mime.startsWith('video/') || mime.startsWith('audio/')) return true;
  return DOCUMENT_MIMES.has(mime);
}

export function normalizeResourceUrl(input: string): string {
  const trimmed = input.trim();
  try {
    const url = new URL(trimmed);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return trimmed.replace(/\/+$/, '');
    url.hash = '';
    const pathName = url.pathname.replace(/\/+$/, '');
    return `${url.protocol.toLowerCase()}//${url.host.toLowerCase()}${pathName}${url.search}`;
  } catch {
    return trimmed.replace(/\/+$/, '');
  }
}

export function assertResourceBytes(buffer: Buffer) {
  if (buffer.length === 0) throw new Error('File is empty');
  if (buffer.length > MAX_RESOURCE_FILE_BYTES) throw new Error('File exceeds 25 MB');
}

export function decodeFileBase64(input: string): Buffer {
  const cleaned = input.replace(/^data:[^;]+;base64,/i, '').replace(/\s+/g, '');
  if (!cleaned) throw new Error('fileBase64 is empty');
  const maxChars = Math.ceil((MAX_RESOURCE_FILE_BYTES * 4) / 3) + 8;
  if (cleaned.length > maxChars) throw new Error('File exceeds 25 MB');
  const buffer = Buffer.from(cleaned, 'base64');
  assertResourceBytes(buffer);
  return buffer;
}

function isPrivateIp(ip: string): boolean {
  const mapped = ip.startsWith('::ffff:') ? ip.slice(7) : ip;
  if (mapped === '::1') return true;
  const lower = mapped.toLowerCase();
  if (lower.startsWith('fe80:') || lower.startsWith('fc') || lower.startsWith('fd')) return true;
  if (!isIP(mapped) || mapped.includes(':')) return mapped.includes(':');
  const parts = mapped.split('.').map((part) => Number(part));
  if (parts.length !== 4 || parts.some((part) => Number.isNaN(part))) return true;
  const [a, b] = parts;
  if (a === 10 || a === 127 || a === 0) return true;
  if (a === 169 && b === 254) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 192 && b === 168) return true;
  if (a === 100 && b >= 64 && b <= 127) return true;
  return false;
}

const BLOCKED_HOSTS = new Set(['localhost', 'metadata.google.internal']);

async function assertPublicHttpUrl(target: string, resolveHost?: (hostname: string) => Promise<string[]>) {
  let url: URL;
  try {
    url = new URL(target);
  } catch {
    throw new Error('fileUrl must be an http(s) URL');
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new Error('Only http(s) file URLs are allowed');
  }
  const host = url.hostname.replace(/^\[|\]$/g, '').toLowerCase();
  if (BLOCKED_HOSTS.has(host) || host.endsWith('.localhost') || host.endsWith('.local')) {
    throw new Error('Refusing to fetch a private or local URL');
  }
  const addresses = isIP(host)
    ? [host]
    : resolveHost
      ? await resolveHost(host)
      : (await lookup(host, { all: true })).map((entry) => entry.address);
  if (addresses.length === 0 || addresses.some((address) => isPrivateIp(address))) {
    throw new Error('Refusing to fetch a private or local URL');
  }
}

export async function fetchRemoteFile(
  fileUrl: string,
  deps: {
    fetchImpl?: typeof fetch;
    resolveHost?: (hostname: string) => Promise<string[]>;
  } = {}
): Promise<{ buffer: Buffer; mime?: string }> {
  const fetchImpl = deps.fetchImpl ?? fetch;
  let current = fileUrl;
  for (let hop = 0; hop < 3; hop += 1) {
    await assertPublicHttpUrl(current, deps.resolveHost);
    const response = await fetchImpl(current, { redirect: 'manual' });
    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get('location');
      if (!location) throw new Error('File URL redirect is missing a location');
      current = new URL(location, current).toString();
      continue;
    }
    if (!response.ok) throw new Error(`Could not fetch file (${response.status})`);
    const advertised = Number(response.headers.get('content-length') || 0);
    if (advertised > MAX_RESOURCE_FILE_BYTES) throw new Error('File exceeds 25 MB');
    const buffer = Buffer.from(await response.arrayBuffer());
    assertResourceBytes(buffer);
    const mime = response.headers.get('content-type')?.split(';')[0]?.trim().toLowerCase();
    return { buffer, mime };
  }
  throw new Error('Too many redirects fetching file URL');
}

export function fileAccessSecret(strapi: { config?: { get?: (key: string) => unknown } }): string {
  const keys = strapi.config?.get?.('server.app.keys');
  const list = Array.isArray(keys) ? keys : typeof keys === 'string' ? keys.split(',') : [];
  const first = list.map((key) => String(key).trim()).find(Boolean);
  if (first) return first;
  const admin = strapi.config?.get?.('admin.auth.secret');
  if (typeof admin === 'string' && admin.trim()) return admin.trim();
  const env = process.env.APP_KEYS || process.env.ADMIN_JWT_SECRET || '';
  const fromEnv = env.split(',').map((key) => key.trim()).find(Boolean);
  if (fromEnv) return fromEnv;
  throw new Error('Cannot sign a file URL without APP_KEYS');
}

export function signFileToken(
  strapi: { config?: { get?: (key: string) => unknown } },
  documentId: string,
  now = Date.now()
): { token: string; expiresAt: string } {
  const exp = now + FILE_URL_TTL_MS;
  const payload = Buffer.from(JSON.stringify({ d: documentId, e: exp })).toString('base64url');
  const sig = createHmac('sha256', fileAccessSecret(strapi)).update(payload).digest('base64url');
  return { token: `${payload}~${sig}`, expiresAt: new Date(exp).toISOString() };
}

export function verifyFileToken(
  strapi: { config?: { get?: (key: string) => unknown } },
  token: string,
  now = Date.now()
): string {
  const splitAt = token.lastIndexOf('~');
  if (splitAt <= 0) throw new Error('Invalid or expired file link');
  const payload = token.slice(0, splitAt);
  const sig = token.slice(splitAt + 1);
  const expected = createHmac('sha256', fileAccessSecret(strapi)).update(payload).digest('base64url');
  const actualBuf = Buffer.from(sig);
  const expectedBuf = Buffer.from(expected);
  if (actualBuf.length !== expectedBuf.length || !timingSafeEqual(actualBuf, expectedBuf)) {
    throw new Error('Invalid or expired file link');
  }
  let body: { d?: unknown; e?: unknown };
  try {
    body = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
  } catch {
    throw new Error('Invalid or expired file link');
  }
  if (typeof body.e !== 'number' || body.e < now || typeof body.d !== 'string' || !body.d) {
    throw new Error('Invalid or expired file link');
  }
  return body.d;
}

export function publicFileView(file: unknown) {
  if (!file || typeof file !== 'object') return undefined;
  const row = file as UploadFileRecord;
  const view: Record<string, unknown> = {};
  if (typeof row.id === 'number') view.id = row.id;
  if (row.name) view.name = row.name;
  if (row.mime) view.mime = row.mime;
  if (row.ext) view.ext = row.ext;
  if (typeof row.size === 'number') view.size = row.size;
  if (row.alternativeText) view.alternativeText = row.alternativeText;
  return Object.keys(view).length > 0 ? view : undefined;
}

export function serverPublicBase(strapi: { config?: { get?: (key: string) => unknown } }): string {
  const configured = strapi.config?.get?.('server.url') || process.env.PUBLIC_URL || '';
  return String(configured).replace(/\/$/, '');
}

export function signedFilePath(token: string): string {
  return `/api/paul-brain/resource-file/${token}`;
}

function localUploadPath(strapi: { dirs?: { static?: { public?: string } } }, file: UploadFileRecord): string | undefined {
  if (!file.url || (file.provider && file.provider !== 'local')) return undefined;
  const relative = String(file.url).replace(/^https?:\/\/[^/]+/i, '').replace(/^\//, '');
  if (!relative || relative.includes('..')) return undefined;
  const roots = [strapi.dirs?.static?.public, path.join(process.cwd(), 'public')].filter(
    (root): root is string => Boolean(root)
  );
  for (const root of roots) {
    const full = path.join(root, relative);
    if (existsSync(full)) return full;
  }
  return undefined;
}

export async function loadFileBytes(
  strapi: { dirs?: { static?: { public?: string } }; config?: { get?: (key: string) => unknown } },
  file: UploadFileRecord,
  deps: {
    fetchImpl?: typeof fetch;
    resolveHost?: (hostname: string) => Promise<string[]>;
  } = {}
): Promise<Buffer> {
  if (Buffer.isBuffer(file.buffer)) return file.buffer;
  const local = localUploadPath(strapi, file);
  if (local) return readFileSync(local);
  if (!file.url) throw new Error('File content is not available');
  const absolute = /^https?:\/\//i.test(file.url)
    ? file.url
    : `${serverPublicBase(strapi)}${file.url.startsWith('/') ? '' : '/'}${file.url}`;
  if (!absolute.startsWith('http')) throw new Error('File content is not available');
  const fetched = await fetchRemoteFile(absolute, deps);
  return fetched.buffer;
}

export async function captionResource(options: {
  buffer: Buffer;
  mime: string;
  env?: NodeJS.ProcessEnv;
  fetchImpl?: typeof fetch;
  model?: string;
}): Promise<string | undefined> {
  const mime = options.mime.toLowerCase();
  if (!IMAGE_CAPTION_MIMES.has(mime)) return undefined;
  if (options.buffer.length > 5 * 1024 * 1024) return undefined;
  const env = options.env ?? process.env;
  const apiKey = env.ANTHROPIC_API_KEY?.trim();
  if (!apiKey) return undefined;
  const model = options.model || env.TANSTACK_AI_MODEL || 'claude-sonnet-5';
  const fetchImpl = options.fetchImpl ?? fetch;
  try {
    const response = await fetchImpl('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model,
        max_tokens: 200,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image',
                source: {
                  type: 'base64',
                  media_type: mime,
                  data: options.buffer.toString('base64'),
                },
              },
              {
                type: 'text',
                text: 'Write one short caption for this image, under 200 characters. No quotes or preamble.',
              },
            ],
          },
        ],
      }),
    });
    if (!response.ok) return undefined;
    const json = (await response.json()) as { content?: Array<{ type?: string; text?: string }> };
    const text = json.content?.find((block) => block.type === 'text')?.text?.replace(/\s+/g, ' ').trim();
    if (!text) return undefined;
    return text.slice(0, 500);
  } catch {
    return undefined;
  }
}

export { extractResourceText };
