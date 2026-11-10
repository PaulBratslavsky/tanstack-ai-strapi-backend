import type { Core } from '@strapi/strapi';
import { z } from '@strapi/utils';
import { getActionId } from '../permissions';
import { getUid } from '../types';
import { stripNullish, getTodayPST, diffDays } from '../utils';

export const register = (strapi: Core.Strapi) => {
  strapi.ai.mcp.registerTool({
    name: 'list_goals',
    title: 'List Goals',
    description: 'List goals with filters by status and category. Includes current and best streaks.',
    
    resolveInputSchema: () => z.object({
      status: z.array(z.enum(['active', 'paused', 'done', 'dropped'])).optional().describe('Filter by status'),
      category: z.array(z.enum(['health', 'fitness', 'work', 'learning', 'personal', 'other'])).optional().describe('Filter by category'),
      limit: z.number().min(1).max(100).optional().describe('Max results (default: 50)'),
    }),
    
    resolveOutputSchema: () => z.object({
      goals: z.array(z.object({
        documentId: z.string(),
        title: z.string(),
        description: z.string().nullish(),
        category: z.string().nullish(),
        cadence: z.string(),
        target: z.string().nullish(),
        status: z.string(),
        startDate: z.string().nullish(),
        currentStreak: z.number(),
        bestStreak: z.number(),
        lastCheckinDate: z.string().nullish(),
      })),
      count: z.number(),
    }),
    
    auth: {
      policies: [{ action: getActionId('goal.read') }],
    },
    
    createHandler: (strapi) => async ({ args, context }) => {
      const uid = getUid('goal');
      const limit = args.limit || 50;
      
      const filters: any = {};
      
      if (args.status && args.status.length > 0) {
        filters.state = { $in: args.status };
      }
      
      if (args.category && args.category.length > 0) {
        filters.category = { $in: args.category };
      }

      const goals = await strapi.documents(uid).findMany({
        filters,
        limit,
        sort: { createdAt: 'desc' },
      });

      const todayPST = getTodayPST();

      const formattedGoals = goals.map(goal => {
        let currentStreak = goal.currentStreak;
        
        // Check if streak has lapsed in Pacific Time without needing a write
        if (currentStreak > 0 && goal.lastCheckinDate) {
          const daysSinceLastCheckin = diffDays(todayPST, goal.lastCheckinDate);
          if (goal.cadence === 'daily' && daysSinceLastCheckin > 1) {
            currentStreak = 0;
          } else if (goal.cadence === 'weekly' && daysSinceLastCheckin > 7) {
            currentStreak = 0;
          }
        }
        
        return {
          documentId: goal.documentId,
          title: goal.title,
          description: goal.description,
          category: goal.category,
          cadence: goal.cadence,
          target: goal.target,
          status: goal.state, // Map state to status for external API
          startDate: goal.startDate,
          currentStreak,
          bestStreak: goal.bestStreak,
          lastCheckinDate: goal.lastCheckinDate,
        };
      });

      const output = stripNullish({
        goals: formattedGoals,
        count: formattedGoals.length,
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
