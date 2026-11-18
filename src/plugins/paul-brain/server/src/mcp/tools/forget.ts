import type { Core } from '@strapi/strapi';
import { z } from '@strapi/utils';
import { getActionId } from '../permissions';
import { getUid } from '../types';
import { actorFrom, recordAudit } from '../../services/audit';
import { isArchivedRecord } from '../../services/archive';
import { stripNullish } from '../utils';

const FORGET_TYPES = ['note', 'person', 'project', 'decision', 'source', 'resource'] as const;

export const register = (strapi: Core.Strapi) => {
  strapi.ai.mcp.registerTool({
    name: 'forget',
    title: 'Forget from Brain',
    description: 'Archive an entity by default (archived flag and archivedAt). Hard-delete only when force is true. Requires confirm: true. Archived rows drop out of recall, list_recent, get_briefing, and kb_stats. See get_brain_guide for usage.',

    resolveInputSchema: () => z.object({
      type: z.enum(FORGET_TYPES).describe('Entity type'),
      identifier: z.string().describe('documentId or slug'),
      confirm: z.boolean().describe('Must be true to confirm'),
      force: z.boolean().optional().describe('Hard-delete. Default false archives the row'),
    }),

    resolveOutputSchema: () => z.object({
      deleted: z.boolean(),
      archived: z.boolean(),
      documentId: z.string(),
      archivedAt: z.string().optional(),
      entity: z.record(z.any()).optional(),
    }),

    auth: {
      policies: [{ action: getActionId('forget') }],
    },

    createHandler: (strapi) => async ({ args, context }) => {
      if (!args.confirm) {
        throw new Error('Deletion requires confirm: true');
      }

      const uid = getUid(args.type as any);
      const entities = await strapi.documents(uid).findMany({
        filters: {
          $or: [
            { documentId: { $eq: args.identifier } },
            { slug: { $eq: args.identifier } },
          ],
        },
        limit: 1,
      });

      if (entities.length === 0) {
        throw new Error(`${args.type} not found: ${args.identifier}`);
      }

      const entity = entities[0];
      const actor = actorFrom(context);
      const label = entity.title || entity.name || entity.documentId;

      if (args.force) {
        await strapi.documents(uid).delete({ documentId: entity.documentId });
        await recordAudit(strapi, {
          action: 'delete',
          entityKind: args.type,
          documentId: entity.documentId,
          changedFields: [],
          actor,
        });
        const output = {
          deleted: true,
          archived: false,
          documentId: entity.documentId,
          entity,
        };
        return {
          content: [{ type: 'text', text: `Deleted ${args.type}: ${label}` }],
          structuredContent: output,
        };
      }

      const archivedAt = new Date().toISOString();
      if (isArchivedRecord(args.type, entity)) {
        const output = stripNullish({
          deleted: false,
          archived: true,
          documentId: entity.documentId,
          archivedAt: entity.archivedAt,
          entity: identityOf(entity),
        });
        return {
          content: [{ type: 'text', text: `${args.type} already archived: ${label}` }],
          structuredContent: output,
        };
      }

      const data = args.type === 'resource'
        ? { state: 'archived', archivedAt }
        : { archived: true, archivedAt };
      await strapi.documents(uid).update({ documentId: entity.documentId, data });
      await recordAudit(strapi, {
        action: 'archive',
        entityKind: args.type,
        documentId: entity.documentId,
        changedFields: Object.keys(data),
        actor,
      });

      const output = stripNullish({
        deleted: false,
        archived: true,
        documentId: entity.documentId,
        archivedAt,
        entity: identityOf(entity),
      });

      return {
        content: [{ type: 'text', text: `Archived ${args.type}: ${label}` }],
        structuredContent: output,
      };
    },
  });
};

function identityOf(entity: any) {
  return stripNullish({
    documentId: entity.documentId,
    title: entity.title,
    name: entity.name,
    slug: entity.slug,
  });
}
