import { describe, expect, it } from 'vitest';
import brain, { SEARCH_PAGE_SIZE, SEARCH_SCAN_CAP } from '../services/brain';
import { toDateOnly } from '../mcp/utils';

type Row = Record<string, any>;

function mockStrapi(rowsByUid: Record<string, Row[]>) {
  const calls: Array<{ uid: string; params: any }> = [];

  const strapi = {
    calls,
    log: { warn: () => undefined },
    documents(uid: string) {
      const rows = rowsByUid[uid] || [];
      return {
        async findMany(params: any) {
          calls.push({ uid, params });
          let list = rows.slice();
          const filters = params.filters || {};

          if (filters.kind?.$eq) {
            list = list.filter((row) => row.kind === filters.kind.$eq);
          }
          if (filters.videoId?.$eq) {
            list = list.filter((row) => row.videoId === filters.videoId.$eq);
          }
          if (filters.updatedAt?.$gte) {
            list = list.filter((row) => row.updatedAt >= filters.updatedAt.$gte);
          }
          if (filters.sources?.documentId?.$eq) {
            const sourceId = filters.sources.documentId.$eq;
            list = list.filter((row) =>
              (row.sources || []).some((source: any) => source.documentId === sourceId)
            );
          }
          if (Array.isArray(filters.$or)) {
            list = list.filter((row) =>
              filters.$or.some((clause: Record<string, { $containsi?: string }>) => {
                const [field, cond] = Object.entries(clause)[0];
                const value = String(row[field] ?? '').toLowerCase();
                return value.includes(String(cond.$containsi ?? '').toLowerCase());
              })
            );
          }

          list.sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt)));
          const start = params.start ?? 0;
          const limit = params.limit ?? list.length;
          return list.slice(start, start + limit);
        },
      };
    },
  };

  return strapi;
}

function note(index: number, extra: Partial<Row> = {}): Row {
  const day = new Date(Date.UTC(2020, 0, 1) + index * 86400000).toISOString();
  return {
    documentId: `note-${index}`,
    title: `Note ${index}`,
    body: 'ordinary text',
    slug: `note-${index}`,
    tags: [],
    aliases: [],
    sources: [],
    people: [],
    updatedAt: day,
    ...extra,
  };
}

const NOTE_UID = 'plugin::paul-brain.note';

describe('recall search', () => {
  it('finds a match past the old unordered 100-row window', async () => {
    const notes = Array.from({ length: 150 }, (_, index) =>
      note(index, index === 0 ? { body: 'zephyr lives in the oldest note' } : {})
    );
    const strapi = mockStrapi({ [NOTE_UID]: notes });
    const service = brain({ strapi: strapi as any });

    const results = await service.search({ query: 'zephyr', types: ['note'] });

    expect(results.map((result) => result.documentId)).toContain('note-0');
    expect(strapi.calls[0].params.sort).toEqual(['updatedAt:desc']);
    expect(strapi.calls[0].params.limit).toBe(SEARCH_PAGE_SIZE);
    expect(strapi.calls.length).toBeGreaterThan(1);
    expect(strapi.calls[1].params.start).toBe(SEARCH_PAGE_SIZE);
  });

  it('loads older text matches from the database when the newest window is full', async () => {
    const total = SEARCH_SCAN_CAP + 200;
    const notes = Array.from({ length: total }, (_, index) =>
      note(index, index === 0 ? { body: 'zephyr is older than the scan cap' } : {})
    );
    const strapi = mockStrapi({ [NOTE_UID]: notes });
    const service = brain({ strapi: strapi as any });

    const results = await service.search({ query: 'zephyr', types: ['note'] });

    expect(results.map((result) => result.documentId)).toContain('note-0');
    const textQuery = strapi.calls.find((call) => Array.isArray(call.params.filters?.$or));
    expect(textQuery).toBeTruthy();
    expect(textQuery?.params.filters.$or).toEqual(
      expect.arrayContaining([{ body: { $containsi: 'zephyr' } }])
    );
  });

  it('still scores tag matches that are not in scalar text fields', async () => {
    const strapi = mockStrapi({
      [NOTE_UID]: [note(1, { title: 'Untitled', body: 'no keywords here', tags: ['strapi'] })],
    });
    const service = brain({ strapi: strapi as any });

    const results = await service.search({ query: 'strapi', types: ['note'] });

    expect(results).toHaveLength(1);
    expect(results[0].documentId).toBe('note-1');
  });

  it('filters linked sources in the database query', async () => {
    const notes = [
      note(1, { body: 'shared keyword alpha', sources: [{ documentId: 'src-a' }] }),
      note(2, { body: 'shared keyword alpha', sources: [{ documentId: 'src-b' }] }),
    ];
    const strapi = mockStrapi({ [NOTE_UID]: notes });
    const service = brain({ strapi: strapi as any });

    const results = await service.search({
      query: 'alpha',
      types: ['note'],
      sourceId: 'src-a',
    });

    expect(results.map((result) => result.documentId)).toEqual(['note-1']);
    expect(strapi.calls[0].params.filters.sources).toEqual({ documentId: { $eq: 'src-a' } });
    expect(strapi.calls[0].params.filters.kind).toBeUndefined();
  });

  it('applies kind and videoId as database filters', async () => {
    const notes = [
      note(1, { kind: 'video', videoId: 'abc123', body: 'alpha transcript' }),
      note(2, { kind: 'fact', videoId: 'abc123', body: 'alpha other' }),
    ];
    const strapi = mockStrapi({ [NOTE_UID]: notes });
    const service = brain({ strapi: strapi as any });

    const results = await service.search({
      query: 'alpha',
      types: ['note'],
      kind: 'video',
      videoId: 'abc123',
    });

    expect(results.map((result) => result.documentId)).toEqual(['note-1']);
    expect(strapi.calls[0].params.filters.kind).toEqual({ $eq: 'video' });
    expect(strapi.calls[0].params.filters.videoId).toEqual({ $eq: 'abc123' });
  });
});

describe('toDateOnly', () => {
  it('keeps a calendar date and strips a time from an ISO timestamp', () => {
    expect(toDateOnly('2026-11-15')).toBe('2026-11-15');
    expect(toDateOnly('2026-11-15T08:30:00.000Z')).toBe('2026-11-15');
  });
});
