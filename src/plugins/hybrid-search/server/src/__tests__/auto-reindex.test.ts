import { afterEach, describe, expect, it } from 'vitest';
import { getRuntime } from '../runtime';
import { encodeVector } from '../services/text';

const NOTE = 'plugin::paul-brain.note';

const noteModel = {
  options: { draftAndPublish: false },
  collectionName: 'notes',
  attributes: {
    title: { type: 'string' },
    body: { type: 'richtext' },
    updatedAt: { type: 'datetime' },
  },
};

function vectorRow() {
  return {
    id: 1,
    uid: NOTE,
    document_id: 'lesson',
    model: 'text-embedding-3-small',
    embedding_version: 1,
    text_hash: 'old',
    embedding_b64: encodeVector([1, 0, 0]),
    dims: 3,
    status: 'current',
    error: null,
    preview: 'old title',
    updated_at: '2026-01-01T00:00:00.000Z',
  };
}

function knexStub(rows: any[]) {
  const knex: any = (table: string) => {
    const api: any = {
      select: () => Promise.resolve(table === 'hybrid_search_vectors' ? rows : []),
      whereIn: () => ({ update: async () => undefined }),
      where: () => ({
        first: async () => rows[0] || null,
        update: async () => undefined,
        delete: async () => undefined,
      }),
      insert: async () => undefined,
    };
    return api;
  };
  knex.schema = {
    hasTable: async () => true,
    hasColumn: async () => true,
    alterTable: async () => undefined,
  };
  knex.fn = { now: () => new Date() };
  knex.raw = async () => ({ rows: [] });
  return knex;
}

describe('auto reindex', () => {
  const previousKey = process.env.OPENAI_API_KEY;
  const previousFetch = global.fetch;

  afterEach(() => {
    if (previousKey === undefined) delete process.env.OPENAI_API_KEY;
    else process.env.OPENAI_API_KEY = previousKey;
    global.fetch = previousFetch;
  });

  it('starts in the background, skips a second run, and survives an API error', async () => {
    process.env.OPENAI_API_KEY = 'test-key';
    let releaseEmbed: (value: Response) => void = () => undefined;
    const gate = new Promise<Response>((resolve) => {
      releaseEmbed = resolve;
    });
    let calls = 0;
    global.fetch = (async () => {
      calls += 1;
      if (calls === 1) return gate;
      return new Response('nope', { status: 500 });
    }) as typeof fetch;

    const logs: string[] = [];
    const strapi = {
      config: {
        get(key: string) {
          if (key === 'plugin::hybrid-search.types') {
            return { [NOTE]: { fields: ['title', 'body'], titleField: 'title' } };
          }
          return undefined;
        },
      },
      log: {
        info(message: string) {
          logs.push(message);
        },
        warn(message: string) {
          logs.push(message);
        },
        error(message: string) {
          logs.push(message);
        },
        debug() {},
      },
      getModel() {
        return noteModel;
      },
      db: {
        connection: knexStub([vectorRow()]),
        metadata: { get: () => ({ tableName: 'notes' }) },
        config: { connection: { client: 'sqlite' } },
      },
      documents() {
        return {
          async findOne() {
            return { documentId: 'lesson', title: 'Office hours', body: 'yt-kb lesson body' };
          },
          async findMany() {
            return [{ documentId: 'lesson', title: 'Office hours', body: 'yt-kb lesson body' }];
          },
        };
      },
    };

    const runtime = getRuntime(strapi);
    const startedAt = Date.now();
    await runtime.start();
    expect(Date.now() - startedAt).toBeLessThan(500);

    const early = await runtime.status();
    expect(early.totals.stale).toBe(1);
    expect(early.job?.running).toBe(true);
    expect(early.job?.reason).toBe('auto');
    expect(early.job?.incompleteOnly).toBe(true);
    expect(early.statusMessage).toMatch(/Background reindex is running/);

    const second = await runtime.reindex({ wait: false });
    expect(second.alreadyRunning).toBe(true);

    releaseEmbed(
      new Response(JSON.stringify({ data: [{ embedding: [1, 0, 0] }] }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      })
    );
    let finished = await runtime.status();
    for (let attempt = 0; attempt < 20 && finished.job?.running; attempt += 1) {
      await new Promise((resolve) => setTimeout(resolve, 30));
      finished = await runtime.status();
    }
    expect(finished.job?.running).toBe(false);
    expect(finished.job?.embedded).toBe(1);
    expect(finished.job?.failed).toBe(0);
    expect(finished.totals.stale).toBe(0);
    expect(logs.some((line) => line.includes('background reindex'))).toBe(true);

    const broken = getRuntime({
      ...strapi,
      db: {
        connection: knexStub([{ ...vectorRow(), document_id: 'other' }]),
        metadata: strapi.db.metadata,
        config: strapi.db.config,
      },
      documents: () => ({
        async findOne() {
          return { documentId: 'other', title: 'Other', body: 'body text' };
        },
        async findMany() {
          return [{ documentId: 'other', title: 'Other', body: 'body text' }];
        },
      }),
    });
    const report = await broken.reindex({ wait: true, incompleteOnly: true, reason: 'auto' });
    expect(report.failed).toBe(1);
    expect(report.partial).toBe(true);
    expect(logs.some((line) => line.includes('OpenAI embeddings 500'))).toBe(true);
  });
});
