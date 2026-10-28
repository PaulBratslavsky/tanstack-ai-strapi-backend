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
  tags?: string[];
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
    
    const entities = await strapi.documents(uid).findMany({
      filters: {
        $or: [
          { slug: { $eq: slug } },
          { aliases: { $contains: slug } },
        ],
      },
      limit: 1,
    });

    if (entities.length > 0) {
      return {
        exists: true,
        documentId: entities[0].documentId,
        entity: entities[0],
      };
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
    const { query, types = ['note', 'person', 'project', 'decision', 'source'], tags, since, limit = 25 } = options;
    
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

        if (tags && type === 'note') {
          filters.tags = { $contains: tags };
        }

        const entities = await strapi.documents(uid).findMany({
          filters,
          limit: 100,
        });

        for (const entity of entities) {
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

            results.push({
              type,
              documentId: entity.documentId,
              slug: entity.slug,
              title: entity.title,
              name: entity.name,
              snippet,
              score,
              updatedAt: entity.updatedAt,
            });
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
});

export default brain;
export type BrainService = ReturnType<typeof brain>;
