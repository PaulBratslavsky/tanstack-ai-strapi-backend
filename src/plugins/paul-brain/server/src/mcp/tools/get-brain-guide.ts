import type { Core } from '@strapi/strapi';
import { z } from '@strapi/utils';
import { getActionId } from '../permissions';
import { BRAIN_GUIDE } from '../guides/brain-guide';

const PLUGIN_VERSION = '1.4.1';

export const register = (strapi: Core.Strapi) => {
  strapi.ai.mcp.registerTool({
    name: 'get_brain_guide',
    title: 'Get Brain Usage Guide',
    description: 'Returns the complete usage guide for Paul\'s Brain: what content types exist, when to use which tool, best practices, tagging conventions, and permission requirements.',
    
    resolveInputSchema: () => z.object({}),
    
    resolveOutputSchema: () => z.object({
      guide: z.string().describe('The complete brain usage guide in markdown format'),
      version: z.string().describe('Plugin version'),
    }),
    
    auth: {
      policies: [{ action: getActionId('guide.read') }],
    },
    
    createHandler: () => async () => {
      return {
        content: [
          {
            type: 'text',
            text: `${BRAIN_GUIDE}\n\n---\nPlugin version: ${PLUGIN_VERSION}`,
          },
        ],
        structuredContent: {
          guide: BRAIN_GUIDE,
          version: PLUGIN_VERSION,
        },
      };
    },
  });
};
