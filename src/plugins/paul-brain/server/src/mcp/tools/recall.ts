import type { Core } from '@strapi/strapi';
import { z } from '@strapi/utils';
import { getActionId, PLUGIN_NAME } from '../permissions';
import type { BrainService } from '../../services/brain';

export const register = (strapi: Core.Strapi) => {
  strapi.ai.mcp.registerTool({
    name: 'recall',
    title: 'Recall from Brain',
    description: 'Search across all brain types (notes, people, projects, decisions, sources) with ranked keyword search. Returns snippets and documentIds. Results ranked by: title match (×3) > alias/tag match (×2) > body match (×1), plus recency decay and pinned boost. See get_brain_guide for usage.',
    
    resolveInputSchema: () => z.object({
      query: z.string().describe('Search query (keywords)'),
      types: z.array(z.enum(['note', 'person', 'project', 'decision', 'source'])).optional().describe('Limit search to these types (default: all)'),
      tags: z.array(z.string()).optional().describe('Filter by tags (notes only)'),
      since: z.string().optional().describe('Only return items updated after this ISO date'),
      limit: z.number().min(1).max(25).optional().describe('Max results (default: 25)'),
    }),
    
    resolveOutputSchema: () => z.object({
      results: z.array(z.object({
        type: z.string(),
        documentId: z.string(),
        slug: z.string().optional(),
        title: z.string().optional(),
        name: z.string().optional(),
        snippet: z.string(),
        score: z.number(),
        updatedAt: z.string(),
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
        tags: args.tags,
        since: args.since,
        limit: args.limit,
      });

      const output = {
        results,
        count: results.length,
      };

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
