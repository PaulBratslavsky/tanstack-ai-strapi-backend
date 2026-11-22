import { readFileSync } from 'fs';
import { join } from 'path';
import { afterEach, describe, expect, it } from 'vitest';
import { getRuntime } from '../runtime';

const NOTE = 'plugin::paul-brain.note';
const TODO = 'plugin::paul-brain.todo';
const PERSON = 'plugin::paul-brain.person';
const DECISION = 'plugin::paul-brain.decision';

const fixture = JSON.parse(
  readFileSync(join(__dirname, '../eval/cases.json'), 'utf8')
) as {
  corpus: Array<{ uid: string; documentId: string; fields: Record<string, unknown> }>;
  cases: Array<{
    id: string;
    query: string;
    expectDocumentIds: string[];
    expectInTop: string[];
  }>;
};

const attributes = (names: string[], json: string[] = []) => {
  const attributes: Record<string, { type: string }> = { updatedAt: { type: 'datetime' } };
  for (const name of names) attributes[name] = { type: json.includes(name) ? 'json' : 'text' };
  return { options: { draftAndPublish: false }, attributes };
};

const models: Record<string, ReturnType<typeof attributes>> = {
  [NOTE]: attributes(['title', 'body', 'summary', 'tags'], ['tags']),
  [TODO]: attributes(['title', 'goal', 'acceptanceCriteria', 'context']),
  [PERSON]: attributes(['name', 'notes_md']),
  [DECISION]: attributes(['title', 'summary', 'body']),
};

const types = {
  [NOTE]: { fields: ['title', 'body', 'summary', 'tags'], titleField: 'title', tagField: 'tags' },
  [TODO]: { fields: ['title', 'goal', 'acceptanceCriteria', 'context'], titleField: 'title' },
  [PERSON]: { fields: ['name', 'notes_md'], titleField: 'name' },
  [DECISION]: { fields: ['title', 'summary', 'body'], titleField: 'title' },
};

function vectorFor(input: string): number[] {
  const text = input.toLowerCase();
  const vector = [0, 0, 0, 0, 0, 0.05];
  if (text.includes('yt-kb') || text.includes('video clip')) vector[0] = 1;
  if (text.includes('urology') || text.includes('labcorp') || text.includes('doctor appointment')) vector[1] = 1;
  if (text.includes('ada lovelace')) vector[2] = 1;
  if (text.includes('postgres for the brain')) vector[3] = 1;
  if (text.includes('strapi tutorial') || text.includes('content manager')) vector[4] = 1;
  return vector;
}

describe('search eval fixture', () => {
  const previousKey = process.env.OPENAI_API_KEY;
  const previousFetch = global.fetch;

  afterEach(() => {
    if (previousKey === undefined) delete process.env.OPENAI_API_KEY;
    else process.env.OPENAI_API_KEY = previousKey;
    global.fetch = previousFetch;
  });

  it('puts each expected hit in the top 3', async () => {
    process.env.OPENAI_API_KEY = 'test-key';
    const embedded: string[] = [];
    global.fetch = (async (_url: string, init?: RequestInit) => {
      const body = JSON.parse(String(init?.body || '{}')) as { input?: string };
      const input = body.input || '';
      embedded.push(input);
      return new Response(JSON.stringify({ data: [{ embedding: vectorFor(input) }] }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      });
    }) as typeof fetch;

    const rows = new Map(
      fixture.corpus.map((row) => [
        `${row.uid}:${row.documentId}`,
        { documentId: row.documentId, ...row.fields, updatedAt: '2026-04-01T00:00:00.000Z' },
      ])
    );
    const strapi = {
      config: {
        get(key: string) {
          if (key === 'plugin::hybrid-search.types') return types;
          return undefined;
        },
      },
      log: { info() {}, warn() {}, error() {}, debug() {} },
      getModel(uid: string) {
        return models[uid];
      },
      db: { connection: null, config: { connection: { client: 'sqlite' } } },
      documents(uid: string) {
        return {
          async findOne(params: { documentId: string }) {
            return rows.get(`${uid}:${params.documentId}`) || null;
          },
          async findMany(params: { filters?: { documentId?: { $in?: string[] } } }) {
            const ids = params.filters?.documentId?.$in;
            return [...rows.entries()]
              .filter(([key]) => key.startsWith(`${uid}:`))
              .map(([, row]) => row)
              .filter((row) => !ids || ids.includes(row.documentId));
          },
        };
      },
    };

    const runtime = getRuntime(strapi);
    for (const row of fixture.corpus) {
      expect(await runtime.indexDocument(row.uid, row.documentId)).toBe('embedded');
    }
    expect(embedded.some((input) => input.includes('yt-kb') && input.includes('body:'))).toBe(true);
    expect(embedded.some((input) => input.includes('Labcorp'))).toBe(true);

    for (const item of fixture.cases) {
      const searched = await runtime.search({ query: item.query, limit: 3 });
      const top = searched.results.slice(0, 3);
      for (const documentId of item.expectDocumentIds) {
        expect(top.map((hit) => hit.documentId), item.id).toContain(documentId);
      }
      const haystack = top.map((hit) => hit.snippet).join('\n');
      for (const phrase of item.expectInTop) {
        expect(haystack.toLowerCase(), `${item.id} ${phrase}`).toContain(phrase.toLowerCase());
      }
    }
  });
});
