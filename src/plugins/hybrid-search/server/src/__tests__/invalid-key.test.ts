import { afterEach, describe, expect, it } from 'vitest';
import { validate } from '@strapi/utils';
import { getRuntime } from '../runtime';
import { selectableFields } from '../services/query-fields';

const FIELD_CHECKS = ['scalarAttributes'];
const FILTER_CHECKS = ['nonAttributesOperators', 'dynamicZones', 'morphRelations'];
const SORT_CHECKS = ['nonAttributesOperators', 'dynamicZones', 'morphRelations'];

const NOTE = 'plugin::paul-brain.note';
const PERSON = 'plugin::paul-brain.person';

const noteModel = {
  options: { draftAndPublish: false },
  attributes: {
    title: { type: 'string' },
    body: { type: 'richtext' },
    tags: { type: 'json' },
    aliases: { type: 'json' },
    pinned: { type: 'boolean' },
    archived: { type: 'boolean' },
    kind: { type: 'enumeration' },
    videoId: { type: 'string' },
    updatedAt: { type: 'datetime' },
    sources: { type: 'relation' },
  },
};

const personModel = {
  options: { draftAndPublish: false },
  attributes: {
    name: { type: 'string' },
    notes_md: { type: 'text' },
    aliases: { type: 'json' },
    updatedAt: { type: 'datetime' },
  },
};

const models: Record<string, typeof noteModel | typeof personModel> = {
  [NOTE]: noteModel,
  [PERSON]: personModel,
};

const types = {
  [NOTE]: {
    fields: ['title', 'body', 'tags', 'aliases'],
    titleField: 'title',
    tagField: 'tags',
    aliasField: 'aliases',
    pinnedField: 'pinned',
    exclude: { field: 'archived', equals: true },
  },
  [PERSON]: {
    fields: ['name', 'notes_md', 'aliases'],
    titleField: 'name',
    aliasField: 'aliases',
  },
};

async function assertDocumentParams(uid: string, params: any) {
  const schema = models[uid];
  const ctx = { schema, getModel: () => schema };
  if (params.fields) await validate.validators.validateFields(ctx, params.fields, FIELD_CHECKS);
  if (params.filters && Object.keys(params.filters).length > 0) {
    await validate.validators.validateFilters(ctx, params.filters, FILTER_CHECKS);
  }
  if (params.sort) await validate.validators.validateSort(ctx, params.sort, SORT_CHECKS);
}

describe('document service keys', () => {
  const previousKey = process.env.OPENAI_API_KEY;
  const previousFetch = global.fetch;

  afterEach(() => {
    if (previousKey === undefined) delete process.env.OPENAI_API_KEY;
    else process.env.OPENAI_API_KEY = previousKey;
    global.fetch = previousFetch;
  });

  it('rejects the old field list with Invalid key name, and keeps only scalar attributes', async () => {
    const naive = ['title', 'body', 'tags', 'aliases', 'pinned', 'archived', 'title', 'name'];
    const ctx = { schema: noteModel, getModel: () => noteModel };
    await expect(validate.validators.validateFields(ctx, naive, FIELD_CHECKS)).rejects.toThrow('Invalid key name');

    const fields = selectableFields(noteModel, ['title', 'name', 'tags', 'sources', 'body']);
    expect(fields).toEqual(['title', 'tags', 'body']);
    expect(fields).not.toContain('name');
    expect(fields).not.toContain('sources');
    await validate.validators.validateFields(ctx, fields, FIELD_CHECKS);

    const personFields = selectableFields(personModel, ['title', 'name', 'notes_md']);
    expect(personFields).not.toContain('title');
    await validate.validators.validateFields(
      { schema: personModel, getModel: () => personModel },
      personFields,
      FIELD_CHECKS
    );
  });

  it('search and reindex pass Strapi field, filter, and sort validation on Postgres-shaped types', async () => {
    process.env.OPENAI_API_KEY = 'test-key';
    global.fetch = (async () =>
      new Response(JSON.stringify({ data: [{ embedding: [0.2, 0.4, 0.6] }] }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      })) as typeof fetch;

    const calls: Array<{ uid: string; action: string; params: any }> = [];
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
      db: {
        connection: null,
        config: { connection: { client: 'postgres' } },
      },
      documents(uid: string) {
        return {
          async findOne(params: any) {
            calls.push({ uid, action: 'findOne', params });
            await assertDocumentParams(uid, params);
            return {
              documentId: uid === NOTE ? 'note-1' : 'person-1',
              title: 'Habitat',
              name: 'Ada',
              body: 'zephyr habitat',
              tags: ['strapi'],
              aliases: ['cloud'],
              pinned: true,
              archived: false,
              notes_md: 'habitat notes',
            };
          },
          async findMany(params: any) {
            calls.push({ uid, action: 'findMany', params });
            await assertDocumentParams(uid, params);
            return [
              {
                documentId: uid === NOTE ? 'note-1' : 'person-1',
                title: 'Habitat',
                name: 'Ada',
                body: 'zephyr habitat',
                tags: ['strapi'],
                aliases: ['cloud'],
                pinned: true,
                archived: false,
                updatedAt: '2026-02-01T00:00:00.000Z',
              },
            ];
          },
        };
      },
    };

    const runtime = getRuntime(strapi);
    await runtime.indexDocument(NOTE, 'note-1');
    await runtime.indexDocument(PERSON, 'person-1');

    const searched = await runtime.search({
      query: 'habitat',
      uids: [NOTE, PERSON],
      since: '2026-01-01',
      equals: { kind: 'lesson', videoId: 'abc123', missingField: 'nope' },
    });
    expect(searched.results.map((hit) => hit.documentId).sort()).toEqual(['note-1', 'person-1']);

    const searchCalls = calls.filter((call) => call.action === 'findMany' && call.params.filters);
    expect(searchCalls.length).toBeGreaterThan(0);
    for (const call of searchCalls) {
      expect(call.params.fields).not.toContain('missingField');
      expect(JSON.stringify(call.params.filters)).not.toContain('missingField');
      expect(JSON.stringify(call.params.filters)).not.toContain('hybrid_search');
    }
    const noteSearch = searchCalls.find((call) => call.uid === NOTE);
    const personSearch = searchCalls.find((call) => call.uid === PERSON);
    expect(noteSearch?.params.fields).toEqual(expect.arrayContaining(['title', 'tags', 'aliases', 'body']));
    expect(noteSearch?.params.fields).not.toContain('name');
    expect(JSON.stringify(noteSearch?.params.filters)).toContain('kind');
    expect(JSON.stringify(personSearch?.params.filters)).not.toContain('kind');
    expect(JSON.stringify(personSearch?.params.filters)).not.toContain('videoId');
    expect(personSearch?.params.fields).toContain('name');
    expect(personSearch?.params.fields).not.toContain('title');

    calls.length = 0;
    const report = await runtime.reindex({ dryRun: true, wait: true });
    expect(report.failed).toBe(0);
    expect(report.errorCount).toBe(0);
    expect(report.partial).toBe(false);
    const reindexCalls = calls.filter((call) => call.action === 'findMany');
    expect(reindexCalls.map((call) => call.uid).sort()).toEqual([NOTE, PERSON]);
    for (const call of reindexCalls) {
      expect(call.params.sort).toEqual(['documentId:asc']);
    }
    expect(reindexCalls.find((call) => call.uid === NOTE)?.params.fields).not.toContain('name');
    expect(reindexCalls.find((call) => call.uid === PERSON)?.params.fields).not.toContain('title');
  });
});
