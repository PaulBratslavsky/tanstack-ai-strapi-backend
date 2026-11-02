import type { Core } from '@strapi/strapi';
import { z } from '@strapi/utils';
import { getActionId } from '../permissions';
import { getUid } from '../types';

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
      dueDate: z.string().optional(),
      doDate: z.string().optional(),
      goal: z.string().optional(),
      acceptanceCriteria: z.string().optional(),
      context: z.string().optional(),
      links: z.array(z.any()).optional(),
      relatedNotes: z.array(z.object({
        documentId: z.string(),
        title: z.string(),
        slug: z.string().optional(),
      })).optional(),
      project: z.object({
        documentId: z.string(),
        name: z.string(),
        slug: z.string().optional(),
      }).optional(),
      waitingOn: z.string().optional(),
      log: z.array(z.any()).optional(),
      source: z.string().optional(),
      capturedBy: z.string().optional(),
      completedAt: z.string().optional(),
      closingNote: z.string().optional(),
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
      const sanitized = await strapi.contentAPI.sanitize.output(todo, uid, context.userAbility);

      const output = {
        documentId: sanitized.documentId,
        title: sanitized.title,
        status: sanitized.status,
        priority: sanitized.priority,
        dueDate: sanitized.dueDate,
        doDate: sanitized.doDate,
        goal: sanitized.goal,
        acceptanceCriteria: sanitized.acceptanceCriteria,
        context: sanitized.context,
        links: sanitized.links,
        relatedNotes: sanitized.relatedNotes?.map((note: any) => ({
          documentId: note.documentId,
          title: note.title,
          slug: note.slug,
        })),
        project: sanitized.project ? {
          documentId: sanitized.project.documentId,
          name: sanitized.project.name,
          slug: sanitized.project.slug,
        } : undefined,
        waitingOn: sanitized.waitingOn,
        log: sanitized.log,
        source: sanitized.source,
        capturedBy: sanitized.capturedBy,
        completedAt: sanitized.completedAt,
        closingNote: sanitized.closingNote,
        createdAt: sanitized.createdAt,
        updatedAt: sanitized.updatedAt,
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
