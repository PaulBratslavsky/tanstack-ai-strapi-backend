import { mkdtemp, rm, writeFile } from 'fs/promises';
import { tmpdir } from 'os';
import path from 'path';
import type { Core } from '@strapi/strapi';
import { getUid } from '../mcp/types';
import { getTodayPST, sinceToUpdatedAt, stripNullish } from '../mcp/utils';
import {
  BASE64_INLINE_LIMIT,
  captionResource,
  decodeFileBase64,
  extractResourceText,
  fetchRemoteFile,
  hashBuffer,
  isAllowedResourceMime,
  loadFileBytes,
  normalizeMime,
  normalizeResourceUrl,
  publicFileView,
  safeFilename,
  serverPublicBase,
  signedFilePath,
  signFileToken,
  type UploadFileRecord,
} from './resource-file';

/**
 * Stored as `state`. Strapi's document service reserves `status` for draft/publish,
 * and one of these values is the word "draft", so the column follows the plugin's
 * state -> status mapping (todos, goals, decisions).
 */
export const RESOURCE_STATUSES = ['draft', 'final', 'archived'] as const;
export type ResourceStatus = (typeof RESOURCE_STATUSES)[number];

export const RESOURCE_FORMATS = ['md', 'page', 'link', 'pdf', 'image', 'other'] as const;
export type ResourceFormat = (typeof RESOURCE_FORMATS)[number];

/**
 * Stored as `author`. Strapi reserves the attribute name `createdBy` for the
 * admin user who created the row. Tools accept and return `createdBy`.
 */
export const AUTHOR_ATTRIBUTE = 'author';

/** Scalar text recall searches. Title is also scored on its own. */
export const RESOURCE_TEXT_FIELDS = [
  'title',
  'summary',
  'body',
  'extractedText',
  'altText',
  'caption',
  'snapshotMarkdown',
] as const;

const RESOURCE_UID = getUid('resource');
const POPULATE = ['notes', 'projects', 'people', 'sources', 'file', 'supersededBy'] as const;
const RELATION_TYPES = {
  notes: 'note',
  projects: 'project',
  people: 'person',
  sources: 'source',
} as const;
type RelationName = keyof typeof RELATION_TYPES;

/** Same newest-first window recall uses, for tag filtering that cannot be done in SQL. */
const LIST_PAGE_SIZE = 100;
const LIST_SCAN_CAP = 1000;

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export interface SaveResourceArgs {
  title: string;
  slug?: string;
  format: ResourceFormat;
  body?: string;
  summary?: string;
  extractedText?: string;
  altText?: string;
  caption?: string;
  snapshotMarkdown?: string;
  snapshotAt?: string;
  contentHash?: string;
  externalUrl?: string;
  status?: ResourceStatus;
  tags?: string[];
  createdBy?: string;
  notes?: string[];
  projects?: string[];
  people?: string[];
  sources?: string[];
}

export interface UpdateResourceArgs {
  identifier: string;
  title?: string;
  format?: ResourceFormat;
  body?: string;
  appendBody?: string;
  summary?: string;
  extractedText?: string;
  altText?: string;
  caption?: string;
  snapshotMarkdown?: string;
  snapshotAt?: string;
  contentHash?: string;
  externalUrl?: string;
  status?: ResourceStatus;
  tags?: string[];
  addTags?: string[];
  removeTags?: string[];
  createdBy?: string;
  notes?: string[];
  projects?: string[];
  people?: string[];
  sources?: string[];
  newVersion?: boolean;
}

export interface ListResourceArgs {
  format?: ResourceFormat;
  status?: ResourceStatus;
  tag?: string;
  project?: string;
  since?: string;
  page?: number;
  limit?: number;
}

export interface LinkResourceArgs {
  resource: string;
  relation: RelationName;
  targets: string[];
  operation: 'connect' | 'disconnect';
}

export interface AttachResourceFileArgs {
  identifier: string;
  filename: string;
  mime: string;
  fileBase64?: string;
  fileUrl?: string;
}

function asRows(page: unknown): any[] {
  if (Array.isArray(page)) return page;
  if (page && typeof page === 'object' && Array.isArray((page as { results?: unknown[] }).results)) {
    return (page as { results: any[] }).results;
  }
  return [];
}

