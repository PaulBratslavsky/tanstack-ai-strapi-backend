import type { Core } from '@strapi/strapi';
import { isArchivedRecord, withActiveRecords } from './archive';
import { RESOURCE_TEXT_FIELDS } from './resource';

const PLUGIN_NAME = 'paul-brain';

interface SlugifyOptions {
  title: string;
  aliases?: string[];
}

interface DedupeResult {
  exists: boolean;
  documentId?: string;
  entity?: any;
}

interface SearchOptions {
  query: string;
  types?: string[];
  kind?: string;
  tag?: string;
  videoId?: string;
  sourceId?: string;
  since?: string;
  limit?: number;
}

interface SearchResult {
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
}

/** Page size for recall scans. Strapi's default page is too small to search a real brain. */
export const SEARCH_PAGE_SIZE = 100;

/**
 * Newest-first rows scored in memory per content type.
 * Text matches older than this window are still loaded via a database $containsi filter.
 */
export const SEARCH_SCAN_CAP = 1000;

/** Scalar text fields only. JSON tags/aliases stay in memory (Postgres jsonb LIKE is unsafe). */
const TEXT_SEARCH_FIELDS: Record<string, string[]> = {
  note: ['title', 'body', 'summary', 'howToRecheck', 'videoId', 'source_bot'],
  person: ['name', 'role', 'org', 'email', 'notes_md'],
  project: ['name', 'summary', 'goals', 'repo_url', 'url'],
  decision: ['title', 'context', 'decision', 'rationale'],
  source: ['title', 'excerpt', 'url', 'videoId', 'external_id'],
  retro: ['title', 'task', 'failure', 'fix', 'fixLocation'],
  gap: ['title', 'request', 'whatWasNeeded'],
  capability: ['system', 'capability', 'howVerified', 'notes'],
  rule: ['name', 'match', 'action'],
  todo: ['title', 'goal', 'acceptanceCriteria', 'context', 'waitingOn', 'closingNote', 'capturedBy'],
  goal: ['title', 'description', 'target'],
  'goal-checkin': ['note', 'loggedBy'],
  resource: [...RESOURCE_TEXT_FIELDS],
};

function searchKeywords(query: string): string[] {
  return query.toLowerCase().split(/\s+/).filter((keyword) => keyword.length > 2);
}

function searchableText(type: string, entity: any): string {
  if (type === 'resource') {
    return RESOURCE_TEXT_FIELDS.filter((field) => field !== 'title')
      .map((field) => entity[field])
      .filter((part) => typeof part === 'string' && part.length > 0)
      .join('\n');
  }
  const body = entity.body || entity.summary || entity.context || entity.excerpt || '';
  return typeof body === 'string' ? body : JSON.stringify(body);
}

function rowsFromFindMany(page: unknown): any[] {
  if (Array.isArray(page)) return page;
  if (page && typeof page === 'object' && Array.isArray((page as { results?: unknown[] }).results)) {
    return (page as { results: any[] }).results;
  }
  return [];
}

function textMatchFilter(keywords: string[], fields: string[]): Record<string, unknown> | null {
  if (keywords.length === 0 || fields.length === 0) return null;
  return {
    $or: keywords.flatMap((keyword) =>
      fields.map((field) => ({ [field]: { $containsi: keyword } }))
    ),
  };
}

