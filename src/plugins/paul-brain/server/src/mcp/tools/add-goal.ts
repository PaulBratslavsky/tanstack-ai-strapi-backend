import type { Core } from '@strapi/strapi';
import { z } from '@strapi/utils';
import { getActionId } from '../permissions';
import { getUid } from '../types';
import { stripNullish, getTodayPST } from '../utils';

export const register = (strapi: Core.Strapi) => {
  strapi.ai.mcp.registerTool({
    name: 'add_goal',
    title: 'Add Goal',
    description: 'Create a new goal with daily or weekly check-ins. Categories: health, fitness, work, learning, personal, other. Refuses duplicate active goals by title.',
    
    resolveInputSchema: () => z.object({
      title: z.string().describe('Goal title'),
      description: z.string().optional().describe('Goal description'),
      category: z.enum(['health', 'fitness', 'work', 'learning', 'personal', 'other']).optional().describe('Goal category'),
      cadence: z.enum(['daily', 'weekly']).optional().describe('Check-in cadence (default: daily)'),
      target: z.string().optional().describe('Target metric or description (e.g. "last meal by 5 PM")'),
      startDate: z.string().optional().describe('Start date (ISO format, defaults to today)'),
    }),
    
    resolveOutputSchema: () => z.object({
      documentId: z.string(),
      title: z.string(),
      category: z.string().nullish(),
      cadence: z.string(),
      status: z.string(),
      currentStreak: z.number(),
      bestStreak: z.number(),
      alreadyExists: z.boolean().optional(),
    }),
    
    auth: {
      policies: [{ action: getActionId('goal.write') }],
    },
    
    createHandler: (strapi) => async ({ args, context }) => {
      const uid = getUid('goal');
      
      const existingGoals = await strapi.documents(uid).findMany({
        filters: {
          title: { $eq: args.title },
          status: { $eq: 'active' },
        },
        limit: 1,
      });

      if (existingGoals.length > 0) {
        const existing = existingGoals[0];
        const output = stripNullish({
          documentId: existing.documentId,
          title: existing.title,
          category: existing.category,
          cadence: existing.cadence,
          status: existing.status,
          currentStreak: existing.currentStreak,
          bestStreak: existing.bestStreak,
          alreadyExists: true,
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
      }

      const data: any = {
        title: args.title,
        description: args.description,
        category: args.category,
        cadence: args.cadence || 'daily',
        target: args.target,
        status: 'active',
        startDate: args.startDate || getTodayPST(),
        currentStreak: 0,
        bestStreak: 0,
      };

      const result = await strapi.documents(uid).create({ data });

      const output = stripNullish({
        documentId: result.documentId,
        title: result.title,
        category: result.category,
        cadence: result.cadence,
        status: result.status,
        currentStreak: result.currentStreak,
        bestStreak: result.bestStreak,
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
