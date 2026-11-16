import type { Core } from '@strapi/strapi';
import { z } from '@strapi/utils';
import { getActionId } from '../permissions';
import { getUid } from '../types';
import { stripNullish } from '../utils';

const KINDS = ['orchestrator', 'specialist', 'human', 'app'] as const;
const PACKS = ['asker', 'specialist', 'orchestrator', 'custom'] as const;
const WEBHOOK_MODES = ['reference', 'full'] as const;
const STATUSES = ['active', 'disabled'] as const;

function slugifyAgentName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export const register = (strapi: Core.Strapi) => {
  strapi.ai.mcp.registerTool({
    name: 'agent_bus__register_agent',
    title: 'Register Agent',
    description:
      'Create or update an agent in the registry. Matches an existing agent by slug, then by name. Returns documentId and whether it was created. Does not set webhook secrets.',

    resolveInputSchema: () =>
      z.object({
        name: z.string().min(1).describe('Agent display name'),
        slug: z.string().optional().describe('Stable slug. Generated from name when omitted'),
        description: z.string().optional().describe('What this agent does'),
        capabilities: z.array(z.any()).optional().describe('Public capability card (JSON array)'),
        kind: z.enum(KINDS).optional().describe('Agent kind (default: specialist). Only one orchestrator is allowed'),
        permissionPack: z.enum(PACKS).optional().describe('Permission pack (default: asker)'),
        status: z.enum(STATUSES).optional().describe('active or disabled (default: active)'),
        notes: z.string().optional().describe('Private notes'),
        webhookUrl: z.string().optional().describe('Wake-up webhook URL'),
        webhookMode: z.enum(WEBHOOK_MODES).optional().describe('reference (ids only) or full (default: reference)'),
        rateLimitPerMinute: z.number().int().optional().describe('Per-minute send cap'),
        rateLimitPerDay: z.number().int().optional().describe('Per-day send cap'),
        maxTurnsPerThread: z.number().int().optional().describe('Turn limit per thread'),
      }),

    resolveOutputSchema: () =>
      z.object({
        created: z.boolean(),
        documentId: z.string(),
        slug: z.string(),
        name: z.string(),
        status: z.string(),
        message: z.string(),
      }),

    auth: {
      policies: [{ action: getActionId('agent.manage') }],
    },

    createHandler: (strapi) => async ({ args }) => {
      const agentUid = getUid('agent');
      const name = args.name.trim();
      const explicitSlug = args.slug?.trim();
      const slug = explicitSlug || slugifyAgentName(name);

      if (!slug) {
        throw new Error('Could not derive a slug from name. Pass slug explicitly.');
      }

      const bySlug = await strapi.documents(agentUid).findMany({
        filters: { slug: { $eq: slug } },
        limit: 1,
      });

      let existing = bySlug[0];

      if (!existing) {
        const byName = await strapi.documents(agentUid).findMany({
          filters: { name: { $eqi: name } },
          limit: 1,
        });
        existing = byName[0];
      }

      const nextKind = args.kind ?? existing?.kind;
      if (nextKind === 'orchestrator') {
        const orchestrators = await strapi.documents(agentUid).findMany({
          filters: { kind: { $eq: 'orchestrator' } },
          limit: 5,
        });
        const other = orchestrators.find((agent) => agent.documentId !== existing?.documentId);
        if (other) {
          throw new Error('Only one orchestrator is allowed');
        }
      }

      const data: Record<string, unknown> = { name };

      if (args.description !== undefined) data.description = args.description;
      if (args.capabilities !== undefined) data.capabilities = args.capabilities;
      if (args.kind !== undefined) data.kind = args.kind;
      if (args.permissionPack !== undefined) data.permissionPack = args.permissionPack;
      if (args.status !== undefined) data.state = args.status;
      if (args.notes !== undefined) data.notes = args.notes;
      if (args.webhookUrl !== undefined) data.webhookUrl = args.webhookUrl;
      if (args.webhookMode !== undefined) data.webhookMode = args.webhookMode;
      if (args.rateLimitPerMinute !== undefined) data.rateLimitPerMinute = args.rateLimitPerMinute;
      if (args.rateLimitPerDay !== undefined) data.rateLimitPerDay = args.rateLimitPerDay;
      if (args.maxTurnsPerThread !== undefined) data.maxTurnsPerThread = args.maxTurnsPerThread;
      if (explicitSlug && explicitSlug !== existing?.slug) data.slug = explicitSlug;

      let created = false;
      let message = 'Updated existing agent';
      let result: any;

      if (existing) {
        result = await strapi.documents(agentUid).update({
          documentId: existing.documentId,
          data,
        });
      } else {
        result = await strapi.documents(agentUid).create({
          data: {
            ...data,
            slug,
            kind: args.kind || 'specialist',
            permissionPack: args.permissionPack || 'asker',
            webhookMode: args.webhookMode || 'reference',
            state: args.status || 'active',
            capabilities: args.capabilities || [],
          },
        });
        created = true;
        message = 'Created new agent';
      }

      const output = stripNullish({
        created,
        documentId: result.documentId,
        slug: result.slug || slug,
        name: result.name || name,
        status: result.state || args.status || existing?.state || 'active',
        message,
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
