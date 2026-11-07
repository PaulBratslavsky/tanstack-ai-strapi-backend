import type { Core } from '@strapi/strapi';
import { z } from '@strapi/utils';
import { getActionId, PLUGIN_NAME } from '../permissions';
import { getUid } from '../types';
import type { BrainService } from '../../services/brain';
import { stripNullish } from '../utils';

export const register = (strapi: Core.Strapi) => {
  strapi.ai.mcp.registerTool({
    name: 'upsert_person',
    title: 'Upsert Person',
    description: 'Create or update a person. Matches by slug (from name) or alias. Updates matched person or creates new. See get_brain_guide for usage.',
    
    resolveInputSchema: () => z.object({
      name: z.string().describe('Person name (used to generate slug)'),
      role: z.string().optional().describe('Role or title'),
      org: z.string().optional().describe('Organization'),
      email: z.string().email().optional().describe('Email address'),
      handles: z.record(z.string()).optional().describe('Social handles (e.g., {github: "username", x: "username"})'),
      notes_md: z.string().optional().describe('Rich text notes about this person'),
      last_contact: z.string().optional().describe('Last contact date (ISO format)'),
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
      const uid = getUid('person');
      
      const slug = brainService.slugify(args.name);
      
      const existing = await brainService.findBySlugOrAlias('person', slug);

      let result: any;
      let created = false;
      let message = '';

      if (existing.exists) {
        // Update existing person
        const updates: any = {
          name: args.name,
        };
        
        if (args.role !== undefined) updates.role = args.role;
        if (args.org !== undefined) updates.org = args.org;
        if (args.email !== undefined) updates.email = args.email;
        if (args.handles !== undefined) updates.handles = args.handles;
        if (args.notes_md !== undefined) updates.notes_md = args.notes_md;
        if (args.last_contact !== undefined) updates.last_contact = args.last_contact;

        result = await strapi.documents(uid).update({
          documentId: existing.documentId!,
          data: updates,
        });
        message = 'Updated existing person';
      } else {
        // Create new person
        result = await strapi.documents(uid).create({
          data: {
            name: args.name,
            slug,
            role: args.role,
            org: args.org,
            email: args.email,
            handles: args.handles || {},
            notes_md: args.notes_md,
            last_contact: args.last_contact,
          },
        });
        created = true;
        message = 'Created new person';
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
