import { createEmbedder, type Embedder } from './services/embedder';
import { rankHybrid, type BoostMeta } from './services/fusion';
import {
  clearKeywordText,
  clientName,
  countIndexable,
  ensureKeywordSchema,
  searchKeyword,
  writeKeywordText,
  type KeywordFilter,
  type TypeColumns,
} from './services/keyword-search';
import { isSelectableField, selectableFields } from './services/query-fields';
import {
  EMBEDDING_MODEL,
  EMBEDDING_VERSION,
  REINDEX_PAGE_SIZE,
  buildEmbedText,
  indexIntent,
  isSafeIdent,
  missingKeyMessage,
  pageThrough,
  shouldSkipEmbed,
  textHash,
} from './services/text';
import {
  MemoryVectorIndex,
  deleteVector,
  ensureVectorTable,
  loadVectorIndex,
  probePgvector,
  writeVector,
  type PgvectorProbe,
  type VectorRecord,
} from './services/vector-store';

const KEYWORD_LIMIT = 100;
const VECTOR_LIMIT = 200;
const MAX_ERRORS = 50;

export interface HybridTypeConfig {
  fields: string[];
  titleField?: string;
  tagField?: string;
  aliasField?: string;
  pinnedField?: string;
  exclude?: { field: string; equals: string | number | boolean };
}

export interface SearchInput {
  query: string;
  uids?: string[];
  limit?: number;
  equals?: Record<string, string | number | boolean>;
  since?: string;
  tag?: string;
}

export interface ReindexInput {
  uids?: string[];
  dryRun?: boolean;
  /** Default true. False returns immediately and the job is visible on status. */
  wait?: boolean;
}

const runtimes = new WeakMap<object, HybridRuntime>();

export function getRuntime(strapi: any): HybridRuntime {
  let runtime = runtimes.get(strapi);
  if (!runtime) {
    runtime = new HybridRuntime(strapi);
    runtimes.set(strapi, runtime);
  }
  return runtime;
}

const idKey = (uid: string, documentId: string) => `${uid}\u0000${documentId}`;
const splitKey = (key: string) => {
  const [uid, documentId] = key.split('\u0000');
  return { uid, documentId };
};

