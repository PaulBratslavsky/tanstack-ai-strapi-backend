import type { Core } from '@strapi/strapi';
import { z } from '@strapi/utils';
import { getActionId, PLUGIN_NAME } from '../permissions';
import { getUid } from '../types';
import { stripNullish, getTodayPST } from '../utils';
import type { BrainService } from '../../services/brain';

export const register = (strapi: Core.Strapi) => {
  strapi.ai.mcp.registerTool({
    name: 'log_gap',
    title: 'Log Brain Gap',
    description: 'Create a gap record (request nothing handled well). If a similar open gap exists, appends to seenDates and returns proposeCapability: true when seenDates reaches 2.',
    
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
      proposeCapability: z.boolean().optional(),
      seenDates: z.array(z.string()).optional(),
    }),
    
    auth: {
      policies: [{ action: getActionId('meta.write') }],
    },
    
    createHandler: (strapi) => async ({ args, context }) => {
      const brainService = strapi.plugin(PLUGIN_NAME).service('brain') as BrainService;
      const uid = getUid('gap');
      
      const slug = brainService.slugify(args.title);
      const today = getTodayPST();
      
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
      let proposeCapability = false;

      if (existing.length > 0) {
        const existingGap = existing[0];
        const seenDates = Array.isArray(existingGap.seenDates) ? [...existingGap.seenDates] : [];
        
        if (!seenDates.includes(today)) {
          seenDates.push(today);
        }
        
        if (seenDates.length >= 2) {
          proposeCapability = true;
        }
        
        result = await strapi.documents(uid).update({
          documentId: existingGap.documentId,
          data: {
            count: (existingGap.count || 1) + 1,
            seenDates,
          },
        });
        
        created = false;
        message = `Appended to existing gap seenDates (count: ${result.count})`;
      } else {
        const data: any = {
          title: args.title,
          slug,
          date: args.date || today,
          firstSeen: today,
          seenDates: [today],
          request: args.request,
          whatWasNeeded: args.whatWasNeeded,
          count: 1,
          state: args.status || 'open', // Map external status to internal state,
        };

        result = await strapi.documents(uid).create({ data });
        created = true;
        message = 'Created new gap';
      }

      const output = stripNullish({
        created,
        documentId: result.documentId,
        slug: result.slug,
        count: result.count,
        message,
        proposeCapability: proposeCapability || undefined,
        seenDates: result.seenDates,
      });

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