function assertFormat(format: string): asserts format is ResourceFormat {
  if (!RESOURCE_FORMATS.includes(format as ResourceFormat)) {
    throw new Error(`Invalid format "${format}". Expected one of: ${RESOURCE_FORMATS.join(', ')}`);
  }
}

function assertStatus(status: string): asserts status is ResourceStatus {
  if (!RESOURCE_STATUSES.includes(status as ResourceStatus)) {
    throw new Error(`Invalid status "${status}". Expected one of: ${RESOURCE_STATUSES.join(', ')}`);
  }
}

function assertSummary(summary: string | undefined) {
  if (summary != null && summary.length > 280) {
    throw new Error('summary must be 280 characters or fewer');
  }
}

function assertExternalUrl(format: string, externalUrl: string | undefined) {
  if (format !== 'page' && format !== 'link') return;
  if (!externalUrl || !/^https?:\/\//i.test(externalUrl)) {
    throw new Error(`${format} resources require an http(s) externalUrl`);
  }
}

function assertSnapshotAt(snapshotAt: string | undefined) {
  if (snapshotAt === undefined) return;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(snapshotAt)) {
    throw new Error('snapshotAt must be YYYY-MM-DD');
  }
}

function applySnapshot(data: Record<string, unknown>, args: { snapshotMarkdown?: string; snapshotAt?: string }) {
  assertSnapshotAt(args.snapshotAt);
  if (args.snapshotMarkdown !== undefined) {
    data.snapshotMarkdown = args.snapshotMarkdown;
    data.snapshotAt = args.snapshotAt ?? getTodayPST();
  } else if (args.snapshotAt !== undefined) {
    data.snapshotAt = args.snapshotAt;
  }
}

function copySnapshot(
  data: Record<string, unknown>,
  args: { snapshotMarkdown?: string; snapshotAt?: string },
  existing: { snapshotMarkdown?: unknown; snapshotAt?: unknown }
) {
  assertSnapshotAt(args.snapshotAt);
  if (args.snapshotMarkdown !== undefined) {
    data.snapshotMarkdown = args.snapshotMarkdown;
    data.snapshotAt = args.snapshotAt ?? getTodayPST();
    return;
  }
  if (existing.snapshotMarkdown != null) data.snapshotMarkdown = existing.snapshotMarkdown;
  if (args.snapshotAt !== undefined) data.snapshotAt = args.snapshotAt;
  else if (existing.snapshotAt != null) data.snapshotAt = existing.snapshotAt;
}

function relationIds(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      if (typeof item === 'string') return item;
      if (item && typeof item === 'object' && 'documentId' in item && (item as { documentId?: unknown }).documentId) {
        return String((item as { documentId: unknown }).documentId);
      }
      return '';
    })
    .filter(Boolean);
}

function unique(ids: string[]): string[] {
  return [...new Set(ids)];
}

function connect(ids: string[]) {
  return { connect: ids.map((documentId) => ({ documentId })) };
}

function disconnect(ids: string[]) {
  return { disconnect: ids.map((documentId) => ({ documentId })) };
}

function mediaId(file: unknown): number | undefined {
  if (typeof file === 'number') return file;
  if (file && typeof file === 'object' && typeof (file as { id?: unknown }).id === 'number') {
    return (file as { id: number }).id;
  }
  return undefined;
}

function asIso(value: unknown): string | undefined {
  if (value == null || value === '') return undefined;
  if (value instanceof Date) return value.toISOString();
  return String(value);
}

function hasTag(row: any, tag: string): boolean {
  const tags = Array.isArray(row.tags) ? row.tags : [];
  const needle = tag.toLowerCase();
  return tags.some((item: unknown) => String(item).toLowerCase() === needle);
}

function applyTags(
  existing: unknown,
  args: { tags?: string[]; addTags?: string[]; removeTags?: string[] }
): string[] | undefined {
  if (args.tags === undefined && args.addTags === undefined && args.removeTags === undefined) {
    return undefined;
  }
  let tags = args.tags !== undefined ? [...args.tags] : Array.isArray(existing) ? [...existing] : [];
  if (args.addTags) tags = [...new Set([...tags, ...args.addTags])];
  if (args.removeTags) {
    const drop = new Set(args.removeTags);
    tags = tags.filter((tag) => !drop.has(tag));
  }
  return tags;
}

