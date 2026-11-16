import type { Core } from '@strapi/strapi';
import { z } from '@strapi/utils';
import { getActionId } from '../permissions';
import { stripNullish } from '../utils';
import { createResourceService } from '../../services/resource';

export const register = (strapi: Core.Strapi) => {
  strapi.ai.mcp.registerTool({
    name: 'get_resource_file',
    title: 'Get Resource File',
    description:
      'Read a resource file without its public upload URL. Files up to 120 KB are returned as base64. Larger files return a short-lived signed accessUrl (about 10 minutes) served by this plugin. Admins can also GET /paul-brain/resources/:documentId/file with resource.read. See get_brain_guide.',

    resolveInputSchema: () =>
      z.object({
        identifier: z.string().describe('documentId or slug'),
      }),

    resolveOutputSchema: () =>
      z.object({
        documentId: z.string(),
        filename: z.string(),
        mime: z.string(),
        size: z.number(),
        encoding: z.enum(['base64', 'signed-url']),
        content: z.string().optional(),
        accessUrl: z.string().optional(),
        expiresAt: z.string().optional(),
        message: z.string(),
      }),

    auth: {
      policies: [{ action: getActionId('resource.read') }],
    },

    createHandler: (strapi) => async ({ args }) => {
      const resources = createResourceService(strapi);
      const result = await resources.readFile(args.identifier);
      const output = stripNullish(result);
      return {
        content: [{ type: 'text', text: JSON.stringify(output, null, 2) }],
        structuredContent: output,
      };
    },
  });
};
