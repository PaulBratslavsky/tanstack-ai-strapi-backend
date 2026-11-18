import type { Core } from '@strapi/strapi';
import { z } from '@strapi/utils';
import { getActionId } from '../permissions';
import { getUid } from '../types';
import { stripNullish } from '../utils';

const DELIVERY_STATES = ['pending', 'delivered', 'failed', 'exhausted', 'skipped', 'resolved', 'ignored'] as const;

async function countState(strapi: Core.Strapi, uid: string, state: string): Promise<number> {
  const api = strapi.documents(uid) as {
    count?: (params: any) => Promise<number>;
    findMany: (params: any) => Promise<any[]>;
  };
  if (typeof api.count === 'function') {
    try {
      const counted = await api.count({ filters: { state: { $eq: state } } });
      if (typeof counted === 'number') return counted;
    } catch (err) {
      strapi.log?.warn?.(`[agent-bus] delivery count failed for ${state}:`, err);
    }
  }
  const rows = await api.findMany({
    filters: { state: { $eq: state } },
    fields: ['documentId'],
    limit: 500,
  });
  return rows.length;
}

export const register = (strapi: Core.Strapi) => {
  strapi.ai.mcp.registerTool({
    name: 'agent_bus__delivery_summary',
    title: 'Delivery Summary',
    description: 'Counts of webhook deliveries by state, plus recent failed and exhausted attempts. Does not include message bodies.',

    resolveInputSchema: () => z.object({}),

    resolveOutputSchema: () =>
      z.object({
        counts: z.record(z.number()),
        recentFailures: z.array(z.object({
          documentId: z.string(),
          status: z.string(),
          event: z.string().optional(),
          agentId: z.string().optional(),
          agentSlug: z.string().optional(),
          lastError: z.string().optional(),
          attemptCount: z.number().optional(),
          updatedAt: z.string().optional(),
        })),
      }),

    auth: {
      policies: [{ action: getActionId('delivery.read') }],
    },

    createHandler: (strapi) => async () => {
      const uid = getUid('delivery');
      const counts: Record<string, number> = {};
      for (const state of DELIVERY_STATES) {
        counts[state] = await countState(strapi, uid, state);
      }

      const failures = await strapi.documents(uid).findMany({
        filters: { state: { $in: ['failed', 'exhausted'] } },
        populate: { agent: { fields: ['slug'] } },
        sort: ['updatedAt:desc'],
        limit: 10,
      });

      const output = {
        counts,
        recentFailures: (failures || []).map((row: any) => stripNullish({
          documentId: row.documentId,
          status: row.state,
          event: row.event,
          agentId: row.agent?.documentId,
          agentSlug: row.agent?.slug,
          lastError: typeof row.lastError === 'string' ? row.lastError.slice(0, 180) : undefined,
          attemptCount: typeof row.attemptCount === 'number' ? row.attemptCount : undefined,
          updatedAt: row.updatedAt,
        })),
      };

      return {
        content: [{ type: 'text', text: JSON.stringify(output, null, 2) }],
        structuredContent: output,
      };
    },
  });
};
