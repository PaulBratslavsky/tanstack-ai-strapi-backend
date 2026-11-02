import type { Core } from '@strapi/strapi';
import { z } from '@strapi/utils';
import { getActionId } from '../permissions';
import { getUid } from '../types';

export const register = (strapi: Core.Strapi) => {
  strapi.ai.mcp.registerTool({
    name: 'list_rules',
    title: 'List Brain Rules',
    description: 'List routing/handling rules. Optionally filter by enabled status, sorted by priority. See get_brain_guide for usage.',
    
    resolveInputSchema: () => z.object({
      enabled: z.boolean().optional().describe('Filter by enabled status'),
      limit: z.number().min(1).max(50).optional().describe('Max results (default: 50)'),
    }),
    
    resolveOutputSchema: () => z.object({
      items: z.array(z.object({
        documentId: z.string(),
        name: z.string(),
        match: z.string(),
        action: z.string(),
        priority: z.number(),
        enabled: z.boolean(),
      })),
      count: z.number(),
    }),
    
    auth: {
      policies: [{ action: getActionId('read') }],
    },
    
    createHandler: (strapi) => async ({ args, context }) => {
      const uid = getUid('rule');
      const limit = args.limit || 50;
      
      const filters: any = {};
      if (args.enabled !== undefined) {
        filters.enabled = { $eq: args.enabled };
      }

      const items = await strapi.documents(uid).findMany({
        filters,
        sort: { priority: 'desc' },
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
          name: item.name,
          match: item.match,
          action: item.action,
          priority: item.priority,
          enabled: item.enabled,
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
