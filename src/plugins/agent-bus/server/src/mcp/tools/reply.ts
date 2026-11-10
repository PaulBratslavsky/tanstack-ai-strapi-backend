import type { Core } from '@strapi/strapi';
import { z } from '@strapi/utils';
import { getActionId, PLUGIN_NAME } from '../permissions';
import { stripNullish } from '../utils';

export const register = (strapi: Core.Strapi) => {
  strapi.ai.mcp.registerTool({
    name: 'agent_bus__reply',
    title: 'Reply to Message',
    description: 'Reply to a message on a thread the caller is participating in.',

    resolveInputSchema: () =>
      z.object({
        messageId: z.string().optional().describe('Message ID to reply to (for threading)'),
        threadId: z.string().optional().describe('Thread ID (if not replying to specific message)'),
        body: z.string().max(20000).describe('Reply body (max 20,000 chars)'),
        type: z.enum(['reply', 'status', 'proof', 'result', 'question', 'escalation']).optional().default('reply').describe('Message type'),
        payload: z.record(z.any()).optional().describe('Optional structured data'),
      }),

    resolveOutputSchema: () =>
      z.object({
        messageId: z.string(),
        threadId: z.string(),
        status: z.string(),
      }),

    auth: {
      policies: [{ action: getActionId('message.inbox') }],
    },

    createHandler: (strapi) => async ({ args, context }) => {
      const authService = strapi.plugin(PLUGIN_NAME).service('auth');
      const busService = strapi.plugin(PLUGIN_NAME).service('bus');

      const caller = await authService.resolveCaller(strapi, context);

      // Reply is just sending a message with threadId and optional parentId
      const result = await busService.sendMessage(caller, {
        type: args.type || 'reply',
        body: args.body,
        threadId: args.threadId || args.messageId, // Use messageId as threadId if only that is provided
        parentId: args.messageId,
        payload: args.payload,
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