function applyBody(existing: unknown, args: { body?: string; appendBody?: string }): string | undefined {
  if (args.body !== undefined) return args.body;
  if (args.appendBody === undefined) return undefined;
  const current = typeof existing === 'string' ? existing : '';
  return current ? `${current}\n\n---\n\n${args.appendBody}` : args.appendBody;
}

function relationSummaries(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      if (!item || typeof item !== 'object' || !(item as { documentId?: unknown }).documentId) return null;
      const row = item as { documentId: string; title?: string; name?: string; slug?: string };
      return stripNullish({
        documentId: String(row.documentId),
        title: row.title,
        name: row.name,
        slug: row.slug,
      });
    })
    .filter(Boolean);
}

function fileSummary(file: unknown) {
  return publicFileView(file);
}

function supersededSummary(value: unknown) {
  if (!value || typeof value !== 'object' || !(value as { documentId?: unknown }).documentId) return undefined;
  const row = value as { documentId: string; title?: string; slug?: string };
  return stripNullish({
    documentId: String(row.documentId),
    title: row.title,
    slug: row.slug,
  });
}

function toListItem(row: any) {
  return stripNullish({
    documentId: row.documentId,
    title: row.title,
    slug: row.slug,
    format: row.format,
    status: row.state || 'final',
    summary: row.summary,
    externalUrl: row.externalUrl,
    createdBy: row[AUTHOR_ATTRIBUTE],
    tags: Array.isArray(row.tags) ? row.tags : [],
    updatedAt: asIso(row.updatedAt),
  });
}

function toDetail(row: any) {
  return stripNullish({
    documentId: row.documentId,
    title: row.title,
    slug: row.slug,
    format: row.format,
    status: row.state || 'final',
    body: row.body,
    summary: row.summary,
    extractedText: row.extractedText,
    altText: row.altText,
    caption: row.caption,
    snapshotMarkdown: row.snapshotMarkdown,
    snapshotAt: row.snapshotAt,
    contentHash: row.contentHash,
    externalUrl: row.externalUrl,
    createdBy: row[AUTHOR_ATTRIBUTE],
    tags: Array.isArray(row.tags) ? row.tags : [],
    updatedAt: asIso(row.updatedAt),
    createdAt: asIso(row.createdAt),
    notes: relationSummaries(row.notes),
    projects: relationSummaries(row.projects),
    people: relationSummaries(row.people),
    sources: relationSummaries(row.sources),
    file: fileSummary(row.file),
    supersededBy: supersededSummary(row.supersededBy),
  });
}

function emptyList(page: number, pageSize: number) {
  return {
    resources: [],
    page,
    pageSize,
    count: 0,
    total: 0,
    hasMore: false,
    truncated: false,
  };
}

