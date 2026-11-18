import type { Core } from '@strapi/strapi';
import { z } from '@strapi/utils';
import { getActionId, PLUGIN_NAME } from '../permissions';

export const register = (strapi: Core.Strapi) => {
  strapi.ai.mcp.registerTool({
    name: 'agent_bus__triage_delivery',
    title: 'Triage Delivery',
    description: 'Mark an exhausted webhook delivery resolved or ignored (with an optional note), or retry it. Retry resets the attempt count and queues the delivery again.',

    resolveInputSchema: () =>
      z.object({
        deliveryId: z.string().describe('Delivery documentId'),
        action: z.enum(['resolved', 'ignored', 'retry']).describe('resolved, ignored, or retry'),
        note: z.string().max(500).optional().describe('Short operator note. Not a message body'),
      }),

    resolveOutputSchema: () =>
      z.object({
        documentId: z.string(),
        status: z.string(),
      }),

    auth: {
      policies: [{ action: getActionId('delivery.manage') }],
    },

    createHandler: (strapi) => async ({ args }) => {
      const bus = strapi.plugin(PLUGIN_NAME).service('bus');
      const result = await bus.triageDelivery({
        deliveryId: args.deliveryId,
        action: args.action,
        note: args.note,
      });

      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
        structuredContent: result,
      };
    },
  });
};
