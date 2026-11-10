import type { Core } from '@strapi/strapi';
import { z } from '@strapi/utils';
import { getActionId, PLUGIN_NAME } from '../permissions';

export const register = (strapi: Core.Strapi) => {
  strapi.ai.mcp.registerTool({
    name: 'agent_bus__claim_message',
    title: 'Claim Message',
    description: 'Claim a message and acquire a lease. Extends the lease if already claimed by the same agent.',

    resolveInputSchema: () =>
      z.object({
        messageId: z.string().describe('Message document ID'),
      }),

    resolveOutputSchema: () =>
      z.object({
        messageId: z.string(),
        status: z.string(),
        claimedUntil: z.string(),
      }),

    auth: {
      policies: [{ action: getActionId('message.inbox') }],
    },

    createHandler: (strapi) => async ({ args, context }) => {
      const authService = strapi.plugin(PLUGIN_NAME).service('auth');
      const busService = strapi.plugin(PLUGIN_NAME).service('bus');

      const caller = await authService.resolveCaller(strapi, context);
      const config = strapi.config.get('plugin.agent-bus') || {};
      const leaseMinutes = config.leaseMinutes || 15;

      const result = await busService.claimMessage(caller, args.messageId, leaseMinutes);

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(result, null, 2),
          },
        ],
        structuredContent: result,
      };
    },
  });
};
