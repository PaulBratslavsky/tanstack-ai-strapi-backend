import type { Core } from '@strapi/strapi';
import { z } from '@strapi/utils';
import { getActionId } from '../permissions';
import { stripNullish } from '../utils';
import { createResourceService, RESOURCE_FORMATS, RESOURCE_STATUSES } from '../../services/resource';

export const register = (strapi: Core.Strapi) => {
  strapi.ai.mcp.registerTool({
    name: 'list_resources',
    title: 'List Resources',
    description:
      'List resources newest first (updatedAt desc). Filters: format, status, tag, project (documentId or slug), since (YYYY-MM-DD Pacific midnight, or an ISO timestamp). Paginated with page (default 1) and limit (default 25, max 100). Tag matches scan the newest 1000 rows. See get_brain_guide.',

    resolveInputSchema: () =>
      z.object({
        format: z.enum(RESOURCE_FORMATS).optional().describe('Filter by format'),
        status: z.enum(RESOURCE_STATUSES).optional().describe('Filter by status: draft, final, archived'),
        tag: z.string().optional().describe('Filter by a single tag (case-insensitive)'),
        project: z.string().optional().describe('Project documentId or slug'),
        since: z.string().optional().describe('Only resources updated on or after this Pacific date (YYYY-MM-DD) or ISO timestamp'),
        page: z.number().int().min(1).optional().describe('1-based page (default 1)'),
        limit: z.number().int().min(1).max(100).optional().describe('Page size (default 25, max 100)'),
      }),

    resolveOutputSchema: () =>
      z.object({
        resources: z.array(
          z.object({
            documentId: z.string(),
            title: z.string(),
            slug: z.string().nullish(),
            format: z.string(),
            status: z.string(),
            summary: z.string().nullish(),
            externalUrl: z.string().nullish(),
            createdBy: z.string().nullish(),
            tags: z.array(z.string()),
            updatedAt: z.string().nullish(),
          })
        ),
        page: z.number(),
        pageSize: z.number(),
        count: z.number(),
        total: z.number().optional(),
        hasMore: z.boolean(),
        truncated: z.boolean().optional(),
      }),

    auth: {
      policies: [{ action: getActionId('resource.read') }],
    },

    createHandler: (strapi) => async ({ args }) => {
      const resources = createResourceService(strapi);
      const result = await resources.list(args);
      const output = stripNullish(result);

      return {
        content: [{ type: 'text', text: JSON.stringify(output, null, 2) }],
        structuredContent: output,
      };
    },
  });
};
