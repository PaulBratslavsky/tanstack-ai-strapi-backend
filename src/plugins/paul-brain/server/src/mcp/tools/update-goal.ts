import type { Core } from '@strapi/strapi';
import { z } from '@strapi/utils';
import { getActionId } from '../permissions';
import { getUid } from '../types';
import { stripNullish } from '../utils';

export const register = (strapi: Core.Strapi) => {
  strapi.ai.mcp.registerTool({
    name: 'update_goal',
    title: 'Update Goal',
    description: 'Update goal fields including status, description, category, target, etc.',
    
    resolveInputSchema: () => z.object({
      goal: z.string().describe('Goal documentId or title'),
      status: z.enum(['active', 'paused', 'done', 'dropped']).optional().describe('Update status'),
      description: z.string().optional().describe('Update description'),
      category: z.enum(['health', 'fitness', 'work', 'learning', 'personal', 'other']).optional().describe('Update category'),
      target: z.string().optional().describe('Update target'),
      cadence: z.enum(['daily', 'weekly']).optional().describe('Update cadence'),
    }),
    
    resolveOutputSchema: () => z.object({
      documentId: z.string(),
      title: z.string(),
      status: z.string(),
      description: z.string().nullish(),
      category: z.string().nullish(),
      target: z.string().nullish(),
      cadence: z.string(),
    }),
    
    auth: {
      policies: [{ action: getActionId('goal.write') }],
    },
    
    createHandler: (strapi) => async ({ args, context }) => {
      const uid = getUid('goal');
      
      const goals = await strapi.documents(uid).findMany({
        filters: {
          $or: [
            { documentId: { $eq: args.goal } },
            { title: { $eq: args.goal } },
          ],
        },
        limit: 1,
      });

      if (goals.length === 0) {
        throw new Error(`Goal not found: ${args.goal}`);
      }

      const goal = goals[0];

      const updateData: any = {};
      if (args.status !== undefined) updateData.status = args.status;
      if (args.description !== undefined) updateData.description = args.description;
      if (args.category !== undefined) updateData.category = args.category;
      if (args.target !== undefined) updateData.target = args.target;
      if (args.cadence !== undefined) updateData.cadence = args.cadence;

      const updated = await strapi.documents(uid).update({
        documentId: goal.documentId,
        data: updateData,
      });

      const output = stripNullish({
        documentId: updated.documentId,
        title: updated.title,
        status: updated.status,
        description: updated.description,
        category: updated.category,
        target: updated.target,
        cadence: updated.cadence,
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
