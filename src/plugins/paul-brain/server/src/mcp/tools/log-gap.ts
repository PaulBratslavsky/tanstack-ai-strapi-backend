import type { Core } from '@strapi/strapi';
import { z } from '@strapi/utils';
import { getActionId, PLUGIN_NAME } from '../permissions';
import { getUid } from '../types';
import type { BrainService } from '../../services/brain';

export const register = (strapi: Core.Strapi) => {
  strapi.ai.mcp.registerTool({
    name: 'log_gap',
    title: 'Log Brain Gap',
    description: 'Create a gap record (request nothing handled well). Increments count if a similar open gap title exists. See get_brain_guide for usage.',
    
    resolveInputSchema: () => z.object({
      title: z.string().describe('Gap title'),
      date: z.string().optional().describe('Date of gap (ISO format)'),
      request: z.string().describe('What was requested'),
      whatWasNeeded: z.string().describe('What was actually needed'),
      status: z.enum(['open', 'built', 'wontfix']).optional().describe('Status (default: open)'),
    }),
    
    resolveOutputSchema: () => z.object({
      created: z.boolean(),
      documentId: z.string(),
      slug: z.string(),
      count: z.number(),
      message: z.string(),
    }),
    
    auth: {
      policies: [{ action: getActionId('meta.write') }],
    },
    
    createHandler: (strapi) => async ({ args, context }) => {
      const brainService = strapi.plugin(PLUGIN_NAME).service('brain') as BrainService;
      const uid = getUid('gap');
      
      const slug = brainService.slugify(args.title);
      
      const existing = await strapi.documents(uid).findMany({
        filters: {
          slug: { $eq: slug },
          status: { $eq: 'open' },
        },
        limit: 1,
      });

      let result: any;
      let created = false;
      let message = '';

      if (existing.length > 0) {
        const existingGap = existing[0];
        const newCount = (existingGap.count || 1) + 1;
        
        result = await strapi.documents(uid).update({
          documentId: existingGap.documentId,
          data: {
            count: newCount,
          },
        });
        
        created = false;
        message = `Incremented existing gap count to ${newCount}`;
      } else {
        const data: any = {
          title: args.title,
          slug,
          date: args.date || new Date().toISOString(),
          request: args.request,
          whatWasNeeded: args.whatWasNeeded,
          count: 1,
          status: args.status || 'open',
        };

        result = await strapi.documents(uid).create({ data });
        created = true;
        message = 'Created new gap';
      }

      const output = {
        created,
        documentId: result.documentId,
        slug: result.slug,
        count: result.count,
        message,
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
