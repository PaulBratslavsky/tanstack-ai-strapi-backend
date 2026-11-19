import type { Core } from '@strapi/strapi';
import { z } from '@strapi/utils';
import { getActionId, PLUGIN_NAME } from '../permissions';
import { getUid } from '../types';
import { stripNullish } from '../utils';
import type { BrainService } from '../../services/brain';
import { noteContentAlreadyStored } from '../../services/brain';
import { actorFrom, recordAudit } from '../../services/audit';

export const register = (strapi: Core.Strapi) => {
  strapi.ai.mcp.registerTool({
    name: 'remember',
    title: 'Remember in Brain',
    description: 'Create a note with duplicate detection. When embeddings are available, similar() at cosine 0.9 finds semantic duplicates; otherwise the keyword scan is used. A matching dedupeKey updates the existing note instead of creating another. onDuplicate: merge (append to existing), new (force new), supersede (mark old as superseded). Always set tags and source_bot.',
    
    resolveInputSchema: () => z.object({
      title: z.string().describe('Note title (used to generate slug)'),
      body: z.string().optional().describe('Note body (markdown)'),
      summary: z.string().max(280).optional().describe('Short summary'),
      kind: z.enum(['fact', 'preference', 'idea', 'todo', 'log', 'reference', 'lesson', 'video', 'taught']).optional().describe('Note kind (default: fact)'),
      videoId: z.string().optional().describe('YouTube video ID for video or taught notes'),
      tags: z.array(z.string()).optional().describe('Tags for categorization'),
      confidence: z.enum(['low', 'medium', 'high']).optional().describe('Confidence level'),
      source_bot: z.string().optional().describe('Bot identifier that created this'),
      dedupeKey: z.string().optional().describe('Stable key. A live note with the same key is updated instead of duplicated'),
      pinned: z.boolean().optional().describe('Pin this note for higher search ranking'),
      expires_on: z.string().optional().describe('Expiration date (ISO format)'),
      onDuplicate: z.enum(['merge', 'new', 'supersede']).optional().describe('How to handle duplicates: merge (append), new (force new), supersede (mark old superseded)'),
      createMissing: z.boolean().optional().describe('Auto-create missing people/projects/sources by name'),
      link_people: z.array(z.string()).optional().describe('People names or slugs to link'),
      link_projects: z.array(z.string()).optional().describe('Project names or slugs to link'),
      link_sources: z.array(z.string()).optional().describe('Source titles or slugs to link'),
    }),
    
    resolveOutputSchema: () => z.union([
      z.object({
        needsDecision: z.literal(true),
        candidates: z.array(z.object({
          documentId: z.string(),
          title: z.string(),
          slug: z.string(),
          kind: z.string().optional(),
          summary: z.string().optional(),
        })),
      }),
      z.object({
        created: z.boolean(),
        documentId: z.string(),
        slug: z.string(),
        message: z.string(),
        superseded: z.string().optional(),
      }),
    ]),
    
    auth: {
      policies: [{ action: getActionId('note.write') }],
    },
    
    createHandler: (strapi) => async ({ args, context }) => {
      const brainService = strapi.plugin(PLUGIN_NAME).service('brain') as BrainService;
      const uid = getUid('note');
      
      const slug = brainService.slugify(args.title);
      const actor = actorFrom(context, args.source_bot);

      if (args.dedupeKey) {
        const keyed = await brainService.findActiveByDedupeKey(args.dedupeKey);
        if (keyed) {
          if (noteContentAlreadyStored(keyed, args)) {
            const output = stripNullish({
              created: false,
              documentId: keyed.documentId,
              slug: keyed.slug,
              message: 'Skipped existing note with the same dedupeKey',
            });
            return {
              content: [{ type: 'text', text: JSON.stringify(output, null, 2) }],
              structuredContent: output,
            };
          }

          const merged = await brainService.mergeNote(keyed.documentId, definedNotePatch(args));
          await recordAudit(strapi, {
            action: 'merge',
            entityKind: 'note',
            documentId: merged.documentId,
            changedFields: Object.keys(definedNotePatch(args)),
            actor,
          });
          const output = stripNullish({
            created: false,
            documentId: merged.documentId,
            slug: merged.slug || keyed.slug,
            message: 'Updated existing note matched by dedupeKey',
          });
          return {
            content: [{ type: 'text', text: JSON.stringify(output, null, 2) }],
            structuredContent: output,
          };
        }
      }
      
      // Check for duplicates if onDuplicate is not set
      if (!args.onDuplicate) {
        const candidates = await brainService.findDuplicateNotes(args.title, {
          summary: args.summary,
          body: args.body,
          tags: args.tags,
          dedupeKey: args.dedupeKey,
        });
        
        if (candidates.length > 0) {
          const output = stripNullish({
            needsDecision: true,
            candidates: candidates.map(c => ({
              documentId: c.documentId,
              title: c.title,
              slug: c.slug,
              kind: c.kind,
              summary: c.summary,
            })),
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
        }
      }
      
      const slugHit = await brainService.findBySlugOrAlias('note', slug);
      const existing = slugHit.exists && slugHit.entity?.archived !== true
        ? slugHit
        : { exists: false as const, documentId: undefined, entity: undefined };

      let result: any;
      let created = false;
      let message = '';
      let supersededId: string | undefined;

      const mode = args.onDuplicate || 'merge';

      if (existing.exists && mode !== 'new') {
        if (mode === 'merge') {
          const patch = definedNotePatch(args);
          result = await brainService.mergeNote(existing.documentId!, patch);
          await recordAudit(strapi, {
            action: 'merge',
            entityKind: 'note',
            documentId: result.documentId,
            changedFields: Object.keys(patch),
            actor,
          });
          
          // Apply links if createMissing is true
          if (args.createMissing) {
            await applyLinks(strapi, existing.documentId!, args, brainService);
          }
          
          message = 'Merged with existing note';
        } else if (mode === 'supersede') {
          // Create new note and mark old as superseded
          const createSlug = await slugForNewNote(brainService, slug);
          result = await createNewNote(strapi, uid, args, createSlug, brainService);
          await recordAudit(strapi, {
            action: 'create',
            entityKind: 'note',
            documentId: result.documentId,
            changedFields: ['title', 'slug', 'body', 'summary', 'kind', 'tags', 'dedupeKey'],
            actor,
          });
          
          await strapi.documents(uid).update({
            documentId: existing.documentId!,
            data: {
              supersededBy: { connect: [{ documentId: result.documentId }] },
            },
          });
          await recordAudit(strapi, {
            action: 'supersede',
            entityKind: 'note',
            documentId: existing.documentId!,
            changedFields: ['supersededBy'],
            actor,
          });
          
          created = true;
          message = 'Created new note and superseded old one';
          supersededId = existing.documentId;
        } else {
          const replaced = definedNotePatch(args);
          result = await strapi.documents(uid).update({
            documentId: existing.documentId!,
            data: {
              title: args.title,
              ...replaced,
              kind: args.kind || 'fact',
              tags: args.tags || [],
              confidence: args.confidence || 'medium',
            },
          });
          await recordAudit(strapi, {
            action: 'update',
            entityKind: 'note',
            documentId: result.documentId,
            changedFields: Object.keys(replaced),
            actor,
          });
          message = 'Replaced existing note';
        }
      } else {
        const createSlug = await slugForNewNote(brainService, slug);
        result = await createNewNote(strapi, uid, args, createSlug, brainService);
        await recordAudit(strapi, {
          action: 'create',
          entityKind: 'note',
          documentId: result.documentId,
          changedFields: Object.keys(definedNotePatch(args)).concat(['title', 'slug']),
          actor,
        });
        created = true;
        message = 'Created new note';
      }

      const output = stripNullish({
        created,
        documentId: result.documentId,
        slug: result.slug,
        message,
        superseded: supersededId,
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

async function applyLinks(strapi: Core.Strapi, noteDocId: string, args: any, brainService: BrainService) {
  const uid = getUid('note');
  
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
    await strapi.documents(uid).update({
      documentId: noteDocId,
      data: { people: { connect: peopleIds.map(id => ({ documentId: id })) } },
    });
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
    await strapi.documents(uid).update({
      documentId: noteDocId,
      data: { projects: { connect: projectIds.map(id => ({ documentId: id })) } },
    });
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
    await strapi.documents(uid).update({
      documentId: noteDocId,
      data: { sources: { connect: sourceIds.map(id => ({ documentId: id })) } },
    });
  }
}

function definedNotePatch(args: any): Record<string, unknown> {
  const patch: Record<string, unknown> = {};
  if (args.body !== undefined) patch.body = args.body;
  if (args.summary !== undefined) patch.summary = args.summary;
  if (args.kind !== undefined) patch.kind = args.kind;
  if (args.videoId !== undefined) patch.videoId = args.videoId;
  if (args.tags !== undefined) patch.tags = args.tags;
  if (args.confidence !== undefined) patch.confidence = args.confidence;
  if (args.source_bot !== undefined) patch.source_bot = args.source_bot;
  if (args.pinned !== undefined) patch.pinned = args.pinned;
  if (args.expires_on !== undefined) patch.expires_on = args.expires_on;
  if (args.dedupeKey !== undefined) patch.dedupeKey = args.dedupeKey;
  return patch;
}

async function slugForNewNote(brainService: BrainService, base: string): Promise<string> {
  let candidate = base || 'note';
  for (let n = 2; n < 20; n += 1) {
    const hit = await brainService.findBySlugOrAlias('note', candidate);
    if (!hit.exists || hit.entity?.slug !== candidate) return candidate;
    candidate = `${base}-${n}`;
  }
  return `${base}-new`;
}

async function createNewNote(strapi: Core.Strapi, uid: string, args: any, slug: string, brainService: BrainService) {
  const data: any = {
    title: args.title,
    slug,
    body: args.body,
    summary: args.summary,
    kind: args.kind || 'fact',
    videoId: args.videoId,
    tags: args.tags || [],
    confidence: args.confidence || 'medium',
    source_bot: args.source_bot,
    dedupeKey: args.dedupeKey,
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

  return strapi.documents(uid).create({ data });
}
