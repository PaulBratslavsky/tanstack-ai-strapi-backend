/**
 * Vector store. This file is the pgvector swap point.
 *
 * Today: one vector per entry, stored as base64 Float32 in the plugin-owned
 * table `hybrid_search_vectors`, searched from an in-memory cache loaded
 * once at boot. JSON.parse is avoided on the hot path; base64 decodes
 * straight into a Float32Array.
 *
 * There is no second database and no LangChain. Strapi Cloud Postgres is
 * the only database. Do not assume the `vector` extension is installed.
 * `probePgvector` runs `SELECT name FROM pg_available_extensions WHERE
 * name = 'vector'` and reports the result. It does not CREATE EXTENSION.
 *
 * Later pgvector migration (replace this file, leave callers alone):
 *   - Index with HNSW, not IVFFlat. HNSW recall is stable at this scale
 *     without the IVFFlat lists/probes tuning that goes stale as the
 *     table grows.
 *   - Copy the stored base64 vectors into a `vector` column. Do not
 *     re-embed. The bytes are already the model output.
 *   - A dimension change is a real migration: new column, backfill or
 *     re-embed, swap, drop the old column. Do not cast.
 *   - Keep the (model, embedding_version, text_hash) columns. Search must
 *     skip rows whose model or version is not current.
 *   - v1 is one vector per (uid, document_id). If chunking is added later,
 *     version the chunker separately from EMBEDDING_VERSION, delete and
 *     rebuild every chunk of an entry on update, and point chunks at a
 *     real parent column. Do not add a morph relation onto every content
 *     type.
 */

import {
  EMBEDDING_MODEL,
  EMBEDDING_VERSION,
  decodeVector,
  effectiveStatus,
  encodeVector,
  type VectorRowStatus,
} from './text';

export const VECTOR_TABLE = 'hybrid_search_vectors';

export interface VectorRecord {
  uid: string;
  documentId: string;
  model: string;
  embeddingVersion: number;
  textHash: string;
  vector: Float32Array | null;
  status: VectorRowStatus;
  error: string | null;
  preview: string;
  updatedAt: string | null;
}

export interface VectorWrite {
  uid: string;
  documentId: string;
  model: string;
  embeddingVersion: number;
  textHash: string;
  vector: Float32Array | null;
  status: 'current' | 'stale' | 'failed' | 'pending';
  error: string | null;
  preview?: string;
}

const keyOf = (uid: string, documentId: string) => `${uid}\u0000${documentId}`;

export class MemoryVectorIndex {
  private readonly entries = new Map<string, VectorRecord>();

  clear(): void {
    this.entries.clear();
  }

  upsert(record: VectorRecord): void {
    this.entries.set(keyOf(record.uid, record.documentId), record);
  }

  remove(uid: string, documentId: string): void {
    this.entries.delete(keyOf(uid, documentId));
  }

  get(uid: string, documentId: string): VectorRecord | undefined {
    return this.entries.get(keyOf(uid, documentId));
  }

  /**
   * Current vectors only. Stale, failed, and missing rows are skipped
   * so a version mismatch cannot silently empty results while still
   * being counted as current.
   */
  rank(
    query: ArrayLike<number>,
    uids: Set<string> | null,
    limit: number
  ): Array<{ uid: string; documentId: string; score: number; preview: string }> {
    const scored: Array<{ uid: string; documentId: string; score: number; preview: string }> = [];
    for (const entry of this.entries.values()) {
      if (entry.status !== 'current' || !entry.vector) continue;
      if (uids && !uids.has(entry.uid)) continue;
      let dot = 0;
      let normA = 0;
      let normB = 0;
      const vector = entry.vector;
      if (vector.length !== query.length) continue;
      for (let i = 0; i < vector.length; i += 1) {
        const x = query[i];
        const y = vector[i];
        dot += x * y;
        normA += x * x;
        normB += y * y;
      }
      const denom = Math.sqrt(normA) * Math.sqrt(normB);
      const score = denom === 0 ? 0 : dot / denom;
      scored.push({
        uid: entry.uid,
        documentId: entry.documentId,
        score,
        preview: entry.preview,
      });
    }
    scored.sort((a, b) => b.score - a.score || a.documentId.localeCompare(b.documentId));
    return limit > 0 ? scored.slice(0, limit) : scored;
  }

  counts(uid?: string): Record<VectorRowStatus, number> {
    const counts: Record<VectorRowStatus, number> = { current: 0, stale: 0, failed: 0, missing: 0 };
    for (const entry of this.entries.values()) {
      if (uid && entry.uid !== uid) continue;
      counts[entry.status] += 1;
    }
    return counts;
  }

  currentCount(uids?: string[]): number {
    const allow = uids ? new Set(uids) : null;
    let n = 0;
    for (const entry of this.entries.values()) {
      if (entry.status === 'current' && (!allow || allow.has(entry.uid))) n += 1;
    }
    return n;
  }
}

