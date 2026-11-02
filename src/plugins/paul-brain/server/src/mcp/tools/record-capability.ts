import type { Core } from '@strapi/strapi';
import { z } from '@strapi/utils';
import { getActionId } from '../permissions';
import { getUid } from '../types';

export const register = (strapi: Core.Strapi) => {
  strapi.ai.mcp.registerTool({
    name: 'record_capability',
    title: 'Record Brain Capability',
    description: 'Create or update a capability record (what a system can and CANNOT do). Upserts by system+capability. See get_brain_guide for usage.',
    
    resolveInputSchema: () => z.object({
      system: z.string().describe('System name (e.g., "strapi", "mcp", "cursor-agent")'),
      capability: z.string().describe('What capability is being tested'),
      canDo: z.boolean().describe('Whether the system CAN do this'),
      verifiedAt: z.string().optional().describe('When this was verified (ISO format)'),
      howVerified: z.string().optional().describe('How this was verified'),
      notes: z.string().optional().describe('Additional notes'),
    }),
    
    resolveOutputSchema: () => z.object({
      created: z.boolean(),
      documentId: z.string(),
      message: z.string(),
    }),
    
    auth: {
      policies: [{ action: getActionId('meta.write') }],
    },
    
    createHandler: (strapi) => async ({ args, context }) => {
      const uid = getUid('capability');
      
      const existing = await strapi.documents(uid).findMany({
        filters: {
          system: { $eq: args.system },
          capability: { $eq: args.capability },
        },
        limit: 1,
      });

      let result: any;
      let created = false;
      let message = '';

      const data: any = {
        system: args.system,
        capability: args.capability,
        canDo: args.canDo,
        verifiedAt: args.verifiedAt || new Date().toISOString(),
        howVerified: args.howVerified,
        notes: args.notes,
      };

      if (existing.length > 0) {
        result = await strapi.documents(uid).update({
          documentId: existing[0].documentId,
          data,
        });
        created = false;
        message = 'Updated existing capability';
      } else {
        result = await strapi.documents(uid).create({ data });
        created = true;
        message = 'Created new capability';
      }

      const output = {
        created,
        documentId: result.documentId,
        message,
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
