import type { Core } from '@strapi/strapi';
import { z } from '@strapi/utils';
import { getActionId, PLUGIN_NAME } from '../permissions';
import { getUid } from '../types';
import { stripNullish } from '../utils';

export const register = (strapi: Core.Strapi) => {
  strapi.ai.mcp.registerTool({
    name: 'agent_bus__list_approvals',
    title: 'List Approvals',
    description: 'List pending and scheduled approvals for orchestrator review.',

    resolveInputSchema: () =>
      z.object({
        status: z.enum(['pending', 'approved', 'rejected', 'auto_approved', 'vetoed', 'expired']).optional().describe('Filter by status (default: pending)'),
        limit: z.number().min(1).max(50).optional().default(20).describe('Max items to return'),
      }),

    resolveOutputSchema: () =>
      z.object({
        approvals: z.array(z.any()),
        count: z.number(),
      }),

    auth: {
      policies: [{ action: getActionId('approval.read') }],
    },

    createHandler: (strapi) => async ({ args, extra, context }) => {
      const authService = strapi.plugin(PLUGIN_NAME).service('auth');
      const approvalUid = getUid('approval');
      const threadUid = getUid('thread');
      const limit = Math.min(args.limit || 20, 50);

      // Resolve caller to check if they're the orchestrator
      const caller = await authService.resolveCaller(strapi, extra);
      
      // Check if caller has message.manage permission (orchestrator)
      const manageAction = getActionId('message.manage');
      const isOrchestrator = extra.userAbility?.can(manageAction) ?? false;

      const filters: any = {};
      if (args.status) {
        filters.state = { $eq: args.status };
      } else {
        filters.state = { $eq: 'pending' };
      }

      // If not orchestrator, scope to threads where caller is a participant
      if (!isOrchestrator) {
        // Find threads where this agent is a participant
        const callerThreads = await strapi.documents(threadUid).findMany({
          filters: {
            $or: [
              { participants: { documentId: { $eq: caller.agentDocumentId } } },
            ],
          },
          fields: ['documentId'],
        });
        
        const threadIds = callerThreads.map((t: any) => t.documentId);
        
        if (threadIds.length === 0) {
          // No threads = no approvals
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({ approvals: [], count: 0 }, null, 2),
              },
            ],
            structuredContent: { approvals: [], count: 0 },
          };
        }
        
        filters.thread = { documentId: { $in: threadIds } };
      }

      const approvals = await strapi.documents(approvalUid).findMany({
        filters,
        populate: {
          message: {
            fields: ['documentId', 'type', 'priority', 'blastRadius', 'riskClass'],
            populate: {
              from: { fields: ['slug', 'name'] },
              to: { fields: ['slug', 'name'] },
            },
          },
          thread: { fields: ['documentId', 'subject'] },
          decidedByAgent: { fields: ['slug', 'name'] },
        },
        sort: ['createdAt:asc'],
        limit,
      });

      const output = {
        approvals: approvals.map((approval: any) => stripNullish({
          approvalId: approval.documentId,
          messageId: approval.message?.documentId,
          threadId: approval.thread?.documentId,
          subject: approval.thread?.subject,
          status: approval.state, // Map state to status for external API
          reviewLevel: approval.reviewLevel,
          vetoUntil: approval.vetoUntil,
          message: approval.message ? {
            type: approval.message.type,
            from: approval.message.from?.slug,
            to: approval.message.to?.slug,
            priority: approval.message.priority,
            blastRadius: approval.message.blastRadius,
            riskClass: approval.message.riskClass,
          } : undefined,
          decidedAt: approval.decidedAt,
          decidedBy: approval.decidedByAgent?.slug || approval.decidedByLabel,
          reason: approval.reason,
          createdAt: approval.createdAt,
        })),
        count: approvals.length,
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
