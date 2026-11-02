import type { Core } from '@strapi/strapi';
import { z } from '@strapi/utils';
import { getActionId } from '../permissions';
import { getUid } from '../types';
import { stripNullish } from '../utils';

export const register = (strapi: Core.Strapi) => {
  strapi.ai.mcp.registerTool({
    name: 'get_todo',
    title: 'Get Todo',
    description: 'Fetch one todo by documentId with populated relatedNotes and project. See get_brain_guide for usage.',
    
    resolveInputSchema: () => z.object({
      identifier: z.string().describe('documentId of the todo'),
    }),
    
    resolveOutputSchema: () => z.object({
      documentId: z.string(),
      title: z.string(),
      status: z.string(),
      priority: z.string(),
      dueDate: z.string().nullish(),
      doDate: z.string().nullish(),
      goal: z.string().nullish(),
      acceptanceCriteria: z.string().nullish(),
      context: z.string().nullish(),
      links: z.array(z.any()).nullish(),
      relatedNotes: z.array(z.object({
        documentId: z.string(),
        title: z.string(),
        slug: z.string().nullish(),
      })).nullish(),
      project: z.object({
        documentId: z.string(),
        name: z.string(),
        slug: z.string().nullish(),
      }).nullish(),
      waitingOn: z.string().nullish(),
      log: z.array(z.any()).nullish(),
      source: z.string().nullish(),
      capturedBy: z.string().nullish(),
      completedAt: z.string().nullish(),
      closingNote: z.string().nullish(),
      createdAt: z.string(),
      updatedAt: z.string(),
    }),
    
    auth: {
      policies: [{ action: getActionId('read') }],
    },
    
    createHandler: (strapi) => async ({ args, context }) => {
      const uid = getUid('todo');
      
      const todos = await strapi.documents(uid).findMany({
        filters: { documentId: { $eq: args.identifier } },
        populate: ['relatedNotes', 'project'],
        limit: 1,
      });

      if (todos.length === 0) {
        throw new Error(`Todo not found: ${args.identifier}`);
      }

      const todo = todos[0];

      const output = stripNullish({
        documentId: todo.documentId,
        title: todo.title,
        status: todo.status,
        priority: todo.priority,
        dueDate: todo.dueDate,
        doDate: todo.doDate,
        goal: todo.goal,
        acceptanceCriteria: todo.acceptanceCriteria,
        context: todo.context,
        links: todo.links,
        relatedNotes: todo.relatedNotes?.map((note: any) => ({
          documentId: note.documentId,
          title: note.title,
          slug: note.slug,
        })),
        project: todo.project ? {
          documentId: todo.project.documentId,
          name: todo.project.name,
          slug: todo.project.slug,
        } : undefined,
        waitingOn: todo.waitingOn,
        log: todo.log,
        source: todo.source,
        capturedBy: todo.capturedBy,
        completedAt: todo.completedAt,
        closingNote: todo.closingNote,
        createdAt: todo.createdAt,
        updatedAt: todo.updatedAt,
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
