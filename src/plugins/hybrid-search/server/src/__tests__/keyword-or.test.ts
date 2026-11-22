import { describe, expect, it } from 'vitest';
import { OR_TSQUERY_SQL, keywordHitCount, searchKeyword, type TypeColumns } from '../services/keyword-search';

const type: TypeColumns = {
  table: 'notes',
  documentId: 'document_id',
  textColumns: ['title', 'body'],
  draftAndPublish: false,
};

describe('OR keyword query', () => {
  it('builds a bound OR tsquery and ranks with cover density', () => {
    expect(OR_TSQUERY_SQL).toContain("to_tsquery('english'");
    expect(OR_TSQUERY_SQL).toContain("string_agg(term, ' | ')");
    expect(OR_TSQUERY_SQL).toContain("regexp_replace(lexeme, '[^a-z0-9]+'");
    expect(OR_TSQUERY_SQL).toContain('to_tsvector');
    expect(OR_TSQUERY_SQL).not.toContain('${');
  });

  it('sends the raw query only as a binding, including characters that would break tsquery', async () => {
    const calls: Array<{ sql: string; bindings: unknown[] }> = [];
    const builder: any = {
      select() {
        return builder;
      },
      whereRaw(sql: string, bindings: unknown[]) {
        calls.push({ sql, bindings });
        return builder;
      },
      orderByRaw() {
        return builder;
      },
      limit() {
        return builder;
      },
      where() {
        return builder;
      },
      whereNotNull() {
        return builder;
      },
      then(resolve: (rows: unknown[]) => void) {
        resolve([]);
      },
    };
    const knex = (() => builder) as any;
    knex.raw = (sql: string, bindings: unknown[]) => {
      calls.push({ sql, bindings });
      return { sql };
    };

    await searchKeyword(knex, 'postgres', type, "doctor'); DROP TABLE appointments | book", 5);

    const match = calls.find((call) => call.sql.includes('@@'));
    expect(calls.some((call) => call.sql.includes('ts_rank_cd'))).toBe(true);
    expect(match?.sql).not.toContain('plainto_tsquery');
    expect(match?.sql).not.toContain('DROP TABLE');
    expect(match?.bindings).toEqual(["doctor'); DROP TABLE appointments | book"]);
    expect(calls.some((call) => call.sql.includes('ts_headline'))).toBe(true);
  });

  it('ranks a sqlite row that matches more terms above a single-term row', async () => {
    const rows = [
      { documentId: 'one', text: 'book the clinic visit' },
      { documentId: 'both', text: 'book the urology doctor appointment' },
    ];
    const builder: any = {
      select() {
        return builder;
      },
      where(columnOrFn: unknown) {
        if (typeof columnOrFn === 'function') columnOrFn(builder);
        return builder;
      },
      orWhere() {
        return builder;
      },
      limit() {
        return builder;
      },
      then(resolve: (value: typeof rows) => void) {
        resolve(rows);
      },
    };
    const knex = (() => builder) as any;
    const hits = await searchKeyword(knex, 'sqlite', type, 'doctor appointments I still need to book', 5);
    expect(hits.map((hit) => hit.documentId)).toEqual(['both', 'one']);
    expect(hits[0].rank).toBeGreaterThan(hits[1].rank);
    expect(keywordHitCount('book the urology doctor appointment', ['doctor', 'book'])).toBe(2);
  });
});
