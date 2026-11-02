import type { Core } from '@strapi/strapi';
import { z } from '@strapi/utils';
import { getActionId } from '../permissions';
import { getUid } from '../types';
import { stripNullish } from '../utils';

export const register = (strapi: Core.Strapi) => {
  strapi.ai.mcp.registerTool({
    name: 'list_gaps',
    title: 'List Brain Gaps',
    description: 'List gap records. See get_brain_guide for usage.',
    
    resolveInputSchema: () => z.object({
      status: z.enum(['open', 'built', 'wontfix']).optional().describe('Filter by status'),
      limit: z.number().min(1).max(50).optional().describe('Max results (default: 25)'),
    }),
    
    resolveOutputSchema: () => z.object({
      items: z.array(z.object({
        documentId: z.string(),
        slug: z.string(),
        title: z.string(),
        status: z.string(),
        count: z.number(),
        date: z.string().nullish(),
        request: z.string().nullish(),
        whatWasNeeded: z.string().nullish(),
      })),
      count: z.number(),
    }),
    
    auth: {
      policies: [{ action: getActionId('read') }],
    },
    
    createHandler: (strapi) => async ({ args, context }) => {
      const uid = getUid('gap');
      const limit = args.limit || 25;
      
      const filters: any = {};
      if (args.status) {
        filters.status = { $eq: args.status };
      }

      const items = await strapi.documents(uid).findMany({
        filters,
        sort: { count: 'desc', date: 'desc' },
        limit,
      });

      const output = stripNullish({
        items: items.map(item => ({
          documentId: item.documentId,
          slug: item.slug,
          title: item.title,
          status: item.status,
          count: item.count || 1,
          date: item.date,
          request: item.request,
          whatWasNeeded: item.whatWasNeeded,
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
