import { describe, expect, it } from 'vitest';
import { MemoryVectorIndex, recordFromRow } from '../services/vector-store';
import {
  EMBEDDING_MODEL,
  EMBEDDING_VERSION,
  REINDEX_PAGE_SIZE,
  buildEmbedText,
  decodeVector,
  effectiveStatus,
  encodeVector,
  indexIntent,
  normalizeDocumentText,
  pageThrough,
  retryDelayMs,
  shouldSkipEmbed,
  textHash,
} from '../services/text';

describe('embed text', () => {
  it('strips HTML and Markdown and collapses whitespace', () => {
    const text = buildEmbedText(
      ['body'],
      { body: '<p>Hello</p> **bold** [label](https://example.com) `code`\n\n# Title' }
    );
    expect(text).toContain('Hello');
    expect(text).toContain('bold');
    expect(text).toContain('label');
    expect(text).toContain('code');
    expect(text).toContain('Title');
    expect(text).not.toContain('<p>');
    expect(text).not.toContain('**');
    expect(text).not.toContain('https://example.com');
    expect(normalizeDocumentText('a   \n\n  b')).toBe('a b');
  });

  it('hashes the normalized text and skips only an unchanged current vector', () => {
    const text = buildEmbedText(['title', 'tags'], { title: 'Habitat', tags: ['zephyr'] });
    const hash = textHash(text);
    expect(hash).toHaveLength(64);
    const next = { model: EMBEDDING_MODEL, version: EMBEDDING_VERSION, textHash: hash };
    expect(shouldSkipEmbed({ model: EMBEDDING_MODEL, version: EMBEDDING_VERSION, textHash: hash, status: 'current', hasVector: true }, next)).toBe(true);
    expect(shouldSkipEmbed({ model: EMBEDDING_MODEL, version: EMBEDDING_VERSION, textHash: 'other', status: 'current', hasVector: true }, next)).toBe(false);
    expect(shouldSkipEmbed({ model: 'other-model', version: EMBEDDING_VERSION, textHash: hash, status: 'current', hasVector: true }, next)).toBe(false);
    expect(shouldSkipEmbed({ model: EMBEDDING_MODEL, version: EMBEDDING_VERSION + 1, textHash: hash, status: 'current', hasVector: true }, next)).toBe(false);
    expect(shouldSkipEmbed({ model: EMBEDDING_MODEL, version: 1, textHash: hash, status: 'current', hasVector: true }, next)).toBe(false);
    expect(effectiveStatus(
      { model: EMBEDDING_MODEL, embeddingVersion: 1, status: 'current', hasVector: true },
      { model: EMBEDDING_MODEL, version: EMBEDDING_VERSION }
    )).toBe('stale');
    expect(shouldSkipEmbed({ model: EMBEDDING_MODEL, version: EMBEDDING_VERSION, textHash: hash, status: 'failed', hasVector: true }, next)).toBe(false);
    expect(shouldSkipEmbed(null, next)).toBe(false);
  });
});

