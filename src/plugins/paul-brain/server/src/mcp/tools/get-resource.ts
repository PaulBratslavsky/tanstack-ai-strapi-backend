import type { Core } from '@strapi/strapi';
import { z } from '@strapi/utils';
import { getActionId } from '../permissions';
import { stripNullish } from '../utils';
import { createResourceService } from '../../services/resource';

const relationSchema = z.object({
  documentId: z.string(),
  title: z.string().nullish(),
  name: z.string().nullish(),
  slug: z.string().nullish(),
});

export const register = (strapi: Core.Strapi) => {
  strapi.ai.mcp.registerTool({
    name: 'get_resource',
    title: 'Get Resource',
    description:
      'Fetch one resource by documentId or slug, including notes, projects, people, sources, private file metadata, and supersededBy. File output never includes the public upload URL; use get_resource_file for contents. See get_brain_guide.',

    resolveInputSchema: () =>
      z.object({
        identifier: z.string().describe('documentId or slug'),
      }),

    resolveOutputSchema: () =>
      z.object({
        resource: z
          .object({
            documentId: z.string(),
            title: z.string(),
            slug: z.string().nullish(),
            format: z.string(),
            status: z.string(),
            body: z.string().nullish(),
            summary: z.string().nullish(),
            extractedText: z.string().nullish(),
            altText: z.string().nullish(),
            caption: z.string().nullish(),
            snapshotMarkdown: z.string().nullish(),
            snapshotAt: z.string().nullish(),
            contentHash: z.string().nullish(),
            externalUrl: z.string().nullish(),
            createdBy: z.string().nullish(),
            tags: z.array(z.string()),
            updatedAt: z.string().nullish(),
            createdAt: z.string().nullish(),
            notes: z.array(relationSchema),
            projects: z.array(relationSchema),
            people: z.array(relationSchema),
            sources: z.array(relationSchema),
            file: z
              .object({
                id: z.number().nullish(),
                name: z.string().nullish(),
                mime: z.string().nullish(),
                ext: z.string().nullish(),
                size: z.number().nullish(),
                alternativeText: z.string().nullish(),
              })
              .nullish(),
            supersededBy: relationSchema.nullish(),
          })
          .nullable(),
      }),

    auth: {
      policies: [{ action: getActionId('resource.read') }],
    },

    createHandler: (strapi) => async ({ args }) => {
      const resources = createResourceService(strapi);
      const result = await resources.get(args.identifier);
      // stripNullish drops a null resource, which the output schema requires.
      const output = result.resource ? stripNullish(result) : { resource: null };

      return {
        content: [
          {
            type: 'text',
            text: result.resource ? JSON.stringify(output.resource, null, 2) : 'Resource not found',
          },
        ],
        structuredContent: output,
      };
    },
  });
};
