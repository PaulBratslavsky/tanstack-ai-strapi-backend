import { readFileSync } from 'fs';
import { join } from 'path';
import { describe, expect, it } from 'vitest';
import { contentTypes } from '@strapi/utils';
import { getActionId, PERMISSIONS } from '../mcp/permissions';
import { AUTHOR_ATTRIBUTE, createResourceService } from '../services/resource';

type Row = Record<string, any>;

const RELATION_KEYS = ['notes', 'projects', 'people', 'sources'];

function matches(row: Row, filters: any): boolean {
  if (!filters) return true;
  for (const [key, cond] of Object.entries(filters)) {
    if (key === '$or' && Array.isArray(cond)) {
      if (!cond.some((clause) => matches(row, clause))) return false;
      continue;
    }
    if (cond && typeof cond === 'object' && '$eq' in (cond as any)) {
      if (row[key] !== (cond as any).$eq) return false;
      continue;
    }
    if (cond && typeof cond === 'object' && '$gte' in (cond as any)) {
      if (String(row[key] ?? '') < String((cond as any).$gte)) return false;
      continue;
    }
    if (cond && typeof cond === 'object' && (cond as any).documentId?.$eq) {
      const ids = (Array.isArray(row[key]) ? row[key] : []).map((item: any) =>
        typeof item === 'string' ? item : item.documentId
      );
      if (!ids.includes((cond as any).documentId.$eq)) return false;
    }
  }
  return true;
}

function clone(row: Row): Row {
  const copy: Row = { ...row, tags: Array.isArray(row.tags) ? [...row.tags] : row.tags };
  for (const key of [...RELATION_KEYS, 'supersededBy', 'file']) {
    if (Array.isArray(row[key])) copy[key] = row[key].map((item: any) => ({ ...item }));
    else if (row[key] && typeof row[key] === 'object') copy[key] = { ...row[key] };
  }
  return copy;
}

function applyData(row: Row, data: any) {
  for (const [key, value] of Object.entries(data)) {
    if (RELATION_KEYS.includes(key) && value && typeof value === 'object') {
      let next = Array.isArray(row[key]) ? row[key].map((item: any) => ({ ...item })) : [];
      const relation = value as { connect?: { documentId: string }[]; disconnect?: { documentId: string }[] };
      if (Array.isArray(relation.connect)) {
        for (const item of relation.connect) {
          if (!next.some((current: any) => current.documentId === item.documentId)) {
            next.push({ documentId: item.documentId });
          }
        }
      }
      if (Array.isArray(relation.disconnect)) {
        const drop = new Set(relation.disconnect.map((item) => item.documentId));
        next = next.filter((item: any) => !drop.has(item.documentId));
      }
      row[key] = next;
      continue;
    }
    if (key === 'supersededBy' && value && typeof value === 'object' && Array.isArray((value as any).connect)) {
      const target = (value as any).connect[0];
      row.supersededBy = target ? { documentId: target.documentId } : null;
      continue;
    }
    row[key] = value;
  }
}

function mockStrapi() {
  const tables = new Map<string, Row[]>();
  let seq = 0;
  let tick = 0;

  const stamp = () => {
    tick += 1;
    return new Date(Date.UTC(2026, 0, 1, 0, 0, tick)).toISOString();
  };

  const rows = (uid: string) => {
    if (!tables.has(uid)) tables.set(uid, []);
    return tables.get(uid)!;
  };

  const strapi = {
    tables,
    log: { warn: () => undefined },
    documents(uid: string) {
      return {
        async findMany(params: any = {}) {
          let list = rows(uid).filter((row) => matches(row, params.filters));
          const sort = Array.isArray(params.sort) ? params.sort[0] : params.sort;
          if (sort === 'updatedAt:desc' || sort?.updatedAt === 'desc') {
            list.sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt)));
          }
          const start = params.start ?? 0;
          const limit = params.limit ?? list.length;
          return list.slice(start, start + limit).map(clone);
        },
        async count(params: any = {}) {
          return rows(uid).filter((row) => matches(row, params.filters)).length;
        },
        async create({ data }: { data: any }) {
          seq += 1;
          const row: Row = {
            documentId: `doc-${seq}`,
            id: seq,
            createdAt: stamp(),
            updatedAt: stamp(),
          };
          applyData(row, data);
          rows(uid).push(row);
          return clone(row);
        },
        async update({ documentId, data }: { documentId: string; data: any }) {
          const row = rows(uid).find((item) => item.documentId === documentId);
          if (!row) throw new Error(`missing ${documentId}`);
          applyData(row, data);
          row.updatedAt = stamp();
          return clone(row);
        },
      };
    },
  };

  return strapi;
}

