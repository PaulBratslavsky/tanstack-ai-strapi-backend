import type { Core } from '@strapi/strapi';
import { z } from '@strapi/utils';
import { getActionId, PLUGIN_NAME } from '../permissions';
import type { BrainService } from '../../services/brain';

export const register = (strapi: Core.Strapi) => {
  strapi.ai.mcp.registerTool({
    name: 'link',
    title: 'Link Brain Entities',
    description: 'Connect or disconnect a note with people/projects/sources/decisions. Pass documentIds or slugs. Use after creating stubs with createMissing. See get_brain_guide for usage.',
    
    resolveInputSchema: () => z.object({
      note: z.string().describe('Note documentId or slug'),
      relation: z.enum(['people', 'projects', 'sources', 'decisions']).describe('Relation to modify'),
      targets: z.array(z.string()).describe('Target documentIds or slugs'),
      operation: z.enum(['connect', 'disconnect']).describe('connect or disconnect'),
    }),
    
    resolveOutputSchema: () => z.object({
      linked: z.boolean(),
      message: z.string(),
    }),
    
    auth: {
      policies: [{ action: getActionId('note.write') }],
    },
    
    createHandler: (strapi) => async ({ args, context }) => {
      const brainService = strapi.plugin(PLUGIN_NAME).service('brain') as BrainService;
      
      const noteDocId = await brainService.resolveEntityBySlug('note', args.note);
      if (!noteDocId) {
        throw new Error(`Note not found: ${args.note}`);
      }

      const relationTypeMap: Record<string, string> = {
        people: 'person',
        projects: 'project',
        sources: 'source',
        decisions: 'decision',
      };
      const targetType = relationTypeMap[args.relation];

      const targetDocIds = await Promise.all(
        args.targets.map(async (target) => {
          const docId = await brainService.resolveEntityBySlug(targetType, target);
          if (!docId) {
            throw new Error(`${targetType} not found: ${target}`);
          }
          return docId;
        })
      );

      await brainService.linkEntities(
        noteDocId,
        args.relation as any,
        targetDocIds,
        args.operation
      );

      const output = {
        linked: true,
        message: `${args.operation === 'connect' ? 'Connected' : 'Disconnected'} ${targetDocIds.length} ${args.relation}`,
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
