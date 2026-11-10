import type { Core } from '@strapi/strapi';
import { z } from '@strapi/utils';
import { getActionId, PLUGIN_NAME } from '../permissions';
import { getUid } from '../types';
import { stripNullish } from '../utils';

export const register = (strapi: Core.Strapi) => {
  strapi.ai.mcp.registerTool({
    name: 'agent_bus__escalate',
    title: 'Escalate to Chief/Paul',
    description: 'Escalate a message or situation to Chief of Staff or Paul for a decision.',

    resolveInputSchema: () =>
      z.object({
        messageId: z.string().optional().describe('Message ID if escalating a specific message'),
        threadId: z.string().optional().describe('Thread ID if escalating the whole thread'),
        body: z.string().max(20000).describe('Escalation explanation'),
        riskClass: z.enum(['none', 'data_write', 'external_message', 'payment', 'delete', 'credentials']).optional().describe('Risk class if applicable'),
      }),

    resolveOutputSchema: () =>
      z.object({
        messageId: z.string(),
        threadId: z.string(),
        status: z.string(),
        approvalId: z.string().optional(),
      }),

    auth: {
      policies: [{ action: getActionId('message.inbox') }],
    },

    createHandler: (strapi) => async ({ args, extra }) => {
      const authService = strapi.plugin(PLUGIN_NAME).service('auth');
      const busService = strapi.plugin(PLUGIN_NAME).service('bus');
      const messageUid = getUid('message');

      const caller = await authService.resolveCaller(strapi, extra);

      let threadId: string;

      if (args.messageId) {
        // Get the original message to resolve thread
        const originalMessages = await strapi.documents(messageUid).findMany({
          filters: { documentId: { $eq: args.messageId } },
          populate: {
            thread: { fields: ['documentId'] },
          },
          limit: 1,
        });

        if (!originalMessages || originalMessages.length === 0) {
          throw new Error('Original message not found');
        }

        const originalMessage = originalMessages[0];
        threadId = args.threadId || (originalMessage.thread as any)?.documentId;
      } else if (args.threadId) {
        // threadId-only case
        threadId = args.threadId;
      } else {
        throw new Error('Either messageId or threadId must be provided');
      }
      
      if (!threadId) {
        throw new Error('Thread not found');
      }

      // Escalation creates a new escalation-type message to chief
      const result = await busService.sendMessage(caller, {
        type: 'escalation',
        body: args.body,
        to: 'chief',
        threadId,
        parentId: args.messageId,
        riskClass: args.riskClass || 'none',
        priority: 'P1', // Escalations are high priority
      });

      const output = stripNullish(result);

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
