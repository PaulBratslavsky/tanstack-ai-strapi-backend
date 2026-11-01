import type { Core } from '@strapi/strapi';
import { z } from '@strapi/utils';
import { getActionId, PLUGIN_NAME } from '../permissions';
import { getUid } from '../types';

export const register = (strapi: Core.Strapi) => {
  strapi.ai.mcp.registerTool({
    name: 'add_rule',
    title: 'Add Brain Rule',
    description: 'Create a deterministic routing/handling rule. See get_brain_guide for usage.',
    
    resolveInputSchema: () => z.object({
      name: z.string().describe('Rule name'),
      match: z.string().describe('What items this rule applies to'),
      action: z.string().describe('What action to take'),
      priority: z.number().optional().describe('Priority (higher = earlier, default: 0)'),
      enabled: z.boolean().optional().describe('Whether rule is enabled (default: true)'),
    }),
    
    resolveOutputSchema: () => z.object({
      created: z.boolean(),
      documentId: z.string(),
    }),
    
    auth: {
      policies: [{ action: getActionId('rule.write') }],
    },
    
    createHandler: (strapi) => async ({ args, context }) => {
      const uid = getUid('rule');
      
      const data: any = {
        name: args.name,
        match: args.match,
        action: args.action,
        priority: args.priority || 0,
        enabled: args.enabled !== false,
      };

      const result = await strapi.documents(uid).create({ data });

      const output = {
        created: true,
        documentId: result.documentId,
      };

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
