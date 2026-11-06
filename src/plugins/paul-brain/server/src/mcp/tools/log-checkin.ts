import type { Core } from '@strapi/strapi';
import { z } from '@strapi/utils';
import { getActionId } from '../permissions';
import { getUid } from '../types';
import { stripNullish, getTodayPST, diffDays } from '../utils';

export function calculateStreaks(checkins: any[], cadence: 'daily' | 'weekly'): { currentStreak: number; bestStreak: number } {
  if (checkins.length === 0) {
    return { currentStreak: 0, bestStreak: 0 };
  }

  const sortedCheckins = [...checkins].sort((a, b) => b.date.localeCompare(a.date));
  
  const latestCheckin = sortedCheckins[0];
  const todayPST = getTodayPST();
  
  const daysDiff = diffDays(todayPST, latestCheckin.date);
  
  let currentStreak = 0;
  if (cadence === 'daily') {
    if (daysDiff > 1) {
      currentStreak = 0;
    } else {
      for (let i = 0; i < sortedCheckins.length; i++) {
        const checkin = sortedCheckins[i];
        if (!checkin.met) break;
        
        if (i === 0) {
          currentStreak = 1;
        } else {
          const diff = diffDays(sortedCheckins[i - 1].date, checkin.date);
          
          if (diff === 1) {
            currentStreak++;
          } else {
            break;
          }
        }
      }
    }
  } else {
    if (daysDiff > 7) {
      currentStreak = 0;
    } else {
      for (let i = 0; i < sortedCheckins.length; i++) {
        const checkin = sortedCheckins[i];
        if (!checkin.met) break;
        
        if (i === 0) {
          currentStreak = 1;
        } else {
          const diff = diffDays(sortedCheckins[i - 1].date, checkin.date);
          
          if (diff >= 6 && diff <= 8) {
            currentStreak++;
          } else {
            break;
          }
        }
      }
    }
  }
  
  let bestStreak = 0;
  let tempStreak = 0;
  
  for (let i = sortedCheckins.length - 1; i >= 0; i--) {
    const checkin = sortedCheckins[i];
    
    if (checkin.met) {
      if (i === sortedCheckins.length - 1) {
        tempStreak = 1;
      } else {
        const diff = diffDays(checkin.date, sortedCheckins[i + 1].date);
        
        if (cadence === 'daily' && diff === 1) {
          tempStreak++;
        } else if (cadence === 'weekly' && diff >= 6 && diff <= 8) {
          tempStreak++;
        } else {
          tempStreak = 1;
        }
      }
      bestStreak = Math.max(bestStreak, tempStreak);
    } else {
      tempStreak = 0;
    }
  }
  
  return { currentStreak, bestStreak };
}

export const register = (strapi: Core.Strapi) => {
  strapi.ai.mcp.registerTool({
    name: 'log_checkin',
    title: 'Log Goal Check-in',
    description: 'Log a check-in for a goal. Updates existing check-in for the same date. Recomputes currentStreak (consecutive met days ending on latest check-in) and bestStreak. For daily goals, missed/unlogged days break the streak.',
    
    resolveInputSchema: () => z.object({
      goal: z.string().describe('Goal documentId or title'),
      date: z.string().optional().describe('Check-in date (YYYY-MM-DD, defaults to today in America/Los_Angeles)'),
      met: z.boolean().describe('Whether the goal was met'),
      note: z.string().optional().describe('Optional note'),
      loggedBy: z.string().optional().describe('Who logged this check-in'),
    }),
    
    resolveOutputSchema: () => z.object({
      checkinId: z.string(),
      goalId: z.string(),
      date: z.string(),
      met: z.boolean(),
      currentStreak: z.number(),
      bestStreak: z.number(),
    }),
    
    auth: {
      policies: [{ action: getActionId('goal.write') }],
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
      
      const checkinDate = args.date || getTodayPST();

      const existingCheckins = await strapi.documents(checkinUid).findMany({
        filters: {
          goal: { documentId: { $eq: goal.documentId } },
          date: { $eq: checkinDate },
        },
        limit: 1,
      });

      let checkin;
      if (existingCheckins.length > 0) {
        checkin = await strapi.documents(checkinUid).update({
          documentId: existingCheckins[0].documentId,
          data: {
            met: args.met,
            note: args.note,
            loggedBy: args.loggedBy,
          },
        });
      } else {
        checkin = await strapi.documents(checkinUid).create({
          data: {
            goal: { connect: [{ documentId: goal.documentId }] },
            date: checkinDate,
            met: args.met,
            note: args.note,
            loggedBy: args.loggedBy,
          },
        });
      }

      const allCheckins = await strapi.documents(checkinUid).findMany({
        filters: {
          goal: { documentId: { $eq: goal.documentId } },
        },
        limit: 1000,
      });

      const { currentStreak, bestStreak } = calculateStreaks(allCheckins, goal.cadence);

      await strapi.documents(goalUid).update({
        documentId: goal.documentId,
        data: {
          currentStreak,
          bestStreak,
          lastCheckinDate: checkinDate,
        },
      });

      const output = stripNullish({
        checkinId: checkin.documentId,
        goalId: goal.documentId,
        date: checkinDate,
        met: args.met,
        currentStreak,
        bestStreak,
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
