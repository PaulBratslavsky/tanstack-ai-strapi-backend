import type { Core } from '@strapi/strapi';
import { z } from '@strapi/utils';
import { getActionId, PLUGIN_NAME } from '../permissions';

export const register = (strapi: Core.Strapi) => {
  strapi.ai.mcp.registerTool({
    name: 'agent_bus__check_inbox',
    title: 'Check Inbox',
    description: 'List open inbox items for the calling agent. Returns summaries by default; set includeBody=true to see message bodies (still marked untrusted).',

    resolveInputSchema: () =>
      z.object({
        statuses: z.array(z.string()).optional().describe('Filter by status (default: all open states)'),
        priority: z.enum(['P0', 'P1', 'P2', 'P3']).optional().describe('Filter by priority'),
        limit: z.number().min(1).max(50).optional().default(20).describe('Max items to return (default 20, max 50)'),
        includeBody: z.boolean().optional().default(false).describe('Include message bodies (still marked untrusted)'),
      }),

    resolveOutputSchema: () =>
      z.object({
        messages: z.array(z.any()),
        unreadCount: z.number(),
      }),

    auth: {
      policies: [{ action: getActionId('message.inbox') }],
    },

    createHandler: (strapi) => async ({ args, context }) => {
      const authService = strapi.plugin(PLUGIN_NAME).service('auth');
      const busService = strapi.plugin(PLUGIN_NAME).service('bus');

      const caller = await authService.resolveCaller(strapi, context);
      const result = await busService.getInbox(caller, args);

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
