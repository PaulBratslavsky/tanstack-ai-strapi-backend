import type { Core } from '@strapi/strapi';
import { z } from '@strapi/utils';
import { getActionId, PLUGIN_NAME } from '../permissions';
import { getUid } from '../types';

export const register = (strapi: Core.Strapi) => {
  strapi.ai.mcp.registerTool({
    name: 'add_todo',
    title: 'Add Todo',
    description: 'Create a new todo item. Bot-captured todos default to inbox status for Paul to confirm. Priority: P0 (urgent today), P1 (this week), P2 (soon, default), P3 (someday). Links are JSON objects with type (email|github|calendar|doc|url|other), label, url, note.',
    
    resolveInputSchema: () => z.object({
      title: z.string().describe('Todo title'),
      status: z.enum(['inbox', 'next', 'doing', 'waiting', 'done', 'dropped']).optional().describe('Status (default: inbox)'),
      priority: z.enum(['P0', 'P1', 'P2', 'P3']).optional().describe('Priority: P0 urgent today, P1 this week, P2 soon (default), P3 someday'),
      dueDate: z.string().optional().describe('Due date (ISO format)'),
      doDate: z.string().optional().describe('Do date (ISO format)'),
      goal: z.string().optional().describe('Goal or objective'),
      acceptanceCriteria: z.string().optional().describe('Acceptance criteria'),
      context: z.string().optional().describe('Context (markdown)'),
      links: z.array(z.object({
        type: z.enum(['email', 'github', 'calendar', 'doc', 'url', 'other']),
        label: z.string(),
        url: z.string(),
        note: z.string().optional(),
      })).optional().describe('Related links'),
      relatedNoteIds: z.array(z.string()).optional().describe('documentIds of related notes'),
      projectId: z.string().optional().describe('documentId or slug of the project'),
      waitingOn: z.string().optional().describe('What/who this is waiting on'),
      source: z.enum(['paul', 'email', 'meeting', 'bot', 'other']).optional().describe('Source (default: other)'),
      capturedBy: z.string().optional().describe('Bot or system that captured this'),
      logEntry: z.string().optional().describe('Initial log entry'),
    }),
    
    resolveOutputSchema: () => z.object({
      documentId: z.string(),
      title: z.string(),
      status: z.string(),
      priority: z.string(),
    }),
    
    auth: {
      policies: [{ action: getActionId('todo.write') }],
    },
    
    createHandler: (strapi) => async ({ args, context }) => {
      const uid = getUid('todo');
      
      const data: any = {
        title: args.title,
        status: args.status || 'inbox',
        priority: args.priority || 'P2',
        dueDate: args.dueDate,
        doDate: args.doDate,
        goal: args.goal,
        acceptanceCriteria: args.acceptanceCriteria,
        context: args.context,
        links: args.links || [],
        waitingOn: args.waitingOn,
        source: args.source || 'other',
        capturedBy: args.capturedBy,
        log: [],
      };

      if (args.logEntry) {
        data.log = [{
          date: new Date().toISOString(),
          entry: args.logEntry,
          by: args.capturedBy || 'system',
        }];
      }

      if (args.relatedNoteIds && args.relatedNoteIds.length > 0) {
        data.relatedNotes = {
          connect: args.relatedNoteIds.map(id => ({ documentId: id })),
        };
      }

      if (args.projectId) {
        const projectUid = getUid('project');
        const projects = await strapi.documents(projectUid).findMany({
          filters: {
            $or: [
              { documentId: { $eq: args.projectId } },
              { slug: { $eq: args.projectId } },
            ],
          },
          limit: 1,
        });

        if (projects.length > 0) {
          data.project = { connect: [{ documentId: projects[0].documentId }] };
        }
      }

      const result = await strapi.documents(uid).create({ data });

      const output = {
        documentId: result.documentId,
        title: result.title,
        status: result.status,
        priority: result.priority,
      };

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
