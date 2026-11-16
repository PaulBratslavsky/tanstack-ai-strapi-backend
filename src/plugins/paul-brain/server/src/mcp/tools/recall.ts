import type { Core } from '@strapi/strapi';
import { z } from '@strapi/utils';
import { getActionId, PLUGIN_NAME } from '../permissions';
import type { BrainService } from '../../services/brain';
import { stripNullish } from '../utils';

export const register = (strapi: Core.Strapi) => {
  strapi.ai.mcp.registerTool({
    name: 'recall',
    title: 'Recall from Brain',
    description: 'Search across brain types with ranked keyword search. Pages each type newest-first (updatedAt desc, up to 1000 rows) and also filters title/body in the database so older text matches are not dropped. Resources are included and match title, summary, body, extractedText, altText, caption, and snapshotMarkdown. Tag and alias matches are scored in memory. See get_brain_guide for usage.',
    
    resolveInputSchema: () => z.object({
      query: z.string().describe('Search query (keywords)'),
      types: z.array(z.enum(['note', 'person', 'project', 'decision', 'source', 'retro', 'gap', 'capability', 'rule', 'todo', 'goal', 'goal-checkin', 'resource'])).optional().describe('Limit search to these types (default: notes, people, projects, decisions, sources, and resources)'),
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
      })),
      count: z.number(),
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
