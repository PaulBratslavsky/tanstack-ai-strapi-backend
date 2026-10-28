import type { Core } from '@strapi/strapi';
import { z } from '@strapi/utils';
import { getActionId, PLUGIN_NAME } from '../permissions';
import { getUid } from '../types';

export const register = (strapi: Core.Strapi) => {
  strapi.ai.mcp.registerTool({
    name: 'update_note',
    title: 'Update Brain Note',
    description: 'Patch a note\'s fields. Use appendBody instead of body to add without overwriting. Use addTags/removeTags for tag operations. See get_brain_guide for usage.',
    
    resolveInputSchema: () => z.object({
      identifier: z.string().describe('documentId or slug'),
      title: z.string().optional().describe('New title'),
      body: z.string().optional().describe('Replace body (use appendBody to add)'),
      appendBody: z.string().optional().describe('Append to body (preferred over replace)'),
      summary: z.string().max(280).optional().describe('New summary'),
      kind: z.enum(['fact', 'preference', 'idea', 'todo', 'log', 'reference']).optional().describe('New kind'),
      addTags: z.array(z.string()).optional().describe('Tags to add'),
      removeTags: z.array(z.string()).optional().describe('Tags to remove'),
      confidence: z.enum(['low', 'medium', 'high']).optional().describe('New confidence'),
      pinned: z.boolean().optional().describe('Pin/unpin'),
      expires_on: z.string().optional().describe('New expiration date'),
    }),
    
    resolveOutputSchema: () => z.object({
      updated: z.boolean(),
      documentId: z.string(),
    }),
    
    auth: {
      policies: [{ action: getActionId('note.write') }],
    },
    
    createHandler: (strapi) => async ({ args, context }) => {
      const uid = getUid('note');
      
      const notes = await strapi.documents(uid).findMany({
        filters: {
          $or: [
            { documentId: { $eq: args.identifier } },
            { slug: { $eq: args.identifier } },
          ],
        },
        limit: 1,
      });

      if (notes.length === 0) {
        throw new Error(`Note not found: ${args.identifier}`);
      }

      const note = notes[0];
      const updates: any = {};

      if (args.title) updates.title = args.title;
      if (args.summary) updates.summary = args.summary;
      if (args.kind) updates.kind = args.kind;
      if (args.confidence) updates.confidence = args.confidence;
      if (args.pinned !== undefined) updates.pinned = args.pinned;
      if (args.expires_on) updates.expires_on = args.expires_on;

      if (args.body) {
        updates.body = args.body;
      } else if (args.appendBody) {
        const existingBody = note.body || '';
        updates.body = existingBody ? `${existingBody}\n\n---\n\n${args.appendBody}` : args.appendBody;
      }

      if (args.addTags || args.removeTags) {
        let tags = Array.isArray(note.tags) ? [...note.tags] : [];
        if (args.addTags) {
          tags = [...new Set([...tags, ...args.addTags])];
        }
        if (args.removeTags) {
          tags = tags.filter(t => !args.removeTags!.includes(t));
        }
        updates.tags = tags;
      }

      const result = await strapi.documents(uid).update({
        documentId: note.documentId,
        data: updates,
      });

      const output = {
        updated: true,
        documentId: result.documentId,
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
