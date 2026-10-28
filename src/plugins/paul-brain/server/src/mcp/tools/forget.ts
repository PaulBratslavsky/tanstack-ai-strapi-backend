import type { Core } from '@strapi/strapi';
import { z } from '@strapi/utils';
import { getActionId } from '../permissions';
import { getUid } from '../types';

export const register = (strapi: Core.Strapi) => {
  strapi.ai.mcp.registerTool({
    name: 'forget',
    title: 'Forget from Brain',
    description: 'Delete an entity (requires confirm: true). Returns what was deleted. Separate permission (not granted by default). See get_brain_guide for usage.',
    
    resolveInputSchema: () => z.object({
      type: z.enum(['note', 'person', 'project', 'decision', 'source']).describe('Entity type'),
      identifier: z.string().describe('documentId or slug'),
      confirm: z.boolean().describe('Must be true to confirm deletion'),
    }),
    
    resolveOutputSchema: () => z.object({
      deleted: z.boolean(),
      entity: z.record(z.any()).optional(),
    }),
    
    auth: {
      policies: [{ action: getActionId('forget') }],
    },
    
    createHandler: (strapi) => async ({ args, context }) => {
      if (!args.confirm) {
        throw new Error('Deletion requires confirm: true');
      }

      const uid = getUid(args.type as any);
      
      const entities = await strapi.documents(uid).findMany({
        filters: {
          $or: [
            { documentId: { $eq: args.identifier } },
            { slug: { $eq: args.identifier } },
          ],
        },
        limit: 1,
      });

      if (entities.length === 0) {
        throw new Error(`${args.type} not found: ${args.identifier}`);
      }

      const entity = entities[0];
      await strapi.documents(uid).delete({ documentId: entity.documentId });

      const output = {
        deleted: true,
        entity,
      };

      return {
        content: [
          {
            type: 'text',
            text: `Deleted ${args.type}: ${entity.title || entity.name || entity.documentId}`,
          },
        ],
        structuredContent: output,
      };
    },
  });
};
