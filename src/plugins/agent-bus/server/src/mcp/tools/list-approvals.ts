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

    createHandler: (strapi) => async ({ args, context }) => {
      const approvalUid = getUid('approval');
      const limit = Math.min(args.limit || 20, 50);

      const filters: any = {};
      if (args.status) {
        filters.status = { $eq: args.status };
      } else {
        filters.status = { $eq: 'pending' };
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
          status: approval.status,
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