const brain = ({ strapi }: { strapi: Core.Strapi }) => ({
  slugify(text: string): string {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  },

  async findBySlugOrAlias(
    type: string,
    slug: string,
  ): Promise<DedupeResult> {
    const uid = `plugin::${PLUGIN_NAME}.${type}`;
    
    // First try exact slug match
    const exactMatch = await strapi.documents(uid).findMany({
      filters: { slug: { $eq: slug } },
      limit: 1,
    });

    if (exactMatch.length > 0) {
      return {
        exists: true,
        documentId: exactMatch[0].documentId,
        entity: exactMatch[0],
      };
    }

    // If no slug match, fetch entities with aliases and match in JS
    // This avoids Postgres jsonb LIKE incompatibility
    const candidates = await strapi.documents(uid).findMany({
      filters: { aliases: { $notNull: true } },
      limit: 100,
    });

    const slugLower = slug.toLowerCase();
    for (const entity of candidates) {
      const aliases = Array.isArray(entity.aliases) ? entity.aliases : [];
      if (aliases.some((alias: string) => alias.toLowerCase() === slugLower)) {
        return {
          exists: true,
          documentId: entity.documentId,
          entity,
        };
      }
    }

    return { exists: false };
  },

  async mergeNote(documentId: string, data: any): Promise<any> {
    const uid = `plugin::${PLUGIN_NAME}.note`;
    const existing = await strapi.documents(uid).findOne({ documentId });

    if (!existing) {
      throw new Error(`Note ${documentId} not found`);
    }

    const updates: any = { ...data };

    if (data.body && existing.body) {
      updates.body = `${existing.body}\n\n---\n\n${data.body}`;
    }

    if (data.tags && Array.isArray(data.tags)) {
      const existingTags = Array.isArray(existing.tags) ? existing.tags : [];
      updates.tags = [...new Set([...existingTags, ...data.tags])];
    }

    return strapi.documents(uid).update({ documentId, data: updates });
  },

  async search(options: SearchOptions): Promise<SearchResult[]> {
    const { query, types = ['note', 'person', 'project', 'decision', 'source', 'resource'], kind, tag, videoId, sourceId, since, limit = 25 } = options;
    
    const results: SearchResult[] = [];
    const queryLower = query.toLowerCase();

    for (const type of types) {
      const uid = `plugin::${PLUGIN_NAME}.${type}`;
      
      try {
        const filters: any = {};
        
        if (since) {
          filters.updatedAt = { $gte: since };
        }

        if (type === 'note' && kind) {
          filters.kind = { $eq: kind };
        }

        if (type === 'note' && videoId) {
          filters.videoId = { $eq: videoId };
        }

        if (type === 'note' && sourceId) {
          filters.sources = { documentId: { $eq: sourceId } };
        }

        const populate = type === 'note' ? ['sources', 'people'] : undefined;
        const keywords = searchKeywords(query);
        const liveFilters = withActiveRecords(type, filters);

        const collect = async (queryFilters: Record<string, unknown>) => {
          const collected: any[] = [];
          const seen = new Set<string>();

          for (let start = 0; collected.length < SEARCH_SCAN_CAP; start += SEARCH_PAGE_SIZE) {
            const pageLimit = Math.min(SEARCH_PAGE_SIZE, SEARCH_SCAN_CAP - collected.length);
            const page = await strapi.documents(uid).findMany({
              filters: queryFilters,
              populate,
              sort: ['updatedAt:desc'],
              start,
              limit: pageLimit,
            });
            const rows = rowsFromFindMany(page);
            if (rows.length === 0) break;

            let added = 0;
            for (const row of rows) {
              if (!row?.documentId || seen.has(row.documentId)) continue;
              seen.add(row.documentId);
              collected.push(row);
              added += 1;
              if (collected.length >= SEARCH_SCAN_CAP) break;
            }

            // Repeated documentIds mean this page was not advanced.
            if (added === 0 || rows.length < pageLimit) break;
          }

          return collected;
        };

        const entities = await collect(liveFilters);

        // The newest-first window can hide older text matches. Ask the database
        // for those directly, then merge. Tags and aliases stay in the JS scorer.
        if (entities.length >= SEARCH_SCAN_CAP) {
          const textFilter = textMatchFilter(keywords, TEXT_SEARCH_FIELDS[type] || []);
          if (textFilter) {
            const olderMatches = await collect({ ...liveFilters, ...textFilter });
            const seen = new Set(entities.map((entity) => entity.documentId));
            for (const match of olderMatches) {
              if (!seen.has(match.documentId)) {
                seen.add(match.documentId);
                entities.push(match);
              }
            }
          }
        }

        for (const entity of entities) {
          if (isArchivedRecord(type, entity)) continue;

          // Apply tag filter in JS for DB-agnostic compatibility
          if (tag && (type === 'note' || type === 'resource')) {
            const entityTags = Array.isArray(entity.tags) ? entity.tags : [];
            const hasMatchingTag = entityTags.some((t: string) => 
              t.toLowerCase() === tag.toLowerCase()
            );
            if (!hasMatchingTag) {
              continue;
            }
          }

          let score = 0;
          let snippet = '';

          const title = entity.title || entity.name || '';
          const titleLower = title.toLowerCase();
          const bodyText = searchableText(type, entity);
          const bodyLower = bodyText.toLowerCase();
          
          const aliases = Array.isArray(entity.aliases) ? entity.aliases : [];
          const entityTags = Array.isArray(entity.tags) ? entity.tags : [];

          for (const keyword of keywords) {
            if (titleLower.includes(keyword)) score += 3;
            if (aliases.some((a: string) => a.toLowerCase().includes(keyword))) score += 2;
            if (entityTags.some((t: string) => t.toLowerCase().includes(keyword))) score += 2;
            if (bodyLower.includes(keyword)) score += 1;
          }

          if (titleLower.includes(queryLower)) score += 5;

          const now = new Date();
          const updated = new Date(entity.updatedAt);
          const ageInDays = (now.getTime() - updated.getTime()) / (1000 * 60 * 60 * 24);
          const recencyBoost = Math.max(0, 1 - (ageInDays / 365));
          score += recencyBoost;

          if (entity.pinned === true && type === 'note') {
            score += 2;
          }

          if (score > 0) {
            const snippetStart = bodyLower.indexOf(queryLower);
            if (snippetStart >= 0) {
              const start = Math.max(0, snippetStart - 50);
              const end = Math.min(bodyText.length, snippetStart + query.length + 100);
              snippet = (start > 0 ? '...' : '') + 
                        bodyText.substring(start, end) +
                        (end < bodyText.length ? '...' : '');
            } else {
              snippet = bodyText.substring(0, 150) + (bodyText.length > 150 ? '...' : '');
            }

            const result: SearchResult = {
              type,
              documentId: entity.documentId,
              slug: entity.slug,
              title: entity.title,
              name: entity.name,
              snippet,
              score,
              updatedAt: entity.updatedAt,
            };

            if (type === 'note') {
              const sources = Array.isArray(entity.sources) ? entity.sources : [];
              const people = Array.isArray(entity.people) ? entity.people : [];
              
              if (sources.length > 0) {
                result.linkedSourceIds = sources.map((s: any) => s.documentId);
              }
              
              if (people.length > 0) {
                result.linkedPersonIds = people.map((p: any) => p.documentId);
              }
            }

            results.push(result);
          }
        }
      } catch (err) {
        strapi.log.warn(`Search failed for type ${type}:`, err);
      }
    }

    results.sort((a, b) => b.score - a.score);
    return results.slice(0, Math.min(limit, 25));
  },

  async linkEntities(
    noteDocumentId: string,
    relation: 'people' | 'projects' | 'sources' | 'decisions',
    targetDocumentIds: string[],
    operation: 'connect' | 'disconnect',
  ): Promise<any> {
    const uid = `plugin::${PLUGIN_NAME}.note`;
    
    const data: any = {};
    data[relation] = operation === 'connect' 
      ? { connect: targetDocumentIds.map(id => ({ documentId: id })) }
      : { disconnect: targetDocumentIds.map(id => ({ documentId: id })) };

    return strapi.documents(uid).update({
      documentId: noteDocumentId,
      data,
    });
  },

  async resolveEntityBySlug(type: string, identifier: string): Promise<string | null> {
    const uid = `plugin::${PLUGIN_NAME}.${type}`;
    
    const entities = await strapi.documents(uid).findMany({
      filters: {
        $or: [
          { slug: { $eq: identifier } },
          { documentId: { $eq: identifier } },
        ],
      },
      limit: 1,
    });

    return entities.length > 0 ? entities[0].documentId : null;
  },

  normalizeTitle(title: string): string {
    return title
      .toLowerCase()
      .trim()
      .replace(/[^\w\s]/g, '')
      .replace(/\s+/g, ' ');
  },

  isSimilar(title1: string, title2: string): boolean {
    const norm1 = this.normalizeTitle(title1);
    const norm2 = this.normalizeTitle(title2);
    
    if (norm1 === norm2) return true;
    
    const words1 = norm1.split(' ');
    const words2 = norm2.split(' ');
    const commonWords = words1.filter(w => words2.includes(w) && w.length > 3);
    
    const similarity = (2 * commonWords.length) / (words1.length + words2.length);
    return similarity > 0.7;
  },

  async findDuplicateTodos(title: string, dueDate?: string, projectId?: string): Promise<any[]> {
    const uid = `plugin::${PLUGIN_NAME}.todo`;
    const todos = await strapi.documents(uid).findMany({
      filters: {
        state: { $notIn: ['done', 'dropped', 'superseded'] }
      },
      limit: 100,
    });

    const candidates = [];
    for (const todo of todos) {
      if (this.isSimilar(title, todo.title)) {
        const sameDueDate = dueDate && todo.dueDate && dueDate === todo.dueDate;
        const sameProject = projectId && todo.project?.documentId === projectId;
        
        if (sameDueDate || sameProject || !dueDate) {
          candidates.push(todo);
        }
      }
    }

    return candidates;
  },

  async findActiveByDedupeKey(dedupeKey: string): Promise<any | null> {
    const key = dedupeKey.trim();
    if (!key) return null;
    const uid = `plugin::${PLUGIN_NAME}.note`;
    const notes = await strapi.documents(uid).findMany({
      filters: withActiveRecords('note', { dedupeKey: { $eq: key } }),
      sort: ['updatedAt:desc'],
      limit: 5,
    });
    return (notes || []).find((note: any) => note?.archived !== true) || null;
  },

  /**
   * Rank notes that resemble a proposal.
   * Candidates come from search() (title, summary, and body; newest-first pages, same cap as recall),
   * plus an exact dedupeKey lookup and an exact slug lookup. Archived notes are ignored.
   */
  async assessNote(input: NoteProposal): Promise<NoteAssessment> {
    const byId = new Map<string, RankedCandidate>();
    const uid = `plugin::${PLUGIN_NAME}.note`;

    const consider = (entity: any, match: RelatedNote['match'], score: number) => {
      if (!entity?.documentId || entity.archived === true) return;
      const prev = byId.get(entity.documentId);
      if (!prev) {
        byId.set(entity.documentId, { entity, match, score });
        return;
      }
      const betterMatch = MATCH_RANK[match] > MATCH_RANK[prev.match];
      if (betterMatch || score > prev.score) {
        byId.set(entity.documentId, {
          entity: prev.entity.body || prev.entity.summary ? prev.entity : entity,
          match: betterMatch ? match : prev.match,
          score: Math.max(score, prev.score),
        });
      }
    };

    if (input.dedupeKey) {
      const keyed = await this.findActiveByDedupeKey(input.dedupeKey);
      if (keyed) consider(keyed, 'dedupeKey', 100);
    }

    const slug = this.slugify(input.title || '');
    if (slug) {
      const bySlug = await this.findBySlugOrAlias('note', slug);
      if (bySlug.exists && bySlug.entity?.archived !== true) {
        consider(bySlug.entity, 'slug', 40);
      }
    }

    const query = proposalQuery(input);
    if (searchKeywords(query).length > 0) {
      const hits = await this.search({ query, types: ['note'], limit: 25 });
      if (hits.length > 0) {
        const rows = await strapi.documents(uid).findMany({
          filters: withActiveRecords('note', {
            documentId: { $in: hits.map((hit) => hit.documentId) },
          }),
          limit: hits.length,
        });
        const rowById = new Map((rows || []).map((row: any) => [row.documentId, row]));
        for (const hit of hits) {
          const entity = rowById.get(hit.documentId) || {
            documentId: hit.documentId,
            title: hit.title,
            slug: hit.slug,
            summary: undefined,
            updatedAt: hit.updatedAt,
          };
          const title = entity.title || hit.title || '';
          const strongTitle =
            this.isSimilar(input.title, title) || titlePhraseIn(entity, input.title);
          let score = hit.score;
          let match: RelatedNote['match'] = 'search';
          if (strongTitle) {
            score += 12;
            match = 'title';
          }
          score += Math.min(3, sharedTagCount(input.tags, entity.tags));
          consider(entity, match, score);
        }
      }
    }

    const ranked = [...byId.values()].sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return String(b.entity.updatedAt || '').localeCompare(String(a.entity.updatedAt || ''));
    });

    const related: RelatedNote[] = ranked.slice(0, 8).map((candidate) => ({
      documentId: candidate.entity.documentId,
      title: candidate.entity.title || '',
      slug: candidate.entity.slug || '',
      kind: candidate.entity.kind,
      summary: candidate.entity.summary,
      score: Math.round(candidate.score * 100) / 100,
      match: candidate.match,
      updatedAt: candidate.entity.updatedAt,
    }));

    const top = ranked[0];
    let recommendedAction: NoteRecommendation = 'create';
    if (top && (top.match === 'dedupeKey' || top.match === 'slug' || top.match === 'title')) {
      recommendedAction = noteContentAlreadyStored(top.entity, input) ? 'skip' : 'update_existing';
    }

    return { recommendedAction, related };
  },

  async findDuplicateNotes(
    title: string,
    extra: Omit<NoteProposal, 'title'> = {}
  ): Promise<any[]> {
    const assessment = await this.assessNote({ title, ...extra });
    if (assessment.recommendedAction === 'create') return [];
    return assessment.related.map((note) => ({
      documentId: note.documentId,
      title: note.title,
      slug: note.slug,
      kind: note.kind,
      summary: note.summary,
    }));
  },
});

