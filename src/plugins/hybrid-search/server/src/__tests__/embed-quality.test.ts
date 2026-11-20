import { afterEach, describe, expect, it } from 'vitest';
import { getRuntime } from '../runtime';
import { contentKeywords } from '../services/keyword-search';
import {
  EMBEDDING_VERSION,
  MAX_EMBED_CHARS,
  buildEmbedText,
  passageSnippet,
} from '../services/text';

const NOTE = 'plugin::paul-brain.note';
const TODO = 'plugin::paul-brain.todo';

const noteModel = {
  options: { draftAndPublish: false },
  attributes: {
    title: { type: 'string' },
    body: { type: 'richtext' },
    summary: { type: 'text' },
    tags: { type: 'json' },
    updatedAt: { type: 'datetime' },
  },
};

const todoModel = {
  options: { draftAndPublish: false },
  attributes: {
    title: { type: 'string' },
    goal: { type: 'text' },
    acceptanceCriteria: { type: 'text' },
    context: { type: 'richtext' },
    updatedAt: { type: 'datetime' },
  },
};

const models: Record<string, typeof noteModel | typeof todoModel> = {
  [NOTE]: noteModel,
  [TODO]: todoModel,
};

const types = {
  [NOTE]: {
    fields: ['title', 'body', 'summary', 'tags'],
    titleField: 'title',
    tagField: 'tags',
  },
  [TODO]: {
    fields: ['title', 'goal', 'acceptanceCriteria', 'context'],
    titleField: 'title',
  },
};

const LESSON = 'YouTube videos always go through yt-kb then a kind=video brain note';
const TUTORIAL_BODY = 'Install the admin panel and click Content Manager.';

function vectorFor(input: string): number[] {
  const text = input.toLowerCase();
  if (text.includes('always go through yt-kb')) return [1, 0, 0];
  if (text.includes('install the admin panel')) return [0, 1, 0];
  if (text.includes('urology') || text.includes('labcorp')) return [0, 0, 1];
  if (text.includes('video clip')) return [0.98, 0.02, 0];
  if (text.includes('doctor') || text.includes('appointment')) return [0, 0.05, 0.95];
  return [0, 0, 0.2];
}

describe('embed recipe', () => {
  const previousKey = process.env.OPENAI_API_KEY;
  const previousFetch = global.fetch;
  const embedded: string[] = [];

  afterEach(() => {
    if (previousKey === undefined) delete process.env.OPENAI_API_KEY;
    else process.env.OPENAI_API_KEY = previousKey;
    global.fetch = previousFetch;
    embedded.length = 0;
  });

  function runtime() {
    process.env.OPENAI_API_KEY = 'test-key';
    global.fetch = (async (_url: string, init?: RequestInit) => {
      const body = JSON.parse(String(init?.body || '{}')) as { input?: string };
      const input = body.input || '';
      embedded.push(input);
      return new Response(JSON.stringify({ data: [{ embedding: vectorFor(input) }] }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      });
    }) as typeof fetch;

    const rows: Record<string, Record<string, any>> = {
      [`${NOTE}:lesson`]: {
        documentId: 'lesson',
        title: 'Office hours',
        body: LESSON,
        summary: 'How a shared clip should be filed.',
        tags: ['youtube'],
        updatedAt: '2026-04-01T00:00:00.000Z',
      },
      [`${NOTE}:tutorial`]: {
        documentId: 'tutorial',
        title: 'Strapi tutorial',
        body: TUTORIAL_BODY,
        summary: 'A generic admin walkthrough.',
        tags: ['strapi'],
        updatedAt: '2026-04-02T00:00:00.000Z',
      },
      [`${TODO}:urology`]: {
        documentId: 'urology',
        title: 'Call the clinic',
        goal: 'Book the urology visit',
        acceptanceCriteria: 'Labcorp blood work is on the calendar',
        context: 'The referral is still in the inbox.',
        updatedAt: '2026-04-03T00:00:00.000Z',
      },
    };

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
            return rows[`${uid}:${params.documentId}`] || null;
          },
          async findMany(params: { filters?: { documentId?: { $in?: string[] } } }) {
            const ids = params.filters?.documentId?.$in;
            return Object.entries(rows)
              .filter(([key]) => key.startsWith(`${uid}:`))
              .map(([, row]) => row)
              .filter((row) => !ids || ids.includes(row.documentId));
          },
        };
      },
    };
    return getRuntime(strapi);
  }

  it('embeds the body, ranks a body-only match first, and snippets that passage', async () => {
    expect(EMBEDDING_VERSION).toBeGreaterThan(1);
    const text = buildEmbedText(['title', 'body', 'summary', 'tags'], {
      title: 'Office hours',
      body: LESSON,
      summary: 'How a shared clip should be filed.',
      tags: ['youtube'],
    });
    expect(text).toContain(`body: ${LESSON}`);
    expect(text.startsWith('title:')).toBe(true);
    const long = buildEmbedText(['body'], { body: `keep-me ${'word '.repeat(20000)} drop-me-tail` });
    expect(long.length).toBe(MAX_EMBED_CHARS);
    expect(long).toContain('keep-me');
    expect(long).not.toContain('drop-me-tail');

    const snippet = passageSnippet('shares a video clip', ['title', 'body'], {
      title: 'Office hours',
      body: `preamble ${LESSON} after`,
    }, 'title');
    expect(snippet).toContain('yt-kb');
    expect(snippet).not.toBe('Office hours');

    const search = runtime();
    expect(await search.indexDocument(NOTE, 'lesson')).toBe('embedded');
    expect(await search.indexDocument(NOTE, 'tutorial')).toBe('embedded');
    expect(await search.indexDocument(TODO, 'urology')).toBe('embedded');
    expect(embedded.some((input) => input.includes(LESSON) && input.includes('Office hours'))).toBe(true);
    expect(embedded.some((input) => input.includes('Book the urology visit') && input.includes('Labcorp'))).toBe(true);

    const clip = await search.search({
      query: 'what to do when someone shares a video clip with me',
      uids: [NOTE, TODO],
    });
    expect(clip.mode).toBe('hybrid');
    expect(clip.results[0].documentId).toBe('lesson');
    expect(clip.results[0].score).toBeGreaterThan(0.9);
    expect(clip.results[0].snippet).toContain('yt-kb');
    expect(clip.results[0].snippet).not.toBe('Office hours');
    const tutorial = clip.results.find((hit) => hit.documentId === 'tutorial');
    expect((tutorial?.score ?? 1) < clip.results[0].score).toBe(true);

    const appointments = await search.search({
      query: 'doctor appointments I still need to book',
      uids: [NOTE, TODO],
    });
    expect(appointments.results[0].documentId).toBe('urology');
    expect(appointments.results[0].snippet.toLowerCase()).toContain('labcorp');

    const status = await search.status();
    expect(status.embedRecipeVersion).toBe(EMBEDDING_VERSION);
    expect(status.embeddingVersion).toBe(EMBEDDING_VERSION);
    const noteRow = status.types.find((row) => row.uid === NOTE);
    const todoRow = status.types.find((row) => row.uid === TODO);
    expect(noteRow?.current).toBe(2);
    expect(todoRow?.current).toBe(1);
    expect(status.totals.stale).toBe(0);
  });

  it('drops function words before the keyword leg', () => {
    expect(contentKeywords('what to do when someone shares a video clip with me')).toEqual([
      'someone',
      'shares',
      'video',
      'clip',
    ]);
    expect(contentKeywords('to me')).toEqual([]);
  });
});
