import type { Core } from '@strapi/strapi';
import { z } from '@strapi/utils';
import { getActionId, PLUGIN_NAME } from '../permissions';
import { getUid } from '../types';
import { getTodayPST } from '../utils';
import type { BrainService } from '../../services/brain';

export const register = (strapi: Core.Strapi) => {
  strapi.ai.mcp.registerTool({
    name: 'log_retro',
    title: 'Log Brain Retro',
    description: 'Create a retro record (failure on real work + fix). Optionally link to project. See get_brain_guide for usage.',
    
    resolveInputSchema: () => z.object({
      title: z.string().describe('Retro title'),
      date: z.string().optional().describe('Date of failure (YYYY-MM-DD, defaults to today in America/Los_Angeles)'),
      task: z.string().optional().describe('What task was being attempted'),
      failure: z.string().describe('What went wrong'),
      fix: z.string().describe('How it was fixed'),
      fixLocation: z.string().optional().describe('Where the fix was applied (file, system, etc.)'),
      status: z.enum(['open', 'fixed']).optional().describe('Status (default: open)'),
      project: z.string().optional().describe('Project documentId or slug'),
    }),
    
    resolveOutputSchema: () => z.object({
      created: z.boolean(),
      documentId: z.string(),
      slug: z.string(),
    }),
    
    auth: {
      policies: [{ action: getActionId('meta.write') }],
    },
    
    createHandler: (strapi) => async ({ args, context }) => {
      const brainService = strapi.plugin(PLUGIN_NAME).service('brain') as BrainService;
      const uid = getUid('retro');
      
      const slug = brainService.slugify(args.title);
      
      const data: any = {
        title: args.title,
        slug,
        date: args.date ? args.date.slice(0, 10) : getTodayPST(),
        task: args.task,
        failure: args.failure,
        fix: args.fix,
        fixLocation: args.fixLocation,
        status: args.status || 'open',
      };

      if (args.project) {
        const projectDocId = await brainService.resolveEntityBySlug('project', args.project);
        if (projectDocId) {
          data.project = { connect: [{ documentId: projectDocId }] };
        }
      }

      const result = await strapi.documents(uid).create({ data });

      const output = {
        created: true,
        documentId: result.documentId,
        slug: result.slug,
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
