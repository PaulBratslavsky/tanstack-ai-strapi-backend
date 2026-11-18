import type { Core } from '@strapi/strapi';
import { z } from '@strapi/utils';
import { getActionId, PLUGIN_NAME } from '../permissions';
import type { BrainService } from '../../services/brain';
import { stripNullish } from '../utils';

export const register = (strapi: Core.Strapi) => {
  strapi.ai.mcp.registerTool({
    name: 'verify_note',
    title: 'Verify Note Before Saving',
    description: 'Read-only duplicate check. Searches every note (title, summary, and body, newest-first, same paging as recall) plus an optional dedupeKey. Returns ranked related notes and a recommendedAction: create, update_existing, or skip.',

    resolveInputSchema: () => z.object({
      title: z.string().describe('Proposed note title'),
      summary: z.string().max(280).optional().describe('Proposed summary'),
      body: z.string().optional().describe('Proposed body'),
      tags: z.array(z.string()).optional().describe('Proposed tags'),
      dedupeKey: z.string().optional().describe('Stable key. An existing note with this key recommends update_existing or skip'),
    }),

    resolveOutputSchema: () => z.object({
      recommendedAction: z.enum(['create', 'update_existing', 'skip']),
      related: z.array(z.object({
        documentId: z.string(),
        title: z.string(),
        slug: z.string(),
        kind: z.string().optional(),
        summary: z.string().optional(),
        score: z.number(),
        match: z.enum(['dedupeKey', 'slug', 'title', 'search']),
        updatedAt: z.string().optional(),
      })),
    }),

    auth: {
      policies: [{ action: getActionId('read') }],
    },

    createHandler: (strapi) => async ({ args }) => {
      const brainService = strapi.plugin(PLUGIN_NAME).service('brain') as BrainService;
      const assessment = await brainService.assessNote({
        title: args.title,
        summary: args.summary,
        body: args.body,
        tags: args.tags,
        dedupeKey: args.dedupeKey,
      });

      const output = stripNullish({
        recommendedAction: assessment.recommendedAction,
        related: assessment.related,
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
