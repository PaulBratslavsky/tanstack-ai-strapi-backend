import type { Core } from '@strapi/strapi';
import { z } from '@strapi/utils';
import { getActionId, PLUGIN_NAME } from '../permissions';
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

    createHandler: (strapi) => async ({ args, context }) => {
      const authService = strapi.plugin(PLUGIN_NAME).service('auth');
      const busService = strapi.plugin(PLUGIN_NAME).service('bus');

      const caller = await authService.resolveCaller(strapi, context);

      // Escalation creates a new escalation-type message to chief
      const result = await busService.sendMessage(caller, {
        type: 'escalation',
        body: args.body,
        to: 'chief',
        threadId: args.threadId || args.messageId,
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