const schema = JSON.parse(
  readFileSync(join(__dirname, '../content-types/resource/schema.json'), 'utf8')
);

describe('resource content type', () => {
  it('stores lifecycle as state and the bot name as author', () => {
    expect(contentTypes.isReservedAttributeName('createdBy', { draftAndPublish: false })).toBe(true);
    expect(contentTypes.isReservedAttributeName('author', { draftAndPublish: false })).toBe(false);
    expect(contentTypes.isReservedAttributeName('state', { draftAndPublish: false })).toBe(false);
    expect(schema.attributes.status).toBeUndefined();
    expect(schema.attributes.createdBy).toBeUndefined();
    expect(schema.attributes.state).toMatchObject({
      type: 'enumeration',
      enum: ['draft', 'final', 'archived'],
      default: 'final',
    });
    expect(schema.attributes.author).toMatchObject({ type: 'string' });
    expect(schema.attributes.format.enum).toEqual(['md', 'page', 'link', 'pdf', 'image', 'other']);
    expect(schema.attributes.file).toMatchObject({ type: 'media', multiple: false, required: false });
    expect(schema.attributes.tags).toMatchObject({ type: 'json', default: [] });
    expect(schema.attributes.supersededBy).toMatchObject({
      relation: 'oneToOne',
      target: 'plugin::paul-brain.resource',
    });
    expect(schema.options.draftAndPublish).toBe(false);
  });

  it('owns relations to notes, projects, people, and sources', () => {
    expect(schema.attributes.notes).toMatchObject({
      relation: 'manyToMany',
      target: 'plugin::paul-brain.note',
      inversedBy: 'resources',
    });
    expect(schema.attributes.projects.inversedBy).toBe('resources');
    expect(schema.attributes.people.inversedBy).toBe('resources');
    expect(schema.attributes.sources.inversedBy).toBe('resources');

    for (const [type, mappedBy] of [
      ['note', 'notes'],
      ['project', 'projects'],
      ['person', 'people'],
      ['source', 'sources'],
    ] as const) {
      const inverse = JSON.parse(
        readFileSync(join(__dirname, `../content-types/${type}/schema.json`), 'utf8')
      );
      expect(inverse.attributes.resources).toMatchObject({
        relation: 'manyToMany',
        target: 'plugin::paul-brain.resource',
        mappedBy,
      });
    }
  });

  it('registers resource.read and resource.write for the MCP tools', () => {
    expect(PERMISSIONS.find((permission) => permission.uid === 'resource.read')).toMatchObject({
      section: 'plugins',
      pluginName: 'paul-brain',
      subCategory: 'memory',
    });
    expect(PERMISSIONS.find((permission) => permission.uid === 'resource.write')).toMatchObject({
      section: 'plugins',
      pluginName: 'paul-brain',
    });
    expect(getActionId('resource.read')).toBe('plugin::paul-brain.resource.read');
    expect(getActionId('resource.write')).toBe('plugin::paul-brain.resource.write');

    const toolsDir = join(__dirname, '../mcp/tools');
    for (const file of ['get-resource.ts', 'list-resources.ts']) {
      expect(readFileSync(join(toolsDir, file), 'utf8')).toContain("getActionId('resource.read')");
    }
    for (const file of ['save-resource.ts', 'update-resource.ts', 'link-resource.ts']) {
      expect(readFileSync(join(toolsDir, file), 'utf8')).toContain("getActionId('resource.write')");
    }
  });
});

