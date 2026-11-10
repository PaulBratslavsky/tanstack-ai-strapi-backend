import type { Core } from '@strapi/strapi';
import { z } from '@strapi/utils';
import { getActionId, PLUGIN_NAME } from '../permissions';
import { getUid } from '../types';
import { stripNullish } from '../utils';

export const register = (strapi: Core.Strapi) => {
  strapi.ai.mcp.registerTool({
    name: 'agent_bus__cancel',
    title: 'Cancel Message',
    description: 'Cancel an open message. Sender or orchestrator can cancel.',

    resolveInputSchema: () =>
      z.object({
        messageId: z.string().describe('Message document ID'),
        reason: z.string().optional().describe('Optional cancellation reason'),
      }),

    resolveOutputSchema: () =>
      z.object({
        messageId: z.string(),
        status: z.string(),
      }),

    auth: {
      policies: [{ action: getActionId('message.inbox') }],
    },

    createHandler: (strapi) => async ({ args, context }) => {
      const authService = strapi.plugin(PLUGIN_NAME).service('auth');
      const busService = strapi.plugin(PLUGIN_NAME).service('bus');
      const messageUid = getUid('message');

      const caller = await authService.resolveCaller(strapi, context);

      const messages = await strapi.documents(messageUid).findMany({
        filters: { documentId: { $eq: args.messageId } },
        populate: { from: true, to: true },
      });

      if (!messages || messages.length === 0) {
        throw new Error('Message not found');
      }

      const message = messages[0];

      // Check authorization: sender or orchestrator
      const isSender = (message.from as any)?.documentId === caller.agentDocumentId;
      
      // TODO: Check for message.manage permission for orchestrators
      // For now, only sender can cancel
      if (!isSender) {
        throw new Error('Not authorized to cancel this message');
      }

      // Check if cancellable
      const cancellableStatuses = ['queued', 'notified', 'claimed', 'in_progress', 'waiting_info'];
      if (!cancellableStatuses.includes(message.status)) {
        throw new Error(`Cannot cancel message in status: ${message.status}`);
      }

      // Update status
      await strapi.documents(messageUid).update({
        documentId: args.messageId,
        data: { status: 'cancelled' },
      });

      // Audit
      await busService.audit({
        action: 'message.cancel',
        actorAgent: caller.agentDocumentId,
        actorLabel: caller.agentSlug,
        entityType: 'message',
        entityDocumentId: args.messageId,
        metadata: { reason: args.reason },
      });

      const output = stripNullish({
        messageId: args.messageId,
        status: 'cancelled',
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
