import type { Core } from '@strapi/strapi';
import { z } from '@strapi/utils';
import { getActionId } from '../permissions';
import { getUid } from '../types';
import { stripNullish } from '../utils';

export const register = (strapi: Core.Strapi) => {
  strapi.ai.mcp.registerTool({
    name: 'update_gap',
    title: 'Update Gap',
    description: 'Update an existing gap record. Change status to built/wontfix, update what was needed, or modify other fields.',
    
    resolveInputSchema: () => z.object({
      documentId: z.string().describe('documentId of the gap to update'),
      title: z.string().optional().describe('Updated title'),
      request: z.string().optional().describe('Updated request description'),
      whatWasNeeded: z.string().optional().describe('Updated description of what was needed'),
      status: z.enum(['open', 'built', 'wontfix']).optional().describe('Updated status'),
      date: z.string().optional().describe('Updated date (ISO format)'),
    }),
    
    resolveOutputSchema: () => z.object({
      documentId: z.string(),
      title: z.string(),
      status: z.string(),
      count: z.number(),
      message: z.string(),
    }),
    
    auth: {
      policies: [{ action: getActionId('gap.update') }],
    },
    
    createHandler: (strapi) => async ({ args }) => {
      const uid = getUid('gap');
      
      const updates: any = {};
      if (args.title !== undefined) updates.title = args.title;
      if (args.request !== undefined) updates.request = args.request;
      if (args.whatWasNeeded !== undefined) updates.whatWasNeeded = args.whatWasNeeded;
      if (args.status !== undefined) updates.status = args.status;
      if (args.date !== undefined) updates.date = args.date;

      const result = await strapi.documents(uid).update({
        documentId: args.documentId,
        data: updates,
      });

      const output = stripNullish({
        documentId: result.documentId,
        title: result.title,
        status: result.status,
        count: result.count,
        message: 'Gap updated successfully',
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
