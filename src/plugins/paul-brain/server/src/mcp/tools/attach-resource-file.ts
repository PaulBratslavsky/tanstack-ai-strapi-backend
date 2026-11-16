import type { Core } from '@strapi/strapi';
import { z } from '@strapi/utils';
import { getActionId } from '../permissions';
import { stripNullish } from '../utils';
import { createResourceService } from '../../services/resource';

export const register = (strapi: Core.Strapi) => {
  strapi.ai.mcp.registerTool({
    name: 'attach_resource_file',
    title: 'Attach Resource File',
    description:
      'Attach one private file to an existing resource. Pass fileBase64 or fileUrl (http or https), plus filename and mime. Documents, images, video, and audio are allowed, up to 25 MB. SVG and executables are rejected. Text, markdown, PDF, and DOCX text is stored in extractedText when it can be read. Images are captioned with the Anthropic API when ANTHROPIC_API_KEY is set; video and audio captions are skipped. If the same file hash already exists, the existing resource is returned with deduped: true and no second copy is stored. The public upload URL is never returned. See get_brain_guide.',

    resolveInputSchema: () =>
      z.object({
        identifier: z.string().describe('documentId or slug of the resource that should own the file'),
        filename: z.string().describe('File name, such as brief.pdf'),
        mime: z.string().describe('MIME type, such as application/pdf, image/png, video/mp4, or audio/mpeg'),
        fileBase64: z.string().optional().describe('File contents as base64. Use this or fileUrl, not both'),
        fileUrl: z.string().optional().describe('http(s) URL the server will fetch. Private and local addresses are refused'),
      }),

    resolveOutputSchema: () =>
      z.object({
        attached: z.boolean(),
        deduped: z.boolean(),
        documentId: z.string(),
        slug: z.string().nullish(),
        contentHash: z.string(),
        filename: z.string(),
        mime: z.string(),
        size: z.number(),
        extractedTextStored: z.boolean(),
        captioned: z.boolean(),
        message: z.string(),
      }),

    auth: {
      policies: [{ action: getActionId('resource.write') }],
    },

    createHandler: (strapi) => async ({ args }) => {
      const resources = createResourceService(strapi);
      const result = await resources.attach(args);
      const output = stripNullish(result);
      return {
        content: [{ type: 'text', text: JSON.stringify(output, null, 2) }],
        structuredContent: output,
      };
    },
  });
};
