import type { Core } from '@strapi/strapi';
import { z } from '@strapi/utils';
import { getActionId } from '../permissions';
import { getUid } from '../types';
import { sinceToIso, stripNullish } from '../utils';

const DELIVERY_STATES = ['pending', 'delivered', 'failed', 'exhausted', 'skipped', 'resolved', 'ignored'] as const;

export const register = (strapi: Core.Strapi) => {
  strapi.ai.mcp.registerTool({
    name: 'agent_bus__list_deliveries',
    title: 'List Deliveries',
    description: 'List webhook deliveries. Filters: state, agentId (documentId or slug), since (YYYY-MM-DD Pacific midnight, or an ISO timestamp). Message bodies are not returned.',

    resolveInputSchema: () =>
      z.object({
        state: z.enum(DELIVERY_STATES).optional().describe('Filter by delivery state'),
        agentId: z.string().optional().describe('Agent documentId or slug'),
        since: z.string().optional().describe('Created at or after this Pacific date (YYYY-MM-DD) or ISO timestamp'),
        limit: z.number().min(1).max(50).optional().describe('Max rows (default 25)'),
      }),

    resolveOutputSchema: () =>
      z.object({
        deliveries: z.array(z.object({
          documentId: z.string(),
          status: z.string(),
          event: z.string().optional(),
          agentId: z.string().optional(),
          agentSlug: z.string().optional(),
          attemptCount: z.number().optional(),
          lastError: z.string().optional(),
          lastStatusCode: z.number().optional(),
          nextAttemptAt: z.string().optional(),
          deliveredAt: z.string().optional(),
          createdAt: z.string().optional(),
          triageNote: z.string().optional(),
        })),
        count: z.number(),
      }),

    auth: {
      policies: [{ action: getActionId('delivery.read') }],
    },

    createHandler: (strapi) => async ({ args }) => {
      const uid = getUid('delivery');
      const limit = Math.min(args.limit || 25, 50);
      const filters: Record<string, unknown> = {};
      if (args.state) filters.state = { $eq: args.state };
      if (args.since) filters.createdAt = { $gte: sinceToIso(args.since) };
      if (args.agentId) {
        filters.$or = [
          { agent: { documentId: { $eq: args.agentId } } },
          { agent: { slug: { $eq: args.agentId } } },
        ];
      }

      const rows = await strapi.documents(uid).findMany({
        filters,
        populate: { agent: { fields: ['slug'] } },
        sort: ['createdAt:desc'],
        limit,
      });

      const output = {
        deliveries: (rows || []).map((row: any) => stripNullish({
          documentId: row.documentId,
          status: row.state,
          event: row.event,
          agentId: row.agent?.documentId,
          agentSlug: row.agent?.slug,
          attemptCount: typeof row.attemptCount === 'number' ? row.attemptCount : undefined,
          lastError: typeof row.lastError === 'string' ? row.lastError.slice(0, 180) : undefined,
          lastStatusCode: typeof row.lastStatusCode === 'number' ? row.lastStatusCode : undefined,
          nextAttemptAt: row.nextAttemptAt,
          deliveredAt: row.deliveredAt,
          createdAt: row.createdAt,
          triageNote: typeof row.triageNote === 'string' ? row.triageNote.slice(0, 500) : undefined,
        })),
        count: (rows || []).length,
      };

      return {
        content: [{ type: 'text', text: JSON.stringify(output, null, 2) }],
        structuredContent: output,
      };
    },
  });
};
