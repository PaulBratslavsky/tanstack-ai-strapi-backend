import { describe, expect, it } from 'vitest';
import * as forget from '../mcp/tools/forget';

function store(seed: Record<string, any[]>) {
  const tables = new Map<string, any[]>(Object.entries(seed).map(([uid, rows]) => [uid, rows.map((row) => ({ ...row }))]));
  const audits: any[] = [];
  const strapi = {
    log: { warn() {} },
    documents(uid: string) {
      if (!tables.has(uid)) tables.set(uid, []);
      const rows = () => tables.get(uid)!;
      return {
        async findMany(params: any = {}) {
          const filters = params.filters || {};
          return rows().filter((row) => {
            if (!Array.isArray(filters.$or)) return true;
            return filters.$or.some((clause: any) => {
              const [field, cond] = Object.entries(clause)[0] as [string, any];
              return row[field] === cond?.$eq;
            });
          }).map((row) => ({ ...row }));
        },
        async update({ documentId, data }: { documentId: string; data: any }) {
          const row = rows().find((item) => item.documentId === documentId);
          Object.assign(row, data);
          return { ...row };
        },
        async delete({ documentId }: { documentId: string }) {
          const list = rows();
          const index = list.findIndex((item) => item.documentId === documentId);
          list.splice(index, 1);
        },
        async create({ data }: { data: any }) {
          audits.push(data);
          rows().push(data);
          return data;
        },
      };
    },
  };
  return { strapi, tables, audits };
}

async function handlerFor(strapi: any) {
  let handler: any;
  const host = {
    ...strapi,
    ai: { mcp: { registerTool(def: any) { handler = def.createHandler(strapi); } } },
  };
  forget.register(host);
  return handler;
}

describe('forget', () => {
  it('archives by default and writes an audit row without the note body', async () => {
    const { strapi, tables, audits } = store({
      'plugin::paul-brain.note': [{
        documentId: 'note-1',
        slug: 'habitat',
        title: 'Zephyr habitat',
        body: 'secret body that must not be audited',
      }],
    });
    const handler = await handlerFor(strapi);
    const result = await handler({
      args: { type: 'note', identifier: 'habitat', confirm: true },
      context: { user: { email: 'paul@example.com' } },
    });

    expect(result.structuredContent.deleted).toBe(false);
    expect(result.structuredContent.archived).toBe(true);
    expect(tables.get('plugin::paul-brain.note')![0].archived).toBe(true);
    expect(tables.get('plugin::paul-brain.note')![0].archivedAt).toEqual(expect.any(String));
    expect(result.structuredContent.entity.body).toBeUndefined();
    expect(audits[0]).toMatchObject({
      action: 'archive',
      entityKind: 'note',
      entityDocumentId: 'note-1',
      actor: 'paul@example.com',
      changedFields: ['archived', 'archivedAt'],
    });
    expect(JSON.stringify(audits[0])).not.toContain('secret body');
  });

  it('hard-deletes only when force is true', async () => {
    const { strapi, tables } = store({
      'plugin::paul-brain.resource': [{
        documentId: 'res-1',
        slug: 'guide',
        title: 'Guide',
        state: 'final',
        body: 'markdown',
      }],
    });
    const handler = await handlerFor(strapi);
    const archived = await handler({
      args: { type: 'resource', identifier: 'res-1', confirm: true },
      context: {},
    });
    expect(archived.structuredContent.archived).toBe(true);
    expect(tables.get('plugin::paul-brain.resource')![0].state).toBe('archived');

    const removed = await handler({
      args: { type: 'resource', identifier: 'res-1', confirm: true, force: true },
      context: {},
    });
    expect(removed.structuredContent.deleted).toBe(true);
    expect(tables.get('plugin::paul-brain.resource')).toHaveLength(0);
  });
});
