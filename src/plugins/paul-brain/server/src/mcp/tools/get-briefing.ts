import type { Core } from '@strapi/strapi';
import { z } from '@strapi/utils';
import { getActionId } from '../permissions';
import { getUid } from '../types';
import { stripNullish } from '../utils';

export const register = (strapi: Core.Strapi) => {
  strapi.ai.mcp.registerTool({
    name: 'get_briefing',
    title: 'Get Briefing',
    description: 'Get a compact session briefing with pinned/recent lessons, open retros, open gaps, P0/P1/overdue todos, and recent cannot capabilities.',
    
    resolveInputSchema: () => z.object({
      lessonLimit: z.number().optional().describe('Max number of lessons to return (default: 10)'),
      todoLimit: z.number().optional().describe('Max number of todos to return (default: 10)'),
    }),
    
    resolveOutputSchema: () => z.object({
      lessons: z.array(z.object({
        documentId: z.string(),
        title: z.string(),
        summary: z.string().optional(),
        lesson: z.string().optional(),
        pinned: z.boolean().optional(),
      })),
      openRetros: z.array(z.object({
        documentId: z.string(),
        title: z.string(),
        date: z.string().optional(),
        task: z.string().optional(),
        failure: z.string().optional(),
      })),
      openGaps: z.array(z.object({
        documentId: z.string(),
        title: z.string(),
        count: z.number(),
        request: z.string().optional(),
        whatWasNeeded: z.string().optional(),
      })),
      urgentTodos: z.array(z.object({
        documentId: z.string(),
        title: z.string(),
        priority: z.string(),
        status: z.string(),
        dueDate: z.string().optional(),
      })),
      recentCannotCapabilities: z.array(z.object({
        documentId: z.string(),
        system: z.string(),
        capability: z.string(),
        verifiedAt: z.string().optional(),
        notes: z.string().optional(),
      })),
      summary: z.object({
        lessonsCount: z.number(),
        openRetrosCount: z.number(),
        openGapsCount: z.number(),
        urgentTodosCount: z.number(),
        cannotCount: z.number(),
      }),
    }),
    
    auth: {
      policies: [{ action: getActionId('brief.read') }],
    },
    
    createHandler: (strapi) => async ({ args }) => {
      const lessonLimit = args.lessonLimit || 10;
      const todoLimit = args.todoLimit || 10;

      const noteUid = getUid('note');
      const retroUid = getUid('retro');
      const gapUid = getUid('gap');
      const todoUid = getUid('todo');
      const capabilityUid = getUid('capability');

      // Get pinned lessons
      const pinnedLessons = await strapi.documents(noteUid).findMany({
        filters: {
          kind: { $eq: 'lesson' },
          pinned: { $eq: true },
        },
        limit: lessonLimit,
        sort: ['updatedAt:desc'],
      });

      // Get recent lessons (if we need more)
      const remainingLessonSlots = lessonLimit - pinnedLessons.length;
      let recentLessons: any[] = [];
      if (remainingLessonSlots > 0) {
        recentLessons = await strapi.documents(noteUid).findMany({
          filters: {
            kind: { $eq: 'lesson' },
            pinned: { $ne: true },
          },
          limit: remainingLessonSlots,
          sort: ['updatedAt:desc'],
        });
      }

      const lessons = [...pinnedLessons, ...recentLessons].map(l => stripNullish({
        documentId: l.documentId,
        title: l.title,
        summary: l.summary,
        lesson: typeof l.body === 'string' ? l.body.substring(0, 200) : undefined,
        pinned: l.pinned,
      }));

      // Get open retros
      const openRetros = await strapi.documents(retroUid).findMany({
        filters: {
          status: { $eq: 'open' },
        },
        limit: 20,
        sort: ['date:desc'],
      });

      const retros = openRetros.map(r => stripNullish({
        documentId: r.documentId,
        title: r.title,
        date: r.date,
        task: r.task,
        failure: r.failure,
      }));

      // Get open gaps sorted by count
      const openGaps = await strapi.documents(gapUid).findMany({
        filters: {
          status: { $eq: 'open' },
        },
        limit: 20,
        sort: ['count:desc', 'date:desc'],
      });

      const gaps = openGaps.map(g => stripNullish({
        documentId: g.documentId,
        title: g.title,
        count: g.count,
        request: g.request,
        whatWasNeeded: g.whatWasNeeded,
      }));

      // Get P0/P1 and overdue todos
      const now = new Date();
      const todos = await strapi.documents(todoUid).findMany({
        filters: {
          status: { $in: ['inbox', 'next', 'doing', 'waiting'] },
        },
        limit: 100,
        sort: ['priority:asc', 'dueDate:asc'],
      });

      const urgentTodos = todos
        .filter(t => {
          if (t.priority === 'P0' || t.priority === 'P1') return true;
          if (t.dueDate) {
            const dueDate = new Date(t.dueDate);
            return dueDate < now;
          }
          return false;
        })
        .slice(0, todoLimit)
        .map(t => stripNullish({
          documentId: t.documentId,
          title: t.title,
          priority: t.priority,
          status: t.status,
          dueDate: t.dueDate,
        }));

      // Get recent 'cannot' capabilities (within last 90 days)
      const ninetyDaysAgo = new Date();
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
      const ninetyDaysAgoStr = ninetyDaysAgo.toISOString().split('T')[0];

      const capabilities = await strapi.documents(capabilityUid).findMany({
        filters: {
          canDo: { $eq: false },
          verifiedAt: { $gte: ninetyDaysAgoStr },
        },
        limit: 10,
        sort: ['verifiedAt:desc'],
      });

      const cannotCapabilities = capabilities.map(c => stripNullish({
        documentId: c.documentId,
        system: c.system,
        capability: c.capability,
        verifiedAt: c.verifiedAt,
        notes: c.notes,
      }));

      const output = stripNullish({
        lessons,
        openRetros: retros,
        openGaps: gaps,
        urgentTodos,
        recentCannotCapabilities: cannotCapabilities,
        summary: {
          lessonsCount: lessons.length,
          openRetrosCount: retros.length,
          openGapsCount: gaps.length,
          urgentTodosCount: urgentTodos.length,
          cannotCount: cannotCapabilities.length,
        },
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
