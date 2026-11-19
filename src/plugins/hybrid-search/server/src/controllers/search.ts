import { getRuntime } from '../runtime';

export default ({ strapi }: { strapi: any }) => ({
  async status(ctx: any) {
    ctx.body = await getRuntime(strapi).status();
  },

  async search(ctx: any) {
    const body = ctx.request?.body || {};
    if (typeof body.query !== 'string' || body.query.trim().length === 0) {
      return ctx.badRequest('query is required');
    }
    ctx.body = await getRuntime(strapi).search({
      query: body.query,
      uids: Array.isArray(body.uids) ? body.uids : undefined,
      limit: typeof body.limit === 'number' ? body.limit : undefined,
      equals: body.equals && typeof body.equals === 'object' ? body.equals : undefined,
      since: typeof body.since === 'string' ? body.since : undefined,
      tag: typeof body.tag === 'string' ? body.tag : undefined,
    });
  },

  async reindex(ctx: any) {
    const body = ctx.request?.body || {};
    ctx.body = await getRuntime(strapi).reindex({
      uids: Array.isArray(body.uids) ? body.uids : undefined,
      dryRun: Boolean(body.dryRun),
      wait: body.wait === false ? false : true,
    });
  },
});
