import type { Core } from '@strapi/strapi';
import { z } from '@strapi/utils';
import { getActionId, PLUGIN_NAME } from '../permissions';
import { getUid } from '../types';
import type { BrainService } from '../../services/brain';
import { stripNullish } from '../utils';

export const register = (strapi: Core.Strapi) => {
  strapi.ai.mcp.registerTool({
    name: 'upsert_source',
    title: 'Upsert Source',
    description: 'Create or update a source. Matches by slug (from title), videoId, or url. Updates matched source or creates new. See get_brain_guide for usage.',
    
    resolveInputSchema: () => z.object({
      title: z.string().describe('Source title (used to generate slug)'),
      type: z.enum(['video', 'article', 'email', 'transcript', 'chat', 'repo', 'other']).optional().describe('Source type'),
      url: z.string().optional().describe('Source URL'),
      videoId: z.string().optional().describe('YouTube video ID'),
      external_id: z.string().optional().describe('External ID (e.g., video ID, article ID)'),
      excerpt: z.string().optional().describe('Excerpt or description'),
      captured_on: z.string().optional().describe('Date captured (ISO format)'),
    }),
    
    resolveOutputSchema: () => z.object({
      created: z.boolean(),
      documentId: z.string(),
      slug: z.string(),
      message: z.string(),
    }),
    
    auth: {
      policies: [{ action: getActionId('entity.write') }],
    },
    
    createHandler: (strapi) => async ({ args, context }) => {
      const brainService = strapi.plugin(PLUGIN_NAME).service('brain') as BrainService;
      const uid = getUid('source');
      
      const slug = brainService.slugify(args.title);
      
      // Try to find existing source by slug, videoId, or url
      let existing = await brainService.findBySlugOrAlias('source', slug);
      
      if (!existing.exists && args.videoId) {
        const sources = await strapi.documents(uid).findMany({
          filters: { videoId: { $eq: args.videoId } },
          limit: 1,
        });
        if (sources.length > 0) {
          existing = { exists: true, documentId: sources[0].documentId, entity: sources[0] };
        }
      }
      
      if (!existing.exists && args.url) {
        const sources = await strapi.documents(uid).findMany({
          filters: { url: { $eq: args.url } },
          limit: 1,
        });
        if (sources.length > 0) {
          existing = { exists: true, documentId: sources[0].documentId, entity: sources[0] };
        }
      }

      let result: any;
      let created = false;
      let message = '';

      if (existing.exists) {
        // Update existing source
        const updates: any = {
          title: args.title,
        };
        
        if (args.type) updates.type = args.type;
        if (args.url) updates.url = args.url;
        if (args.videoId) updates.videoId = args.videoId;
        if (args.external_id) updates.external_id = args.external_id;
        if (args.excerpt) updates.excerpt = args.excerpt;
        if (args.captured_on) updates.captured_on = args.captured_on;

        result = await strapi.documents(uid).update({
          documentId: existing.documentId!,
          data: updates,
        });
        message = 'Updated existing source';
      } else {
        // Create new source
        result = await strapi.documents(uid).create({
          data: {
            title: args.title,
            slug,
            type: args.type || 'other',
            url: args.url,
            videoId: args.videoId,
            external_id: args.external_id,
            excerpt: args.excerpt,
            captured_on: args.captured_on,
          },
        });
        created = true;
        message = 'Created new source';
      }

      const output = stripNullish({
        created,
        documentId: result.documentId,
        slug: result.slug,
        message,
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
