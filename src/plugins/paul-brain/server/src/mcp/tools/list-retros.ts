import type { Core } from '@strapi/strapi';
import { z } from '@strapi/utils';
import { getActionId } from '../permissions';
import { getUid } from '../types';
import { stripNullish } from '../utils';

export const register = (strapi: Core.Strapi) => {
  strapi.ai.mcp.registerTool({
    name: 'list_retros',
    title: 'List Brain Retros',
    description: 'List retro records. Filter by status. See get_brain_guide for usage.',
    
    resolveInputSchema: () => z.object({
      status: z.enum(['open', 'fixed']).optional().describe('Filter by status'),
      limit: z.number().min(1).max(50).optional().describe('Max results (default: 25)'),
    }),
    
    resolveOutputSchema: () => z.object({
      items: z.array(z.object({
        documentId: z.string(),
        slug: z.string(),
        title: z.string(),
        state: z.string(),
        date: z.string().nullish(),
        failure: z.string().nullish(),
        fix: z.string().nullish(),
      })),
      count: z.number(),
    }),
    
    auth: {
      policies: [{ action: getActionId('read') }],
    },
    
    createHandler: (strapi) => async ({ args, context }) => {
      const uid = getUid('retro');
      const limit = args.limit || 25;
      
      const filters: any = {};
      if (args.status) {
        filters.state = { $eq: args.status };
      }

      const items = await strapi.documents(uid).findMany({
        filters,
        sort: { date: 'desc' },
        limit,
      });

      const output = stripNullish({
        items: items.map(item => ({
          documentId: item.documentId,
          slug: item.slug,
          title: item.title,
          status: item.state, // Map state to status for external API
          date: item.date,
          failure: item.failure,
          fix: item.fix,
        })),
        count: items.length,
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
