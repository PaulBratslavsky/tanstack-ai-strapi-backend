/**
 * Lexical search against the content-type tables.
 *
 * Postgres: a generated `hybrid_search_tsv` tsvector column plus a GIN index.
 * The query is an OR of stemmed lexemes (`to_tsquery` with `|`), ranked with
 * `ts_rank_cd` so more matched terms rank higher. User text is bound as a
 * parameter and lexemes are reduced to [a-z0-9] before they reach tsquery,
 * so the query string cannot change the operator. SQLite (local dev): OR of
 * LIKE on `hybrid_search_text`, ranked by how many terms hit.
 * This is not an in-process BM25 store. The fusion module only consumes
 * the order this module returns.
 */

import { isSafeIdent, snippetAround } from './text';

export const TEXT_COLUMN = 'hybrid_search_text';
export const TSV_COLUMN = 'hybrid_search_tsv';

export interface TypeColumns {
  table: string;
  documentId: string;
  textColumns: string[];
  exclude?: { column: string; equals: string | number | boolean };
  draftAndPublish: boolean;
}

export interface KeywordHit {
  documentId: string;
  snippet: string;
  /** Higher is better. Postgres uses ts_rank. SQLite uses row order. */
  rank: number;
}

export interface KeywordFilter {
  equals?: Record<string, string | number | boolean>;
  equalsColumns?: Record<string, string>;
  since?: string;
}

/** Function words. A match on these alone is not evidence. */
const STOPWORDS = new Set([
  'a', 'an', 'the', 'to', 'of', 'in', 'on', 'for', 'and', 'or', 'me', 'my', 'i', 'do', 'be', 'is', 'it',
  'when', 'what', 'with', 'from', 'that', 'this', 'at', 'by', 'as', 'are', 'was', 'were', 'you', 'your',
]);

export function contentKeywords(queryText: string): string[] {
  return queryText
    .toLowerCase()
    .split(/\s+/)
    .map((part) => part.replace(/[^a-z0-9]+/g, ''))
    .filter((part) => part.length >= 3 && !STOPWORDS.has(part))
    .slice(0, 12);
}

/**
 * OR tsquery built inside Postgres. The only input is a bound parameter to
 * `to_tsvector`. Lexemes are stripped to letters and digits, then joined
 * with `|`. An empty parse becomes NULL and matches nothing.
 */
export const OR_TSQUERY_SQL = `(
  SELECT CASE
    WHEN q IS NULL OR q = '' THEN NULL
    ELSE to_tsquery('english', q)
  END
  FROM (
    SELECT string_agg(term, ' | ') AS q
    FROM (
      SELECT DISTINCT regexp_replace(lexeme, '[^a-z0-9]+', '', 'g') AS term
      FROM unnest(to_tsvector('english', ?)) AS lex(lexeme, positions)
    ) cleaned
    WHERE term <> ''
  ) built
)`;

export function keywordHitCount(text: string, keywords: string[]): number {
  const lower = text.toLowerCase();
  return keywords.reduce((count, word) => count + (lower.includes(word) ? 1 : 0), 0);
}

const quote = (ident: string) => {
  if (!isSafeIdent(ident)) throw new Error(`Unsafe SQL identifier: ${ident}`);
  return `"${ident}"`;
};

export function clientName(strapi: any): string {
  return (
    strapi?.db?.config?.connection?.client ||
    strapi?.config?.get?.('database.connection.client') ||
    'sqlite'
  );
}

export async function ensureKeywordSchema(knex: any, client: string, types: TypeColumns[]): Promise<void> {
  for (const type of types) {
    if (!isSafeIdent(type.table)) continue;
    const hasText = await knex.schema.hasColumn(type.table, TEXT_COLUMN);
    if (!hasText) {
      await knex.schema.alterTable(type.table, (table: any) => {
        table.text(TEXT_COLUMN);
      });
    }
    if (client === 'postgres') {
      const hasTsv = await knex.schema.hasColumn(type.table, TSV_COLUMN);
      if (!hasTsv) {
        await knex.raw(
          `ALTER TABLE ${quote(type.table)} ADD COLUMN IF NOT EXISTS ${quote(TSV_COLUMN)} tsvector`
        );
      }
      const index = indexName(type.table);
      await knex.raw(
        `CREATE INDEX IF NOT EXISTS ${quote(index)} ON ${quote(type.table)} USING GIN (${quote(TSV_COLUMN)})`
      );
    }
    await backfillText(knex, client, type);
  }
}

function indexName(table: string): string {
  const raw = `hs_tsv_${table}`;
  return raw.length <= 60 ? raw : `hs_tsv_${table.slice(0, 40)}_${table.length}`;
}

