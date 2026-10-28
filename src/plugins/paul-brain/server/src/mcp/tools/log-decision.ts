import type { Core } from '@strapi/strapi';
import { z } from '@strapi/utils';
import { getActionId, PLUGIN_NAME } from '../permissions';
import { getUid } from '../types';
import type { BrainService } from '../../services/brain';

export const register = (strapi: Core.Strapi) => {
  strapi.ai.mcp.registerTool({
    name: 'log_decision',
    title: 'Log Brain Decision',
    description: 'Create a decision record (context/decision/rationale). Always link project and people. Optionally mark a prior decision as superseded. See get_brain_guide for usage.',
    
    resolveInputSchema: () => z.object({
      title: z.string().describe('Decision title'),
      context: z.string().optional().describe('Background context (markdown)'),
      decision: z.string().describe('The decision made (markdown)'),
      rationale: z.string().optional().describe('Why this decision (markdown)'),
      status: z.enum(['proposed', 'accepted', 'superseded']).optional().describe('Decision status (default: accepted)'),
      decided_on: z.string().optional().describe('Decision date (ISO format)'),
      project: z.string().optional().describe('Project documentId or slug'),
      people: z.array(z.string()).optional().describe('People documentIds or slugs'),
      supersedes: z.string().optional().describe('Prior decision documentId or slug to mark superseded'),
    }),
    
    resolveOutputSchema: () => z.object({
      created: z.boolean(),
      documentId: z.string(),
      slug: z.string(),
    }),
    
    auth: {
      policies: [{ action: getActionId('decision.write') }],
    },
    
    createHandler: (strapi) => async ({ args, context }) => {
      const brainService = strapi.plugin(PLUGIN_NAME).service('brain') as BrainService;
      const uid = getUid('decision');
      
      const slug = brainService.slugify(args.title);
      
      const data: any = {
        title: args.title,
        slug,
        context: args.context,
        decision: args.decision,
        rationale: args.rationale,
        status: args.status || 'accepted',
        decided_on: args.decided_on || new Date().toISOString(),
      };

      if (args.project) {
        const projectDocId = await brainService.resolveEntityBySlug('project', args.project);
        if (projectDocId) {
          data.project = { connect: [{ documentId: projectDocId }] };
        }
      }

      if (args.people && args.people.length > 0) {
        const peopleDocIds = await Promise.all(
          args.people.map(async (p) => {
            const docId = await brainService.resolveEntityBySlug('person', p);
            return docId;
          })
        );
        const validIds = peopleDocIds.filter(id => id !== null);
        if (validIds.length > 0) {
          data.people = { connect: validIds.map(id => ({ documentId: id })) };
        }
      }

      if (args.supersedes) {
        const supersedesDocId = await brainService.resolveEntityBySlug('decision', args.supersedes);
        if (supersedesDocId) {
          data.supersedes = { connect: [{ documentId: supersedesDocId }] };
          await strapi.documents(uid).update({
            documentId: supersedesDocId,
            data: { status: 'superseded' },
          });
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
