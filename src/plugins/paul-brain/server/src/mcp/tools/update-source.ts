import type { Core } from '@strapi/strapi';
import { z } from '@strapi/utils';
import { getActionId, PLUGIN_NAME } from '../permissions';
import { getUid } from '../types';
import type { BrainService } from '../../services/brain';
import { stripNullish } from '../utils';

export const register = (strapi: Core.Strapi) => {
  strapi.ai.mcp.registerTool({
    name: 'update_source',
    title: 'Update Source',
    description: 'Update an existing source by documentId or slug. See get_brain_guide for usage.',
    
    resolveInputSchema: () => z.object({
      source: z.string().describe('Source documentId or slug'),
      title: z.string().optional().describe('New title'),
      type: z.enum(['video', 'article', 'email', 'transcript', 'chat', 'repo', 'other']).optional().describe('Source type'),
      url: z.string().optional().describe('Source URL'),
      videoId: z.string().optional().describe('YouTube video ID'),
      external_id: z.string().optional().describe('External ID'),
      excerpt: z.string().optional().describe('Excerpt or description'),
      captured_on: z.string().optional().describe('Date captured (ISO format)'),
    }),
    
    resolveOutputSchema: () => z.object({
      updated: z.boolean(),
      documentId: z.string(),
      message: z.string(),
    }),
    
    auth: {
      policies: [{ action: getActionId('entity.write') }],
    },
    
    createHandler: (strapi) => async ({ args, context }) => {
      const brainService = strapi.plugin(PLUGIN_NAME).service('brain') as BrainService;
      const uid = getUid('source');
      
      const sourceDocId = await brainService.resolveEntityBySlug('source', args.source);
      if (!sourceDocId) {
        throw new Error(`Source not found: ${args.source}`);
      }

      const updates: any = {};
      
      if (args.title !== undefined) updates.title = args.title;
      if (args.type !== undefined) updates.type = args.type;
      if (args.url !== undefined) updates.url = args.url;
      if (args.videoId !== undefined) updates.videoId = args.videoId;
      if (args.external_id !== undefined) updates.external_id = args.external_id;
      if (args.excerpt !== undefined) updates.excerpt = args.excerpt;
      if (args.captured_on !== undefined) updates.captured_on = args.captured_on;

      if (Object.keys(updates).length === 0) {
        throw new Error('No fields to update');
      }

      const result = await strapi.documents(uid).update({
        documentId: sourceDocId,
        data: updates,
      });

      const output = stripNullish({
        updated: true,
        documentId: result.documentId,
        message: 'Source updated successfully',
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