type KnexLike = any;

async function columnExists(knex: KnexLike, table: string, column: string): Promise<boolean> {
  const has = await knex.schema.hasColumn(table, column);
  return Boolean(has);
}

export async function ensureVectorTable(knex: KnexLike): Promise<void> {
  const exists = await knex.schema.hasTable(VECTOR_TABLE);
  if (!exists) {
    await knex.schema.createTable(VECTOR_TABLE, (table: any) => {
      table.increments('id').primary();
      table.string('uid').notNullable();
      table.string('document_id').notNullable();
      table.string('model');
      table.integer('embedding_version');
      table.string('text_hash');
      table.text('embedding_b64');
      table.integer('dims');
      table.string('status').notNullable().defaultTo('pending');
      table.text('error');
      table.string('preview', 200);
      table.datetime('updated_at');
      table.unique(['uid', 'document_id']);
    });
  }
  if (!(await columnExists(knex, VECTOR_TABLE, 'preview'))) {
    await knex.schema.alterTable(VECTOR_TABLE, (table: any) => {
      table.string('preview', 200);
    });
  }
  if (!(await columnExists(knex, VECTOR_TABLE, 'error'))) {
    await knex.schema.alterTable(VECTOR_TABLE, (table: any) => {
      table.text('error');
    });
  }
}

export function recordFromRow(row: any): VectorRecord {
  let vector: Float32Array | null = null;
  if (typeof row.embedding_b64 === 'string' && row.embedding_b64.length > 0) {
    try {
      vector = decodeVector(row.embedding_b64);
    } catch {
      vector = null;
    }
  }
  const status = effectiveStatus(
    {
      model: row.model,
      embeddingVersion: row.embedding_version,
      status: row.status,
      hasVector: vector != null && vector.length > 0,
    },
    { model: EMBEDDING_MODEL, version: EMBEDDING_VERSION }
  );
  return {
    uid: row.uid,
    documentId: row.document_id,
    model: row.model ?? '',
    embeddingVersion: row.embedding_version ?? 0,
    textHash: row.text_hash ?? '',
    vector,
    status,
    error: row.error ?? null,
    preview: row.preview ?? '',
    updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : null,
  };
}

export async function loadVectorIndex(knex: KnexLike, index: MemoryVectorIndex): Promise<void> {
  index.clear();
  const rows = await knex(VECTOR_TABLE).select('*');
  const staleIds: number[] = [];
  for (const row of rows) {
    const record = recordFromRow(row);
    if (!record.vector && record.status !== 'failed') {
      record.status = 'missing';
    }
    index.upsert(record);
    if (record.status === 'stale' && row.status !== 'stale' && row.id != null) staleIds.push(row.id);
  }
  if (staleIds.length > 0) {
    await knex(VECTOR_TABLE).whereIn('id', staleIds).update({
      status: 'stale',
      updated_at: knex.fn.now(),
    });
  }
}

export async function writeVector(knex: KnexLike, write: VectorWrite): Promise<void> {
  const now = new Date();
  const embedding = write.vector ? encodeVector(write.vector) : null;
  const payload = {
    uid: write.uid,
    document_id: write.documentId,
    model: write.model,
    embedding_version: write.embeddingVersion,
    text_hash: write.textHash,
    embedding_b64: embedding,
    dims: write.vector ? write.vector.length : null,
    status: write.status,
    error: write.error,
    preview: (write.preview ?? '').slice(0, 180),
    updated_at: now,
  };
  const existing = await knex(VECTOR_TABLE)
    .where({ uid: write.uid, document_id: write.documentId })
    .first();
  if (existing) {
    const next = { ...payload };
    if (!write.vector && existing.embedding_b64) {
      next.embedding_b64 = existing.embedding_b64;
      next.dims = existing.dims;
      next.model = write.model || existing.model;
      next.embedding_version = write.embeddingVersion || existing.embedding_version;
    }
    await knex(VECTOR_TABLE).where({ id: existing.id }).update(next);
    return;
  }
  await knex(VECTOR_TABLE).insert(payload);
}

export async function deleteVector(knex: KnexLike, uid: string, documentId: string): Promise<void> {
  await knex(VECTOR_TABLE).where({ uid, document_id: documentId }).delete();
}

export type PgvectorProbe = 'available' | 'unavailable' | 'not-postgres' | 'unknown';

export async function probePgvector(knex: KnexLike, client: string): Promise<PgvectorProbe> {
  if (client !== 'postgres') return 'not-postgres';
  try {
    const result = await knex.raw("SELECT name FROM pg_available_extensions WHERE name = 'vector'");
    const rows = result?.rows ?? result;
    return Array.isArray(rows) && rows.length > 0 ? 'available' : 'unavailable';
  } catch {
    return 'unknown';
  }
}

export { EMBEDDING_MODEL, EMBEDDING_VERSION };