export type NoteRecommendation = 'create' | 'update_existing' | 'skip';

export interface NoteProposal {
  title: string;
  summary?: string;
  body?: string;
  tags?: string[];
  dedupeKey?: string;
}

export interface RelatedNote {
  documentId: string;
  title: string;
  slug: string;
  kind?: string;
  summary?: string;
  score: number;
  match: 'dedupeKey' | 'slug' | 'title' | 'search';
  updatedAt?: string;
}

export interface NoteAssessment {
  recommendedAction: NoteRecommendation;
  related: RelatedNote[];
}

interface RankedCandidate {
  entity: any;
  match: RelatedNote['match'];
  score: number;
}

const MATCH_RANK: Record<RelatedNote['match'], number> = {
  search: 0,
  title: 1,
  slug: 2,
  dedupeKey: 3,
};

function plainTitle(title: string): string {
  return title.toLowerCase().trim().replace(/[^\w\s]/g, '').replace(/\s+/g, ' ');
}

function proposalQuery(input: NoteProposal): string {
  const body = typeof input.body === 'string' ? input.body.replace(/\s+/g, ' ').trim().slice(0, 240) : '';
  return [input.title, input.summary, body].filter((part) => typeof part === 'string' && part.trim()).join(' ');
}

function titlePhraseIn(entity: { title?: string; summary?: string; body?: string }, title: string): boolean {
  const phrase = plainTitle(title);
  if (phrase.length < 8) return false;
  const haystack = plainTitle(`${entity.title || ''} ${entity.summary || ''} ${entity.body || ''}`);
  return haystack.includes(phrase);
}

function sharedTagCount(left?: string[], right?: string[]): number {
  if (!Array.isArray(left) || !Array.isArray(right)) return 0;
  const have = new Set(right.map((tag) => String(tag).toLowerCase()));
  return left.filter((tag) => have.has(String(tag).toLowerCase())).length;
}

/** True when the proposal adds no summary or body beyond what the existing note already has. */
export function noteContentAlreadyStored(
  existing: { title?: string; summary?: string; body?: string },
  input: NoteProposal
): boolean {
  const incoming = [input.summary, input.body]
    .map((part) => (typeof part === 'string' ? part.trim() : ''))
    .filter((part) => part.length > 0);
  if (incoming.length === 0) {
    return plainTitle(existing.title || '') === plainTitle(input.title || '');
  }
  const haystack = `${existing.summary || ''}\n${existing.body || ''}`;
  return incoming.every((part) => haystack.includes(part));
}

export default brain;
export type BrainService = ReturnType<typeof brain>;