describe('resource service', () => {
  it('creates a final markdown resource and upserts the same slug', async () => {
    const strapi = mockStrapi();
    const service = createResourceService(strapi as any);

    const created = await service.save({
      title: 'Line market brief',
      format: 'md',
      body: '# v1',
      summary: 'Asia brief',
      tags: ['line'],
      createdBy: 'research-bot',
    });

    expect(created).toMatchObject({
      created: true,
      slug: 'line-market-brief',
      status: 'final',
      format: 'md',
    });

    const stored = strapi.tables.get('plugin::paul-brain.resource')![0];
    expect(stored.state).toBe('final');
    expect(stored.status).toBeUndefined();
    expect(stored[AUTHOR_ATTRIBUTE]).toBe('research-bot');
    expect(stored.createdBy).toBeUndefined();

    const updated = await service.save({
      title: 'Line market brief',
      format: 'md',
      body: '# v1 revised',
    });
    expect(updated.created).toBe(false);
    expect(updated.documentId).toBe(created.documentId);

    const got = await service.get(created.slug);
    expect(got.resource).toMatchObject({
      body: '# v1 revised',
      summary: 'Asia brief',
      createdBy: 'research-bot',
      status: 'final',
      tags: ['line'],
    });
  });

  it('requires an http(s) externalUrl for pages and links', async () => {
    const strapi = mockStrapi();
    const service = createResourceService(strapi as any);

    await expect(service.save({ title: 'Lauren Tan guide', format: 'page', body: '# snap' })).rejects.toThrow(
      /externalUrl/
    );
    expect(strapi.tables.get('plugin::paul-brain.resource') ?? []).toHaveLength(0);

    const saved = await service.save({
      title: 'Lauren Tan guide',
      format: 'page',
      externalUrl: 'https://cursor.com/canvas/example',
      body: '# snapshot',
      createdBy: 'research-bot',
    });
    expect(saved.created).toBe(true);

    await expect(service.save({ title: 'A repo', format: 'link', externalUrl: 'notaurl' })).rejects.toThrow(
      /externalUrl/
    );
  });

  it('attaches notes on save and link_resource can detach them', async () => {
    const strapi = mockStrapi();
    const service = createResourceService(strapi as any);
    const note = await strapi.documents('plugin::paul-brain.note').create({
      data: { title: 'Video note', slug: 'video-note' },
    });

    await expect(
      service.save({ title: 'Guide', format: 'md', body: 'x', projects: ['missing-project'] })
    ).rejects.toThrow(/project not found/i);

    const saved = await service.save({
      title: 'Guide',
      format: 'md',
      body: 'x',
      notes: [note.slug],
    });
    const loaded = await service.get(saved.documentId);
    expect(loaded.resource?.notes).toEqual([expect.objectContaining({ documentId: note.documentId })]);

    const detached = await service.link({
      resource: saved.slug,
      relation: 'notes',
      targets: [note.documentId],
      operation: 'disconnect',
    });
    expect(detached.message).toMatch(/Disconnected 1 notes/);
    const after = await service.get(saved.documentId);
    expect(after.resource?.notes).toEqual([]);
  });

  it('lists newest first with format, status, tag, project, since, and pages', async () => {
    const strapi = mockStrapi();
    const service = createResourceService(strapi as any);
    const project = await strapi.documents('plugin::paul-brain.project').create({
      data: { name: 'LINE', slug: 'line' },
    });

    await service.save({ title: 'Old draft', format: 'md', status: 'draft', body: 'old' });
    const middle = await service.save({
      title: 'Middle link',
      format: 'link',
      externalUrl: 'https://example.com/mid',
      tags: ['guide'],
      projects: [project.documentId],
    });
    await service.save({ title: 'Newest final', format: 'md', status: 'final', tags: ['guide'], body: 'new' });

    const firstPage = await service.list({ limit: 2, page: 1 });
    expect(firstPage.resources.map((item) => item.title)).toEqual(['Newest final', 'Middle link']);
    expect(firstPage.total).toBe(3);
    expect(firstPage.hasMore).toBe(true);

    const secondPage = await service.list({ limit: 2, page: 2 });
    expect(secondPage.resources.map((item) => item.title)).toEqual(['Old draft']);
    expect(secondPage.hasMore).toBe(false);

    const finals = await service.list({ status: 'final', format: 'md' });
    expect(finals.resources.map((item) => item.title)).toEqual(['Newest final']);

    const tagged = await service.list({ tag: 'GUIDE' });
    expect(tagged.resources.map((item) => item.title)).toEqual(['Newest final', 'Middle link']);

    const byProject = await service.list({ project: 'line' });
    expect(byProject.resources.map((item) => item.documentId)).toEqual([middle.documentId]);

    const missingProject = await service.list({ project: 'nope' });
    expect(missingProject.total).toBe(0);

    const middleRow = strapi.tables.get('plugin::paul-brain.resource')!.find((row) => row.documentId === middle.documentId);
    const since = await service.list({ since: middleRow!.updatedAt });
    expect(since.resources.map((item) => item.title)).toEqual(['Newest final', 'Middle link']);
  });

  it('patches in place and creates a new version that supersedes the old row', async () => {
    const strapi = mockStrapi();
    const service = createResourceService(strapi as any);
    const note = await strapi.documents('plugin::paul-brain.note').create({
      data: { title: 'Source note', slug: 'source-note' },
    });
    const saved = await service.save({
      title: 'Guide',
      format: 'md',
      body: 'version one',
      tags: ['a'],
      createdBy: 'research-bot',
      notes: [note.documentId],
    });
    strapi.tables.get('plugin::paul-brain.resource')![0].file = {
      id: 9,
      url: '/uploads/guide.pdf',
      name: 'guide.pdf',
      mime: 'application/pdf',
    };

    const patched = await service.update({
      identifier: saved.slug,
      appendBody: 'more',
      addTags: ['b'],
      status: 'draft',
    });
    expect(patched).toMatchObject({ newVersion: false, slug: 'guide', status: 'draft' });
    const patchedRow = await service.get(saved.documentId);
    expect(patchedRow.resource?.body).toBe('version one\n\n---\n\nmore');
    expect(patchedRow.resource?.tags).toEqual(['a', 'b']);

    const versioned = await service.update({
      identifier: 'guide',
      body: 'version two',
      newVersion: true,
    });
    expect(versioned.newVersion).toBe(true);
    expect(versioned.slug).toBe('guide-2');
    expect(versioned.superseded).toBe(saved.documentId);
    expect(versioned.documentId).not.toBe(saved.documentId);

    const previous = await service.get(saved.documentId);
    expect(previous.resource?.body).toBe('version one\n\n---\n\nmore');
    expect(previous.resource?.supersededBy).toEqual(expect.objectContaining({ documentId: versioned.documentId }));

    const next = await service.get(versioned.slug);
    expect(next.resource).toMatchObject({
      body: 'version two',
      status: 'draft',
      createdBy: 'research-bot',
      tags: ['a', 'b'],
    });
    expect(next.resource?.notes).toEqual([expect.objectContaining({ documentId: note.documentId })]);

    const nextStored = strapi.tables
      .get('plugin::paul-brain.resource')!
      .find((row) => row.documentId === versioned.documentId);
    expect(nextStored?.file).toBe(9);
    expect(nextStored?.supersededBy).toBeUndefined();
  });

  it('gives a renamed version its own slug and keeps the previous slug', async () => {
    const strapi = mockStrapi();
    const service = createResourceService(strapi as any);
    const saved = await service.save({ title: 'Guide', format: 'md', body: 'v1' });

    const renamed = await service.update({
      identifier: saved.documentId,
      title: 'Guide',
    });
    expect(renamed.slug).toBe('guide');

    const versioned = await service.update({
      identifier: saved.documentId,
      title: 'Other guide',
      newVersion: true,
    });
    expect(versioned.slug).toBe('other-guide');
    const previous = await service.get(saved.slug);
    expect(previous.resource?.title).toBe('Guide');
  });
});
