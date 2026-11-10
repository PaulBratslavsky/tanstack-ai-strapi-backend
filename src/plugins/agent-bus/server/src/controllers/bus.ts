import type { Core } from '@strapi/strapi';

export default ({ strapi }: { strapi: Core.Strapi }) => ({
  /**
   * POST /api/agent-bus/v1/messages
   */
  async sendMessage(ctx: any) {
    try {
      const authService = strapi.plugin('agent-bus').service('auth');
      const busService = strapi.plugin('agent-bus').service('bus');

      const caller = await authService.resolveCaller(strapi, ctx);
      const result = await busService.sendMessage(caller, ctx.request.body);

      ctx.status = 202;
      ctx.body = result;
    } catch (error: any) {
      ctx.status = error.message.includes('not found') || error.message.includes('not authorized') ? 404 : 400;
      ctx.body = { error: error.message };
    }
  },

  /**
   * GET /api/agent-bus/v1/inbox
   */
  async getInbox(ctx: any) {
    try {
      const authService = strapi.plugin('agent-bus').service('auth');
      const busService = strapi.plugin('agent-bus').service('bus');

      const caller = await authService.resolveCaller(strapi, ctx);
      
      const options = {
        statuses: ctx.query.statuses ? ctx.query.statuses.split(',') : undefined,
        priority: ctx.query.priority,
        limit: ctx.query.limit ? parseInt(ctx.query.limit, 10) : 20,
        includeBody: ctx.query.includeBody === 'true',
      };

      const result = await busService.getInbox(caller, options);

      ctx.body = result;
    } catch (error: any) {
      ctx.status = 400;
      ctx.body = { error: error.message };
    }
  },

  /**
   * POST /api/agent-bus/v1/messages/:id/claim
   */
  async claimMessage(ctx: any) {
    try {
      const authService = strapi.plugin('agent-bus').service('auth');
      const busService = strapi.plugin('agent-bus').service('bus');

      const caller = await authService.resolveCaller(strapi, ctx);
      const config = strapi.config.get('plugin.agent-bus') || {};
      const leaseMinutes = config.leaseMinutes || 15;

      const result = await busService.claimMessage(caller, ctx.params.id, leaseMinutes);

      ctx.body = result;
    } catch (error: any) {
      ctx.status = error.message.includes('not authorized') ? 404 : 400;
      ctx.body = { error: error.message };
    }
  },
});
