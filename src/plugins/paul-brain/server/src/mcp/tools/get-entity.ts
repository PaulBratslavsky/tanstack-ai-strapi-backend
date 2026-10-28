import type { Core } from '@strapi/strapi';
import { z } from '@strapi/utils';
import { getActionId } from '../permissions';
import { getUid } from '../types';

export const register = (strapi: Core.Strapi) => {
  strapi.ai.mcp.registerTool({
    name: 'get_entity',
    title: 'Get Brain Entity',
    description: 'Fetch one entity by type and documentId or slug, with relations populated. Use after recall to get full details. See get_brain_guide for usage.',
    
    resolveInputSchema: () => z.object({
      type: z.enum(['note', 'person', 'project', 'decision', 'source']).describe('Entity type'),
      identifier: z.string().describe('documentId or slug'),
    }),
    
    resolveOutputSchema: () => z.object({
      entity: z.record(z.any()).nullable(),
    }),
    
    auth: {
      policies: [{ action: getActionId('read') }],
    },
    
    createHandler: (strapi) => async ({ args, context }) => {
      const uid = getUid(args.type as any);
      
      const entities = await strapi.documents(uid).findMany({
        filters: {
          $or: [
            { documentId: { $eq: args.identifier } },
            { slug: { $eq: args.identifier } },
          ],
        },
        populate: '*',
        limit: 1,
      });

      const entity = entities.length > 0 ? entities[0] : null;

      let sanitized = entity;
      if (entity) {
        try {
          sanitized = await strapi.contentAPI.sanitize.output(entity, uid, context.userAbility);
        } catch (err) {
          strapi.log.warn('Failed to sanitize entity:', err);
        }
      }

      const output = {
        entity: sanitized,
      };

      return {
        content: [
          {
            type: 'text',
            text: sanitized ? JSON.stringify(sanitized, null, 2) : 'Entity not found',
          },
        ],
        structuredContent: output,
      };
    },
  });
};
