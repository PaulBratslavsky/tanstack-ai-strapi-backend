import { describe, expect, it } from 'vitest';
import brain, { SEARCH_PAGE_SIZE, SEARCH_SCAN_CAP } from '../services/brain';
import { pacificMidnightIso, sinceToUpdatedAt, toDateOnly } from '../mcp/utils';

type Row = Record<string, any>;

function matches(row: Row, filters: any): boolean {
  if (!filters || typeof filters !== 'object') return true;
  if (Array.isArray(filters.$and) && !filters.$and.every((clause: any) => matches(row, clause))) return false;
  if (Array.isArray(filters.$or) && !filters.$or.some((clause: any) => matches(row, clause))) return false;
  for (const [key, cond] of Object.entries(filters)) {
    if (key === '$and' || key === '$or') continue;
    if (!matchField(row, key, cond)) return false;
  }
  return true;
}

function matchField(row: Row, key: string, cond: any): boolean {
  if (cond && typeof cond === 'object' && cond.documentId?.$eq) {
    return (row[key] || []).some((item: any) => item.documentId === cond.documentId.$eq);
  }
  if (cond && typeof cond === 'object') {
    if ('$eq' in cond && row[key] !== cond.$eq) return false;
    if ('$ne' in cond && row[key] === cond.$ne) return false;
    if ('$in' in cond && !cond.$in.includes(row[key])) return false;
    if ('$gte' in cond && String(row[key] ?? '') < String(cond.$gte)) return false;
    if ('$containsi' in cond) {
      return String(row[key] ?? '').toLowerCase().includes(String(cond.$containsi).toLowerCase());
    }
    if ('$null' in cond) {
      const isNull = row[key] == null;
      if (Boolean(cond.$null) !== isNull) return false;
    }
    if ('$notNull' in cond && (row[key] == null) === Boolean(cond.$notNull)) return false;
    return true;
  }
  return row[key] === cond;
}

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
          let list = rows.filter((row) => matches(row, params.filters || {}));

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
const RESOURCE_UID = 'plugin::paul-brain.resource';

function resource(index: number, extra: Partial<Row> = {}): Row {
  const day = new Date(Date.UTC(2020, 0, 1) + index * 86400000).toISOString();
  return {
    documentId: `resource-${index}`,
    title: `Resource ${index}`,
    slug: `resource-${index}`,
    format: 'md',
    state: 'final',
    summary: '',
    body: '',
    extractedText: '',
    altText: '',
    tags: [],
    updatedAt: day,
    ...extra,
  };
}

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

describe('resource recall', () => {
  it('searches summary, body, extractedText, and altText', async () => {
    const strapi = mockStrapi({
      [RESOURCE_UID]: [
        resource(1, { summary: 'line market brief' }),
        resource(2, { body: 'hands-on guide to the talk' }),
        resource(3, { extractedText: 'page seven mentions zephyr' }),
        resource(4, { altText: 'diagram of the gateway' }),
        resource(5, { title: 'unrelated', body: 'nothing here' }),
        resource(6, { caption: 'red barn at dusk' }),
        resource(7, { snapshotMarkdown: 'canvas-only paragraph about the launch' }),
      ],
    });
    const service = brain({ strapi: strapi as any });

    const summary = await service.search({ query: 'market', types: ['resource'] });
    const body = await service.search({ query: 'hands-on', types: ['resource'] });
    const extracted = await service.search({ query: 'zephyr', types: ['resource'] });
    const alt = await service.search({ query: 'gateway', types: ['resource'] });
    const caption = await service.search({ query: 'barn', types: ['resource'] });
    const snapshot = await service.search({ query: 'canvas-only', types: ['resource'] });

    expect(summary.map((result) => result.documentId)).toEqual(['resource-1']);
    expect(body.map((result) => result.documentId)).toEqual(['resource-2']);
    expect(extracted.map((result) => result.documentId)).toEqual(['resource-3']);
    expect(alt.map((result) => result.documentId)).toEqual(['resource-4']);
    expect(caption.map((result) => result.documentId)).toEqual(['resource-6']);
    expect(snapshot.map((result) => result.documentId)).toEqual(['resource-7']);
  });

  it('includes resources in the default type list', async () => {
    const strapi = mockStrapi({
      [RESOURCE_UID]: [resource(1, { title: 'Zephyr guide' })],
    });
    const service = brain({ strapi: strapi as any });

    const results = await service.search({ query: 'zephyr' });

    expect(results.map((result) => result.documentId)).toEqual(['resource-1']);
    expect(strapi.calls.some((call) => call.uid === RESOURCE_UID)).toBe(true);
  });

  it('asks the database for older resource text on every resource field', async () => {
    const total = SEARCH_SCAN_CAP + 50;
    const resources = Array.from({ length: total }, (_, index) =>
      resource(index, index === 0 ? { extractedText: 'zephyr lives in the old pdf text' } : {})
    );
    const strapi = mockStrapi({ [RESOURCE_UID]: resources });
    const service = brain({ strapi: strapi as any });

    const results = await service.search({ query: 'zephyr', types: ['resource'] });

    expect(results.map((result) => result.documentId)).toContain('resource-0');
    const textQuery = strapi.calls.find((call) => Array.isArray(call.params.filters?.$or));
    expect(textQuery?.params.filters.$or).toEqual(
      expect.arrayContaining([
        { title: { $containsi: 'zephyr' } },
        { summary: { $containsi: 'zephyr' } },
        { body: { $containsi: 'zephyr' } },
        { extractedText: { $containsi: 'zephyr' } },
        { altText: { $containsi: 'zephyr' } },
        { caption: { $containsi: 'zephyr' } },
        { snapshotMarkdown: { $containsi: 'zephyr' } },
      ])
    );
  });

  it('filters resource tags the same way as notes', async () => {
    const strapi = mockStrapi({
      [RESOURCE_UID]: [
        resource(1, { body: 'shared keyword alpha', tags: ['guide'] }),
        resource(2, { body: 'shared keyword alpha', tags: ['draft'] }),
      ],
    });
    const service = brain({ strapi: strapi as any });

    const results = await service.search({ query: 'alpha', types: ['resource'], tag: 'guide' });

    expect(results.map((result) => result.documentId)).toEqual(['resource-1']);
  });
});

