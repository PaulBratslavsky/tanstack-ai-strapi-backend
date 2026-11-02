import type { Core } from '@strapi/strapi';
import { z } from '@strapi/utils';
import { getActionId } from '../permissions';
import { getUid } from '../types';

export const register = (strapi: Core.Strapi) => {
  strapi.ai.mcp.registerTool({
    name: 'list_capabilities',
    title: 'List Brain Capabilities',
    description: 'List capability records. Filter by system. See get_brain_guide for usage.',
    
    resolveInputSchema: () => z.object({
      system: z.string().optional().describe('Filter by system'),
      limit: z.number().min(1).max(50).optional().describe('Max results (default: 25)'),
    }),
    
    resolveOutputSchema: () => z.object({
      items: z.array(z.object({
        documentId: z.string(),
        system: z.string(),
        capability: z.string(),
        canDo: z.boolean(),
        verifiedAt: z.string().optional(),
        howVerified: z.string().optional(),
        notes: z.string().optional(),
      })),
      count: z.number(),
    }),
    
    auth: {
      policies: [{ action: getActionId('read') }],
    },
    
    createHandler: (strapi) => async ({ args, context }) => {
      const uid = getUid('capability');
      const limit = args.limit || 25;
      
      const filters: any = {};
      if (args.system) {
        filters.system = { $eq: args.system };
      }

      const items = await strapi.documents(uid).findMany({
        filters,
        sort: { verifiedAt: 'desc' },
        limit,
      });

      const sanitized = await Promise.all(
        items.map(async (item) => {
          try {
            return await strapi.contentAPI.sanitize.output(item, uid, context.userAbility);
          } catch (err) {
            return item;
          }
        })
      );

      const output = {
        items: sanitized.map(item => ({
          documentId: item.documentId,
          system: item.system,
          capability: item.capability,
          canDo: item.canDo,
          verifiedAt: item.verifiedAt,
          howVerified: item.howVerified,
          notes: item.notes,
        })),
        count: sanitized.length,
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
