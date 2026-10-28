import type { Core } from '@strapi/strapi';
import { z } from '@strapi/utils';
import { getActionId } from '../permissions';
import * as fs from 'fs';
import * as path from 'path';

const loadGuide = () => {
  const guidePath = path.join(__dirname, '../guides/brain-guide.md');
  return fs.readFileSync(guidePath, 'utf-8');
};

export const register = (strapi: Core.Strapi) => {
  strapi.ai.mcp.registerTool({
    name: 'get_brain_guide',
    title: 'Get Brain Usage Guide',
    description: 'Returns the complete usage guide for Paul\'s Brain: what content types exist, when to use which tool, best practices, tagging conventions, and permission requirements.',
    
    resolveInputSchema: () => z.object({}),
    
    resolveOutputSchema: () => z.object({
      guide: z.string().describe('The complete brain usage guide in markdown format'),
    }),
    
    auth: {
      policies: [{ action: getActionId('guide.read') }],
    },
    
    createHandler: () => async () => {
      const guideContent = loadGuide();
      return {
        content: [
          {
            type: 'text',
            text: guideContent,
          },
        ],
        structuredContent: {
          guide: guideContent,
        },
      };
    },
  });
};