describe('note duplicate check', () => {
  it('uses newest-first search and recommends update when the title lives in an older body', async () => {
    const notes = Array.from({ length: 150 }, (_, index) =>
      note(index, index === 0 ? { title: 'Unrelated log', body: 'zephyr habitat details from the oldest note' } : {})
    );
    const strapi = mockStrapi({ [NOTE_UID]: notes });
    const service = brain({ strapi: strapi as any });

    const assessment = await service.assessNote({
      title: 'Zephyr habitat',
      summary: 'where it lives',
    });

    expect(assessment.recommendedAction).toBe('update_existing');
    expect(assessment.related.map((item) => item.documentId)).toContain('note-0');
    expect(assessment.related.find((item) => item.documentId === 'note-0')?.match).toBe('title');
    expect(strapi.calls.some((call) => Array.isArray(call.params.sort) && call.params.sort[0] === 'updatedAt:desc')).toBe(true);
    expect(strapi.calls.some((call) => call.params.start === SEARCH_PAGE_SIZE)).toBe(true);
    expect(JSON.stringify(assessment)).not.toContain('details from the oldest note');
  });

  it('skips when the proposed summary and body are already stored', async () => {
    const strapi = mockStrapi({
      [NOTE_UID]: [note(4, { title: 'Zephyr habitat', summary: 'where it lives', body: 'full details' })],
    });
    const service = brain({ strapi: strapi as any });
    const assessment = await service.assessNote({
      title: 'Zephyr habitat',
      summary: 'where it lives',
      body: 'full details',
    });
    expect(assessment.recommendedAction).toBe('skip');
  });

  it('recommends update when dedupeKey matches and the body is new', async () => {
    const strapi = mockStrapi({
      [NOTE_UID]: [note(4, { title: 'Other', body: 'old text', dedupeKey: 'launch-2026' })],
    });
    const service = brain({ strapi: strapi as any });
    const assessment = await service.assessNote({
      title: 'Launch plan',
      body: 'new paragraph',
      dedupeKey: 'launch-2026',
    });
    expect(assessment.recommendedAction).toBe('update_existing');
    expect(assessment.related[0].match).toBe('dedupeKey');
    expect(assessment.related[0].documentId).toBe('note-4');
  });

  it('recommends create when nothing is related, including an archived key match', async () => {
    const strapi = mockStrapi({
      [NOTE_UID]: [
        note(1, { title: 'Cooking pasta', body: 'boil water' }),
        note(2, { title: 'Quarterly budget review', body: 'old', dedupeKey: 'budget', archived: true }),
      ],
    });
    const service = brain({ strapi: strapi as any });
    const assessment = await service.assessNote({
      title: 'Quarterly budget review',
      body: 'fresh numbers',
      dedupeKey: 'budget',
    });
    expect(assessment.recommendedAction).toBe('create');
    expect(assessment.related.map((item) => item.documentId)).not.toContain('note-2');
  });
});

describe('archived rows', () => {
  it('leaves archived notes and resources out of recall', async () => {
    const strapi = mockStrapi({
      [NOTE_UID]: [
        note(2, { title: 'Zephyr habitat', body: 'live' }),
        note(3, { title: 'Zephyr habitat archived', body: 'zephyr habitat hidden', archived: true }),
      ],
      [RESOURCE_UID]: [
        resource(2, { title: 'Zephyr guide', state: 'final' }),
        resource(3, { title: 'Zephyr archive', state: 'archived' }),
      ],
    });
    const service = brain({ strapi: strapi as any });

    const notes = await service.search({ query: 'zephyr habitat', types: ['note'] });
    const resources = await service.search({ query: 'zephyr', types: ['resource'] });

    expect(notes.map((result) => result.documentId)).toEqual(['note-2']);
    expect(resources.map((result) => result.documentId)).toEqual(['resource-2']);
  });
});

