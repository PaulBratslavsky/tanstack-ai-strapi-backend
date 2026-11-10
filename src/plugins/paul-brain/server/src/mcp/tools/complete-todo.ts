import type { Core } from '@strapi/strapi';
import { z } from '@strapi/utils';
import { getActionId } from '../permissions';
import { getUid } from '../types';

export const register = (strapi: Core.Strapi) => {
  strapi.ai.mcp.registerTool({
    name: 'complete_todo',
    title: 'Complete Todo',
    description: 'Mark a todo as done with an optional closing note. Sets status to done and records completedAt timestamp.',
    
    resolveInputSchema: () => z.object({
      identifier: z.string().describe('documentId of the todo'),
      closingNote: z.string().optional().describe('Closing note or completion summary'),
    }),
    
    resolveOutputSchema: () => z.object({
      completed: z.boolean(),
      documentId: z.string(),
      title: z.string(),
      completedAt: z.string(),
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
      const completedAt = new Date().toISOString();
      
      const updates: any = {
        state: 'done',
        completedAt,
      };

      if (args.closingNote) {
        updates.closingNote = args.closingNote;
      }

      const log = Array.isArray(todo.log) ? [...todo.log] : [];
      log.push({
        date: completedAt,
        entry: 'Marked as done' + (args.closingNote ? `: ${args.closingNote}` : ''),
        by: context?.user?.email || 'system',
      });
      updates.log = log;

      const result = await strapi.documents(uid).update({
        documentId: todo.documentId,
        data: updates,
      });

      const output = {
        completed: true,
        documentId: result.documentId,
        title: result.title,
        completedAt: result.completedAt,
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
