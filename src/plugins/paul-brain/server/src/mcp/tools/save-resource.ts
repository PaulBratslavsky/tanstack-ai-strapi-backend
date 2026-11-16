import type { Core } from '@strapi/strapi';
import { z } from '@strapi/utils';
import { getActionId } from '../permissions';
import { stripNullish } from '../utils';
import { createResourceService, RESOURCE_FORMATS, RESOURCE_STATUSES } from '../../services/resource';

export const register = (strapi: Core.Strapi) => {
  strapi.ai.mcp.registerTool({
    name: 'save_resource',
    title: 'Save Resource',
    description:
      'Create a finished deliverable, or update the row with the same slug. Formats: md, page, link, pdf, image, other. Page and link require an http(s) externalUrl. Put a Page snapshot in snapshotMarkdown (snapshotAt defaults to today in America/Los_Angeles). status defaults to final. createdBy is the bot or agent name. If externalUrl or contentHash already belongs to a resource, that resource is returned with deduped: true and is not modified. Attach files with attach_resource_file. See get_brain_guide.',

    resolveInputSchema: () =>
      z.object({
        title: z.string().describe('Resource title (slug is generated from this unless slug is set)'),
        slug: z.string().optional().describe('Explicit slug. Upserts the row with this slug'),
        format: z.enum(RESOURCE_FORMATS).describe('md, page, link, pdf, image, or other'),
        body: z.string().optional().describe('Markdown body'),
        summary: z.string().max(280).optional().describe('Short summary (280 characters max)'),
        extractedText: z.string().optional().describe('Extracted file text. attach_resource_file fills this for text, markdown, PDF, and DOCX'),
        altText: z.string().optional().describe('Description of an image or diagram'),
        snapshotMarkdown: z.string().optional().describe('Markdown snapshot of a Page or canvas. Searched by recall'),
        snapshotAt: z.string().optional().describe('When the snapshot was taken (YYYY-MM-DD, Pacific). Defaults to today when snapshotMarkdown is set'),
        contentHash: z.string().optional().describe('SHA-256 of a file. If a resource already has this hash, that resource is returned'),
        externalUrl: z.string().optional().describe('Page or link URL (http or https). Required for page and link. Same URL returns the existing resource'),
        status: z.enum(RESOURCE_STATUSES).optional().describe('draft, final (default), or archived'),
        tags: z.array(z.string()).optional().describe('Tags, same shape as notes'),
        createdBy: z.string().optional().describe('Bot or agent name that produced this'),
        notes: z.array(z.string()).optional().describe('Note documentIds or slugs to attach'),
        projects: z.array(z.string()).optional().describe('Project documentIds or slugs to attach'),
        people: z.array(z.string()).optional().describe('Person documentIds or slugs to attach'),
        sources: z.array(z.string()).optional().describe('Source documentIds or slugs to attach'),
      }),

    resolveOutputSchema: () =>
      z.object({
        created: z.boolean(),
        deduped: z.boolean(),
        documentId: z.string(),
        slug: z.string(),
        status: z.string(),
        format: z.string(),
        message: z.string(),
      }),

    auth: {
      policies: [{ action: getActionId('resource.write') }],
    },

    createHandler: (strapi) => async ({ args }) => {
      const resources = createResourceService(strapi);
      const result = await resources.save(args);
      const output = stripNullish(result);

      return {
        content: [{ type: 'text', text: JSON.stringify(output, null, 2) }],
        structuredContent: output,
      };
    },
  });
};