function snake(value: string): string {
  return value.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`).replace(/-/g, '_');
}

function asArray<T>(value: unknown): T[] {
  if (Array.isArray(value)) return value as T[];
  if (value && typeof value === 'object' && Array.isArray((value as { results?: T[] }).results)) {
    return (value as { results: T[] }).results;
  }
  return [];
}

function labels(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map((item) => String(item)).filter((item) => item.trim().length > 0);
}

export class HybridRuntime {
  private readonly embedder: Embedder;
  private readonly memory = new MemoryVectorIndex();
  private readonly columns = new Map<string, TypeColumns>();
  private started = false;
  private middleware = false;
  private lexicalReady = false;
  private pgvector: PgvectorProbe = 'unknown';
  private lastSyncAt: string | null = null;
  private timer: ReturnType<typeof setInterval> | null = null;
  private retries: Array<{ uid: string; documentId: string; attempts: number }> = [];
  private job: {
    running: boolean;
    dryRun: boolean;
    scanned: number;
    embedded: number;
    skipped: number;
    failed: number;
    startedAt: string;
    finishedAt?: string;
    report?: any;
  } | null = null;
  private jobPromise: Promise<any> | null = null;

  constructor(private readonly strapi: any) {
    const gapMs = Number(strapi.config?.get?.('plugin::hybrid-search.embedGapMs') ?? 40);
    this.embedder = createEmbedder({ gapMs: Number.isFinite(gapMs) ? gapMs : 40 });
  }

  private types(): Record<string, HybridTypeConfig> {
    const types = this.strapi.config?.get?.('plugin::hybrid-search.types') || {};
    return types && typeof types === 'object' ? types : {};
  }

  private log(level: 'info' | 'warn' | 'error', message: string, error?: unknown) {
    const logger = this.strapi.log;
    if (!logger?.[level]) return;
    if (error) logger[level](message, error);
    else logger[level](message);
  }

  async start(): Promise<void> {
    if (this.started) return;
    this.started = true;
    this.registerMiddleware();
    const knex = this.knex();
    const client = clientName(this.strapi);
    try {
      if (knex) {
        await ensureVectorTable(knex);
        await this.prepareKeywordSchema(knex, client);
        await loadVectorIndex(knex, this.memory);
        this.pgvector = await probePgvector(knex, client);
        const counts = this.memory.counts();
        this.log(
          'info',
          `[hybrid-search] pgvector probe: ${this.pgvector}. Cache loaded current=${counts.current} stale=${counts.stale} failed=${counts.failed}.`
        );
      } else {
        this.log('warn', '[hybrid-search] No database connection. Index stays empty.');
      }
    } catch (error) {
      this.log('error', '[hybrid-search] Startup index prepare failed. Boot continues.', error);
    }
    if (!this.embedder.hasKey()) this.log('warn', `[hybrid-search] ${missingKeyMessage()}`);
    this.timer = setInterval(() => {
      this.drainRetries().catch((error) => {
        this.log('error', '[hybrid-search] Retry pass failed.', error);
      });
    }, 30_000);
    this.timer.unref?.();
  }

  private knex(): any {
    return this.strapi.db?.connection;
  }

  private model(uid: string): any {
    return this.strapi.getModel?.(uid) || this.strapi.contentTypes?.[uid] || null;
  }

  private columnName(model: any, field: string, opts?: { scalar?: boolean }): string | null {
    const attribute = model?.attributes?.[field];
    if (!attribute) return null;
    if (attribute.type === 'relation' || attribute.type === 'media' || attribute.type === 'component') return null;
    if (opts?.scalar && attribute.type === 'json') return null;
    const column = attribute.columnName || attribute.column?.name || snake(field);
    return isSafeIdent(column) ? column : null;
  }

  private typeColumns(uid: string, config: HybridTypeConfig): TypeColumns | null {
    const model = this.model(uid);
    const meta = this.strapi.db?.metadata?.get?.(uid);
    const table = meta?.tableName || model?.collectionName;
    if (!table || !isSafeIdent(table)) {
      this.log('warn', `[hybrid-search] Skipping ${uid}: no table name.`);
      return null;
    }
    const textColumns = config.fields
      .map((field) => this.columnName(model, field, { scalar: true }))
      .filter((column): column is string => Boolean(column));
    const excludeColumn = config.exclude ? this.columnName(model, config.exclude.field, { scalar: true }) : null;
    const documentId =
      meta?.attributes?.documentId?.columnName ||
      (isSafeIdent(String(meta?.documentIdColumn || '')) ? meta.documentIdColumn : 'document_id');
    return {
      table,
      documentId,
      textColumns,
      draftAndPublish: Boolean(model?.options?.draftAndPublish),
      exclude:
        config.exclude && excludeColumn
          ? { column: excludeColumn, equals: config.exclude.equals }
          : undefined,
    };
  }

  private async prepareKeywordSchema(knex: any, client: string): Promise<void> {
    const prepared: TypeColumns[] = [];
    for (const [uid, config] of Object.entries(this.types())) {
      if (!Array.isArray(config?.fields) || config.fields.length === 0) {
        this.log('warn', `[hybrid-search] ${uid} has no fields configured.`);
        continue;
      }
      const columns = this.typeColumns(uid, config);
      if (!columns) continue;
      this.columns.set(uid, columns);
      prepared.push(columns);
    }
    try {
      await ensureKeywordSchema(knex, client, prepared);
      this.lexicalReady = true;
    } catch (error) {
      this.lexicalReady = false;
      this.log('error', '[hybrid-search] Keyword schema prepare failed. Boot continues.', error);
    }
  }

  private registerMiddleware(): void {
    if (this.middleware || typeof this.strapi.documents?.use !== 'function') return;
    this.middleware = true;
    this.strapi.documents.use(async (context: any, next: any) => {
      const result = await next();
      const uid = context?.uid;
      const config = this.types()[uid];
      if (!config) return result;
      const draftAndPublish = Boolean(
        context.contentType?.options?.draftAndPublish ?? this.model(uid)?.options?.draftAndPublish
      );
      const intent = indexIntent(context.action, draftAndPublish, context.params?.status);
      if (intent === 'ignore') return result;
      const documentId = context.params?.documentId || result?.documentId;
      if (!documentId) return result;
      try {
        if (intent === 'remove') await this.removeEntry(uid, documentId);
        else await this.indexDocument(uid, documentId);
      } catch (error) {
        this.log('error', `[hybrid-search] Index sync failed for ${uid} ${documentId}. Save was kept.`, error);
        this.enqueueRetry(uid, documentId);
      }
      return result;
    });
  }

  private enqueueRetry(uid: string, documentId: string): void {
    const existing = this.retries.find((job) => job.uid === uid && job.documentId === documentId);
    if (existing) return;
    this.retries.push({ uid, documentId, attempts: 0 });
  }

  private async drainRetries(): Promise<void> {
    const batch = this.retries.splice(0, 5);
    for (const job of batch) {
      job.attempts += 1;
      try {
        await this.indexDocument(job.uid, job.documentId);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'retry failed';
        this.log('error', `[hybrid-search] Retry ${job.attempts} failed for ${job.uid} ${job.documentId}: ${message}`);
        if (job.attempts < 5) this.retries.push(job);
        else {
          this.log('error', `[hybrid-search] Gave up retrying ${job.uid} ${job.documentId} after ${job.attempts} attempts.`);
        }
      }
    }
  }

  private async loadEntry(uid: string, documentId: string): Promise<Record<string, any> | null> {
    const config = this.types()[uid];
    if (!config) return null;
    const fields = selectableFields(this.model(uid), [
      config.titleField,
      config.tagField,
      config.aliasField,
      config.pinnedField,
      config.exclude?.field,
      ...config.fields,
    ]);
    const draftAndPublish = Boolean(this.model(uid)?.options?.draftAndPublish);
    const params: any = { documentId };
    if (fields.length > 0) params.fields = fields;
    if (draftAndPublish) params.status = 'published';
    const entry = await this.strapi.documents(uid).findOne(params);
    return entry || null;
  }

  private isExcluded(uid: string, entry: Record<string, any>): boolean {
    const rule = this.types()[uid]?.exclude;
    if (!rule) return false;
    return entry[rule.field] === rule.equals;
  }

  async removeEntry(uid: string, documentId: string): Promise<void> {
    const knex = this.knex();
    const columns = this.columns.get(uid);
    if (knex) {
      try {
        await deleteVector(knex, uid, documentId);
      } catch (error) {
        this.log('error', `[hybrid-search] Vector delete failed for ${uid} ${documentId}.`, error);
        throw error;
      }
      if (columns) {
        try {
          await clearKeywordText(knex, clientName(this.strapi), columns, documentId);
        } catch (error) {
          this.log('error', `[hybrid-search] Keyword clear failed for ${uid} ${documentId}.`, error);
          throw error;
        }
      }
    }
    this.memory.remove(uid, documentId);
  }

  async indexDocument(uid: string, documentId: string, preloaded?: Record<string, any> | null): Promise<'embedded' | 'skipped' | 'removed' | 'deferred' | 'failed'> {
    const config = this.types()[uid];
    if (!config) return 'skipped';
    const entry = preloaded === undefined ? await this.loadEntry(uid, documentId) : preloaded;
    if (!entry || this.isExcluded(uid, entry)) {
      await this.removeEntry(uid, documentId);
      return 'removed';
    }
    const text = buildEmbedText(config.fields, entry);
    const columns = this.columns.get(uid);
    const knex = this.knex();
    if (knex && columns) {
      try {
        await writeKeywordText(knex, clientName(this.strapi), columns, documentId, text);
      } catch (error) {
        this.log('error', `[hybrid-search] Keyword write failed for ${uid} ${documentId}.`, error);
        throw error;
      }
    }
    if (!text) {
      await this.removeEntry(uid, documentId);
      return 'removed';
    }
    const hash = textHash(text);
    const stored = this.memory.get(uid, documentId);
    const identity = stored
      ? {
          model: stored.model,
          version: stored.embeddingVersion,
          textHash: stored.textHash,
          status: stored.status,
          hasVector: Boolean(stored.vector),
        }
      : null;
    if (shouldSkipEmbed(identity, { model: EMBEDDING_MODEL, version: EMBEDDING_VERSION, textHash: hash })) {
      return 'skipped';
    }
    if (!this.embedder.hasKey()) {
      if (stored?.vector) {
        await this.persistStatus(uid, documentId, hash, 'stale', missingKeyMessage());
      }
      return 'deferred';
    }
    const embedded = await this.embedder.embed(text);
    if (embedded.ok === false) {
      const message = embedded.message;
      this.log('error', `[hybrid-search] Embed failed for ${uid} ${documentId}: ${message}. Marked failed and queued for retry.`);
      await this.persistStatus(uid, documentId, hash, 'failed', message);
      if (embedded.reason !== 'missing-key') this.enqueueRetry(uid, documentId);
      return 'failed';
    }
    try {
      await this.persistVector(uid, documentId, hash, Float32Array.from(embedded.vector), text.slice(0, 180));
      return 'embedded';
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Vector write failed';
      this.log('error', `[hybrid-search] Vector write failed for ${uid} ${documentId}: ${message}. Queued for retry.`);
      try {
        await this.persistStatus(uid, documentId, hash, 'failed', message);
      } catch (markError) {
        this.log('error', `[hybrid-search] Could not mark ${uid} ${documentId} failed after the write error.`, markError);
      }
      this.enqueueRetry(uid, documentId);
      return 'failed';
    }
  }

  private async persistVector(uid: string, documentId: string, hash: string, vector: Float32Array, preview: string) {
    const knex = this.knex();
    const now = new Date().toISOString();
    if (knex) {
      await writeVector(knex, {
        uid,
        documentId,
        model: EMBEDDING_MODEL,
        embeddingVersion: EMBEDDING_VERSION,
        textHash: hash,
        vector,
        status: 'current',
        error: null,
        preview,
      });
    }
    const record: VectorRecord = {
      uid,
      documentId,
      model: EMBEDDING_MODEL,
      embeddingVersion: EMBEDDING_VERSION,
      textHash: hash,
      vector,
      status: 'current',
      error: null,
      preview,
      updatedAt: now,
    };
    this.memory.upsert(record);
    this.lastSyncAt = now;
  }

  private async persistStatus(
    uid: string,
    documentId: string,
    hash: string,
    status: 'stale' | 'failed',
    error: string
  ) {
    const knex = this.knex();
    const previous = this.memory.get(uid, documentId);
    if (knex) {
      await writeVector(knex, {
        uid,
        documentId,
        model: previous?.model || EMBEDDING_MODEL,
        embeddingVersion: previous?.embeddingVersion || EMBEDDING_VERSION,
        textHash: hash,
        vector: null,
        status,
        error,
        preview: previous?.preview,
      });
    }
    this.memory.upsert({
      uid,
      documentId,
      model: previous?.model || '',
      embeddingVersion: previous?.embeddingVersion || 0,
      textHash: hash,
      vector: previous?.vector || null,
      status,
      error,
      preview: previous?.preview || '',
      updatedAt: new Date().toISOString(),
    });
  }

  private selectedUids(requested?: string[]): string[] {
    const known = Object.keys(this.types());
    if (!requested || requested.length === 0) return known;
    return requested.filter((uid) => known.includes(uid));
  }

  async search(input: SearchInput) {
    const query = String(input.query || '').trim();
    const limit = Math.min(Math.max(input.limit ?? 25, 1), 100);
    const uids = this.selectedUids(input.uids);
    const statusMessage = this.embedder.hasKey() ? null : missingKeyMessage();
    if (!query) {
      return { results: [], mode: this.embedder.hasKey() ? 'hybrid' : 'keyword-only', statusMessage, lexicalReady: this.lexicalReady };
    }

    const keywordHits: Array<{ key: string; rank: number }> = [];
    const snippets = new Map<string, string>();
    const knex = this.knex();
    const client = clientName(this.strapi);
    if (knex && this.lexicalReady) {
      for (const uid of uids) {
        const columns = this.columns.get(uid);
        if (!columns) continue;
        const filter = this.keywordFilter(uid, input);
        try {
          const hits = await searchKeyword(knex, client, columns, query, KEYWORD_LIMIT, filter);
          for (const hit of hits) {
            const key = idKey(uid, hit.documentId);
            if (snippets.has(key)) continue;
            keywordHits.push({ key, rank: hit.rank });
            snippets.set(key, hit.snippet);
          }
        } catch (error) {
          this.log('warn', `[hybrid-search] Keyword search failed for ${uid}.`, error);
        }
      }
    }
    keywordHits.sort((a, b) => b.rank - a.rank || a.key.localeCompare(b.key));
    const keywordOrder = keywordHits.map((hit) => hit.key);

    const cosineScores = new Map<string, number>();
    const previews = new Map<string, string>();
    let mode: 'hybrid' | 'keyword-only' = 'keyword-only';
    if (this.embedder.hasKey()) {
      const embedded = await this.embedder.embed(query);
      if (embedded.ok === true) {
        mode = 'hybrid';
        const ranked = this.memory.rank(Float32Array.from(embedded.vector), new Set(uids), VECTOR_LIMIT);
        for (const hit of ranked) {
          const key = idKey(hit.uid, hit.documentId);
          cosineScores.set(key, hit.score);
          if (hit.preview) previews.set(key, hit.preview);
        }
      } else if (embedded.reason !== 'missing-key') {
        this.log('warn', `[hybrid-search] Query embedding failed: ${embedded.message}`);
      }
    }

    const ids = Array.from(new Set([...keywordOrder, ...cosineScores.keys()]));
    const allowed = await this.keepAllowed(uids, ids, input);
    const keywordKept = keywordOrder.filter((key) => allowed.has(key));
    const cosineKept = new Map<string, number>();
    for (const [key, score] of cosineScores) {
      if (allowed.has(key)) cosineKept.set(key, score);
    }
    const meta = new Map<string, BoostMeta>();
    for (const key of allowed.keys()) {
      const row = allowed.get(key)!;
      meta.set(key, row.meta);
      if (!snippets.has(key) && row.snippet) snippets.set(key, row.snippet);
    }
    const ranked = rankHybrid({ query, keywordOrder: keywordKept, cosineScores: cosineKept, meta });
    const results = ranked.slice(0, limit).map((hit) => {
      const { uid, documentId } = splitKey(hit.id);
      return {
        type: uid,
        uid,
        documentId,
        score: Math.round(hit.cosineScore * 1e6) / 1e6,
        snippet: snippets.get(hit.id) || previews.get(hit.id) || '',
        matchTier: hit.matchTier,
        rrfScore: hit.rrfScore,
      };
    });
    return { results, mode, statusMessage, lexicalReady: this.lexicalReady };
  }

  private keywordFilter(uid: string, input: SearchInput): KeywordFilter {
    const model = this.model(uid);
    const equalsColumns: Record<string, string> = {};
    for (const field of Object.keys(input.equals || {})) {
      const column = this.columnName(model, field, { scalar: true });
      if (column) equalsColumns[field] = column;
    }
    return { equals: input.equals, equalsColumns, since: input.since };
  }

  private async keepAllowed(uids: string[], keys: string[], input: SearchInput) {
    const kept = new Map<string, { meta: BoostMeta; snippet: string }>();
    const byUid = new Map<string, string[]>();
    for (const key of keys) {
      const { uid, documentId } = splitKey(key);
      if (!uids.includes(uid)) continue;
      const list = byUid.get(uid) || [];
      list.push(documentId);
      byUid.set(uid, list);
    }
    for (const [uid, documentIds] of byUid) {
      const config = this.types()[uid];
      if (!config || documentIds.length === 0) continue;
      const rows = await this.loadRows(uid, documentIds, input);
      for (const row of rows) {
        if (!row?.documentId || this.isExcluded(uid, row)) continue;
        if (input.tag && config.tagField && !labels(row[config.tagField]).some((tag) => tag.toLowerCase() === input.tag!.toLowerCase())) {
          continue;
        }
        const titleField = config.titleField || 'title';
        kept.set(idKey(uid, row.documentId), {
          meta: {
            title: String(row[titleField] || row.title || row.name || ''),
            tags: labels(config.tagField ? row[config.tagField] : []),
            aliases: labels(config.aliasField ? row[config.aliasField] : []),
            pinned: config.pinnedField ? row[config.pinnedField] === true : false,
          },
          snippet: String(row[titleField] || '').slice(0, 180),
        });
      }
    }
    return kept;
  }

  private async loadRows(uid: string, documentIds: string[], input: SearchInput): Promise<any[]> {
    const config = this.types()[uid];
    const fields = selectableFields(this.model(uid), [
      config.titleField,
      config.tagField,
      config.aliasField,
      config.pinnedField,
      config.exclude?.field,
      'title',
      'name',
      ...config.fields,
    ]);
    const filters = this.documentFilters(uid, input, documentIds);
    const draftAndPublish = Boolean(this.model(uid)?.options?.draftAndPublish);
    const rows: any[] = [];
    for (let offset = 0; offset < documentIds.length; offset += REINDEX_PAGE_SIZE) {
      const slice = documentIds.slice(offset, offset + REINDEX_PAGE_SIZE);
      const params: any = {
        filters: { ...filters, documentId: { $in: slice } },
        limit: slice.length,
      };
      if (fields.length > 0) params.fields = fields;
      if (draftAndPublish) params.status = 'published';
      const page = await this.strapi.documents(uid).findMany(params);
      rows.push(...asArray(page));
    }
    return rows;
  }

  private documentFilters(uid: string, input: SearchInput, _documentIds: string[]): Record<string, unknown> {
    const config = this.types()[uid];
    const model = this.model(uid);
    const clauses: Record<string, unknown>[] = [];
    if (input.since && isSelectableField(model, 'updatedAt')) clauses.push({ updatedAt: { $gte: input.since } });
    for (const [field, value] of Object.entries(input.equals || {})) {
      if (isSelectableField(model, field)) clauses.push({ [field]: { $eq: value } });
    }
    const exclude = config.exclude;
    if (exclude && isSelectableField(model, exclude.field)) {
      if (exclude.equals === true) {
        clauses.push({ $or: [{ [exclude.field]: { $eq: false } }, { [exclude.field]: { $null: true } }] });
      } else {
        clauses.push({ $or: [{ [exclude.field]: { $ne: exclude.equals } }, { [exclude.field]: { $null: true } }] });
      }
    }
    if (clauses.length === 0) return {};
    if (clauses.length === 1) return clauses[0];
    return { $and: clauses };
  }

  async similar(input: { text: string; uids?: string[]; threshold?: number; limit?: number }) {
    const uids = this.selectedUids(input.uids);
    const indexedCount = this.memory.currentCount(uids);
    if (!this.embedder.hasKey()) {
      return { enabled: false, statusMessage: missingKeyMessage(), indexedCount, results: [] as Array<{ uid: string; documentId: string; score: number }> };
    }
    const text = String(input.text || '').trim();
    if (!text || indexedCount === 0) {
      return { enabled: true, statusMessage: null, indexedCount, results: [] as Array<{ uid: string; documentId: string; score: number }> };
    }
    const embedded = await this.embedder.embed(text);
    if (embedded.ok === false) {
      return { enabled: false, statusMessage: embedded.message, indexedCount, results: [] };
    }
    const threshold = input.threshold ?? Number(this.strapi.config?.get?.('plugin::hybrid-search.similarThreshold') ?? 0.9);
    const limit = Math.min(Math.max(input.limit ?? 8, 1), 25);
    const hits = this.memory
      .rank(Float32Array.from(embedded.vector), new Set(uids), 0)
      .filter((hit) => hit.score >= threshold)
      .slice(0, limit)
      .map((hit) => ({ uid: hit.uid, documentId: hit.documentId, score: Math.round(hit.score * 1e6) / 1e6 }));
    return { enabled: true, statusMessage: null, indexedCount, results: hits };
  }

  async reindex(input: ReindexInput = {}) {
    if (this.job?.running) {
      return { alreadyRunning: true, dryRun: Boolean(this.job.dryRun), ...(this.job.report || {}), statusMessage: this.job.report?.statusMessage ?? null };
    }
    const run = this.runReindex(input);
    this.jobPromise = run;
    if (input.wait === false) {
      run.catch((error) => this.log('error', '[hybrid-search] Reindex failed.', error));
      return { started: true, dryRun: Boolean(input.dryRun), statusMessage: this.embedder.hasKey() ? null : missingKeyMessage() };
    }
    return run;
  }

  private async runReindex(input: ReindexInput) {
    const dryRun = Boolean(input.dryRun);
    const uids = this.selectedUids(input.uids);
    const report = {
      dryRun,
      partial: false,
      scanned: 0,
      embedded: 0,
      skipped: 0,
      failed: 0,
      removed: 0,
      keywordUpdated: 0,
      deferred: 0,
      errors: [] as Array<{ uid: string; documentId: string; message: string }>,
      errorCount: 0,
      statusMessage: this.embedder.hasKey() ? null : missingKeyMessage(),
    };
    this.job = {
      running: true,
      dryRun,
      scanned: 0,
      embedded: 0,
      skipped: 0,
      failed: 0,
      startedAt: new Date().toISOString(),
    };
    const pushError = (uid: string, documentId: string, message: string) => {
      report.errorCount += 1;
      report.failed += 1;
      report.partial = true;
      if (report.errors.length < MAX_ERRORS) report.errors.push({ uid, documentId, message });
    };
    try {
      for (const uid of uids) {
        const config = this.types()[uid];
        if (!config || typeof this.strapi.documents !== 'function') continue;
        const draftAndPublish = Boolean(this.model(uid)?.options?.draftAndPublish);
        const fields = selectableFields(this.model(uid), [
          config.titleField,
          config.tagField,
          config.aliasField,
          config.pinnedField,
          config.exclude?.field,
          ...config.fields,
        ]);
        try {
          await pageThrough(
            async (start, limit) => {
              const params: any = { start, limit, sort: ['documentId:asc'] };
              if (fields.length > 0) params.fields = fields;
              if (draftAndPublish) params.status = 'published';
              return asArray<{ documentId?: string }>(await this.strapi.documents(uid).findMany(params));
            },
            async (row) => {
              report.scanned += 1;
              this.job!.scanned = report.scanned;
              const documentId = row.documentId as string;
              try {
                if (dryRun) {
                  const outcome = this.dryRunRow(uid, row);
                  report[outcome] += 1;
                  return;
                }
                const outcome = await this.indexDocument(uid, documentId, row);
                if (outcome === 'embedded') report.embedded += 1;
                else if (outcome === 'skipped') report.skipped += 1;
                else if (outcome === 'removed') report.removed += 1;
                else if (outcome === 'deferred') {
                  report.deferred += 1;
                  report.keywordUpdated += 1;
                } else report.failed += 1;
              } catch (error) {
                const message = error instanceof Error ? error.message : 'row failed';
                this.log('error', `[hybrid-search] Reindex row failed for ${uid} ${documentId}: ${message}`);
                pushError(uid, documentId, message);
              }
            },
            REINDEX_PAGE_SIZE
          );
        } catch (error) {
          const message = error instanceof Error ? error.message : 'page failed';
          this.log('error', `[hybrid-search] Reindex failed while paging ${uid}: ${message}`);
          pushError(uid, '*', message);
        }
      }
      if (report.failed > 0) {
        report.statusMessage = `Reindex finished with ${report.errorCount} error${report.errorCount === 1 ? '' : 's'}. Failed rows are marked failed and will be retried.`;
      }
      return report;
    } finally {
      if (this.job) {
        this.job.running = false;
        this.job.finishedAt = new Date().toISOString();
        this.job.embedded = report.embedded;
        this.job.skipped = report.skipped;
        this.job.failed = report.failed;
        this.job.report = report;
      }
    }
  }

  private dryRunRow(uid: string, row: Record<string, any>): 'embedded' | 'skipped' | 'removed' | 'deferred' {
    const config = this.types()[uid];
    if (!row?.documentId || this.isExcluded(uid, row)) return 'removed';
    const text = buildEmbedText(config.fields, row);
    if (!text) return 'removed';
    const hash = textHash(text);
    const stored = this.memory.get(uid, row.documentId);
    const identity = stored
      ? {
          model: stored.model,
          version: stored.embeddingVersion,
          textHash: stored.textHash,
          status: stored.status,
          hasVector: Boolean(stored.vector),
        }
      : null;
    if (shouldSkipEmbed(identity, { model: EMBEDDING_MODEL, version: EMBEDDING_VERSION, textHash: hash })) return 'skipped';
    if (!this.embedder.hasKey()) return 'deferred';
    return 'embedded';
  }

  async status() {
    const types = [];
    const totals = { current: 0, stale: 0, failed: 0, missing: 0, content: 0 };
    const knex = this.knex();
    for (const uid of Object.keys(this.types())) {
      const counts = this.memory.counts(uid);
      let content = counts.current + counts.stale + counts.failed + counts.missing;
      const columns = this.columns.get(uid);
      if (knex && columns) {
        try {
          content = await countIndexable(knex, columns);
        } catch {
          content = counts.current + counts.stale + counts.failed;
        }
      }
      const missing = Math.max(0, content - counts.current - counts.stale - counts.failed);
      types.push({ uid, contentCount: content, ...counts, missing });
      totals.current += counts.current;
      totals.stale += counts.stale;
      totals.failed += counts.failed;
      totals.missing += missing;
      totals.content += content;
    }
    const apiKeyConfigured = this.embedder.hasKey();
    return {
      embeddings: apiKeyConfigured ? 'ready' : 'disabled',
      statusMessage: apiKeyConfigured ? null : missingKeyMessage(),
      model: EMBEDDING_MODEL,
      embeddingVersion: EMBEDDING_VERSION,
      apiKeyConfigured,
      pgvector: this.pgvector,
      vectorStore: 'memory',
      lastSyncAt: this.lastSyncAt,
      lexicalReady: this.lexicalReady,
      types,
      totals,
      job: this.job
        ? {
            running: this.job.running,
            dryRun: this.job.dryRun,
            scanned: this.job.scanned,
            embedded: this.job.embedded,
            skipped: this.job.skipped,
            failed: this.job.failed,
            startedAt: this.job.startedAt,
            finishedAt: this.job.finishedAt ?? null,
          }
        : null,
    };
  }
}
