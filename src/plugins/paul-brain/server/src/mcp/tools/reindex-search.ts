import type { Core } from '@strapi/strapi';
import { z } from '@strapi/utils';
import { getActionId } from '../permissions';
import { CONTENT_TYPES, getUid } from '../types';
import { stripNullish } from '../utils';

const TYPE_NAMES = [...CONTENT_TYPES] as [string, ...string[]];

export const register = (strapi: Core.Strapi) => {
  strapi.ai.mcp.registerTool({
    name: 'reindex_search',
    title: 'Reindex Hybrid Search',
    description:
      'Rebuild the hybrid search index for brain content. Pages through every configured type, embeds changed text with OpenAI when OPENAI_API_KEY is set, and reports per-row errors. dryRun counts work without calling OpenAI or writing. Without the key, keyword text is refreshed and semantic rows stay deferred. Archived rows are removed from the index.',

    resolveInputSchema: () =>
      z.object({
        types: z
          .array(z.enum(TYPE_NAMES))
          .optional()
          .describe('Limit the rebuild to these brain types. Default: every indexed type'),
        dryRun: z.boolean().optional().describe('Count what would change without calling OpenAI or writing'),
      }),

    resolveOutputSchema: () =>
      z.object({
        dryRun: z.boolean(),
        partial: z.boolean(),
        scanned: z.number(),
        embedded: z.number(),
        skipped: z.number(),
        failed: z.number(),
        removed: z.number(),
        deferred: z.number(),
        errors: z.array(
          z.object({
            type: z.string(),
            documentId: z.string(),
            message: z.string(),
          })
        ),
        statusMessage: z.string().nullish(),
      }),

    auth: {
      policies: [{ action: getActionId('search.reindex') }],
    },

    createHandler: (strapi) => async ({ args }) => {
      const unavailable = {
        dryRun: Boolean(args.dryRun),
        partial: true,
        scanned: 0,
        embedded: 0,
        skipped: 0,
        failed: 0,
        removed: 0,
        deferred: 0,
        errors: [{ type: 'hybrid-search', documentId: '*', message: 'hybrid-search plugin is not enabled' }],
        statusMessage: 'hybrid-search plugin is not enabled',
      };

      let report = unavailable;
      try {
        const service = strapi.plugin('hybrid-search').service('search') as {
          reindex: (input: { uids?: string[]; dryRun?: boolean; wait?: boolean }) => Promise<any>;
        };
        const result = await service.reindex({
          uids: args.types?.map((type: string) => getUid(type)),
          dryRun: args.dryRun,
          wait: true,
        });
        const uidToType = new Map(CONTENT_TYPES.map((type) => [getUid(type), type]));
        report = {
          dryRun: Boolean(result?.dryRun),
          partial: Boolean(result?.partial),
          scanned: Number(result?.scanned) || 0,
          embedded: Number(result?.embedded) || 0,
          skipped: Number(result?.skipped) || 0,
          failed: Number(result?.failed) || 0,
          removed: Number(result?.removed) || 0,
          deferred: Number(result?.deferred) || 0,
          errors: Array.isArray(result?.errors)
            ? result.errors.map((error: any) => ({
                type: uidToType.get(error.uid) || error.uid || 'unknown',
                documentId: String(error.documentId || '*'),
                message: String(error.message || 'failed'),
              }))
            : [],
          statusMessage: result?.statusMessage ?? null,
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : 'reindex failed';
        report = {
          ...unavailable,
          errors: [{ type: 'hybrid-search', documentId: '*', message }],
          statusMessage: message,
        };
      }

      const output = stripNullish(report);
      return {
        content: [{ type: 'text', text: JSON.stringify(output, null, 2) }],
        structuredContent: output,
      };
    },
  });
};
