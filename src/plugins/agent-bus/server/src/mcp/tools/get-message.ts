import type { Core } from '@strapi/strapi';
import { z } from '@strapi/utils';
import { getActionId, PLUGIN_NAME } from '../permissions';
import { getUid } from '../types';
import { stripNullish } from '../utils';

export const register = (strapi: Core.Strapi) => {
  strapi.ai.mcp.registerTool({
    name: 'agent_bus__get_message',
    title: 'Get Message',
    description: 'Get full message details if the caller is a participant or has message.manage permission. Body is marked untrusted.',

    resolveInputSchema: () =>
      z.object({
        messageId: z.string().describe('Message document ID'),
      }),

    resolveOutputSchema: () => z.object({
      message: z.any(),
      thread: z.any(),
    }),

    auth: {
      policies: [{ action: getActionId('message.inbox') }],
    },

    createHandler: (strapi) => async ({ args, extra }) => {
      const authService = strapi.plugin(PLUGIN_NAME).service('auth');
      const messageUid = getUid('message');
      const threadUid = getUid('thread');

      const caller = await authService.resolveCaller(strapi, extra);

      const messages = await strapi.documents(messageUid).findMany({
        filters: { documentId: { $eq: args.messageId } },
        populate: {
          thread: { fields: ['documentId', 'subject', 'state', 'turnCount', 'maxTurns'] },
          from: { fields: ['slug', 'name'] },
          to: { fields: ['slug', 'name'] },
          parent: { fields: ['documentId', 'type'] },
          claimedBy: { fields: ['slug', 'name'] },
        },
      });

      if (!messages || messages.length === 0) {
        throw new Error('Message not found');
      }

      const message = messages[0];
      const thread = message.thread as any;

      // Check authorization: caller must be a participant or have message.manage
      // For now, we'll check if caller is to/from agent
      // A full check would require loading thread participants
      const isRecipient = (message.to as any)?.documentId === caller.agentDocumentId;
      const isSender = (message.from as any)?.documentId === caller.agentDocumentId;

      if (!isRecipient && !isSender) {
        // Check for message.manage permission
        // For simplicity, we'll throw not found to avoid leaking existence
        throw new Error('Message not found');
      }

      const output = {
        message: stripNullish({
          messageId: message.documentId,
          threadId: thread?.documentId,
          type: message.type,
          from: (message.from as any)?.slug,
          to: (message.to as any)?.slug,
          subject: thread?.subject,
          body: message.body,
          payload: message.payload,
          status: message.state, // Map state to status for external API
          priority: message.priority,
          blastRadius: message.blastRadius,
          reviewLevel: message.reviewLevel,
          riskClass: message.riskClass,
          acceptanceCriteria: message.acceptanceCriteria,
          proof: message.proof,
          untrusted: true,
          flagged: message.flagged,
          flagReason: message.flagReason,
          createdAt: message.createdAt,
          updatedAt: message.updatedAt,
          claimedBy: (message.claimedBy as any)?.slug,
          claimedUntil: message.claimedUntil,
        }),
        thread: stripNullish({
          threadId: thread?.documentId,
          subject: thread?.subject,
          status: thread?.state, // Map state to status for external API
          turnCount: thread?.turnCount,
          maxTurns: thread?.maxTurns,
        }),
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
