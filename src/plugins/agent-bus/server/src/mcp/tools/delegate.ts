import type { Core } from '@strapi/strapi';
import { z } from '@strapi/utils';
import { getActionId, PLUGIN_NAME } from '../permissions';
import { stripNullish } from '../utils';

export const register = (strapi: Core.Strapi) => {
  strapi.ai.mcp.registerTool({
    name: 'agent_bus__delegate',
    title: 'Delegate Task',
    description: 'Orchestrator delegates a task to a specialist with acceptance criteria.',

    resolveInputSchema: () =>
      z.object({
        messageId: z.string().optional().describe('Message ID if delegating an existing message'),
        to: z.string().describe('Target agent slug or documentId'),
        subject: z.string().optional().describe('Task subject'),
        body: z.string().max(20000).describe('Task description'),
        acceptanceCriteria: z.string().describe('How to verify success'),
        priority: z.enum(['P0', 'P1', 'P2', 'P3']).optional().default('P2').describe('Priority'),
        blastRadius: z.enum(['green', 'yellow', 'red']).optional().default('yellow').describe('Blast radius'),
        threadId: z.string().optional().describe('Thread ID if delegating within an existing thread'),
      }),

    resolveOutputSchema: () =>
      z.object({
        messageId: z.string(),
        threadId: z.string(),
        status: z.string(),
      }),

    auth: {
      policies: [{ action: getActionId('message.manage') }],
    },

    createHandler: (strapi) => async ({ args, extra }) => {
      const authService = strapi.plugin(PLUGIN_NAME).service('auth');
      const busService = strapi.plugin(PLUGIN_NAME).service('bus');

      const caller = await authService.resolveCaller(strapi, extra);

      // Delegation is sending a task message
      const result = await busService.sendMessage(caller, {
        type: 'task',
        body: args.body,
        to: args.to,
        subject: args.subject,
        threadId: args.threadId,
        parentId: args.messageId,
        acceptanceCriteria: args.acceptanceCriteria,
        priority: args.priority,
        blastRadius: args.blastRadius,
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
