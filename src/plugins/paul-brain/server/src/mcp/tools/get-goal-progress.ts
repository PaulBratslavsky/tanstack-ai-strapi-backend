import type { Core } from '@strapi/strapi';
import { z } from '@strapi/utils';
import { getActionId } from '../permissions';
import { getUid } from '../types';
import { stripNullish, getDaysAgoPST } from '../utils';
import { calculateStreaks } from './log-checkin';

export const register = (strapi: Core.Strapi) => {
  strapi.ai.mcp.registerTool({
    name: 'get_goal_progress',
    title: 'Get Goal Progress',
    description: 'Get goal progress including streaks, met rate over last 7 and 30 days, and recent check-ins.',
    
    resolveInputSchema: () => z.object({
      goal: z.string().describe('Goal documentId or title'),
      recentCheckinsLimit: z.number().min(1).max(100).optional().describe('Number of recent check-ins to return (default: 14)'),
    }),
    
    resolveOutputSchema: () => z.object({
      goalId: z.string(),
      title: z.string(),
      status: z.string(),
      currentStreak: z.number(),
      bestStreak: z.number(),
      metRateLast7Days: z.number().nullish(),
      metRateLast30Days: z.number().nullish(),
      recentCheckins: z.array(z.object({
        date: z.string(),
        met: z.boolean(),
        note: z.string().nullish(),
        loggedBy: z.string().nullish(),
      })),
    }),
    
    auth: {
      policies: [{ action: getActionId('goal.read') }],
    },
    
    createHandler: (strapi) => async ({ args, context }) => {
      const goalUid = getUid('goal');
      const checkinUid = getUid('goal-checkin');
      
      const goals = await strapi.documents(goalUid).findMany({
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

      const allCheckins = await strapi.documents(checkinUid).findMany({
        filters: {
          goal: { documentId: { $eq: goal.documentId } },
        },
        limit: 1000,
        sort: { date: 'desc' },
      });

      const recentLimit = args.recentCheckinsLimit || 14;
      const recentCheckins = allCheckins.slice(0, recentLimit).map(c => ({
        date: c.date,
        met: c.met,
        note: c.note,
        loggedBy: c.loggedBy,
      }));

      // Recompute streaks live so currentStreak reflects getTodayPST() even before a new check-in is logged
      const { currentStreak, bestStreak } = calculateStreaks(allCheckins, goal.cadence);

      const sevenDaysAgoStr = getDaysAgoPST(7);
      const thirtyDaysAgoStr = getDaysAgoPST(30);

      const checkins7Days = allCheckins.filter(c => c.date >= sevenDaysAgoStr);
      const checkins30Days = allCheckins.filter(c => c.date >= thirtyDaysAgoStr);

      let metRateLast7Days = null;
      if (checkins7Days.length > 0) {
        const metCount = checkins7Days.filter(c => c.met).length;
        metRateLast7Days = Math.round((metCount / checkins7Days.length) * 100) / 100;
      }

      let metRateLast30Days = null;
      if (checkins30Days.length > 0) {
        const metCount = checkins30Days.filter(c => c.met).length;
        metRateLast30Days = Math.round((metCount / checkins30Days.length) * 100) / 100;
      }

      const output = stripNullish({
        goalId: goal.documentId,
        title: goal.title,
        status: goal.status,
        currentStreak,
        bestStreak,
        metRateLast7Days,
        metRateLast30Days,
        recentCheckins,
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
