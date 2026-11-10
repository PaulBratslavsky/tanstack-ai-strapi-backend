import type { Core } from '@strapi/strapi';
import { z } from '@strapi/utils';
import { getActionId, PLUGIN_NAME } from '../permissions';
import { getUid } from '../types';
import { stripNullish } from '../utils';

export const register = (strapi: Core.Strapi) => {
  strapi.ai.mcp.registerTool({
    name: 'agent_bus__list_agents',
    title: 'List Agents',
    description: 'List registered agents and their public capability cards. Used for routing decisions.',

    resolveInputSchema: () =>
      z.object({
        kind: z.enum(['orchestrator', 'specialist', 'human', 'app']).optional().describe('Filter by agent kind'),
        status: z.enum(['active', 'disabled']).optional().default('active').describe('Filter by status'),
      }),

    resolveOutputSchema: () =>
      z.object({
        agents: z.array(
          z.object({
            documentId: z.string(),
            slug: z.string(),
            name: z.string(),
            kind: z.string(),
            description: z.string().optional(),
            capabilities: z.array(z.any()),
          })
        ),
      }),

    auth: {
      policies: [{ action: getActionId('agent.read') }],
    },

    createHandler: (strapi) => async ({ args, context }) => {
      const agentUid = getUid('agent');

      const filters: any = {};
      
      if (args.kind) {
        filters.kind = { $eq: args.kind };
      }
      
      if (args.status) {
        filters.status = { $eq: args.status };
      }

      const agents = await strapi.documents(agentUid).findMany({
        filters,
        fields: ['documentId', 'slug', 'name', 'kind', 'description', 'capabilities'],
        sort: ['kind:asc', 'name:asc'],
      });

      const output = {
        agents: agents.map((agent: any) => stripNullish({
          documentId: agent.documentId,
          slug: agent.slug,
          name: agent.name,
          kind: agent.kind,
          description: agent.description,
          capabilities: agent.capabilities || [],
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
