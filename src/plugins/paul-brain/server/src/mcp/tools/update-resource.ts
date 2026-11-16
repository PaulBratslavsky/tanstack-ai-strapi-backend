import type { Core } from '@strapi/strapi';
import { z } from '@strapi/utils';
import { getActionId } from '../permissions';
import { stripNullish } from '../utils';
import { createResourceService, RESOURCE_FORMATS, RESOURCE_STATUSES } from '../../services/resource';

export const register = (strapi: Core.Strapi) => {
  strapi.ai.mcp.registerTool({
    name: 'update_resource',
    title: 'Update Resource',
    description:
      'Patch a resource by documentId or slug. Use appendBody to add markdown without replacing body. newVersion: true creates a new row (new slug) and sets supersededBy on the previous row to that new row. The previous row is otherwise left as it was. See get_brain_guide.',

    resolveInputSchema: () =>
      z.object({
        identifier: z.string().describe('documentId or slug of the resource to update'),
        title: z.string().optional().describe('New title'),
        format: z.enum(RESOURCE_FORMATS).optional().describe('New format'),
        body: z.string().optional().describe('Replace body'),
        appendBody: z.string().optional().describe('Append markdown to body'),
        summary: z.string().max(280).optional().describe('New summary (280 characters max)'),
        extractedText: z.string().optional().describe('Replace extracted text'),
        altText: z.string().optional().describe('Replace alt text'),
        externalUrl: z.string().optional().describe('New Page or link URL'),
        status: z.enum(RESOURCE_STATUSES).optional().describe('draft, final, or archived'),
        tags: z.array(z.string()).optional().describe('Replace tags'),
        addTags: z.array(z.string()).optional().describe('Tags to add'),
        removeTags: z.array(z.string()).optional().describe('Tags to remove'),
        createdBy: z.string().optional().describe('Bot or agent name'),
        notes: z.array(z.string()).optional().describe('Note documentIds or slugs to attach'),
        projects: z.array(z.string()).optional().describe('Project documentIds or slugs to attach'),
        people: z.array(z.string()).optional().describe('Person documentIds or slugs to attach'),
        sources: z.array(z.string()).optional().describe('Source documentIds or slugs to attach'),
        newVersion: z.boolean().optional().describe('Create a new row and point the previous row\'s supersededBy at it'),
      }),

    resolveOutputSchema: () =>
      z.object({
        updated: z.boolean(),
        newVersion: z.boolean(),
        documentId: z.string(),
        slug: z.string(),
        status: z.string(),
        superseded: z.string().optional(),
      }),

    auth: {
      policies: [{ action: getActionId('resource.write') }],
    },

    createHandler: (strapi) => async ({ args }) => {
      const resources = createResourceService(strapi);
      const result = await resources.update(args);
      const output = stripNullish(result);

      return {
        content: [{ type: 'text', text: JSON.stringify(output, null, 2) }],
        structuredContent: output,
      };
    },
  });
};
