import type { Core } from '@strapi/strapi';

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
    const { query, types = ['note', 'person', 'project', 'decision', 'source'], kind, tag, videoId, sourceId, since, limit = 25 } = options;
    
    const results: SearchResult[] = [];
    const queryLower = query.toLowerCase();
    const keywords = queryLower.split(/\s+/).filter(k => k.length > 2);

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

        const populate = type === 'note' ? ['sources', 'people'] : undefined;

        const entities = await strapi.documents(uid).findMany({
          filters,
          populate,
          limit: 100,
        });

        for (const entity of entities) {
          // Apply tag filter in JS for DB-agnostic compatibility
          if (tag && type === 'note') {
            const entityTags = Array.isArray(entity.tags) ? entity.tags : [];
            const hasMatchingTag = entityTags.some((t: string) => 
              t.toLowerCase() === tag.toLowerCase()
            );
            if (!hasMatchingTag) {
              continue;
            }
          }

          // Apply sourceId filter
          if (sourceId && type === 'note') {
            const sources = Array.isArray(entity.sources) ? entity.sources : [];
            const hasMatchingSource = sources.some((s: any) => 
              s.documentId === sourceId
            );
            if (!hasMatchingSource) {
              continue;
            }
          }
          let score = 0;
          let snippet = '';

          const title = entity.title || entity.name || '';
          const titleLower = title.toLowerCase();
          const body = entity.body || entity.summary || entity.context || entity.excerpt || '';
          const bodyText = typeof body === 'string' ? body : JSON.stringify(body);
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
        status: { $notIn: ['done', 'dropped', 'superseded'] }
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

  async findDuplicateNotes(title: string): Promise<any[]> {
    const uid = `plugin::${PLUGIN_NAME}.note`;
    const slug = this.slugify(title);
    
    const notes = await strapi.documents(uid).findMany({
      limit: 100,
    });

    const candidates = [];
    for (const note of notes) {
      if (note.slug === slug || this.isSimilar(title, note.title)) {
        candidates.push(note);
      }
    }

    return candidates;
  },
});

export default brain;
export type BrainService = ReturnType<typeof brain>;