describe('effective status', () => {
  it('treats a model or version mismatch as stale even when the column says current', () => {
    expect(
      effectiveStatus(
        { model: 'old-model', embeddingVersion: EMBEDDING_VERSION, status: 'current', hasVector: true },
        { model: EMBEDDING_MODEL, version: EMBEDDING_VERSION }
      )
    ).toBe('stale');
    expect(
      effectiveStatus(
        { model: EMBEDDING_MODEL, embeddingVersion: 0, status: 'current', hasVector: true },
        { model: EMBEDDING_MODEL, version: EMBEDDING_VERSION }
      )
    ).toBe('stale');
    expect(
      effectiveStatus(
        { model: EMBEDDING_MODEL, embeddingVersion: EMBEDDING_VERSION, status: 'current', hasVector: true },
        { model: EMBEDDING_MODEL, version: EMBEDDING_VERSION }
      )
    ).toBe('current');
    expect(
      effectiveStatus(
        { model: EMBEDDING_MODEL, embeddingVersion: EMBEDDING_VERSION, status: 'failed', hasVector: true },
        { model: EMBEDDING_MODEL, version: EMBEDDING_VERSION }
      )
    ).toBe('failed');
  });

  it('skips stale rows at read time', () => {
    const index = new MemoryVectorIndex();
    const encoded = encodeVector([1, 0]);
    const decoded = decodeVector(encoded);
    expect(Array.from(decoded)).toEqual([1, 0]);
    const stale = recordFromRow({
      uid: 'plugin::demo.note',
      document_id: 'stale-row',
      model: 'old-model',
      embedding_version: EMBEDDING_VERSION,
      text_hash: 'abc',
      embedding_b64: encoded,
      status: 'current',
      preview: 'old',
    });
    const current = recordFromRow({
      uid: 'plugin::demo.note',
      document_id: 'current-row',
      model: EMBEDDING_MODEL,
      embedding_version: EMBEDDING_VERSION,
      text_hash: 'def',
      embedding_b64: encodeVector([0, 1]),
      status: 'current',
      preview: 'new',
    });
    expect(stale.status).toBe('stale');
    expect(current.status).toBe('current');
    index.upsert(stale);
    index.upsert(current);
    const hits = index.rank(new Float32Array([1, 0]), null, 10);
    expect(hits.map((hit) => hit.documentId)).toEqual(['current-row']);
    expect(index.counts()).toMatchObject({ current: 1, stale: 1 });
  });
});

describe('draft and publish', () => {
  it('indexes published writes and ignores drafts', () => {
    expect(indexIntent('create', false, null)).toBe('index');
    expect(indexIntent('update', false, 'draft')).toBe('index');
    expect(indexIntent('create', true, 'draft')).toBe('ignore');
    expect(indexIntent('update', true, null)).toBe('ignore');
    expect(indexIntent('update', true, 'published')).toBe('index');
    expect(indexIntent('publish', true, null)).toBe('index');
    expect(indexIntent('unpublish', true, null)).toBe('remove');
    expect(indexIntent('delete', false, null)).toBe('remove');
    expect(indexIntent('findMany', false, null)).toBe('ignore');
  });
});

describe('reindex paging', () => {
  it('pages with a small limit and never asks for 10000 rows', async () => {
    expect(REINDEX_PAGE_SIZE).toBe(100);
    expect(REINDEX_PAGE_SIZE).toBeLessThan(10000);
    const rows = Array.from({ length: 250 }, (_, index) => ({ documentId: `doc-${index}` }));
    const calls: Array<{ start: number; limit: number }> = [];
    const seen: string[] = [];
    await pageThrough(
      async (start, limit) => {
        calls.push({ start, limit });
        return rows.slice(start, start + limit);
      },
      async (row) => {
        seen.push(row.documentId!);
      },
      REINDEX_PAGE_SIZE
    );
    expect(calls).toEqual([
      { start: 0, limit: 100 },
      { start: 100, limit: 100 },
      { start: 200, limit: 100 },
    ]);
    expect(seen).toHaveLength(250);
    expect(calls.every((call) => call.limit !== 10000)).toBe(true);
  });

  it('stops when a full page repeats document ids', async () => {
    const calls: number[] = [];
    await pageThrough(
      async (start) => {
        calls.push(start);
        return Array.from({ length: 100 }, () => ({ documentId: 'same' }));
      },
      async () => undefined,
      100
    );
    expect(calls).toEqual([0, 100]);
  });
});

describe('OpenAI 429 backoff', () => {
  it('doubles the wait and honors Retry-After seconds', () => {
    expect(retryDelayMs(0, null)).toBe(500);
    expect(retryDelayMs(1, null)).toBe(1000);
    expect(retryDelayMs(2, null)).toBe(2000);
    expect(retryDelayMs(0, '2')).toBe(2000);
  });
});
