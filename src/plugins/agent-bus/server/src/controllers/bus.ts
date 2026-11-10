import type { Core } from '@strapi/strapi';
import { getUid } from '../mcp/types';

export default ({ strapi }: { strapi: Core.Strapi }) => ({
  /**
   * GET /api/agent-bus/v1/agents
   */
  async listAgents(ctx: any) {
    try {
      const agentUid = getUid('agent');
      
      const filters: any = {
        state: { $eq: ctx.query.status || 'active' }, // Accept status from query param but use state internally
      };
      
      if (ctx.query.kind) {
        filters.kind = { $eq: ctx.query.kind };
      }

      const agents = await strapi.documents(agentUid).findMany({
        filters,
        fields: ['documentId', 'slug', 'name', 'kind', 'description', 'capabilities'],
        sort: ['kind:asc', 'name:asc'],
      });

      ctx.body = { agents };
    } catch (error: any) {
      ctx.status = 400;
      ctx.body = { error: error.message };
    }
  },

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
   * GET /api/agent-bus/v1/messages/:id
   */
  async getMessage(ctx: any) {
    try {
      const authService = strapi.plugin('agent-bus').service('auth');
      const messageUid = getUid('message');

      const caller = await authService.resolveCaller(strapi, ctx);

      const messages = await strapi.documents(messageUid).findMany({
        filters: { documentId: { $eq: ctx.params.id } },
        populate: {
          thread: true,
          from: { fields: ['slug', 'name'] },
          to: { fields: ['slug', 'name'] },
        },
      });

      if (!messages || messages.length === 0) {
        ctx.status = 404;
        ctx.body = { error: 'Message not found' };
        return;
      }

      const message = messages[0];
      
      // Check authorization
      const isRecipient = (message.to as any)?.documentId === caller.agentDocumentId;
      const isSender = (message.from as any)?.documentId === caller.agentDocumentId;

      if (!isRecipient && !isSender) {
        ctx.status = 404;
        ctx.body = { error: 'Message not found' };
        return;
      }

      ctx.body = { message };
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

  /**
   * POST /api/agent-bus/v1/messages/:id/reply
   */
  async reply(ctx: any) {
    try {
      const authService = strapi.plugin('agent-bus').service('auth');
      const busService = strapi.plugin('agent-bus').service('bus');

      const caller = await authService.resolveCaller(strapi, ctx);
      
      const result = await busService.sendMessage(caller, {
        ...ctx.request.body,
        threadId: ctx.params.id,
        parentId: ctx.params.id,
        type: ctx.request.body.type || 'reply',
      });

      ctx.body = result;
    } catch (error: any) {
      ctx.status = 400;
      ctx.body = { error: error.message };
    }
  },

  /**
   * GET /api/agent-bus/v1/threads/:id
   */
  async getThread(ctx: any) {
    try {
      const authService = strapi.plugin('agent-bus').service('auth');
      const threadUid = getUid('thread');
      const messageUid = getUid('message');

      const caller = await authService.resolveCaller(strapi, ctx);

      const threads = await strapi.documents(threadUid).findMany({
        filters: { documentId: { $eq: ctx.params.id } },
        populate: { participants: { fields: ['documentId', 'slug', 'name'] } },
      });

      if (!threads || threads.length === 0) {
        ctx.status = 404;
        ctx.body = { error: 'Thread not found' };
        return;
      }

      const thread = threads[0];
      const participantIds = (thread.participants as any[])?.map(p => p.documentId) || [];
      
      if (!participantIds.includes(caller.agentDocumentId)) {
        ctx.status = 404;
        ctx.body = { error: 'Thread not found' };
        return;
      }

      const messages = await strapi.documents(messageUid).findMany({
        filters: { thread: { documentId: { $eq: ctx.params.id } } },
        populate: {
          from: { fields: ['slug', 'name'] },
          to: { fields: ['slug', 'name'] },
        },
        sort: ['createdAt:asc'],
      });

      ctx.body = { thread, messages };
    } catch (error: any) {
      ctx.status = 400;
      ctx.body = { error: error.message };
    }
  },

  /**
   * GET /api/agent-bus/v1/approvals
   */
  async listApprovals(ctx: any) {
    try {
      const approvalUid = getUid('approval');
      
      const filters: any = {};
      if (ctx.query.status) {
        filters.state = { $eq: ctx.query.status }; // Accept status from query param but use state internally
      } else {
        filters.state = { $eq: 'pending' };
      }

      const limit = ctx.query.limit ? Math.min(parseInt(ctx.query.limit, 10), 50) : 20;

      const approvals = await strapi.documents(approvalUid).findMany({
        filters,
        populate: {
          message: {
            populate: {
              from: { fields: ['slug', 'name'] },
              to: { fields: ['slug', 'name'] },
            },
          },
          thread: { fields: ['documentId', 'subject'] },
        },
        limit,
        sort: ['createdAt:asc'],
      });

      ctx.body = { approvals };
    } catch (error: any) {
      ctx.status = 400;
      ctx.body = { error: error.message };
    }
  },

  /**
   * POST /api/agent-bus/v1/approvals/:id/decide
   */
  async decide(ctx: any) {
    try {
      const authService = strapi.plugin('agent-bus').service('auth');
      const busService = strapi.plugin('agent-bus').service('bus');
      const approvalUid = getUid('approval');
      const messageUid = getUid('message');

      const caller = await authService.resolveCaller(strapi, ctx);
      const { decision, reason } = ctx.request.body;

      if (!['approved', 'rejected', 'vetoed'].includes(decision)) {
        ctx.status = 400;
        ctx.body = { error: 'Invalid decision' };
        return;
      }

      const approvals = await strapi.documents(approvalUid).findMany({
        filters: { documentId: { $eq: ctx.params.id } },
        populate: { message: { fields: ['documentId'] } },
      });

      if (!approvals || approvals.length === 0) {
        ctx.status = 404;
        ctx.body = { error: 'Approval not found' };
        return;
      }

      const approval = approvals[0];

      if (approval.state !== 'pending') {
        ctx.status = 400;
        ctx.body = { error: `Approval already decided: ${approval.state}` };
        return;
      }

      await strapi.documents(approvalUid).update({
        documentId: ctx.params.id,
        data: {
          status: decision,
          decidedAt: new Date().toISOString(),
          decidedByAgent: { connect: [{ documentId: caller.agentDocumentId }] },
          decidedByLabel: caller.agentSlug,
          reason,
        },
      });

      const messageStatus = decision === 'approved' ? 'completed' : 
                           decision === 'vetoed' ? 'vetoed' : 'declined';

      await strapi.documents(messageUid).update({
        documentId: (approval.message as any).documentId,
        data: { status: messageStatus },
      });

      await busService.audit({
        action: 'approval.decide',
        actorAgent: caller.agentDocumentId,
        actorLabel: caller.agentSlug,
        entityType: 'approval',
        entityDocumentId: ctx.params.id,
        metadata: { decision, messageStatus },
      });

      ctx.body = {
        approvalId: ctx.params.id,
        status: decision,
        messageStatus,
      };
    } catch (error: any) {
      ctx.status = 400;
      ctx.body = { error: error.message };
    }
  },
});