export function createResourceService(strapi: Core.Strapi) {
  const documents = (uid: string) => strapi.documents(uid as any);

  async function findMany(uid: string, params: Record<string, unknown>) {
    return asRows(await documents(uid).findMany(params as any));
  }

  async function findByIdentifier(uid: string, identifier: string, populate?: readonly string[]) {
    const rows = await findMany(uid, {
      filters: {
        $or: [{ documentId: { $eq: identifier } }, { slug: { $eq: identifier } }],
      },
      populate,
      limit: 1,
    });
    return rows[0] ?? null;
  }

  async function findBySlug(slug: string) {
    const rows = await findMany(RESOURCE_UID, {
      filters: { slug: { $eq: slug } },
      limit: 1,
    });
    return rows[0] ?? null;
  }

  async function findByContentHash(contentHash: string) {
    const rows = await findMany(RESOURCE_UID, {
      filters: { contentHash: { $eq: contentHash } },
      sort: ['updatedAt:desc'],
      limit: 1,
    });
    return rows[0] ?? null;
  }

  async function findByExternalUrl(url: string) {
    const normalized = normalizeResourceUrl(url);
    const keys = [...new Set([url.trim(), normalized].filter(Boolean))];
    if (keys.length === 0) return null;
    const rows = await findMany(RESOURCE_UID, {
      filters: { $or: keys.map((value) => ({ externalUrl: { $eq: value } })) },
      sort: ['updatedAt:desc'],
      limit: 1,
    });
    return rows[0] ?? null;
  }

  function dedupedResult(row: any, reason: 'url' | 'contentHash') {
    return {
      created: false,
      deduped: true,
      documentId: row.documentId,
      slug: row.slug,
      status: row.state || 'final',
      format: row.format,
      message:
        reason === 'url'
          ? 'Returned existing resource with the same url'
          : 'Returned existing resource with the same file content hash',
    };
  }

  async function allocateSlug(title: string): Promise<string> {
    const root = slugify(title);
    if (!root) {
      throw new Error('Title must include letters or numbers so a slug can be generated');
    }
    for (let attempt = 1; attempt <= 50; attempt += 1) {
      const candidate = attempt === 1 ? root : `${root}-${attempt}`;
      const existing = await findBySlug(candidate);
      if (!existing) return candidate;
    }
    throw new Error(`Could not allocate a unique slug from "${root}"`);
  }

  async function resolveIds(type: string, identifiers: string[]): Promise<string[]> {
    const ids: string[] = [];
    for (const identifier of identifiers) {
      const found = await findByIdentifier(getUid(type), identifier);
      if (!found) throw new Error(`${type} not found: ${identifier}`);
      ids.push(found.documentId);
    }
    return ids;
  }

  async function resolvedLinks(args: {
    notes?: string[];
    projects?: string[];
    people?: string[];
    sources?: string[];
  }) {
    return {
      notes: args.notes ? await resolveIds('note', args.notes) : undefined,
      projects: args.projects ? await resolveIds('project', args.projects) : undefined,
      people: args.people ? await resolveIds('person', args.people) : undefined,
      sources: args.sources ? await resolveIds('source', args.sources) : undefined,
    };
  }

  function assignLinks(data: Record<string, unknown>, links: Awaited<ReturnType<typeof resolvedLinks>>) {
    for (const relation of Object.keys(RELATION_TYPES) as RelationName[]) {
      const ids = links[relation];
      if (ids && ids.length > 0) data[relation] = connect(ids);
    }
  }

  function storedUrl(url: string | undefined): string | undefined {
    if (url === undefined) return undefined;
    const normalized = normalizeResourceUrl(url);
    return normalized || undefined;
  }

  return {
    async save(args: SaveResourceArgs) {
      if (!args.title?.trim()) throw new Error('title is required');
      assertFormat(args.format);
      assertSummary(args.summary);
      assertSnapshotAt(args.snapshotAt);
      if (args.status) assertStatus(args.status);

      const slug = slugify(args.slug || args.title);
      if (!slug) throw new Error('Title must include letters or numbers so a slug can be generated');

      const existing = await findBySlug(slug);
      const externalUrl = storedUrl(args.externalUrl !== undefined ? args.externalUrl : existing?.externalUrl);
      assertExternalUrl(args.format, externalUrl);

      if (args.contentHash) {
        const hashRow = await findByContentHash(args.contentHash);
        if (hashRow && hashRow.documentId !== existing?.documentId) return dedupedResult(hashRow, 'contentHash');
      }
      if (args.externalUrl) {
        const urlRow = await findByExternalUrl(args.externalUrl);
        if (urlRow && urlRow.documentId !== existing?.documentId) return dedupedResult(urlRow, 'url');
      }

      const links = await resolvedLinks(args);

      if (existing) {
        const data: Record<string, unknown> = {
          title: args.title,
          format: args.format,
        };
        if (args.body !== undefined) data.body = args.body;
        if (args.summary !== undefined) data.summary = args.summary;
        if (args.extractedText !== undefined) data.extractedText = args.extractedText;
        if (args.altText !== undefined) data.altText = args.altText;
        if (args.caption !== undefined) data.caption = args.caption;
        if (args.contentHash !== undefined) data.contentHash = args.contentHash;
        if (args.externalUrl !== undefined) data.externalUrl = externalUrl;
        if (args.status !== undefined) data.state = args.status;
        if (args.tags !== undefined) data.tags = args.tags;
        if (args.createdBy !== undefined) data[AUTHOR_ATTRIBUTE] = args.createdBy;
        applySnapshot(data, args);
        assignLinks(data, links);

        const updated = await documents(RESOURCE_UID).update({
          documentId: existing.documentId,
          data,
        });

        return {
          created: false,
          deduped: false,
          documentId: updated.documentId,
          slug: updated.slug || slug,
          status: updated.state || args.status || existing.state || 'final',
          format: updated.format || args.format,
          message: 'Updated existing resource',
        };
      }

      const data: Record<string, unknown> = {
        title: args.title,
        slug,
        format: args.format,
        state: args.status ?? 'final',
        tags: args.tags ?? [],
      };
      if (args.body !== undefined) data.body = args.body;
      if (args.summary !== undefined) data.summary = args.summary;
      if (args.extractedText !== undefined) data.extractedText = args.extractedText;
      if (args.altText !== undefined) data.altText = args.altText;
      if (args.caption !== undefined) data.caption = args.caption;
      if (args.contentHash !== undefined) data.contentHash = args.contentHash;
      if (args.externalUrl !== undefined) data.externalUrl = externalUrl;
      if (args.createdBy !== undefined) data[AUTHOR_ATTRIBUTE] = args.createdBy;
      applySnapshot(data, args);
      assignLinks(data, links);

      const created = await documents(RESOURCE_UID).create({ data });
      return {
        created: true,
        deduped: false,
        documentId: created.documentId,
        slug: created.slug || slug,
        status: created.state || data.state,
        format: created.format || args.format,
        message: 'Created resource',
      };
    },

    async get(identifier: string) {
      const row = await findByIdentifier(RESOURCE_UID, identifier, POPULATE);
      return { resource: row ? toDetail(row) : null };
    },

    async list(args: ListResourceArgs = {}) {
      const page = Math.max(1, args.page ?? 1);
      const pageSize = Math.min(100, Math.max(1, args.limit ?? 25));
      if (args.format) assertFormat(args.format);
      if (args.status) assertStatus(args.status);

      let projectId: string | undefined;
      if (args.project) {
        const project = await findByIdentifier(getUid('project'), args.project);
        if (!project) return emptyList(page, pageSize);
        projectId = project.documentId;
      }

      const filters: Record<string, unknown> = {};
      if (args.format) filters.format = { $eq: args.format };
      if (args.status) filters.state = { $eq: args.status };
      if (args.since) filters.updatedAt = { $gte: sinceToUpdatedAt(args.since) };
      if (projectId) filters.projects = { documentId: { $eq: projectId } };

      if (args.tag) {
        const matches: any[] = [];
        let scanned = 0;
        let truncated = false;
        for (let start = 0; scanned < LIST_SCAN_CAP; start += LIST_PAGE_SIZE) {
          const batchLimit = Math.min(LIST_PAGE_SIZE, LIST_SCAN_CAP - scanned);
          const batch = await findMany(RESOURCE_UID, {
            filters,
            sort: ['updatedAt:desc'],
            start,
            limit: batchLimit,
          });
          if (batch.length === 0) break;
          scanned += batch.length;
          for (const row of batch) {
            if (hasTag(row, args.tag)) matches.push(row);
          }
          if (batch.length < batchLimit) break;
          if (scanned >= LIST_SCAN_CAP) {
            truncated = true;
            break;
          }
        }

        const startIdx = (page - 1) * pageSize;
        const pageRows = matches.slice(startIdx, startIdx + pageSize);
        return {
          resources: pageRows.map(toListItem),
          page,
          pageSize,
          count: pageRows.length,
          total: matches.length,
          hasMore: startIdx + pageSize < matches.length || truncated,
          truncated,
        };
      }

      let total: number | undefined;
      const api = documents(RESOURCE_UID) as { count?: (params: any) => Promise<number> };
      if (typeof api.count === 'function') {
        try {
          const counted = await api.count({ filters });
          if (typeof counted === 'number') total = counted;
        } catch (err) {
          strapi.log?.warn?.('[paul-brain] resource count failed:', err);
        }
      }

      const start = (page - 1) * pageSize;
      const fetched = await findMany(RESOURCE_UID, {
        filters,
        sort: ['updatedAt:desc'],
        start,
        limit: total == null ? pageSize + 1 : pageSize,
      });
      const hasMore = total == null ? fetched.length > pageSize : start + Math.min(fetched.length, pageSize) < total;
      const pageRows = fetched.slice(0, pageSize);

      return {
        resources: pageRows.map(toListItem),
        page,
        pageSize,
        count: pageRows.length,
        total,
        hasMore,
        truncated: false,
      };
    },

    async update(args: UpdateResourceArgs) {
      const existing = await findByIdentifier(RESOURCE_UID, args.identifier, POPULATE);
      if (!existing) throw new Error(`Resource not found: ${args.identifier}`);
      assertSummary(args.summary);
      assertSnapshotAt(args.snapshotAt);
      if (args.format) assertFormat(args.format);
      if (args.status) assertStatus(args.status);

      const format = args.format ?? existing.format;
      const externalUrl = args.externalUrl !== undefined ? storedUrl(args.externalUrl) : existing.externalUrl;
      if (args.format !== undefined || args.externalUrl !== undefined || args.newVersion) {
        assertExternalUrl(format, externalUrl);
      }

      const links = await resolvedLinks(args);

      if (args.newVersion) {
        const title = args.title ?? existing.title;
        const slug = await allocateSlug(title);
        const tags = applyTags(existing.tags, args) ?? (Array.isArray(existing.tags) ? [...existing.tags] : []);
        const body = applyBody(existing.body, args);
        const data: Record<string, unknown> = {
          title,
          slug,
          format,
          state: args.status ?? existing.state ?? 'final',
          tags,
        };
        if (body !== undefined) data.body = body;
        else if (existing.body != null) data.body = existing.body;
        if (args.summary !== undefined) data.summary = args.summary;
        else if (existing.summary != null) data.summary = existing.summary;
        if (args.extractedText !== undefined) data.extractedText = args.extractedText;
        else if (existing.extractedText != null) data.extractedText = existing.extractedText;
        if (args.altText !== undefined) data.altText = args.altText;
        else if (existing.altText != null) data.altText = existing.altText;
        if (args.caption !== undefined) data.caption = args.caption;
        else if (existing.caption != null) data.caption = existing.caption;
        if (args.contentHash !== undefined) data.contentHash = args.contentHash;
        else if (existing.contentHash != null) data.contentHash = existing.contentHash;
        copySnapshot(data, args, existing);
        if (externalUrl !== undefined) data.externalUrl = externalUrl;
        if (args.createdBy !== undefined) data[AUTHOR_ATTRIBUTE] = args.createdBy;
        else if (existing[AUTHOR_ATTRIBUTE] != null) data[AUTHOR_ATTRIBUTE] = existing[AUTHOR_ATTRIBUTE];

        for (const relation of Object.keys(RELATION_TYPES) as RelationName[]) {
          const ids = unique([...relationIds(existing[relation]), ...(links[relation] ?? [])]);
          if (ids.length > 0) data[relation] = connect(ids);
        }
        const fileId = mediaId(existing.file);
        if (fileId != null) data.file = fileId;

        const created = await documents(RESOURCE_UID).create({ data });
        const supersededBy: Record<string, unknown> = {
          supersededBy: { connect: [{ documentId: created.documentId }] },
        };
        await documents(RESOURCE_UID).update({
          documentId: existing.documentId,
          data: supersededBy,
        });

        return {
          updated: true,
          newVersion: true,
          documentId: created.documentId,
          slug: created.slug || slug,
          status: created.state || data.state,
          superseded: existing.documentId,
        };
      }

      const data: Record<string, unknown> = {};
      if (args.title !== undefined) data.title = args.title;
      if (args.format !== undefined) data.format = args.format;
      const body = applyBody(existing.body, args);
      if (body !== undefined) data.body = body;
      if (args.summary !== undefined) data.summary = args.summary;
      if (args.extractedText !== undefined) data.extractedText = args.extractedText;
      if (args.altText !== undefined) data.altText = args.altText;
      if (args.caption !== undefined) data.caption = args.caption;
      if (args.contentHash !== undefined) data.contentHash = args.contentHash;
      if (args.externalUrl !== undefined) data.externalUrl = externalUrl;
      if (args.status !== undefined) data.state = args.status;
      applySnapshot(data, args);
      if (args.createdBy !== undefined) data[AUTHOR_ATTRIBUTE] = args.createdBy;
      const tags = applyTags(existing.tags, args);
      if (tags !== undefined) data.tags = tags;
      assignLinks(data, links);

      if (Object.keys(data).length === 0) {
        return {
          updated: true,
          newVersion: false,
          documentId: existing.documentId,
          slug: existing.slug,
          status: existing.state || 'final',
        };
      }

      const updated = await documents(RESOURCE_UID).update({
        documentId: existing.documentId,
        data,
      });
      return {
        updated: true,
        newVersion: false,
        documentId: updated.documentId,
        slug: updated.slug || existing.slug,
        status: updated.state || args.status || existing.state || 'final',
      };
    },

    async link(args: LinkResourceArgs) {
      const resource = await findByIdentifier(RESOURCE_UID, args.resource);
      if (!resource) throw new Error(`Resource not found: ${args.resource}`);
      const targetType = RELATION_TYPES[args.relation];
      if (!targetType) throw new Error(`Unknown relation: ${args.relation}`);
      if (args.operation !== 'connect' && args.operation !== 'disconnect') {
        throw new Error('operation must be connect or disconnect');
      }

      const ids = await resolveIds(targetType, args.targets);
      await documents(RESOURCE_UID).update({
        documentId: resource.documentId,
        data: {
          [args.relation]: args.operation === 'connect' ? connect(ids) : disconnect(ids),
        },
      });

      const verb = args.operation === 'connect' ? 'Connected' : 'Disconnected';
      return {
        linked: true,
        message: `${verb} ${ids.length} ${args.relation}`,
      };
    },

    async attach(args: AttachResourceFileArgs) {
      if (!args.filename?.trim()) throw new Error('filename is required');
      if (!args.mime?.trim()) throw new Error('mime is required');
      const hasBase64 = Boolean(args.fileBase64);
      const hasUrl = Boolean(args.fileUrl);
      if (hasBase64 === hasUrl) throw new Error('Provide exactly one of fileBase64 or fileUrl');

      const resource = await findByIdentifier(RESOURCE_UID, args.identifier, POPULATE);
      if (!resource) throw new Error(`Resource not found: ${args.identifier}`);

      const filename = safeFilename(args.filename);
      const fetchImpl = (strapi as { fetch?: typeof fetch }).fetch;
      const resolveHost = (strapi as { resolveHost?: (hostname: string) => Promise<string[]> }).resolveHost;
      let buffer: Buffer;
      let mime = normalizeMime(args.mime, filename);
      if (hasBase64) {
        buffer = decodeFileBase64(args.fileBase64 as string);
      } else {
        const fetched = await fetchRemoteFile(args.fileUrl as string, { fetchImpl, resolveHost });
        buffer = fetched.buffer;
        mime = normalizeMime(args.mime || fetched.mime, filename);
      }
      if (!isAllowedResourceMime(mime)) throw new Error(`File type "${mime}" is not allowed`);

      const contentHash = hashBuffer(buffer);
      const hashRow = await findByContentHash(contentHash);
      if (hashRow && hashRow.documentId !== resource.documentId) {
        return {
          attached: false,
          deduped: true,
          documentId: hashRow.documentId,
          slug: hashRow.slug,
          contentHash,
          filename,
          mime,
          size: buffer.length,
          extractedTextStored: false,
          captioned: false,
          message: 'Returned existing resource with the same file content hash',
        };
      }
      if (hashRow && hashRow.documentId === resource.documentId) {
        const current = await resolveUploadFile(resource.file);
        return {
          attached: true,
          deduped: true,
          documentId: resource.documentId,
          slug: resource.slug,
          contentHash,
          filename: current?.name || filename,
          mime: current?.mime || mime,
          size: buffer.length,
          extractedTextStored: Boolean(resource.extractedText),
          captioned: Boolean(resource.caption),
          message: 'File already attached to this resource',
        };
      }

      let extracted = '';
      try {
        extracted = extractResourceText(buffer, mime, filename);
      } catch (err) {
        strapi.log?.warn?.('[paul-brain] text extraction skipped:', err);
      }

      let caption: string | undefined;
      try {
        const model = strapi.config?.get?.('plugin::tanstack-ai.chat.model');
        caption = await captionResource({
          buffer,
          mime,
          fetchImpl,
          model: typeof model === 'string' ? model : undefined,
        });
      } catch (err) {
        strapi.log?.warn?.('[paul-brain] caption skipped:', err);
      }

      const uploadService = strapi.plugin('upload').service('upload') as {
        upload: (input: { data: Record<string, unknown>; files: Record<string, unknown> }) => Promise<UploadFileRecord | UploadFileRecord[]>;
        remove?: (file: unknown) => Promise<unknown>;
      };
      if (!uploadService?.upload) throw new Error('Upload plugin is not available');

      const dir = await mkdtemp(path.join(tmpdir(), 'paul-brain-'));
      const filepath = path.join(dir, filename);
      let stored: UploadFileRecord;
      try {
        await writeFile(filepath, buffer);
        const uploaded = await uploadService.upload({
          data: { fileInfo: { name: filename, alternativeText: caption } },
          files: {
            filepath,
            path: filepath,
            originalFilename: filename,
            name: filename,
            mimetype: mime,
            type: mime,
            size: buffer.length,
          },
        });
        const file = Array.isArray(uploaded) ? uploaded[0] : uploaded;
        if (!file || typeof file.id !== 'number') throw new Error('Upload did not return a file id');
        stored = file;
      } finally {
        await rm(dir, { recursive: true, force: true });
      }

      const previousId = mediaId(resource.file);
      const data: Record<string, unknown> = { file: stored.id, contentHash };
      if (extracted) data.extractedText = extracted;
      if (caption) {
        data.caption = caption;
        if (!resource.altText) data.altText = caption;
      }
      if (resource.format === 'other') {
        if (mime.startsWith('image/')) data.format = 'image';
        else if (mime === 'application/pdf') data.format = 'pdf';
      }
      await documents(RESOURCE_UID).update({ documentId: resource.documentId, data });

      if (previousId != null && previousId !== stored.id && uploadService.remove) {
        try {
          await uploadService.remove({ id: previousId });
        } catch (err) {
          strapi.log?.warn?.('[paul-brain] could not remove the previous file:', err);
        }
      }

      return {
        attached: true,
        deduped: false,
        documentId: resource.documentId,
        slug: resource.slug,
        contentHash,
        filename,
        mime,
        size: buffer.length,
        extractedTextStored: Boolean(extracted),
        captioned: Boolean(caption),
        message: 'Attached file',
      };
    },

    async fileContent(identifier: string) {
      const resource = await findByIdentifier(RESOURCE_UID, identifier, POPULATE);
      if (!resource) throw new Error(`Resource not found: ${identifier}`);
      const file = await resolveUploadFile(resource.file);
      if (!file) throw new Error('Resource has no file');
      const fetchImpl = (strapi as { fetch?: typeof fetch }).fetch;
      const resolveHost = (strapi as { resolveHost?: (hostname: string) => Promise<string[]> }).resolveHost;
      const buffer = await loadFileBytes(strapi, file, { fetchImpl, resolveHost });
      return {
        documentId: resource.documentId as string,
        filename: file.name || 'file',
        mime: file.mime || 'application/octet-stream',
        buffer,
      };
    },

    async readFile(identifier: string) {
      const file = await this.fileContent(identifier);
      const payload = {
        documentId: file.documentId,
        filename: file.filename,
        mime: file.mime,
        size: file.buffer.length,
      };
      if (file.buffer.length <= BASE64_INLINE_LIMIT) {
        return {
          ...payload,
          encoding: 'base64' as const,
          content: file.buffer.toString('base64'),
          message: 'File bytes are inline. The public upload URL is not included.',
        };
      }
      const signed = signFileToken(strapi, file.documentId);
      const base = serverPublicBase(strapi);
      return {
        ...payload,
        encoding: 'signed-url' as const,
        accessUrl: `${base}${signedFilePath(signed.token)}`,
        expiresAt: signed.expiresAt,
        message:
          'File is above the inline limit. Fetch accessUrl before expiresAt. This is a short-lived signed link, not the public upload URL.',
      };
    },
  };

  async function resolveUploadFile(file: unknown): Promise<UploadFileRecord | null> {
    if (file && typeof file === 'object') {
      const row = file as UploadFileRecord;
      if (row.mime || row.name || row.url || Buffer.isBuffer(row.buffer)) return row;
    }
    const id = mediaId(file);
    if (id == null) return null;
    const query = (strapi as { db?: { query?: (uid: string) => { findOne?: (params: unknown) => Promise<UploadFileRecord | null> } } }).db?.query?.(
      'plugin::upload.file'
    );
    if (query?.findOne) {
      const row = await query.findOne({ where: { id } });
      if (row) return row;
    }
    const upload = strapi.plugin('upload').service('upload') as { findOne?: (fileId: number) => Promise<UploadFileRecord | null> | UploadFileRecord | null };
    if (typeof upload?.findOne === 'function') {
      const row = await upload.findOne(id);
      if (row) return row;
    }
    return null;
  }
}

export type ResourceService = ReturnType<typeof createResourceService>;
