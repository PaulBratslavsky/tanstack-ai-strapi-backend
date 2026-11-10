import type { Core } from '@strapi/strapi';
import { z } from '@strapi/utils';
import { getActionId, PLUGIN_NAME } from '../permissions';
import { getUid } from '../types';
import { stripNullish } from '../utils';

export const register = (strapi: Core.Strapi) => {
  strapi.ai.mcp.registerTool({
    name: 'agent_bus__report_status',
    title: 'Report Status',
    description: 'Update status on a claimed message. Use to report progress, decline, or mark as waiting for info.',

    resolveInputSchema: () =>
      z.object({
        messageId: z.string().describe('Message document ID'),
        status: z.enum(['in_progress', 'waiting_info', 'declined', 'cancelled']).describe('New status'),
        note: z.string().optional().describe('Optional status note'),
      }),

    resolveOutputSchema: () =>
      z.object({
        messageId: z.string(),
        status: z.string(),
      }),

    auth: {
      policies: [{ action: getActionId('message.inbox') }],
    },

    createHandler: (strapi) => async ({ args, extra }) => {
      const authService = strapi.plugin(PLUGIN_NAME).service('auth');
      const busService = strapi.plugin(PLUGIN_NAME).service('bus');
      const messageUid = getUid('message');

      const caller = await authService.resolveCaller(strapi, extra);

      const messages = await strapi.documents(messageUid).findMany({
        filters: { documentId: { $eq: args.messageId } },
        populate: { to: true, claimedBy: true },
      });

      if (!messages || messages.length === 0) {
        throw new Error('Message not found');
      }

      const message = messages[0];

      // Check authorization
      const isRecipient = (message.to as any)?.documentId === caller.agentDocumentId;
      const isClaimed = (message.claimedBy as any)?.documentId === caller.agentDocumentId;

      if (!isRecipient) {
        throw new Error('Not authorized to update this message');
      }

      // Allow cancelled only if sender or orchestrator
      if (args.status === 'cancelled' && !isClaimed) {
        throw new Error('Only the claiming agent can cancel');
      }

      // Update status
      await strapi.documents(messageUid).update({
        documentId: args.messageId,
        data: {
          status: args.status,
        },
      });

      // Audit
      await busService.audit({
        action: 'message.status',
        actorAgent: caller.agentDocumentId,
        actorLabel: caller.agentSlug,
        entityType: 'message',
        entityDocumentId: args.messageId,
        metadata: { status: args.status, note: args.note },
      });

      const output = stripNullish({
        messageId: args.messageId,
        status: args.status,
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