describe('hybrid recall', () => {
  it('keeps hybrid order and cosine, and leaves archived rows out', async () => {
    const notes = [
      note(1, { title: 'Live habitat', body: 'zephyr lives here' }),
      note(2, { title: 'Archived habitat', body: 'zephyr hidden', archived: true }),
    ];
    const strapi = mockStrapi({ [NOTE_UID]: notes });
    (strapi as any).plugin = () => ({
      service: () => ({
        search: async () => ({
          mode: 'hybrid',
          lexicalReady: true,
          statusMessage: null,
          results: [
            { uid: NOTE_UID, type: NOTE_UID, documentId: 'note-2', score: 0.2, snippet: 'hidden', matchTier: 'top' },
            { uid: NOTE_UID, type: NOTE_UID, documentId: 'note-1', score: 0.91, snippet: 'live snippet', matchTier: 'strong' },
          ],
        }),
      }),
    });
    const service = brain({ strapi: strapi as any });
    const results = await service.search({ query: 'zephyr', types: ['note'] }) as any;
    expect(results.map((result: any) => result.documentId)).toEqual(['note-1']);
    expect(results[0].score).toBe(0.91);
    expect(results[0].matchTier).toBe('strong');
    expect(results[0].snippet).toBe('live snippet');
    expect(results.searchMode).toBe('hybrid');
  });

  it('uses the keyword scan when hybrid has no index yet', async () => {
    const strapi = mockStrapi({
      [NOTE_UID]: [note(1, { title: 'Zephyr habitat', body: 'lives in the canyon' })],
    });
    (strapi as any).plugin = () => ({
      service: () => ({
        search: async () => ({ mode: 'keyword-only', lexicalReady: false, results: [], statusMessage: 'Semantic search is off because OPENAI_API_KEY is not set.' }),
      }),
    });
    const service = brain({ strapi: strapi as any });
    const results = await service.search({ query: 'zephyr', types: ['note'] }) as any;
    expect(results.map((result: any) => result.documentId)).toEqual(['note-1']);
    expect(results.searchMode).toBe('keyword-scan');
  });

  it('recommends update when similar() is at least 0.9', async () => {
    const strapi = mockStrapi({
      [NOTE_UID]: [note(4, { title: 'Zephyr habitat', summary: 'old summary', body: 'old body' })],
    });
    (strapi as any).plugin = () => ({
      service: () => ({
        similar: async () => ({
          enabled: true,
          indexedCount: 2,
          results: [{ documentId: 'note-4', score: 0.94 }],
        }),
      }),
    });
    const service = brain({ strapi: strapi as any });
    const assessment = await service.assessNote({ title: 'Where zephyr lives', body: 'a new paragraph' });
    expect(assessment.recommendedAction).toBe('update_existing');
    expect(assessment.related[0].documentId).toBe('note-4');
    expect(assessment.related[0].match).toBe('search');
  });

  it('keeps the keyword duplicate check when similar() is disabled', async () => {
    const strapi = mockStrapi({
      [NOTE_UID]: [note(4, { title: 'Zephyr habitat', summary: 'where it lives', body: 'full details' })],
    });
    (strapi as any).plugin = () => ({
      service: () => ({
        similar: async () => ({ enabled: false, indexedCount: 0, statusMessage: 'missing key', results: [] }),
        search: async () => ({ mode: 'keyword-only', lexicalReady: false, results: [], statusMessage: 'missing' }),
      }),
    });
    const service = brain({ strapi: strapi as any });
    const assessment = await service.assessNote({
      title: 'Zephyr habitat',
      summary: 'where it lives',
      body: 'full details',
    });
    expect(assessment.recommendedAction).toBe('skip');
  });
});

describe('toDateOnly', () => {
  it('keeps a calendar date and strips a time from an ISO timestamp', () => {
    expect(toDateOnly('2026-11-15')).toBe('2026-11-15');
    expect(toDateOnly('2026-11-15T08:30:00.000Z')).toBe('2026-11-15');
  });
});

describe('Pacific dates', () => {
  it('maps a calendar date to midnight in America/Los_Angeles', () => {
    expect(pacificMidnightIso('2026-01-15')).toBe('2026-01-15T08:00:00.000Z');
    expect(pacificMidnightIso('2026-07-15')).toBe('2026-07-15T07:00:00.000Z');
  });

  it('leaves a full timestamp alone and converts a date-only since', () => {
    expect(sinceToUpdatedAt('2026-11-15T18:00:00.000Z')).toBe('2026-11-15T18:00:00.000Z');
    expect(sinceToUpdatedAt('2026-01-15')).toBe('2026-01-15T08:00:00.000Z');
  });
});
