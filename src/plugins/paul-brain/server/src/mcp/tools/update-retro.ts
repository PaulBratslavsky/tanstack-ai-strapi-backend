import type { Core } from '@strapi/strapi';
import { z } from '@strapi/utils';
import { getActionId } from '../permissions';
import { getUid } from '../types';
import { stripNullish } from '../utils';

export const register = (strapi: Core.Strapi) => {
  strapi.ai.mcp.registerTool({
    name: 'update_retro',
    title: 'Update Retro',
    description: 'Update an existing retro record. Change status to fixed/declined/wontfix, update fix details, or modify other fields.',
    
    resolveInputSchema: () => z.object({
      documentId: z.string().describe('documentId of the retro to update'),
      title: z.string().optional().describe('Updated title'),
      task: z.string().optional().describe('Updated task description'),
      failure: z.string().optional().describe('Updated failure description'),
      fix: z.string().optional().describe('Updated fix description'),
      fixLocation: z.string().optional().describe('Updated fix location'),
      status: z.enum(['open', 'fixed', 'declined', 'wontfix']).optional().describe('Updated status'),
      date: z.string().optional().describe('Updated date (ISO format)'),
    }),
    
    resolveOutputSchema: () => z.object({
      documentId: z.string(),
      title: z.string(),
      status: z.string(),
      message: z.string(),
    }),
    
    auth: {
      policies: [{ action: getActionId('retro.update') }],
    },
    
    createHandler: (strapi) => async ({ args }) => {
      const uid = getUid('retro');
      
      const updates: any = {};
      if (args.title !== undefined) updates.title = args.title;
      if (args.task !== undefined) updates.task = args.task;
      if (args.failure !== undefined) updates.failure = args.failure;
      if (args.fix !== undefined) updates.fix = args.fix;
      if (args.fixLocation !== undefined) updates.fixLocation = args.fixLocation;
      if (args.status !== undefined) updates.state = args.status // Map external status to internal state;
      if (args.date !== undefined) updates.date = args.date;

      const result = await strapi.documents(uid).update({
        documentId: args.documentId,
        data: updates,
      });

      const output = stripNullish({
        documentId: result.documentId,
        title: result.title,
        status: result.state, // Map state to status for external API
        message: 'Retro updated successfully',
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