async function backfillText(knex: any, client: string, type: TypeColumns): Promise<void> {
  if (type.textColumns.length === 0) return;
  const expr = type.textColumns.map((column) => `coalesce(${quote(column)}::text, '')`).join(` || ' ' || `);
  const sqliteExpr = type.textColumns.map((column) => `coalesce(${quote(column)}, '')`).join(` || ' ' || `);
  const textExpr = client === 'postgres' ? expr : sqliteExpr;
  await knex.raw(
    `UPDATE ${quote(type.table)} SET ${quote(TEXT_COLUMN)} = trim(${textExpr}) WHERE ${quote(TEXT_COLUMN)} IS NULL`
  );
  if (client === 'postgres') {
    await knex.raw(
      `UPDATE ${quote(type.table)} SET ${quote(TSV_COLUMN)} = to_tsvector('english', coalesce(${quote(TEXT_COLUMN)}, '')) WHERE ${quote(TSV_COLUMN)} IS NULL AND ${quote(TEXT_COLUMN)} IS NOT NULL`
    );
  }
}

export async function writeKeywordText(
  knex: any,
  client: string,
  type: TypeColumns,
  documentId: string,
  text: string
): Promise<void> {
  const where = { [type.documentId]: documentId };
  await knex(type.table).where(where).update({ [TEXT_COLUMN]: text });
  if (client === 'postgres') {
    await knex.raw(
      `UPDATE ${quote(type.table)} SET ${quote(TSV_COLUMN)} = to_tsvector('english', ?) WHERE ${quote(type.documentId)} = ?`,
      [text, documentId]
    );
  }
}

export async function clearKeywordText(
  knex: any,
  client: string,
  type: TypeColumns,
  documentId: string
): Promise<void> {
  await writeKeywordText(knex, client, type, documentId, '');
}

function applyCommon(query: any, type: TypeColumns, filter?: KeywordFilter) {
  if (type.draftAndPublish) query.whereNotNull('published_at');
  if (type.exclude) {
    const column = type.exclude.column;
    const equals = type.exclude.equals;
    query.where((builder: any) => {
      builder.whereNull(column).orWhereNot(column, equals);
    });
  }
  if (filter?.since) query.where('updated_at', '>=', filter.since);
  if (filter?.equals && filter.equalsColumns) {
    for (const [field, value] of Object.entries(filter.equals)) {
      const column = filter.equalsColumns[field];
      if (column) query.where(column, value);
    }
  }
}

export async function searchKeyword(
  knex: any,
  client: string,
  type: TypeColumns,
  queryText: string,
  limit: number,
  filter?: KeywordFilter
): Promise<KeywordHit[]> {
  const keywords = contentKeywords(queryText);
  if (keywords.length === 0 || limit <= 0) return [];

  if (client === 'postgres') {
    const query = knex(type.table)
      .select({
        documentId: type.documentId,
        snippet: knex.raw(
          `ts_headline('english', coalesce(${quote(TEXT_COLUMN)}, ''), ${OR_TSQUERY_SQL}, 'MaxWords=24, MinWords=6, MaxFragments=1')`,
          [queryText]
        ),
        rank: knex.raw(`ts_rank_cd(${quote(TSV_COLUMN)}, ${OR_TSQUERY_SQL})`, [queryText]),
      })
      .whereRaw(`${quote(TSV_COLUMN)} @@ ${OR_TSQUERY_SQL}`, [queryText])
      .orderByRaw('rank DESC')
      .limit(limit);
    applyCommon(query, type, filter);
    const rows = await query;
    return rows.map((row: any) => ({
      documentId: String(row.documentId),
      snippet: String(row.snippet ?? ''),
      rank: Number(row.rank) || 0,
    }));
  }

  const query = knex(type.table).select({
    documentId: type.documentId,
    text: TEXT_COLUMN,
  });
  applyCommon(query, type, filter);
  query.where((builder: any) => {
    for (const keyword of keywords) {
      const escaped = keyword.replace(/[\\%_]/g, (ch) => `\\${ch}`);
      builder.orWhere(TEXT_COLUMN, 'like', `%${escaped}%`);
    }
  });
  query.limit(Math.max(limit * 8, limit));
  const rows = await query;
  return rows
    .map((row: any) => {
      const text = String(row.text ?? '');
      return {
        documentId: String(row.documentId),
        snippet: snippetAround(text, keywords),
        rank: keywordHitCount(text, keywords),
      };
    })
    .sort((a, b) => b.rank - a.rank || a.documentId.localeCompare(b.documentId))
    .slice(0, limit);
}

export async function countIndexable(knex: any, type: TypeColumns): Promise<number> {
  const query = knex(type.table).count({ count: '*' });
  applyCommon(query, type);
  const row = await query.first();
  const value = row?.count ?? row?.['count(*)'] ?? 0;
  return Number(value) || 0;
}
