import type { Core } from '@strapi/strapi';
import { z } from '@strapi/utils';
import { getActionId } from '../permissions';
import { getUid, CONTENT_TYPES } from '../types';
import { stripNullish } from '../utils';
import { isArchivedRecord, withActiveRecords } from '../../services/archive';

export const register = (strapi: Core.Strapi) => {
  strapi.ai.mcp.registerTool({
    name: 'list_recent',
    title: 'List Recent Brain Items',
    description: 'Get newest N items by updatedAt across or within types. Archived rows are excluded. A per-type failure is returned in errors (type and message) along with any items that loaded, so an empty items list with an empty errors list means nothing was recent. Optional filters: types, kind (notes only), source_bot. See get_brain_guide for usage.',
    
    resolveInputSchema: () => z.object({
      types: z.array(z.enum(['note', 'person', 'project', 'decision', 'source', 'resource'])).optional().describe('Limit to these types (default: all)'),
      kind: z.enum(['fact', 'preference', 'idea', 'todo', 'log', 'reference', 'lesson', 'video', 'taught']).optional().describe('Filter notes by kind'),
      source_bot: z.string().optional().describe('Filter by source_bot (notes only)'),
      limit: z.number().min(1).max(50).optional().describe('Max results (default: 25)'),
    }),
    
    resolveOutputSchema: () => z.object({
      items: z.array(z.object({
        type: z.string(),
        documentId: z.string(),
        title: z.string().nullish(),
        name: z.string().nullish(),
        slug: z.string().nullish(),
        updatedAt: z.string(),
      })),
      count: z.number(),
      errors: z.array(z.object({
        type: z.string(),
        message: z.string(),
      })),
    }),
    
    auth: {
      policies: [{ action: getActionId('read') }],
    },
    
    createHandler: (strapi) => async ({ args, context }) => {
      const types = args.types || [...CONTENT_TYPES];
      const limit = args.limit || 25;
      
      const allItems: any[] = [];
      const errors: Array<{ type: string; message: string }> = [];

      for (const type of types) {
        const uid = getUid(type as any);
        
        const filters: any = withActiveRecords(type, {});
        if (args.kind && type === 'note') {
          filters.kind = { $eq: args.kind };
        }
        if (args.source_bot && type === 'note') {
          filters.source_bot = { $eq: args.source_bot };
        }

        try {
          const items = await strapi.documents(uid).findMany({
            filters,
            sort: { updatedAt: 'desc' },
            limit: limit * 2,
          });

          for (const item of items) {
            if (isArchivedRecord(type, item)) continue;
            let sanitized = item;
            try {
              sanitized = await strapi.contentAPI.sanitize.output(item, uid, context.userAbility);
            } catch (err) {
              strapi.log.warn('Failed to sanitize item:', err);
            }

            allItems.push({
              type,
              documentId: sanitized.documentId,
              title: sanitized.title,
              name: sanitized.name,
              slug: sanitized.slug,
              updatedAt: sanitized.updatedAt,
            });
          }
        } catch (err) {
          const message = err instanceof Error ? err.message : 'list failed';
          strapi.log.warn(`Failed to list recent for type ${type}:`, err);
          errors.push({ type, message });
        }
      }

      allItems.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
      const limited = allItems.slice(0, limit);

      const output = stripNullish({
        items: limited,
        count: limited.length,
        errors,
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
