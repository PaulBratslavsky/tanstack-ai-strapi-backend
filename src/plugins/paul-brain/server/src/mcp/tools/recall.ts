import type { Core } from '@strapi/strapi';
import { z } from '@strapi/utils';
import { getActionId, PLUGIN_NAME } from '../permissions';
import type { BrainService } from '../../services/brain';
import { stripNullish } from '../utils';

export const register = (strapi: Core.Strapi) => {
  strapi.ai.mcp.registerTool({
    name: 'recall',
    title: 'Recall from Brain',
    description: 'Search across brain types with hybrid keyword and semantic ranking. Score is cosine similarity, and that cosine sets the order; keyword, tag, alias, and pinned boosts only reorder close neighbors. Without OPENAI_API_KEY, or while vectors are stale, results are keyword-only and statusMessage says so. Default types include notes, people, projects, decisions, sources, resources, and todos. Resources match title, summary, body, extractedText, altText, caption, and snapshotMarkdown. Todos match title, goal, acceptance criteria, and context. Archived rows are excluded. See get_brain_guide for usage.',
    
    resolveInputSchema: () => z.object({
      query: z.string().describe('Search query (keywords)'),
      types: z.array(z.enum(['note', 'person', 'project', 'decision', 'source', 'retro', 'gap', 'capability', 'rule', 'todo', 'goal', 'goal-checkin', 'resource'])).optional().describe('Limit search to these types (default: notes, people, projects, decisions, sources, resources, and todos)'),
      kind: z.enum(['fact', 'preference', 'idea', 'todo', 'log', 'reference', 'lesson', 'video', 'taught']).optional().describe('Filter notes by kind'),
      tag: z.string().optional().describe('Filter by tag (notes and resources)'),
      videoId: z.string().optional().describe('Filter by videoId (notes only)'),
      sourceId: z.string().optional().describe('Filter by linked source documentId (notes only)'),
      since: z.string().optional().describe('Only return items updated after this ISO date'),
      limit: z.number().min(1).max(25).optional().describe('Max results (default: 25)'),
    }),
    
    resolveOutputSchema: () => z.object({
      results: z.array(z.object({
        type: z.string(),
        documentId: z.string(),
        slug: z.string().nullish(),
        title: z.string().nullish(),
        name: z.string().nullish(),
        snippet: z.string(),
        score: z.number(),
        updatedAt: z.string(),
        linkedSourceIds: z.array(z.string()).optional(),
        linkedPersonIds: z.array(z.string()).optional(),
        matchTier: z.enum(['top', 'strong', 'good', 'related']).optional(),
      })),
      count: z.number(),
      searchMode: z.enum(['hybrid', 'keyword-only', 'keyword-scan']).optional(),
      statusMessage: z.string().nullish(),
    }),
    
    auth: {
      policies: [{ action: getActionId('read') }],
    },
    
    createHandler: (strapi) => async ({ args, context }) => {
      const brainService = strapi.plugin(PLUGIN_NAME).service('brain') as BrainService;
      
      const results = await brainService.search({
        query: args.query,
        types: args.types,
        kind: args.kind,
        tag: args.tag,
        videoId: args.videoId,
        sourceId: args.sourceId,
        since: args.since,
        limit: args.limit,
      });

      const output = stripNullish({
        results,
        count: results.length,
        searchMode: (results as { searchMode?: 'hybrid' | 'keyword-only' | 'keyword-scan' }).searchMode,
        statusMessage: (results as { statusMessage?: string | null }).statusMessage,
      });

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(output, null, 2),
          },
        ],
        structuredContent: output,
      };
    },
  });
};
