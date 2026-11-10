import type { Core } from '@strapi/strapi';
import { z } from '@strapi/utils';
import { getActionId, PLUGIN_NAME } from '../permissions';
import { getUid } from '../types';
import { stripNullish } from '../utils';

export const register = (strapi: Core.Strapi) => {
  strapi.ai.mcp.registerTool({
    name: 'agent_bus__submit_proof',
    title: 'Submit Proof',
    description: 'Complete a task by submitting proof. Status may become completed, waiting_approval, or scheduled depending on risk classification.',

    resolveInputSchema: () =>
      z.object({
        messageId: z.string().describe('Message document ID'),
        proof: z.string().describe('Proof that the task is complete (PR URL, screenshot description, test results)'),
        resultBody: z.string().optional().describe('Optional result summary'),
      }),

    resolveOutputSchema: () =>
      z.object({
        messageId: z.string(),
        status: z.string(),
        approvalId: z.string().optional(),
      }),

    auth: {
      policies: [{ action: getActionId('message.inbox') }],
    },

    createHandler: (strapi) => async ({ args, extra }) => {
      const authService = strapi.plugin(PLUGIN_NAME).service('auth');
      const busService = strapi.plugin(PLUGIN_NAME).service('bus');
      const messageUid = getUid('message');
      const approvalUid = getUid('approval');

      const caller = await authService.resolveCaller(strapi, extra);

      const messages = await strapi.documents(messageUid).findMany({
        filters: { documentId: { $eq: args.messageId } },
        populate: { to: true, thread: true },
      });

      if (!messages || messages.length === 0) {
        throw new Error('Message not found');
      }

      const message = messages[0];

      // Check authorization
      if ((message.to as any)?.documentId !== caller.agentDocumentId) {
        throw new Error('Not authorized to submit proof for this message');
      }

      // Update message with proof
      await strapi.documents(messageUid).update({
        documentId: args.messageId,
        data: {
          proof: args.proof,
          ...(args.resultBody ? { body: args.resultBody } : {}),
        },
      });

      // Determine completion path based on risk
      let newStatus = 'completed';
      let approvalId: string | undefined;

      if (message.blastRadius === 'red' || message.riskClass === 'payment' || 
          message.riskClass === 'delete' || message.riskClass === 'external_message' || 
          message.riskClass === 'credentials') {
        // Red: requires human approval
        newStatus = 'waiting_approval';
        
        const approval = await strapi.documents(approvalUid).create({
          data: {
            message: { connect: [{ documentId: args.messageId }] },
            thread: { connect: [{ documentId: (message.thread as any).documentId }] },
            status: 'pending',
            reviewLevel: 'human',
          },
        });
        
        approvalId = approval.documentId;
      } else if (message.blastRadius === 'yellow') {
        // Yellow: veto window
        newStatus = 'scheduled';
        
        const config = strapi.config.get('plugin.agent-bus') || {};
        const vetoMinutes = config.vetoWindowMinutes || 60;
        const vetoUntil = new Date(Date.now() + vetoMinutes * 60 * 1000);
        
        const approval = await strapi.documents(approvalUid).create({
          data: {
            message: { connect: [{ documentId: args.messageId }] },
            thread: { connect: [{ documentId: (message.thread as any).documentId }] },
            status: 'pending',
            reviewLevel: 'auto',
            vetoUntil: vetoUntil.toISOString(),
          },
        });
        
        approvalId = approval.documentId;
      }
      // Green: auto-complete immediately

      // Update message status
      await strapi.documents(messageUid).update({
        documentId: args.messageId,
        data: { status: newStatus },
      });

      // Audit
      await busService.audit({
        action: 'message.submit_proof',
        actorAgent: caller.agentDocumentId,
        actorLabel: caller.agentSlug,
        entityType: 'message',
        entityDocumentId: args.messageId,
        metadata: { newStatus, approvalId },
      });

      const output = stripNullish({
        messageId: args.messageId,
        status: newStatus,
        approvalId,
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
