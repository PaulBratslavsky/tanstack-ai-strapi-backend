import type { Core } from '@strapi/strapi';
import { z } from '@strapi/utils';
import { getActionId, PLUGIN_NAME } from '../permissions';
import { getUid } from '../types';
import type { BrainService } from '../../services/brain';

export const register = (strapi: Core.Strapi) => {
  strapi.ai.mcp.registerTool({
    name: 'remember',
    title: 'Remember in Brain',
    description: 'Create a note OR merge with existing (by slug/alias). Default mode: merge (appends). Use replace to overwrite, new to force new. Auto-creates missing linked entities with createMissing. Always set tags and source_bot. See get_brain_guide for usage.',
    
    resolveInputSchema: () => z.object({
      title: z.string().describe('Note title (used to generate slug)'),
      body: z.string().optional().describe('Note body (markdown)'),
      summary: z.string().max(280).optional().describe('Short summary'),
      kind: z.enum(['fact', 'preference', 'idea', 'todo', 'log', 'reference']).optional().describe('Note kind (default: fact)'),
      tags: z.array(z.string()).optional().describe('Tags for categorization'),
      confidence: z.enum(['low', 'medium', 'high']).optional().describe('Confidence level'),
      source_bot: z.string().optional().describe('Bot identifier that created this'),
      pinned: z.boolean().optional().describe('Pin this note for higher search ranking'),
      expires_on: z.string().optional().describe('Expiration date (ISO format)'),
      mode: z.enum(['merge', 'replace', 'new']).optional().describe('merge: append to existing (default), replace: overwrite, new: force new'),
      createMissing: z.boolean().optional().describe('Auto-create missing people/projects/sources by name'),
      link_people: z.array(z.string()).optional().describe('People names or slugs to link'),
      link_projects: z.array(z.string()).optional().describe('Project names or slugs to link'),
      link_sources: z.array(z.string()).optional().describe('Source titles or slugs to link'),
    }),
    
    resolveOutputSchema: () => z.object({
      created: z.boolean(),
      documentId: z.string(),
      slug: z.string(),
      message: z.string(),
    }),
    
    auth: {
      policies: [{ action: getActionId('note.write') }],
    },
    
    createHandler: (strapi) => async ({ args, context }) => {
      const brainService = strapi.plugin(PLUGIN_NAME).service('brain') as BrainService;
      const uid = getUid('note');
      
      const slug = brainService.slugify(args.title);
      const mode = args.mode || 'merge';
      
      const existing = await brainService.findBySlugOrAlias('note', slug);

      let result: any;
      let created = false;
      let message = '';

      if (existing.exists && mode !== 'new') {
        if (mode === 'merge') {
          result = await brainService.mergeNote(existing.documentId!, {
            body: args.body,
            summary: args.summary,
            kind: args.kind,
            tags: args.tags,
            confidence: args.confidence,
            source_bot: args.source_bot,
            pinned: args.pinned,
            expires_on: args.expires_on,
          });
          message = 'Merged with existing note';
        } else {
          result = await strapi.documents(uid).update({
            documentId: existing.documentId!,
            data: {
              title: args.title,
              body: args.body,
              summary: args.summary,
              kind: args.kind || 'fact',
              tags: args.tags || [],
              confidence: args.confidence || 'medium',
              source_bot: args.source_bot,
              pinned: args.pinned,
              expires_on: args.expires_on,
            },
          });
          message = 'Replaced existing note';
        }
      } else {
        const data: any = {
          title: args.title,
          slug,
          body: args.body,
          summary: args.summary,
          kind: args.kind || 'fact',
          tags: args.tags || [],
          confidence: args.confidence || 'medium',
          source_bot: args.source_bot,
          pinned: args.pinned || false,
          expires_on: args.expires_on,
        };

        if (args.createMissing) {
          if (args.link_people) {
            const peopleIds = await Promise.all(
              args.link_people.map(async (name) => {
                const personSlug = brainService.slugify(name);
                const existingPerson = await brainService.findBySlugOrAlias('person', personSlug);
                if (existingPerson.exists) {
                  return existingPerson.documentId;
                }
                const newPerson = await strapi.documents(getUid('person')).create({
                  data: { name, slug: personSlug },
                });
                return newPerson.documentId;
              })
            );
            data.people = { connect: peopleIds.map(id => ({ documentId: id })) };
          }

          if (args.link_projects) {
            const projectIds = await Promise.all(
              args.link_projects.map(async (name) => {
                const projectSlug = brainService.slugify(name);
                const existingProject = await brainService.findBySlugOrAlias('project', projectSlug);
                if (existingProject.exists) {
                  return existingProject.documentId;
                }
                const newProject = await strapi.documents(getUid('project')).create({
                  data: { name, slug: projectSlug },
                });
                return newProject.documentId;
              })
            );
            data.projects = { connect: projectIds.map(id => ({ documentId: id })) };
          }

          if (args.link_sources) {
            const sourceIds = await Promise.all(
              args.link_sources.map(async (title) => {
                const sourceSlug = brainService.slugify(title);
                const existingSource = await brainService.findBySlugOrAlias('source', sourceSlug);
                if (existingSource.exists) {
                  return existingSource.documentId;
                }
                const newSource = await strapi.documents(getUid('source')).create({
                  data: { title, slug: sourceSlug },
                });
                return newSource.documentId;
              })
            );
            data.sources = { connect: sourceIds.map(id => ({ documentId: id })) };
          }
        }

        result = await strapi.documents(uid).create({ data });
        created = true;
        message = 'Created new note';
      }

      const output = {
        created,
        documentId: result.documentId,
        slug: result.slug,
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
