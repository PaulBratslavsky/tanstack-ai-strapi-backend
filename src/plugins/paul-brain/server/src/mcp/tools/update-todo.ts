import type { Core } from '@strapi/strapi';
import { z } from '@strapi/utils';
import { getActionId, PLUGIN_NAME } from '../permissions';
import { getUid } from '../types';

export const register = (strapi: Core.Strapi) => {
  strapi.ai.mcp.registerTool({
    name: 'update_todo',
    title: 'Update Todo',
    description: 'Update a todo\'s fields. Can append log entries, change status, and set completedAt when marking as done. See get_brain_guide for usage.',
    
    resolveInputSchema: () => z.object({
      identifier: z.string().describe('documentId of the todo'),
      title: z.string().optional().describe('New title'),
      status: z.enum(['inbox', 'next', 'doing', 'waiting', 'done', 'dropped']).optional().describe('New status (sets completedAt if done)'),
      priority: z.enum(['P0', 'P1', 'P2', 'P3']).optional().describe('New priority'),
      dueDate: z.string().optional().describe('New due date (ISO format)'),
      doDate: z.string().optional().describe('New do date (ISO format)'),
      goal: z.string().optional().describe('New goal'),
      acceptanceCriteria: z.string().optional().describe('New acceptance criteria'),
      context: z.string().optional().describe('New context'),
      appendContext: z.string().optional().describe('Append to context (preferred over replace)'),
      addLinks: z.array(z.object({
        type: z.enum(['email', 'github', 'calendar', 'doc', 'url', 'other']),
        label: z.string(),
        url: z.string(),
        note: z.string().optional(),
      })).optional().describe('Links to add'),
      waitingOn: z.string().optional().describe('What/who this is waiting on'),
      appendLog: z.string().optional().describe('Append a log entry'),
      closingNote: z.string().optional().describe('Closing note (for done/dropped)'),
    }),
    
    resolveOutputSchema: () => z.object({
      updated: z.boolean(),
      documentId: z.string(),
      status: z.string(),
    }),
    
    auth: {
      policies: [{ action: getActionId('todo.write') }],
    },
    
    createHandler: (strapi) => async ({ args, context }) => {
      const uid = getUid('todo');
      
      const todos = await strapi.documents(uid).findMany({
        filters: { documentId: { $eq: args.identifier } },
        limit: 1,
      });

      if (todos.length === 0) {
        throw new Error(`Todo not found: ${args.identifier}`);
      }

      const todo = todos[0];
      const updates: any = {};

      if (args.title) updates.title = args.title;
      if (args.priority) updates.priority = args.priority;
      if (args.dueDate !== undefined) updates.dueDate = args.dueDate;
      if (args.doDate !== undefined) updates.doDate = args.doDate;
      if (args.goal !== undefined) updates.goal = args.goal;
      if (args.acceptanceCriteria !== undefined) updates.acceptanceCriteria = args.acceptanceCriteria;
      if (args.waitingOn !== undefined) updates.waitingOn = args.waitingOn;
      if (args.closingNote !== undefined) updates.closingNote = args.closingNote;

      if (args.context) {
        updates.context = args.context;
      } else if (args.appendContext) {
        const existingContext = todo.context || '';
        updates.context = existingContext ? `${existingContext}\n\n---\n\n${args.appendContext}` : args.appendContext;
      }

      if (args.status) {
        updates.state = args.status // Map external status to internal state;
        if (args.status === 'done' && !todo.completedAt) {
          updates.completedAt = new Date().toISOString();
        }
      }

      if (args.addLinks) {
        const existingLinks = Array.isArray(todo.links) ? [...todo.links] : [];
        updates.links = [...existingLinks, ...args.addLinks];
      }

      if (args.appendLog) {
        const existingLog = Array.isArray(todo.log) ? [...todo.log] : [];
        existingLog.push({
          date: new Date().toISOString(),
          entry: args.appendLog,
          by: context?.user?.email || 'system',
        });
        updates.log = existingLog;
      }

      const result = await strapi.documents(uid).update({
        documentId: todo.documentId,
        data: updates,
      });

      const output = {
        updated: true,
        documentId: result.documentId,
        status: result.state, // Map state to status for external API
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
