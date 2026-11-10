import type { Core } from '@strapi/strapi';
import { z } from '@strapi/utils';
import { getActionId, PLUGIN_NAME } from '../permissions';
import { getUid } from '../types';
import { stripNullish } from '../utils';

export const register = (strapi: Core.Strapi) => {
  strapi.ai.mcp.registerTool({
    name: 'agent_bus__decide',
    title: 'Decide on Approval',
    description: 'Approve, reject, or veto a pending approval.',

    resolveInputSchema: () =>
      z.object({
        approvalId: z.string().describe('Approval document ID'),
        decision: z.enum(['approved', 'rejected', 'vetoed']).describe('Decision'),
        reason: z.string().optional().describe('Optional reason for decision'),
      }),

    resolveOutputSchema: () =>
      z.object({
        approvalId: z.string(),
        status: z.string(),
        messageStatus: z.string(),
      }),

    auth: {
      policies: [{ action: getActionId('approval.decide') }],
    },

    createHandler: (strapi) => async ({ args, context }) => {
      const authService = strapi.plugin(PLUGIN_NAME).service('auth');
      const busService = strapi.plugin(PLUGIN_NAME).service('bus');
      const approvalUid = getUid('approval');
      const messageUid = getUid('message');

      const caller = await authService.resolveCaller(strapi, context);

      const approvals = await strapi.documents(approvalUid).findMany({
        filters: { documentId: { $eq: args.approvalId } },
        populate: { message: { fields: ['documentId', 'status'] } },
      });

      if (!approvals || approvals.length === 0) {
        throw new Error('Approval not found');
      }

      const approval = approvals[0];

      if (approval.status !== 'pending') {
        throw new Error(`Approval already decided: ${approval.status}`);
      }

      // Update approval
      await strapi.documents(approvalUid).update({
        documentId: args.approvalId,
        data: {
          status: args.decision,
          decidedAt: new Date().toISOString(),
          decidedByAgent: { connect: [{ documentId: caller.agentDocumentId }] },
          decidedByLabel: caller.agentSlug,
          reason: args.reason,
        },
      });

      // Update message status
      let messageStatus = 'completed';
      if (args.decision === 'rejected' || args.decision === 'vetoed') {
        messageStatus = args.decision === 'vetoed' ? 'vetoed' : 'declined';
      }

      await strapi.documents(messageUid).update({
        documentId: (approval.message as any).documentId,
        data: { status: messageStatus },
      });

      // Audit
      await busService.audit({
        action: 'approval.decide',
        actorAgent: caller.agentDocumentId,
        actorLabel: caller.agentSlug,
        entityType: 'approval',
        entityDocumentId: args.approvalId,
        metadata: {
          decision: args.decision,
          messageId: (approval.message as any).documentId,
          messageStatus,
        },
      });

      const output = stripNullish({
        approvalId: args.approvalId,
        status: args.decision,
        messageStatus,
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
