import type { Core } from '@strapi/strapi';
import { z } from '@strapi/utils';
import { getActionId, PLUGIN_NAME } from '../permissions';
import { getUid } from '../types';
import { stripNullish } from '../utils';

export const register = (strapi: Core.Strapi) => {
  strapi.ai.mcp.registerTool({
    name: 'agent_bus__get_thread',
    title: 'Get Thread',
    description: 'Get a thread and its messages if the caller is a participant.',

    resolveInputSchema: () =>
      z.object({
        threadId: z.string().describe('Thread document ID'),
      }),

    resolveOutputSchema: () =>
      z.object({
        thread: z.any(),
        messages: z.array(z.any()),
      }),

    auth: {
      policies: [{ action: getActionId('message.inbox') }],
    },

    createHandler: (strapi) => async ({ args, context }) => {
      const authService = strapi.plugin(PLUGIN_NAME).service('auth');
      const threadUid = getUid('thread');
      const messageUid = getUid('message');

      const caller = await authService.resolveCaller(strapi, context);

      const threads = await strapi.documents(threadUid).findMany({
        filters: { documentId: { $eq: args.threadId } },
        populate: {
          participants: { fields: ['documentId', 'slug', 'name'] },
          originAgent: { fields: ['slug', 'name'] },
        },
      });

      if (!threads || threads.length === 0) {
        throw new Error('Thread not found');
      }

      const thread = threads[0];

      // Check authorization: caller must be a participant
      const participantIds = (thread.participants as any[])?.map(p => p.documentId) || [];
      if (!participantIds.includes(caller.agentDocumentId)) {
        throw new Error('Thread not found');
      }

      // Get messages
      const messages = await strapi.documents(messageUid).findMany({
        filters: { thread: { documentId: { $eq: args.threadId } } },
        populate: {
          from: { fields: ['slug', 'name'] },
          to: { fields: ['slug', 'name'] },
        },
        sort: ['createdAt:asc'],
      });

      const output = {
        thread: stripNullish({
          threadId: thread.documentId,
          subject: thread.subject,
          status: thread.status,
          turnCount: thread.turnCount,
          maxTurns: thread.maxTurns,
          correlationId: thread.correlationId,
          externalRefs: thread.externalRefs,
          participants: (thread.participants as any[])?.map(p => ({
            slug: p.slug,
            name: p.name,
          })),
          createdAt: thread.createdAt,
        }),
        messages: messages.map((msg: any) => stripNullish({
          messageId: msg.documentId,
          type: msg.type,
          from: msg.from?.slug,
          to: msg.to?.slug,
          body: msg.body,
          status: msg.status,
          priority: msg.priority,
          blastRadius: msg.blastRadius,
          untrusted: true,
          flagged: msg.flagged,
          createdAt: msg.createdAt,
        })),
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
