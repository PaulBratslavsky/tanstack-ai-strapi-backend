import type { Core } from '@strapi/strapi';
import { z } from '@strapi/utils';
import { getActionId } from '../permissions';
import { getUid } from '../types';
import { stripNullish, getTodayPST, getDaysAgoPST } from '../utils';

export const register = (strapi: Core.Strapi) => {
  strapi.ai.mcp.registerTool({
    name: 'list_todos',
    title: 'List Todos',
    description: 'List todos with filters: status[], priority[], project (documentId/slug), dueBefore (ISO date), overdue (boolean), waitingOlderThanDays (number). Results sorted by priority then dueDate.',
    
    resolveInputSchema: () => z.object({
      status: z.array(z.enum(['inbox', 'next', 'doing', 'waiting', 'done', 'dropped'])).optional().describe('Filter by status'),
      priority: z.array(z.enum(['P0', 'P1', 'P2', 'P3'])).optional().describe('Filter by priority'),
      project: z.string().optional().describe('Filter by project documentId or slug'),
      dueBefore: z.string().optional().describe('Filter todos due before this date (ISO format)'),
      overdue: z.boolean().optional().describe('Filter overdue todos (dueDate < today and status not done/dropped)'),
      waitingOlderThanDays: z.number().optional().describe('Filter waiting items older than N days'),
      limit: z.number().min(1).max(100).optional().describe('Max results (default: 50)'),
    }),
    
    resolveOutputSchema: () => z.object({
      todos: z.array(z.object({
        documentId: z.string(),
        title: z.string(),
        status: z.string(),
        priority: z.string(),
        dueDate: z.string().nullish(),
        doDate: z.string().nullish(),
        project: z.object({
          documentId: z.string(),
          name: z.string(),
        }).nullish(),
        waitingOn: z.string().nullish(),
        source: z.string().nullish(),
        capturedBy: z.string().nullish(),
      })),
      count: z.number(),
    }),
    
    auth: {
      policies: [{ action: getActionId('read') }],
    },
    
    createHandler: (strapi) => async ({ args, context }) => {
      const uid = getUid('todo');
      const limit = args.limit || 50;
      
      const filters: any = {};
      
      if (args.status && args.status.length > 0) {
        filters.status = { $in: args.status };
      }
      
      if (args.priority && args.priority.length > 0) {
        filters.priority = { $in: args.priority };
      }
      
      if (args.project) {
        const projectUid = getUid('project');
        const projects = await strapi.documents(projectUid).findMany({
          filters: {
            $or: [
              { documentId: { $eq: args.project } },
              { slug: { $eq: args.project } },
            ],
          },
          limit: 1,
        });
        
        if (projects.length > 0) {
          filters.project = { documentId: { $eq: projects[0].documentId } };
        } else {
          return {
            content: [{ type: 'text', text: JSON.stringify({ todos: [], count: 0 }, null, 2) }],
            structuredContent: { todos: [], count: 0 },
          };
        }
      }
      
      if (args.dueBefore) {
        filters.dueDate = { $lt: args.dueBefore };
      }
      
      if (args.overdue) {
        const today = getTodayPST();
        filters.dueDate = { $lt: today };
        filters.status = { $notIn: ['done', 'dropped'] };
      }

      let todos = await strapi.documents(uid).findMany({
        filters,
        populate: ['project'],
        limit: limit * 2,
      });

      if (args.waitingOlderThanDays !== undefined) {
        const cutoffDate = getDaysAgoPST(args.waitingOlderThanDays);
        
        todos = todos.filter(todo => {
          if (todo.status !== 'waiting') return false;
          return todo.updatedAt && todo.updatedAt.slice(0, 10) < cutoffDate;
        });
      }

      const priorityOrder = { P0: 0, P1: 1, P2: 2, P3: 3 };
      todos.sort((a, b) => {
        const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
        if (priorityDiff !== 0) return priorityDiff;
        
        if (a.dueDate && b.dueDate) {
          return a.dueDate.localeCompare(b.dueDate);
        }
        if (a.dueDate) return -1;
        if (b.dueDate) return 1;
        return 0;
      });

      todos = todos.slice(0, limit);

      const formattedTodos = todos.map(todo => ({
        documentId: todo.documentId,
        title: todo.title,
        status: todo.status,
        priority: todo.priority,
        dueDate: todo.dueDate,
        doDate: todo.doDate,
        project: todo.project ? {
          documentId: todo.project.documentId,
          name: todo.project.name,
        } : undefined,
        waitingOn: todo.waitingOn,
        source: todo.source,
        capturedBy: todo.capturedBy,
      }));

      const output = stripNullish({
        todos: formattedTodos,
        count: formattedTodos.length,
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
