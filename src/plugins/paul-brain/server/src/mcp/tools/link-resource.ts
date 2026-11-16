import type { Core } from '@strapi/strapi';
import { z } from '@strapi/utils';
import { getActionId } from '../permissions';
import { stripNullish } from '../utils';
import { createResourceService } from '../../services/resource';

export const register = (strapi: Core.Strapi) => {
  strapi.ai.mcp.registerTool({
    name: 'link_resource',
    title: 'Link Resource',
    description:
      'Attach or detach notes, projects, people, or sources on a resource. Pass documentIds or slugs. operation connect attaches; disconnect detaches. See get_brain_guide.',

    resolveInputSchema: () =>
      z.object({
        resource: z.string().describe('Resource documentId or slug'),
        relation: z.enum(['notes', 'projects', 'people', 'sources']).describe('Relation to change'),
        targets: z.array(z.string()).describe('Target documentIds or slugs'),
        operation: z.enum(['connect', 'disconnect']).describe('connect to attach, disconnect to detach'),
      }),

    resolveOutputSchema: () =>
      z.object({
        linked: z.boolean(),
        message: z.string(),
      }),

    auth: {
      policies: [{ action: getActionId('resource.write') }],
    },

    createHandler: (strapi) => async ({ args }) => {
      const resources = createResourceService(strapi);
      const result = await resources.link(args);
      const output = stripNullish(result);

      return {
        content: [{ type: 'text', text: JSON.stringify(output, null, 2) }],
        structuredContent: output,
      };
    },
  });
};
