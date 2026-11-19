import { createHash } from 'crypto';

/** Bump when the text builder changes. Stored with every vector. */
export const EMBEDDING_VERSION = 1;

export const EMBEDDING_MODEL = 'text-embedding-3-small';

export const MAX_EMBED_CHARS = 8000;

const MISSING_KEY_MESSAGE =
  'Semantic search is off because OPENAI_API_KEY is not set. Results are keyword-only. Add the key and run Reindex to build embeddings.';

export function missingKeyMessage(): string {
  return MISSING_KEY_MESSAGE;
}

export function textHash(text: string): string {
  return createHash('sha256').update(text).digest('hex');
}

/**
 * Strip HTML and lightweight Markdown, then collapse whitespace.
 * The hash is taken over this string, which is also what we embed.
 */
export function normalizeDocumentText(input: string): string {
  let text = input.replace(/\r\n/g, '\n');
  text = text.replace(/```([\s\S]*?)```/g, (_match, body: string) => ` ${body} `);
  text = text.replace(/`([^`]+)`/g, '$1');
  text = text.replace(/!\[[^\]]*]\([^)]*\)/g, ' ');
  text = text.replace(/\[([^\]]+)]\([^)]*\)/g, '$1');
  text = text.replace(/^#{1,6}\s+/gm, '');
  text = text.replace(/^\s{0,3}>\s?/gm, '');
  text = text.replace(/^\s*([-*+]|\d+\.)\s+/gm, '');
  text = text.replace(/^\s*[-*_]{3,}\s*$/gm, ' ');
  text = text.replace(/\*\*([^*]+)\*\*/g, '$1');
  text = text.replace(/__([^_]+)__/g, '$1');
  text = text.replace(/\*([^*]+)\*/g, '$1');
  text = text.replace(/(^|\s)_([^_]+)_/g, '$1$2');
  text = text.replace(/<[^>]+>/g, ' ');
  text = text
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"');
  return text.replace(/\s+/g, ' ').trim();
}

export function fieldToText(value: unknown): string {
  if (value == null) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (Array.isArray(value)) return value.map(fieldToText).filter(Boolean).join(' ');
  if (typeof value === 'object') {
    return Object.values(value as Record<string, unknown>)
      .map(fieldToText)
      .filter(Boolean)
      .join(' ');
  }
  return '';
}

export function buildEmbedText(
  fields: string[],
  entry: Record<string, unknown>,
  maxChars: number = MAX_EMBED_CHARS
): string {
  const parts = fields.map((field) => fieldToText(entry[field])).filter((part) => part.length > 0);
  const normalized = normalizeDocumentText(parts.join('\n\n'));
  return normalized.slice(0, maxChars);
}

export interface StoredVectorIdentity {
  model?: string | null;
  version?: number | null;
  textHash?: string | null;
  status?: string | null;
  hasVector: boolean;
}

/**
 * Skip the embed only when the stored vector is current for this exact
 * text, model, and version. A model or version change must re-embed.
 */
export function shouldSkipEmbed(
  stored: StoredVectorIdentity | null | undefined,
  next: { model: string; version: number; textHash: string }
): boolean {
  if (!stored?.hasVector) return false;
  if (stored.status !== 'current') return false;
  if (stored.model !== next.model) return false;
  if (stored.version !== next.version) return false;
  if (stored.textHash !== next.textHash) return false;
  return true;
}

export type VectorRowStatus = 'current' | 'stale' | 'failed' | 'missing';

/**
 * Single staleness rule for search, admin, and status.
 * A model/version mismatch is stale even when the row's status column
 * still says "current" (yt-kb #31).
 */
export function effectiveStatus(
  row: {
    model?: string | null;
    embeddingVersion?: number | null;
    status?: string | null;
    hasVector: boolean;
  },
  expected: { model: string; version: number }
): VectorRowStatus {
  if (!row.hasVector) return row.status === 'failed' ? 'failed' : 'missing';
  if (row.model !== expected.model || row.embeddingVersion !== expected.version) return 'stale';
  if (row.status === 'failed') return 'failed';
  if (row.status === 'stale') return 'stale';
  return 'current';
}

export function encodeVector(values: ArrayLike<number>): string {
  const arr = Float32Array.from(values);
  return Buffer.from(arr.buffer, arr.byteOffset, arr.byteLength).toString('base64');
}

export function decodeVector(encoded: string): Float32Array {
  const buf = Buffer.from(encoded, 'base64');
  const copy = Buffer.from(buf);
  return new Float32Array(copy.buffer, copy.byteOffset, copy.byteLength / 4);
}

/** Draft writes are ignored. Published writes and publish itself are indexed. */
export function indexIntent(
  action: string,
  draftAndPublish: boolean,
  status?: string | null
): 'index' | 'remove' | 'ignore' {
  if (action === 'delete' || action === 'unpublish') return 'remove';
  if (action === 'publish') return 'index';
  if (action === 'create' || action === 'update' || action === 'clone') {
    if (!draftAndPublish) return 'index';
    return status === 'published' ? 'index' : 'ignore';
  }
  return 'ignore';
}

export const REINDEX_PAGE_SIZE = 100;

export async function pageThrough<T extends { documentId?: string }>(
  fetchPage: (start: number, limit: number) => Promise<T[]>,
  onRow: (row: T) => Promise<void>,
  pageSize: number = REINDEX_PAGE_SIZE
): Promise<number> {
  const seen = new Set<string>();
  let start = 0;
  let scanned = 0;
  while (true) {
    const rows = await fetchPage(start, pageSize);
    if (!rows || rows.length === 0) break;
    let added = 0;
    for (const row of rows) {
      const id = row?.documentId;
      if (!id || seen.has(id)) continue;
      seen.add(id);
      added += 1;
      scanned += 1;
      await onRow(row);
    }
    if (added === 0 || rows.length < pageSize) break;
    start += pageSize;
  }
  return scanned;
}

export function retryDelayMs(attempt: number, retryAfterHeader: string | null): number {
  if (retryAfterHeader) {
    const seconds = Number(retryAfterHeader);
    if (Number.isFinite(seconds) && seconds >= 0) return Math.min(30_000, seconds * 1000);
    const when = Date.parse(retryAfterHeader);
    if (!Number.isNaN(when)) return Math.min(30_000, Math.max(0, when - Date.now()));
  }
  return Math.min(8_000, 500 * 2 ** attempt);
}

export function snippetAround(text: string, keywords: string[], window = 160): string {
  if (!text) return '';
  const lower = text.toLowerCase();
  let at = -1;
  for (const keyword of keywords) {
    const found = lower.indexOf(keyword.toLowerCase());
    if (found >= 0 && (at < 0 || found < at)) at = found;
  }
  if (at < 0) return text.slice(0, window) + (text.length > window ? '…' : '');
  const start = Math.max(0, at - 40);
  const end = Math.min(text.length, at + window);
  return (start > 0 ? '…' : '') + text.slice(start, end) + (end < text.length ? '…' : '');
}

export function isSafeIdent(name: string): boolean {
  return /^[A-Za-z_][A-Za-z0-9_]*$/.test(name);
}
