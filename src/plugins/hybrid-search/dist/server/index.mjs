import { createHash } from "crypto";
const PLUGIN_NAME = "hybrid-search";
const PERMISSIONS = [
  {
    section: "plugins",
    pluginName: PLUGIN_NAME,
    subCategory: "search",
    uid: "read",
    displayName: "Search and view hybrid search status"
  },
  {
    section: "plugins",
    pluginName: PLUGIN_NAME,
    subCategory: "search",
    uid: "reindex",
    displayName: "Rebuild the hybrid search index"
  }
];
const READ_ACTION = `plugin::${PLUGIN_NAME}.read`;
const REINDEX_ACTION = `plugin::${PLUGIN_NAME}.reindex`;
const register = ({ strapi }) => {
  try {
    const actionProvider = strapi.service("admin::permission").actionProvider;
    const fresh = PERMISSIONS.filter((permission) => !actionProvider.has(`plugin::${PLUGIN_NAME}.${permission.uid}`));
    if (fresh.length > 0) {
      actionProvider.registerMany(fresh);
      strapi.log.info(`[hybrid-search] Registered ${fresh.length} permission actions`);
    }
  } catch (error) {
    strapi.log.error("[hybrid-search] Permission registration failed. Boot continues.", error);
  }
};
const EMBEDDING_VERSION = 1;
const EMBEDDING_MODEL = "text-embedding-3-small";
const MAX_EMBED_CHARS = 8e3;
const MISSING_KEY_MESSAGE = "Semantic search is off because OPENAI_API_KEY is not set. Results are keyword-only. Add the key and run Reindex to build embeddings.";
function missingKeyMessage() {
  return MISSING_KEY_MESSAGE;
}
function textHash(text) {
  return createHash("sha256").update(text).digest("hex");
}
function normalizeDocumentText(input) {
  let text = input.replace(/\r\n/g, "\n");
  text = text.replace(/```([\s\S]*?)```/g, (_match, body) => ` ${body} `);
  text = text.replace(/`([^`]+)`/g, "$1");
  text = text.replace(/!\[[^\]]*]\([^)]*\)/g, " ");
  text = text.replace(/\[([^\]]+)]\([^)]*\)/g, "$1");
  text = text.replace(/^#{1,6}\s+/gm, "");
  text = text.replace(/^\s{0,3}>\s?/gm, "");
  text = text.replace(/^\s*([-*+]|\d+\.)\s+/gm, "");
  text = text.replace(/^\s*[-*_]{3,}\s*$/gm, " ");
  text = text.replace(/\*\*([^*]+)\*\*/g, "$1");
  text = text.replace(/__([^_]+)__/g, "$1");
  text = text.replace(/\*([^*]+)\*/g, "$1");
  text = text.replace(/(^|\s)_([^_]+)_/g, "$1$2");
  text = text.replace(/<[^>]+>/g, " ");
  text = text.replace(/&nbsp;/gi, " ").replace(/&amp;/gi, "&").replace(/&lt;/gi, "<").replace(/&gt;/gi, ">").replace(/&quot;/gi, '"');
  return text.replace(/\s+/g, " ").trim();
}
function fieldToText(value) {
  if (value == null) return "";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (Array.isArray(value)) return value.map(fieldToText).filter(Boolean).join(" ");
  if (typeof value === "object") {
    return Object.values(value).map(fieldToText).filter(Boolean).join(" ");
  }
  return "";
}
function buildEmbedText(fields, entry, maxChars = MAX_EMBED_CHARS) {
  const parts = fields.map((field) => fieldToText(entry[field])).filter((part) => part.length > 0);
  const normalized = normalizeDocumentText(parts.join("\n\n"));
  return normalized.slice(0, maxChars);
}
function shouldSkipEmbed(stored, next) {
  if (!stored?.hasVector) return false;
  if (stored.status !== "current") return false;
  if (stored.model !== next.model) return false;
  if (stored.version !== next.version) return false;
  if (stored.textHash !== next.textHash) return false;
  return true;
}
function effectiveStatus(row, expected) {
  if (!row.hasVector) return row.status === "failed" ? "failed" : "missing";
  if (row.model !== expected.model || row.embeddingVersion !== expected.version) return "stale";
  if (row.status === "failed") return "failed";
  if (row.status === "stale") return "stale";
  return "current";
}
function encodeVector(values) {
  const arr = Float32Array.from(values);
  return Buffer.from(arr.buffer, arr.byteOffset, arr.byteLength).toString("base64");
}
function decodeVector(encoded) {
  const buf = Buffer.from(encoded, "base64");
  const copy = Buffer.from(buf);
  return new Float32Array(copy.buffer, copy.byteOffset, copy.byteLength / 4);
}
function indexIntent(action, draftAndPublish, status) {
  if (action === "delete" || action === "unpublish") return "remove";
  if (action === "publish") return "index";
  if (action === "create" || action === "update" || action === "clone") {
    if (!draftAndPublish) return "index";
    return status === "published" ? "index" : "ignore";
  }
  return "ignore";
}
const REINDEX_PAGE_SIZE = 100;
async function pageThrough(fetchPage, onRow, pageSize = REINDEX_PAGE_SIZE) {
  const seen = /* @__PURE__ */ new Set();
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
function retryDelayMs(attempt, retryAfterHeader) {
  if (retryAfterHeader) {
    const seconds = Number(retryAfterHeader);
    if (Number.isFinite(seconds) && seconds >= 0) return Math.min(3e4, seconds * 1e3);
    const when = Date.parse(retryAfterHeader);
    if (!Number.isNaN(when)) return Math.min(3e4, Math.max(0, when - Date.now()));
  }
  return Math.min(8e3, 500 * 2 ** attempt);
}
function snippetAround(text, keywords, window = 160) {
  if (!text) return "";
  const lower = text.toLowerCase();
  let at = -1;
  for (const keyword of keywords) {
    const found = lower.indexOf(keyword.toLowerCase());
    if (found >= 0 && (at < 0 || found < at)) at = found;
  }
  if (at < 0) return text.slice(0, window) + (text.length > window ? "…" : "");
  const start = Math.max(0, at - 40);
  const end = Math.min(text.length, at + window);
  return (start > 0 ? "…" : "") + text.slice(start, end) + (end < text.length ? "…" : "");
}
function isSafeIdent(name) {
  return /^[A-Za-z_][A-Za-z0-9_]*$/.test(name);
}
const EMBEDDINGS_URL = "https://api.openai.com/v1/embeddings";
const MAX_429_ATTEMPTS = 5;
class EmbedRateLimitError extends Error {
  constructor(retryAfterHeader) {
    super("OpenAI embeddings rate limited");
    this.retryAfterHeader = retryAfterHeader;
    this.name = "EmbedRateLimitError";
  }
}
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
function createEmbedder(options) {
  const gapMs = options?.gapMs ?? 40;
  const fetchImpl = options?.fetchImpl ?? fetch;
  let tail = Promise.resolve();
  let lastAt = 0;
  const enqueue = (fn) => {
    const run = tail.then(async () => {
      const wait = gapMs - (Date.now() - lastAt);
      if (wait > 0) await sleep(wait);
      try {
        return await fn();
      } finally {
        lastAt = Date.now();
      }
    });
    tail = run.then(
      () => void 0,
      () => void 0
    );
    return run;
  };
  const embedOnce = async (text, apiKey) => {
    const response = await fetchImpl(EMBEDDINGS_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ model: EMBEDDING_MODEL, input: text }),
      signal: AbortSignal.timeout(2e4)
    });
    if (response.status === 429) {
      throw new EmbedRateLimitError(response.headers.get("retry-after"));
    }
    if (!response.ok) {
      const body = await response.text().catch(() => "");
      throw new Error(`OpenAI embeddings ${response.status}: ${body.slice(0, 180)}`);
    }
    const json = await response.json();
    const embedding = json?.data?.[0]?.embedding;
    if (!Array.isArray(embedding) || embedding.length === 0) {
      throw new Error("OpenAI embeddings response had no vector");
    }
    return embedding;
  };
  return {
    model: EMBEDDING_MODEL,
    hasKey() {
      return Boolean(process.env.OPENAI_API_KEY);
    },
    missingKeyMessage,
    async embed(text) {
      const apiKey = process.env.OPENAI_API_KEY;
      if (!apiKey) return { ok: false, reason: "missing-key", message: missingKeyMessage() };
      if (!text.trim()) return { ok: false, reason: "empty", message: "Nothing to embed" };
      return enqueue(async () => {
        for (let attempt = 0; attempt < MAX_429_ATTEMPTS; attempt += 1) {
          try {
            const vector = await embedOnce(text, apiKey);
            return { ok: true, vector };
          } catch (error) {
            if (error instanceof EmbedRateLimitError && attempt < MAX_429_ATTEMPTS - 1) {
              await sleep(retryDelayMs(attempt, error.retryAfterHeader));
              continue;
            }
            const message = error instanceof Error ? error.message : "Embedding failed";
            return { ok: false, reason: "error", message };
          }
        }
        return { ok: false, reason: "error", message: "OpenAI embeddings rate limited" };
      });
    }
  };
}
const RRF_K = 60;
const BM25_WEIGHT = 2.5;
const TAG_BOOST_PER_TAG = 0.06;
const TITLE_BOOST_PER_TOKEN = 0.015;
const TITLE_TOKEN_MIN_IDF = 1.5;
const PINNED_BOOST = 0.05;
function getMatchTier(rank, _score) {
  if (rank === 0) return "top";
  if (rank < 3) return "strong";
  if (rank < 8) return "good";
  return "related";
}
function fuseRRF(rankings, k = RRF_K) {
  const fused = /* @__PURE__ */ new Map();
  for (const { order, weight = 1 } of rankings) {
    order.forEach((id, rank) => {
      fused.set(id, (fused.get(id) ?? 0) + weight / (rank + 1 + k));
    });
  }
  return fused;
}
function rankByFusedScore(rrfScores, cosineScores) {
  return Array.from(rrfScores.entries()).map(([id, rrfScore]) => ({
    id,
    rrfScore,
    cosineScore: cosineScores.get(id) ?? 0,
    matchTier: "related"
  })).sort((a, b) => b.rrfScore - a.rrfScore || a.id.localeCompare(b.id)).map((hit, rank) => ({ ...hit, matchTier: getMatchTier(rank, hit.cosineScore) }));
}
function tokenize(text) {
  if (!text) return [];
  return text.toLowerCase().split(/[^a-z0-9]+/).filter((token) => token.length >= 2);
}
function idf(tokenizedDocs) {
  const n = tokenizedDocs.length;
  const df = /* @__PURE__ */ new Map();
  for (const doc of tokenizedDocs) {
    for (const token of new Set(doc)) df.set(token, (df.get(token) ?? 0) + 1);
  }
  const scores = {};
  for (const [token, docs] of df) {
    scores[token] = Math.log(1 + (n - docs + 0.5) / (docs + 0.5));
  }
  return scores;
}
function distinctiveTitleTokens(query, corpusIdf) {
  return new Set(
    tokenize(query).filter((token) => {
      const score = corpusIdf[token];
      return score !== void 0 && score >= TITLE_TOKEN_MIN_IDF;
    })
  );
}
function normalizeLabel(value) {
  return value.toLowerCase().trim();
}
function applyTagAliasAndTitleBoosts(fused, query, meta) {
  const queryTokens = new Set(tokenize(query));
  const titles = Array.from(meta.values()).map((row) => tokenize(row.title));
  const corpusIdf = idf(titles);
  const titleTokens = distinctiveTitleTokens(query, corpusIdf);
  const tagBoosts = /* @__PURE__ */ new Map();
  const aliasBoosts = /* @__PURE__ */ new Map();
  const titleBoosts = /* @__PURE__ */ new Map();
  const pinned = [];
  for (const [id, row] of meta) {
    const matchedTags = row.tags.map(normalizeLabel).filter((tag) => tag.length >= 2 && queryTokens.has(tag));
    if (matchedTags.length > 0) {
      fused.set(id, (fused.get(id) ?? 0) + matchedTags.length * TAG_BOOST_PER_TAG);
      tagBoosts.set(id, matchedTags);
    }
    const matchedAliases = row.aliases.map(normalizeLabel).filter((alias) => alias.length >= 2 && queryTokens.has(alias));
    if (matchedAliases.length > 0) {
      fused.set(id, (fused.get(id) ?? 0) + matchedAliases.length * TAG_BOOST_PER_TAG);
      aliasBoosts.set(id, matchedAliases);
    }
    const candidateTitle = new Set(tokenize(row.title));
    const matchedTitle = Array.from(titleTokens).filter((token) => candidateTitle.has(token));
    if (matchedTitle.length > 0) {
      fused.set(id, (fused.get(id) ?? 0) + matchedTitle.length * TITLE_BOOST_PER_TOKEN);
      titleBoosts.set(id, matchedTitle);
    }
    if (row.pinned) {
      fused.set(id, (fused.get(id) ?? 0) + PINNED_BOOST);
      pinned.push(id);
    }
  }
  return { tagBoosts, aliasBoosts, titleBoosts, pinned };
}
function vectorOrder(cosineScores) {
  return Array.from(cosineScores.entries()).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).map(([id]) => id);
}
function rankHybrid(input) {
  const denseOrder = vectorOrder(input.cosineScores);
  const fused = fuseRRF([
    { order: denseOrder, weight: 1 },
    { order: input.keywordOrder, weight: BM25_WEIGHT }
  ]);
  applyTagAliasAndTitleBoosts(fused, input.query, input.meta);
  return rankByFusedScore(fused, input.cosineScores);
}
const TEXT_COLUMN = "hybrid_search_text";
const TSV_COLUMN = "hybrid_search_tsv";
const quote = (ident) => {
  if (!isSafeIdent(ident)) throw new Error(`Unsafe SQL identifier: ${ident}`);
  return `"${ident}"`;
};
function clientName(strapi) {
  return strapi?.db?.config?.connection?.client || strapi?.config?.get?.("database.connection.client") || "sqlite";
}
async function ensureKeywordSchema(knex, client, types) {
  for (const type of types) {
    if (!isSafeIdent(type.table)) continue;
    const hasText = await knex.schema.hasColumn(type.table, TEXT_COLUMN);
    if (!hasText) {
      await knex.schema.alterTable(type.table, (table) => {
        table.text(TEXT_COLUMN);
      });
    }
    if (client === "postgres") {
      const hasTsv = await knex.schema.hasColumn(type.table, TSV_COLUMN);
      if (!hasTsv) {
        await knex.raw(
          `ALTER TABLE ${quote(type.table)} ADD COLUMN IF NOT EXISTS ${quote(TSV_COLUMN)} tsvector`
        );
      }
      const index2 = indexName(type.table);
      await knex.raw(
        `CREATE INDEX IF NOT EXISTS ${quote(index2)} ON ${quote(type.table)} USING GIN (${quote(TSV_COLUMN)})`
      );
    }
    await backfillText(knex, client, type);
  }
}
function indexName(table) {
  const raw = `hs_tsv_${table}`;
  return raw.length <= 60 ? raw : `hs_tsv_${table.slice(0, 40)}_${table.length}`;
}
async function backfillText(knex, client, type) {
  if (type.textColumns.length === 0) return;
  const expr = type.textColumns.map((column) => `coalesce(${quote(column)}::text, '')`).join(` || ' ' || `);
  const sqliteExpr = type.textColumns.map((column) => `coalesce(${quote(column)}, '')`).join(` || ' ' || `);
  const textExpr = client === "postgres" ? expr : sqliteExpr;
  await knex.raw(
    `UPDATE ${quote(type.table)} SET ${quote(TEXT_COLUMN)} = trim(${textExpr}) WHERE ${quote(TEXT_COLUMN)} IS NULL`
  );
  if (client === "postgres") {
    await knex.raw(
      `UPDATE ${quote(type.table)} SET ${quote(TSV_COLUMN)} = to_tsvector('english', coalesce(${quote(TEXT_COLUMN)}, '')) WHERE ${quote(TSV_COLUMN)} IS NULL AND ${quote(TEXT_COLUMN)} IS NOT NULL`
    );
  }
}
async function writeKeywordText(knex, client, type, documentId, text) {
  const where = { [type.documentId]: documentId };
  await knex(type.table).where(where).update({ [TEXT_COLUMN]: text });
  if (client === "postgres") {
    await knex.raw(
      `UPDATE ${quote(type.table)} SET ${quote(TSV_COLUMN)} = to_tsvector('english', ?) WHERE ${quote(type.documentId)} = ?`,
      [text, documentId]
    );
  }
}
async function clearKeywordText(knex, client, type, documentId) {
  await writeKeywordText(knex, client, type, documentId, "");
}
function applyCommon(query, type, filter) {
  if (type.draftAndPublish) query.whereNotNull("published_at");
  if (type.exclude) {
    const column = type.exclude.column;
    const equals = type.exclude.equals;
    query.where((builder) => {
      builder.whereNull(column).orWhereNot(column, equals);
    });
  }
  if (filter?.since) query.where("updated_at", ">=", filter.since);
  if (filter?.equals && filter.equalsColumns) {
    for (const [field, value] of Object.entries(filter.equals)) {
      const column = filter.equalsColumns[field];
      if (column) query.where(column, value);
    }
  }
}
async function searchKeyword(knex, client, type, queryText, limit, filter) {
  const keywords = queryText.toLowerCase().split(/\s+/).map((part) => part.replace(/[^a-z0-9]+/g, "")).filter((part) => part.length >= 2).slice(0, 8);
  if (keywords.length === 0 || limit <= 0) return [];
  if (client === "postgres") {
    const query2 = knex(type.table).select({
      documentId: type.documentId,
      snippet: knex.raw(
        `ts_headline('english', coalesce(${quote(TEXT_COLUMN)}, ''), plainto_tsquery('english', ?), 'MaxWords=24, MinWords=6, MaxFragments=1')`,
        [queryText]
      ),
      rank: knex.raw(`ts_rank(${quote(TSV_COLUMN)}, plainto_tsquery('english', ?))`, [queryText])
    }).whereRaw(`${quote(TSV_COLUMN)} @@ plainto_tsquery('english', ?)`, [queryText]).orderByRaw(`ts_rank(${quote(TSV_COLUMN)}, plainto_tsquery('english', ?)) DESC`, [queryText]).limit(limit);
    applyCommon(query2, type, filter);
    const rows2 = await query2;
    return rows2.map((row) => ({
      documentId: String(row.documentId),
      snippet: String(row.snippet ?? ""),
      rank: Number(row.rank) || 0
    }));
  }
  const query = knex(type.table).select({
    documentId: type.documentId,
    text: TEXT_COLUMN
  });
  applyCommon(query, type, filter);
  for (const keyword of keywords) {
    const escaped = keyword.replace(/[\\%_]/g, (ch) => `\\${ch}`);
    query.where(TEXT_COLUMN, "like", `%${escaped}%`);
  }
  query.limit(Math.max(limit * 4, limit));
  const rows = await query;
  return rows.map((row, index2) => ({
    documentId: String(row.documentId),
    snippet: snippetAround(String(row.text ?? ""), keywords),
    rank: rows.length - index2
  })).slice(0, limit);
}
async function countIndexable(knex, type) {
  const query = knex(type.table).count({ count: "*" });
  applyCommon(query, type);
  const row = await query.first();
  const value = row?.count ?? row?.["count(*)"] ?? 0;
  return Number(value) || 0;
}
const NON_FIELD_TYPES = /* @__PURE__ */ new Set(["relation", "media", "component", "dynamiczone"]);
function isSelectableField(model, field) {
  if (!field) return false;
  const attribute = model?.attributes?.[field];
  if (!attribute?.type) return false;
  return !NON_FIELD_TYPES.has(attribute.type);
}
function selectableFields(model, requested) {
  const fields = [];
  for (const field of requested) {
    if (!field || fields.includes(field)) continue;
    if (!isSelectableField(model, field)) continue;
    fields.push(field);
  }
  return fields;
}
const VECTOR_TABLE = "hybrid_search_vectors";
const keyOf = (uid, documentId) => `${uid}\0${documentId}`;
class MemoryVectorIndex {
  constructor() {
    this.entries = /* @__PURE__ */ new Map();
  }
  clear() {
    this.entries.clear();
  }
  upsert(record) {
    this.entries.set(keyOf(record.uid, record.documentId), record);
  }
  remove(uid, documentId) {
    this.entries.delete(keyOf(uid, documentId));
  }
  get(uid, documentId) {
    return this.entries.get(keyOf(uid, documentId));
  }
  /**
   * Current vectors only. Stale, failed, and missing rows are skipped
   * so a version mismatch cannot silently empty results while still
   * being counted as current.
   */
  rank(query, uids, limit) {
    const scored = [];
    for (const entry of this.entries.values()) {
      if (entry.status !== "current" || !entry.vector) continue;
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
        preview: entry.preview
      });
    }
    scored.sort((a, b) => b.score - a.score || a.documentId.localeCompare(b.documentId));
    return limit > 0 ? scored.slice(0, limit) : scored;
  }
  counts(uid) {
    const counts = { current: 0, stale: 0, failed: 0, missing: 0 };
    for (const entry of this.entries.values()) {
      if (uid && entry.uid !== uid) continue;
      counts[entry.status] += 1;
    }
    return counts;
  }
  currentCount(uids) {
    const allow = uids ? new Set(uids) : null;
    let n = 0;
    for (const entry of this.entries.values()) {
      if (entry.status === "current" && (!allow || allow.has(entry.uid))) n += 1;
    }
    return n;
  }
}
async function columnExists(knex, table, column) {
  const has = await knex.schema.hasColumn(table, column);
  return Boolean(has);
}
async function ensureVectorTable(knex) {
  const exists = await knex.schema.hasTable(VECTOR_TABLE);
  if (!exists) {
    await knex.schema.createTable(VECTOR_TABLE, (table) => {
      table.increments("id").primary();
      table.string("uid").notNullable();
      table.string("document_id").notNullable();
      table.string("model");
      table.integer("embedding_version");
      table.string("text_hash");
      table.text("embedding_b64");
      table.integer("dims");
      table.string("status").notNullable().defaultTo("pending");
      table.text("error");
      table.string("preview", 200);
      table.datetime("updated_at");
      table.unique(["uid", "document_id"]);
    });
  }
  if (!await columnExists(knex, VECTOR_TABLE, "preview")) {
    await knex.schema.alterTable(VECTOR_TABLE, (table) => {
      table.string("preview", 200);
    });
  }
  if (!await columnExists(knex, VECTOR_TABLE, "error")) {
    await knex.schema.alterTable(VECTOR_TABLE, (table) => {
      table.text("error");
    });
  }
}
function recordFromRow(row) {
  let vector = null;
  if (typeof row.embedding_b64 === "string" && row.embedding_b64.length > 0) {
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
      hasVector: vector != null && vector.length > 0
    },
    { model: EMBEDDING_MODEL, version: EMBEDDING_VERSION }
  );
  return {
    uid: row.uid,
    documentId: row.document_id,
    model: row.model ?? "",
    embeddingVersion: row.embedding_version ?? 0,
    textHash: row.text_hash ?? "",
    vector,
    status,
    error: row.error ?? null,
    preview: row.preview ?? "",
    updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : null
  };
}
async function loadVectorIndex(knex, index2) {
  index2.clear();
  const rows = await knex(VECTOR_TABLE).select("*");
  const staleIds = [];
  for (const row of rows) {
    const record = recordFromRow(row);
    if (!record.vector && record.status !== "failed") {
      record.status = "missing";
    }
    index2.upsert(record);
    if (record.status === "stale" && row.status !== "stale" && row.id != null) staleIds.push(row.id);
  }
  if (staleIds.length > 0) {
    await knex(VECTOR_TABLE).whereIn("id", staleIds).update({
      status: "stale",
      updated_at: knex.fn.now()
    });
  }
}
async function writeVector(knex, write) {
  const now = /* @__PURE__ */ new Date();
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
    preview: (write.preview ?? "").slice(0, 180),
    updated_at: now
  };
  const existing = await knex(VECTOR_TABLE).where({ uid: write.uid, document_id: write.documentId }).first();
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
async function deleteVector(knex, uid, documentId) {
  await knex(VECTOR_TABLE).where({ uid, document_id: documentId }).delete();
}
async function probePgvector(knex, client) {
  if (client !== "postgres") return "not-postgres";
  try {
    const result = await knex.raw("SELECT name FROM pg_available_extensions WHERE name = 'vector'");
    const rows = result?.rows ?? result;
    return Array.isArray(rows) && rows.length > 0 ? "available" : "unavailable";
  } catch {
    return "unknown";
  }
}
const KEYWORD_LIMIT = 100;
const VECTOR_LIMIT = 200;
const MAX_ERRORS = 50;
const runtimes = /* @__PURE__ */ new WeakMap();
function getRuntime(strapi) {
  let runtime = runtimes.get(strapi);
  if (!runtime) {
    runtime = new HybridRuntime(strapi);
    runtimes.set(strapi, runtime);
  }
  return runtime;
}
const idKey = (uid, documentId) => `${uid}\0${documentId}`;
const splitKey = (key) => {
  const [uid, documentId] = key.split("\0");
  return { uid, documentId };
};
function snake(value) {
  return value.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`).replace(/-/g, "_");
}
function asArray(value) {
  if (Array.isArray(value)) return value;
  if (value && typeof value === "object" && Array.isArray(value.results)) {
    return value.results;
  }
  return [];
}
function labels(value) {
  if (!Array.isArray(value)) return [];
  return value.map((item) => String(item)).filter((item) => item.trim().length > 0);
}
class HybridRuntime {
  constructor(strapi) {
    this.strapi = strapi;
    this.memory = new MemoryVectorIndex();
    this.columns = /* @__PURE__ */ new Map();
    this.started = false;
    this.middleware = false;
    this.lexicalReady = false;
    this.pgvector = "unknown";
    this.lastSyncAt = null;
    this.timer = null;
    this.retries = [];
    this.job = null;
    this.jobPromise = null;
    const gapMs = Number(strapi.config?.get?.("plugin::hybrid-search.embedGapMs") ?? 40);
    this.embedder = createEmbedder({ gapMs: Number.isFinite(gapMs) ? gapMs : 40 });
  }
  types() {
    const types = this.strapi.config?.get?.("plugin::hybrid-search.types") || {};
    return types && typeof types === "object" ? types : {};
  }
  log(level, message, error) {
    const logger = this.strapi.log;
    if (!logger?.[level]) return;
    if (error) logger[level](message, error);
    else logger[level](message);
  }
  async start() {
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
          "info",
          `[hybrid-search] pgvector probe: ${this.pgvector}. Cache loaded current=${counts.current} stale=${counts.stale} failed=${counts.failed}.`
        );
      } else {
        this.log("warn", "[hybrid-search] No database connection. Index stays empty.");
      }
    } catch (error) {
      this.log("error", "[hybrid-search] Startup index prepare failed. Boot continues.", error);
    }
    if (!this.embedder.hasKey()) this.log("warn", `[hybrid-search] ${missingKeyMessage()}`);
    this.timer = setInterval(() => {
      this.drainRetries().catch((error) => {
        this.log("error", "[hybrid-search] Retry pass failed.", error);
      });
    }, 3e4);
    this.timer.unref?.();
  }
  knex() {
    return this.strapi.db?.connection;
  }
  model(uid) {
    return this.strapi.getModel?.(uid) || this.strapi.contentTypes?.[uid] || null;
  }
  columnName(model, field, opts) {
    const attribute = model?.attributes?.[field];
    if (!attribute) return null;
    if (attribute.type === "relation" || attribute.type === "media" || attribute.type === "component") return null;
    if (opts?.scalar && attribute.type === "json") return null;
    const column = attribute.columnName || attribute.column?.name || snake(field);
    return isSafeIdent(column) ? column : null;
  }
  typeColumns(uid, config2) {
    const model = this.model(uid);
    const meta = this.strapi.db?.metadata?.get?.(uid);
    const table = meta?.tableName || model?.collectionName;
    if (!table || !isSafeIdent(table)) {
      this.log("warn", `[hybrid-search] Skipping ${uid}: no table name.`);
      return null;
    }
    const textColumns = config2.fields.map((field) => this.columnName(model, field, { scalar: true })).filter((column) => Boolean(column));
    const excludeColumn = config2.exclude ? this.columnName(model, config2.exclude.field, { scalar: true }) : null;
    const documentId = meta?.attributes?.documentId?.columnName || (isSafeIdent(String(meta?.documentIdColumn || "")) ? meta.documentIdColumn : "document_id");
    return {
      table,
      documentId,
      textColumns,
      draftAndPublish: Boolean(model?.options?.draftAndPublish),
      exclude: config2.exclude && excludeColumn ? { column: excludeColumn, equals: config2.exclude.equals } : void 0
    };
  }
  async prepareKeywordSchema(knex, client) {
    const prepared = [];
    for (const [uid, config2] of Object.entries(this.types())) {
      if (!Array.isArray(config2?.fields) || config2.fields.length === 0) {
        this.log("warn", `[hybrid-search] ${uid} has no fields configured.`);
        continue;
      }
      const columns = this.typeColumns(uid, config2);
      if (!columns) continue;
      this.columns.set(uid, columns);
      prepared.push(columns);
    }
    try {
      await ensureKeywordSchema(knex, client, prepared);
      this.lexicalReady = true;
    } catch (error) {
      this.lexicalReady = false;
      this.log("error", "[hybrid-search] Keyword schema prepare failed. Boot continues.", error);
    }
  }
  registerMiddleware() {
    if (this.middleware || typeof this.strapi.documents?.use !== "function") return;
    this.middleware = true;
    this.strapi.documents.use(async (context, next) => {
      const result = await next();
      const uid = context?.uid;
      const config2 = this.types()[uid];
      if (!config2) return result;
      const draftAndPublish = Boolean(
        context.contentType?.options?.draftAndPublish ?? this.model(uid)?.options?.draftAndPublish
      );
      const intent = indexIntent(context.action, draftAndPublish, context.params?.status);
      if (intent === "ignore") return result;
      const documentId = context.params?.documentId || result?.documentId;
      if (!documentId) return result;
      try {
        if (intent === "remove") await this.removeEntry(uid, documentId);
        else await this.indexDocument(uid, documentId);
      } catch (error) {
        this.log("error", `[hybrid-search] Index sync failed for ${uid} ${documentId}. Save was kept.`, error);
        this.enqueueRetry(uid, documentId);
      }
      return result;
    });
  }
  enqueueRetry(uid, documentId) {
    const existing = this.retries.find((job) => job.uid === uid && job.documentId === documentId);
    if (existing) return;
    this.retries.push({ uid, documentId, attempts: 0 });
  }
  async drainRetries() {
    const batch = this.retries.splice(0, 5);
    for (const job of batch) {
      job.attempts += 1;
      try {
        await this.indexDocument(job.uid, job.documentId);
      } catch (error) {
        const message = error instanceof Error ? error.message : "retry failed";
        this.log("error", `[hybrid-search] Retry ${job.attempts} failed for ${job.uid} ${job.documentId}: ${message}`);
        if (job.attempts < 5) this.retries.push(job);
        else {
          this.log("error", `[hybrid-search] Gave up retrying ${job.uid} ${job.documentId} after ${job.attempts} attempts.`);
        }
      }
    }
  }
  async loadEntry(uid, documentId) {
    const config2 = this.types()[uid];
    if (!config2) return null;
    const fields = selectableFields(this.model(uid), [
      config2.titleField,
      config2.tagField,
      config2.aliasField,
      config2.pinnedField,
      config2.exclude?.field,
      ...config2.fields
    ]);
    const draftAndPublish = Boolean(this.model(uid)?.options?.draftAndPublish);
    const params = { documentId };
    if (fields.length > 0) params.fields = fields;
    if (draftAndPublish) params.status = "published";
    const entry = await this.strapi.documents(uid).findOne(params);
    return entry || null;
  }
  isExcluded(uid, entry) {
    const rule = this.types()[uid]?.exclude;
    if (!rule) return false;
    return entry[rule.field] === rule.equals;
  }
  async removeEntry(uid, documentId) {
    const knex = this.knex();
    const columns = this.columns.get(uid);
    if (knex) {
      try {
        await deleteVector(knex, uid, documentId);
      } catch (error) {
        this.log("error", `[hybrid-search] Vector delete failed for ${uid} ${documentId}.`, error);
        throw error;
      }
      if (columns) {
        try {
          await clearKeywordText(knex, clientName(this.strapi), columns, documentId);
        } catch (error) {
          this.log("error", `[hybrid-search] Keyword clear failed for ${uid} ${documentId}.`, error);
          throw error;
        }
      }
    }
    this.memory.remove(uid, documentId);
  }
  async indexDocument(uid, documentId, preloaded) {
    const config2 = this.types()[uid];
    if (!config2) return "skipped";
    const entry = preloaded === void 0 ? await this.loadEntry(uid, documentId) : preloaded;
    if (!entry || this.isExcluded(uid, entry)) {
      await this.removeEntry(uid, documentId);
      return "removed";
    }
    const text = buildEmbedText(config2.fields, entry);
    const columns = this.columns.get(uid);
    const knex = this.knex();
    if (knex && columns) {
      try {
        await writeKeywordText(knex, clientName(this.strapi), columns, documentId, text);
      } catch (error) {
        this.log("error", `[hybrid-search] Keyword write failed for ${uid} ${documentId}.`, error);
        throw error;
      }
    }
    if (!text) {
      await this.removeEntry(uid, documentId);
      return "removed";
    }
    const hash = textHash(text);
    const stored = this.memory.get(uid, documentId);
    const identity = stored ? {
      model: stored.model,
      version: stored.embeddingVersion,
      textHash: stored.textHash,
      status: stored.status,
      hasVector: Boolean(stored.vector)
    } : null;
    if (shouldSkipEmbed(identity, { model: EMBEDDING_MODEL, version: EMBEDDING_VERSION, textHash: hash })) {
      return "skipped";
    }
    if (!this.embedder.hasKey()) {
      if (stored?.vector) {
        await this.persistStatus(uid, documentId, hash, "stale", missingKeyMessage());
      }
      return "deferred";
    }
    const embedded = await this.embedder.embed(text);
    if (embedded.ok === false) {
      const message = embedded.message;
      this.log("error", `[hybrid-search] Embed failed for ${uid} ${documentId}: ${message}. Marked failed and queued for retry.`);
      await this.persistStatus(uid, documentId, hash, "failed", message);
      if (embedded.reason !== "missing-key") this.enqueueRetry(uid, documentId);
      return "failed";
    }
    try {
      await this.persistVector(uid, documentId, hash, Float32Array.from(embedded.vector), text.slice(0, 180));
      return "embedded";
    } catch (error) {
      const message = error instanceof Error ? error.message : "Vector write failed";
      this.log("error", `[hybrid-search] Vector write failed for ${uid} ${documentId}: ${message}. Queued for retry.`);
      try {
        await this.persistStatus(uid, documentId, hash, "failed", message);
      } catch (markError) {
        this.log("error", `[hybrid-search] Could not mark ${uid} ${documentId} failed after the write error.`, markError);
      }
      this.enqueueRetry(uid, documentId);
      return "failed";
    }
  }
  async persistVector(uid, documentId, hash, vector, preview) {
    const knex = this.knex();
    const now = (/* @__PURE__ */ new Date()).toISOString();
    if (knex) {
      await writeVector(knex, {
        uid,
        documentId,
        model: EMBEDDING_MODEL,
        embeddingVersion: EMBEDDING_VERSION,
        textHash: hash,
        vector,
        status: "current",
        error: null,
        preview
      });
    }
    const record = {
      uid,
      documentId,
      model: EMBEDDING_MODEL,
      embeddingVersion: EMBEDDING_VERSION,
      textHash: hash,
      vector,
      status: "current",
      error: null,
      preview,
      updatedAt: now
    };
    this.memory.upsert(record);
    this.lastSyncAt = now;
  }
  async persistStatus(uid, documentId, hash, status, error) {
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
        preview: previous?.preview
      });
    }
    this.memory.upsert({
      uid,
      documentId,
      model: previous?.model || "",
      embeddingVersion: previous?.embeddingVersion || 0,
      textHash: hash,
      vector: previous?.vector || null,
      status,
      error,
      preview: previous?.preview || "",
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    });
  }
  selectedUids(requested) {
    const known = Object.keys(this.types());
    if (!requested || requested.length === 0) return known;
    return requested.filter((uid) => known.includes(uid));
  }
  async search(input) {
    const query = String(input.query || "").trim();
    const limit = Math.min(Math.max(input.limit ?? 25, 1), 100);
    const uids = this.selectedUids(input.uids);
    const statusMessage = this.embedder.hasKey() ? null : missingKeyMessage();
    if (!query) {
      return { results: [], mode: this.embedder.hasKey() ? "hybrid" : "keyword-only", statusMessage, lexicalReady: this.lexicalReady };
    }
    const keywordHits = [];
    const snippets = /* @__PURE__ */ new Map();
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
          this.log("warn", `[hybrid-search] Keyword search failed for ${uid}.`, error);
        }
      }
    }
    keywordHits.sort((a, b) => b.rank - a.rank || a.key.localeCompare(b.key));
    const keywordOrder = keywordHits.map((hit) => hit.key);
    const cosineScores = /* @__PURE__ */ new Map();
    const previews = /* @__PURE__ */ new Map();
    let mode = "keyword-only";
    if (this.embedder.hasKey()) {
      const embedded = await this.embedder.embed(query);
      if (embedded.ok === true) {
        mode = "hybrid";
        const ranked2 = this.memory.rank(Float32Array.from(embedded.vector), new Set(uids), VECTOR_LIMIT);
        for (const hit of ranked2) {
          const key = idKey(hit.uid, hit.documentId);
          cosineScores.set(key, hit.score);
          if (hit.preview) previews.set(key, hit.preview);
        }
      } else if (embedded.reason !== "missing-key") {
        this.log("warn", `[hybrid-search] Query embedding failed: ${embedded.message}`);
      }
    }
    const ids = Array.from(/* @__PURE__ */ new Set([...keywordOrder, ...cosineScores.keys()]));
    const allowed = await this.keepAllowed(uids, ids, input);
    const keywordKept = keywordOrder.filter((key) => allowed.has(key));
    const cosineKept = /* @__PURE__ */ new Map();
    for (const [key, score] of cosineScores) {
      if (allowed.has(key)) cosineKept.set(key, score);
    }
    const meta = /* @__PURE__ */ new Map();
    for (const key of allowed.keys()) {
      const row = allowed.get(key);
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
        snippet: snippets.get(hit.id) || previews.get(hit.id) || "",
        matchTier: hit.matchTier,
        rrfScore: hit.rrfScore
      };
    });
    return { results, mode, statusMessage, lexicalReady: this.lexicalReady };
  }
  keywordFilter(uid, input) {
    const model = this.model(uid);
    const equalsColumns = {};
    for (const field of Object.keys(input.equals || {})) {
      const column = this.columnName(model, field, { scalar: true });
      if (column) equalsColumns[field] = column;
    }
    return { equals: input.equals, equalsColumns, since: input.since };
  }
  async keepAllowed(uids, keys, input) {
    const kept = /* @__PURE__ */ new Map();
    const byUid = /* @__PURE__ */ new Map();
    for (const key of keys) {
      const { uid, documentId } = splitKey(key);
      if (!uids.includes(uid)) continue;
      const list = byUid.get(uid) || [];
      list.push(documentId);
      byUid.set(uid, list);
    }
    for (const [uid, documentIds] of byUid) {
      const config2 = this.types()[uid];
      if (!config2 || documentIds.length === 0) continue;
      const rows = await this.loadRows(uid, documentIds, input);
      for (const row of rows) {
        if (!row?.documentId || this.isExcluded(uid, row)) continue;
        if (input.tag && config2.tagField && !labels(row[config2.tagField]).some((tag) => tag.toLowerCase() === input.tag.toLowerCase())) {
          continue;
        }
        const titleField = config2.titleField || "title";
        kept.set(idKey(uid, row.documentId), {
          meta: {
            title: String(row[titleField] || row.title || row.name || ""),
            tags: labels(config2.tagField ? row[config2.tagField] : []),
            aliases: labels(config2.aliasField ? row[config2.aliasField] : []),
            pinned: config2.pinnedField ? row[config2.pinnedField] === true : false
          },
          snippet: String(row[titleField] || "").slice(0, 180)
        });
      }
    }
    return kept;
  }
  async loadRows(uid, documentIds, input) {
    const config2 = this.types()[uid];
    const fields = selectableFields(this.model(uid), [
      config2.titleField,
      config2.tagField,
      config2.aliasField,
      config2.pinnedField,
      config2.exclude?.field,
      "title",
      "name",
      ...config2.fields
    ]);
    const filters = this.documentFilters(uid, input, documentIds);
    const draftAndPublish = Boolean(this.model(uid)?.options?.draftAndPublish);
    const rows = [];
    for (let offset = 0; offset < documentIds.length; offset += REINDEX_PAGE_SIZE) {
      const slice = documentIds.slice(offset, offset + REINDEX_PAGE_SIZE);
      const params = {
        filters: { ...filters, documentId: { $in: slice } },
        limit: slice.length
      };
      if (fields.length > 0) params.fields = fields;
      if (draftAndPublish) params.status = "published";
      const page = await this.strapi.documents(uid).findMany(params);
      rows.push(...asArray(page));
    }
    return rows;
  }
  documentFilters(uid, input, _documentIds) {
    const config2 = this.types()[uid];
    const model = this.model(uid);
    const clauses = [];
    if (input.since && isSelectableField(model, "updatedAt")) clauses.push({ updatedAt: { $gte: input.since } });
    for (const [field, value] of Object.entries(input.equals || {})) {
      if (isSelectableField(model, field)) clauses.push({ [field]: { $eq: value } });
    }
    const exclude = config2.exclude;
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
  async similar(input) {
    const uids = this.selectedUids(input.uids);
    const indexedCount = this.memory.currentCount(uids);
    if (!this.embedder.hasKey()) {
      return { enabled: false, statusMessage: missingKeyMessage(), indexedCount, results: [] };
    }
    const text = String(input.text || "").trim();
    if (!text || indexedCount === 0) {
      return { enabled: true, statusMessage: null, indexedCount, results: [] };
    }
    const embedded = await this.embedder.embed(text);
    if (embedded.ok === false) {
      return { enabled: false, statusMessage: embedded.message, indexedCount, results: [] };
    }
    const threshold = input.threshold ?? Number(this.strapi.config?.get?.("plugin::hybrid-search.similarThreshold") ?? 0.9);
    const limit = Math.min(Math.max(input.limit ?? 8, 1), 25);
    const hits = this.memory.rank(Float32Array.from(embedded.vector), new Set(uids), 0).filter((hit) => hit.score >= threshold).slice(0, limit).map((hit) => ({ uid: hit.uid, documentId: hit.documentId, score: Math.round(hit.score * 1e6) / 1e6 }));
    return { enabled: true, statusMessage: null, indexedCount, results: hits };
  }
  async reindex(input = {}) {
    if (this.job?.running) {
      return { alreadyRunning: true, dryRun: Boolean(this.job.dryRun), ...this.job.report || {}, statusMessage: this.job.report?.statusMessage ?? null };
    }
    const run = this.runReindex(input);
    this.jobPromise = run;
    if (input.wait === false) {
      run.catch((error) => this.log("error", "[hybrid-search] Reindex failed.", error));
      return { started: true, dryRun: Boolean(input.dryRun), statusMessage: this.embedder.hasKey() ? null : missingKeyMessage() };
    }
    return run;
  }
  async runReindex(input) {
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
      errors: [],
      errorCount: 0,
      statusMessage: this.embedder.hasKey() ? null : missingKeyMessage()
    };
    this.job = {
      running: true,
      dryRun,
      scanned: 0,
      embedded: 0,
      skipped: 0,
      failed: 0,
      startedAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    const pushError = (uid, documentId, message) => {
      report.errorCount += 1;
      report.failed += 1;
      report.partial = true;
      if (report.errors.length < MAX_ERRORS) report.errors.push({ uid, documentId, message });
    };
    try {
      for (const uid of uids) {
        const config2 = this.types()[uid];
        if (!config2 || typeof this.strapi.documents !== "function") continue;
        const draftAndPublish = Boolean(this.model(uid)?.options?.draftAndPublish);
        const fields = selectableFields(this.model(uid), [
          config2.titleField,
          config2.tagField,
          config2.aliasField,
          config2.pinnedField,
          config2.exclude?.field,
          ...config2.fields
        ]);
        try {
          await pageThrough(
            async (start, limit) => {
              const params = { start, limit, sort: ["documentId:asc"] };
              if (fields.length > 0) params.fields = fields;
              if (draftAndPublish) params.status = "published";
              return asArray(await this.strapi.documents(uid).findMany(params));
            },
            async (row) => {
              report.scanned += 1;
              this.job.scanned = report.scanned;
              const documentId = row.documentId;
              try {
                if (dryRun) {
                  const outcome2 = this.dryRunRow(uid, row);
                  report[outcome2] += 1;
                  return;
                }
                const outcome = await this.indexDocument(uid, documentId, row);
                if (outcome === "embedded") report.embedded += 1;
                else if (outcome === "skipped") report.skipped += 1;
                else if (outcome === "removed") report.removed += 1;
                else if (outcome === "deferred") {
                  report.deferred += 1;
                  report.keywordUpdated += 1;
                } else report.failed += 1;
              } catch (error) {
                const message = error instanceof Error ? error.message : "row failed";
                this.log("error", `[hybrid-search] Reindex row failed for ${uid} ${documentId}: ${message}`);
                pushError(uid, documentId, message);
              }
            },
            REINDEX_PAGE_SIZE
          );
        } catch (error) {
          const message = error instanceof Error ? error.message : "page failed";
          this.log("error", `[hybrid-search] Reindex failed while paging ${uid}: ${message}`);
          pushError(uid, "*", message);
        }
      }
      if (report.failed > 0) {
        report.statusMessage = `Reindex finished with ${report.errorCount} error${report.errorCount === 1 ? "" : "s"}. Failed rows are marked failed and will be retried.`;
      }
      return report;
    } finally {
      if (this.job) {
        this.job.running = false;
        this.job.finishedAt = (/* @__PURE__ */ new Date()).toISOString();
        this.job.embedded = report.embedded;
        this.job.skipped = report.skipped;
        this.job.failed = report.failed;
        this.job.report = report;
      }
    }
  }
  dryRunRow(uid, row) {
    const config2 = this.types()[uid];
    if (!row?.documentId || this.isExcluded(uid, row)) return "removed";
    const text = buildEmbedText(config2.fields, row);
    if (!text) return "removed";
    const hash = textHash(text);
    const stored = this.memory.get(uid, row.documentId);
    const identity = stored ? {
      model: stored.model,
      version: stored.embeddingVersion,
      textHash: stored.textHash,
      status: stored.status,
      hasVector: Boolean(stored.vector)
    } : null;
    if (shouldSkipEmbed(identity, { model: EMBEDDING_MODEL, version: EMBEDDING_VERSION, textHash: hash })) return "skipped";
    if (!this.embedder.hasKey()) return "deferred";
    return "embedded";
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
      embeddings: apiKeyConfigured ? "ready" : "disabled",
      statusMessage: apiKeyConfigured ? null : missingKeyMessage(),
      model: EMBEDDING_MODEL,
      embeddingVersion: EMBEDDING_VERSION,
      apiKeyConfigured,
      pgvector: this.pgvector,
      vectorStore: "memory",
      lastSyncAt: this.lastSyncAt,
      lexicalReady: this.lexicalReady,
      types,
      totals,
      job: this.job ? {
        running: this.job.running,
        dryRun: this.job.dryRun,
        scanned: this.job.scanned,
        embedded: this.job.embedded,
        skipped: this.job.skipped,
        failed: this.job.failed,
        startedAt: this.job.startedAt,
        finishedAt: this.job.finishedAt ?? null
      } : null
    };
  }
}
const bootstrap = async ({ strapi }) => {
  try {
    await getRuntime(strapi).start();
  } catch (error) {
    strapi.log.error("[hybrid-search] Bootstrap failed. Boot continues.", error);
  }
};
const config = {
  default: {
    embedGapMs: 40,
    similarThreshold: 0.9,
    types: {}
  },
  validator(value) {
    if (value.types != null && (typeof value.types !== "object" || Array.isArray(value.types))) {
      throw new Error("hybrid-search config.types must be an object of uid -> { fields }");
    }
  }
};
const adminRoute = (method, path, handler, action) => ({
  method,
  path,
  handler,
  config: {
    policies: [
      "admin::isAuthenticatedAdmin",
      { name: "admin::hasPermissions", config: { actions: [action] } }
    ]
  }
});
const routes$1 = [
  adminRoute("GET", "/status", "search.status", READ_ACTION),
  adminRoute("GET", "/admin/status", "search.status", READ_ACTION),
  adminRoute("POST", "/search", "search.search", READ_ACTION),
  adminRoute("POST", "/admin/search", "search.search", READ_ACTION),
  adminRoute("POST", "/reindex", "search.reindex", REINDEX_ACTION),
  adminRoute("POST", "/admin/reindex", "search.reindex", REINDEX_ACTION)
];
const routes = {
  admin: {
    type: "admin",
    routes: routes$1
  }
};
const search$1 = ({ strapi }) => ({
  async status(ctx) {
    ctx.body = await getRuntime(strapi).status();
  },
  async search(ctx) {
    const body = ctx.request?.body || {};
    if (typeof body.query !== "string" || body.query.trim().length === 0) {
      return ctx.badRequest("query is required");
    }
    ctx.body = await getRuntime(strapi).search({
      query: body.query,
      uids: Array.isArray(body.uids) ? body.uids : void 0,
      limit: typeof body.limit === "number" ? body.limit : void 0,
      equals: body.equals && typeof body.equals === "object" ? body.equals : void 0,
      since: typeof body.since === "string" ? body.since : void 0,
      tag: typeof body.tag === "string" ? body.tag : void 0
    });
  },
  async reindex(ctx) {
    const body = ctx.request?.body || {};
    ctx.body = await getRuntime(strapi).reindex({
      uids: Array.isArray(body.uids) ? body.uids : void 0,
      dryRun: Boolean(body.dryRun),
      wait: body.wait === false ? false : true
    });
  }
});
const controllers = {
  search: search$1
};
const search = ({ strapi }) => ({
  search: (input) => getRuntime(strapi).search(input),
  similar: (input) => getRuntime(strapi).similar(input),
  reindex: (input) => getRuntime(strapi).reindex(input),
  status: () => getRuntime(strapi).status()
});
const services = {
  search
};
const index = {
  register,
  bootstrap,
  config,
  routes,
  controllers,
  services
};
export {
  index as default
};
