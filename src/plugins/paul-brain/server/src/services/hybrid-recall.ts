import type { Core } from '@strapi/strapi';
import { getUid } from '../mcp/types';
import { isArchivedRecord, withActiveRecords } from './archive';

const DEFAULT_TYPES = ['note', 'person', 'project', 'decision', 'source', 'resource'];
const NOTE_UID = 'plugin::paul-brain.note';

export interface HybridSearchHit {
  type: string;
  documentId: string;
  slug?: string;
  title?: string;
  name?: string;
  snippet: string;
  score: number;
  updatedAt: string;
  linkedSourceIds?: string[];
  linkedPersonIds?: string[];
  matchTier?: 'top' | 'strong' | 'good' | 'related';
}

export type HybridHitList = HybridSearchHit[] & {
  searchMode?: 'hybrid' | 'keyword-only' | 'keyword-scan';
  statusMessage?: string | null;
};

interface RecallOptions {
  query: string;
  types?: string[];
  kind?: string;
  tag?: string;
  videoId?: string;
  sourceId?: string;
  since?: string;
  limit?: number;
}

function hybridService(strapi: Core.Strapi): any | null {
  if (typeof (strapi as any).plugin !== 'function') return null;
  try {
    const plugin = (strapi as any).plugin('hybrid-search');
    return plugin?.service?.('search') ?? null;
  } catch {
    return null;
  }
}

function rowsOf(page: unknown): any[] {
  if (Array.isArray(page)) return page;
  if (page && typeof page === 'object' && Array.isArray((page as { results?: unknown[] }).results)) {
    return (page as { results: any[] }).results;
  }
  return [];
}

/**
 * Recall through hybrid-search. Tag and alias boosts are applied inside that
 * plugin's fusion module (configured per type). Returns null when the plugin
 * is not installed or its keyword index is not ready and it found nothing,
 * so the existing scan can still answer.
 */
export async function searchWithHybrid(strapi: Core.Strapi, options: RecallOptions): Promise<HybridHitList | null> {
  const service = hybridService(strapi);
  if (!service?.search) return null;

  const types = options.types?.length ? options.types : DEFAULT_TYPES;
  const limit = Math.min(options.limit ?? 25, 25);
  const equals: Record<string, string> = {};
  if (options.kind) equals.kind = options.kind;
  if (options.videoId) equals.videoId = options.videoId;

  let response: any;
  try {
    response = await service.search({
      query: options.query,
      uids: types.map((type) => getUid(type)),
      limit: 100,
      equals: Object.keys(equals).length ? equals : undefined,
      since: options.since,
      tag: options.tag,
    });
  } catch (error) {
    strapi.log?.warn?.('[paul-brain] hybrid search failed; using keyword scan', error);
    return null;
  }

  const raw = Array.isArray(response?.results) ? response.results : [];
  if (raw.length === 0 && response?.lexicalReady === false) return null;

  const hits: HybridSearchHit[] = [];
  for (const type of types) {
    const uid = getUid(type);
    const typed = raw.filter((hit: any) => hit.uid === uid || hit.type === uid);
    if (typed.length === 0) continue;
    const filters: any = withActiveRecords(type, {});
    if (options.since) filters.updatedAt = { $gte: options.since };
    if (type === 'note' && options.kind) filters.kind = { $eq: options.kind };
    if (type === 'note' && options.videoId) filters.videoId = { $eq: options.videoId };
    if (type === 'note' && options.sourceId) filters.sources = { documentId: { $eq: options.sourceId } };
    filters.documentId = { $in: typed.map((hit: any) => hit.documentId) };

    let rows: any[] = [];
    try {
      const page = await strapi.documents(uid as any).findMany({
        filters,
        populate: type === 'note' ? ['sources', 'people'] : undefined,
        limit: typed.length,
      });
      rows = rowsOf(page);
    } catch (error) {
      strapi.log?.warn?.(`[paul-brain] hybrid result load failed for ${type}`, error);
      continue;
    }
    const byId = new Map(rows.map((row) => [row.documentId, row]));
    for (const hit of typed) {
      const entity = byId.get(hit.documentId);
      if (!entity || isArchivedRecord(type, entity)) continue;
      if (options.tag && (type === 'note' || type === 'resource')) {
        const entityTags = Array.isArray(entity.tags) ? entity.tags : [];
        if (!entityTags.some((tag: string) => tag.toLowerCase() === options.tag!.toLowerCase())) continue;
      }
      const result: HybridSearchHit = {
        type,
        documentId: entity.documentId,
        slug: entity.slug,
        title: entity.title,
        name: entity.name,
        snippet: hit.snippet || '',
        score: typeof hit.score === 'number' ? hit.score : 0,
        updatedAt: entity.updatedAt,
        matchTier: hit.matchTier,
      };
      if (type === 'note') {
        const sources = Array.isArray(entity.sources) ? entity.sources : [];
        const people = Array.isArray(entity.people) ? entity.people : [];
        if (sources.length > 0) result.linkedSourceIds = sources.map((source: any) => source.documentId);
        if (people.length > 0) result.linkedPersonIds = people.map((person: any) => person.documentId);
      }
      hits.push(result);
    }
  }

  const order = new Map<string, number>();
  raw.forEach((hit: any, index: number) => {
    order.set(`${hit.uid || hit.type}:${hit.documentId}`, index);
  });
  hits.sort((a, b) => {
    const left = order.get(`${getUid(a.type)}:${a.documentId}`) ?? 0;
    const right = order.get(`${getUid(b.type)}:${b.documentId}`) ?? 0;
    return left - right;
  });
  const sliced = hits.slice(0, limit) as HybridHitList;
  sliced.searchMode = response.mode === 'hybrid' ? 'hybrid' : 'keyword-only';
  sliced.statusMessage = response.statusMessage ?? null;
  return sliced;
}

/**
 * Semantic duplicate check. Falls back to the keyword scan when the key is
 * missing, similar() is unavailable, or no note vectors have been indexed yet.
 */
export async function similarNoteHits(
  strapi: Core.Strapi,
  text: string
): Promise<{ mode: 'similar' | 'keyword'; hits: Array<{ documentId: string; score: number }> }> {
  const service = hybridService(strapi);
  if (!service?.similar || !text.trim()) return { mode: 'keyword', hits: [] };
  try {
    const result = await service.similar({
      text,
      uids: [NOTE_UID],
      threshold: 0.9,
      limit: 8,
    });
    if (!result?.enabled || !result.indexedCount) return { mode: 'keyword', hits: [] };
    const hits = Array.isArray(result.results)
      ? result.results.map((hit: any) => ({ documentId: String(hit.documentId), score: Number(hit.score) || 0 }))
      : [];
    return { mode: 'similar', hits };
  } catch (error) {
    strapi.log?.warn?.('[paul-brain] similar() failed; using keyword duplicate check', error);
    return { mode: 'keyword', hits: [] };
  }
}
