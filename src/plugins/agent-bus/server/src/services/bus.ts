import type { Core } from '@strapi/strapi';
import { getUid } from '../mcp/types';
import { scanForInjection } from '../utils/sanitizer';
import type { CallerInfo } from './auth';

export interface SendMessageInput {
  type: 'question' | 'task' | 'status' | 'proof' | 'result' | 'reply' | 'escalation' | 'notice';
  body: string;
  to?: string; // slug or documentId, defaults to 'chief'
  subject?: string;
  threadId?: string; // continue existing thread
  parentId?: string;
  priority?: 'P0' | 'P1' | 'P2' | 'P3';
  blastRadius?: 'green' | 'yellow' | 'red';
  riskClass?: 'none' | 'data_write' | 'external_message' | 'payment' | 'delete' | 'credentials';
  acceptanceCriteria?: string;
  payload?: Record<string, any>;
  correlationId?: string;
  externalRefs?: Array<{ type: string; id: string; url?: string }>;
  expiresAt?: string;
  idempotencyKey?: string;
}

export interface SendMessageOutput {
  messageId: string;
  threadId: string;
  status: string;
  duplicate?: boolean;
}

/**
 * Main bus service handling all message operations
 */
export default ({ strapi }: { strapi: Core.Strapi }) => ({
  /**
   * Send a message
   */
  async sendMessage(caller: CallerInfo, input: SendMessageInput): Promise<SendMessageOutput> {
    const messageUid = getUid('message');
    const threadUid = getUid('thread');
    const agentUid = getUid('agent');
    
    // Validate required fields
    if (input.type === 'task' && !input.acceptanceCriteria) {
      throw new Error('acceptanceCriteria is required for task messages');
    }

    if (input.body.length > 20000) {
      throw new Error('Message body exceeds 20,000 character limit');
    }

    if (input.payload && JSON.stringify(input.payload).length > 32768) {
      throw new Error('Payload exceeds 32KB limit');
    }

    // Check idempotency
    if (input.idempotencyKey) {
      const existing = await strapi.documents(messageUid).findMany({
        filters: {
          idempotencyKey: { $eq: input.idempotencyKey },
          from: { documentId: { $eq: caller.agentDocumentId } },
        },
        limit: 1,
      });

      if (existing && existing.length > 0) {
        const msg = existing[0];
        return {
          messageId: msg.documentId,
          threadId: (msg.thread as any)?.documentId || '',
          status: msg.state, // Map state to status for external API
          duplicate: true,
        };
      }
    }

    // Resolve 'to' agent (default to 'chief')
    const toSlugOrId = input.to || 'chief';
    const toAgents = await strapi.documents(agentUid).findMany({
      filters: {
        $or: [
          { slug: { $eq: toSlugOrId } },
          { documentId: { $eq: toSlugOrId } },
        ],
        state: { $eq: 'active' },
      },
      limit: 1,
    });

    if (!toAgents || toAgents.length === 0) {
      throw new Error(`Agent '${toSlugOrId}' not found or not active`);
    }

    const toAgent = toAgents[0];

    // Check rate limits
    await this.checkRateLimits(caller.agentDocumentId);

    // Scan for injection
    const scanResult = scanForInjection(input.body);

    // Apply risk class upgrades
    let blastRadius = input.blastRadius || 'green';
    let reviewLevel = input.blastRadius === 'red' ? 'human' : undefined;

    const forcedRedRisks = ['payment', 'delete', 'external_message', 'credentials'];
    if (input.riskClass && forcedRedRisks.includes(input.riskClass)) {
      blastRadius = 'red';
      reviewLevel = 'human';
    }

    // Get or create thread
    let thread: any;
    if (input.threadId) {
      const threads = await strapi.documents(threadUid).findMany({
        filters: { documentId: { $eq: input.threadId } },
        populate: { participants: true },
      });

      if (!threads || threads.length === 0) {
        throw new Error('Thread not found');
      }

      thread = threads[0];

      // Verify caller is a participant
      const participantIds = (thread.participants as any[])?.map(p => p.documentId) || [];
      if (!participantIds.includes(caller.agentDocumentId)) {
        throw new Error('Not authorized to post in this thread');
      }

      // Check turn limit
      if (thread.turnCount >= thread.maxTurns) {
        // Only allow if caller has message.manage permission
        // For now, we'll throw an error (force flag can be added later)
        throw new Error('Thread turn limit exceeded');
      }

      // Increment turn count
      await strapi.documents(threadUid).update({
        documentId: thread.documentId,
        data: {
          turnCount: thread.turnCount + 1,
          lastMessageAt: new Date().toISOString(),
        },
      });
    } else {
      // Create new thread
      const subject = input.subject || input.body.substring(0, 80).replace(/\n/g, ' ');
      
      thread = await strapi.documents(threadUid).create({
        data: {
          subject,
          state: 'open',
          originAgent: { connect: [{ documentId: caller.agentDocumentId }] },
          participants: { 
            connect: [
              { documentId: caller.agentDocumentId },
              { documentId: toAgent.documentId },
            ],
          },
          turnCount: 1,
          correlationId: input.correlationId,
          externalRefs: input.externalRefs || [],
          lastMessageAt: new Date().toISOString(),
        },
      });
    }

    // Get caller agent for sourceLabel
    const callerAgents = await strapi.documents(agentUid).findMany({
      filters: { documentId: { $eq: caller.agentDocumentId } },
      fields: ['slug'],
    });
    const callerSlug = callerAgents[0]?.slug || 'unknown';

    // Create message
    const message = await strapi.documents(messageUid).create({
      data: {
        thread: { connect: [{ documentId: thread.documentId }] },
        from: { connect: [{ documentId: caller.agentDocumentId }] },
        to: { connect: [{ documentId: toAgent.documentId }] },
        parent: input.parentId ? { connect: [{ documentId: input.parentId }] } : undefined,
        type: input.type,
        body: input.body,
        payload: input.payload || {},
        state: 'queued',
        priority: input.priority || 'P2',
        blastRadius,
        reviewLevel,
        riskClass: input.riskClass || 'none',
        acceptanceCriteria: input.acceptanceCriteria,
        idempotencyKey: input.idempotencyKey,
        correlationId: input.correlationId || thread.correlationId,
        expiresAt: input.expiresAt,
        untrusted: true,
        flagged: scanResult.flagged,
        flagReason: scanResult.reason,
        sourceLabel: callerSlug,
      },
    });

    // Audit
    await this.audit({
      action: 'message.send',
      actorAgent: caller.agentDocumentId,
      actorLabel: callerSlug,
      entityType: 'message',
      entityDocumentId: message.documentId,
      metadata: {
        type: input.type,
        to: toAgent.slug,
        threadId: thread.documentId,
        blastRadius,
        flagged: scanResult.flagged,
      },
    });

    // Enqueue delivery (webhook wake)
    await this.enqueueDelivery(message.documentId, toAgent.documentId, 'message.queued');

    return {
      messageId: message.documentId,
      threadId: thread.documentId,
      status: 'queued',
    };
  },

  /**
   * Check rate limits for an agent
   */
  async checkRateLimits(agentDocumentId: string): Promise<void> {
    const agentUid = getUid('agent');
    const auditUid = getUid('audit-event');
    
    const agents = await strapi.documents(agentUid).findMany({
      filters: { documentId: { $eq: agentDocumentId } },
      fields: ['rateLimitPerMinute', 'rateLimitPerDay'],
    });

    if (!agents || agents.length === 0) {
      throw new Error('Agent not found');
    }

    const agent = agents[0];
    const now = new Date();
    const oneMinuteAgo = new Date(now.getTime() - 60 * 1000);
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    // Count recent actions
    const recentMinute = await strapi.documents(auditUid).findMany({
      filters: {
        actorAgent: { documentId: { $eq: agentDocumentId } },
        action: { $in: ['message.send', 'message.claim', 'message.reply'] },
        at: { $gte: oneMinuteAgo.toISOString() },
      },
    });

    const recentDay = await strapi.documents(auditUid).findMany({
      filters: {
        actorAgent: { documentId: { $eq: agentDocumentId } },
        action: { $in: ['message.send', 'message.claim', 'message.reply'] },
        at: { $gte: oneDayAgo.toISOString() },
      },
    });

    if (recentMinute.length >= agent.rateLimitPerMinute) {
      await this.audit({
        action: 'rate_limit',
        actorAgent: agentDocumentId,
        entityType: 'agent',
        entityDocumentId: agentDocumentId,
        metadata: { window: 'minute', limit: agent.rateLimitPerMinute },
      });
      throw new Error('Rate limit exceeded (per minute)');
    }

    if (recentDay.length >= agent.rateLimitPerDay) {
      await this.audit({
        action: 'rate_limit',
        actorAgent: agentDocumentId,
        entityType: 'agent',
        entityDocumentId: agentDocumentId,
        metadata: { window: 'day', limit: agent.rateLimitPerDay },
      });
      throw new Error('Rate limit exceeded (per day)');
    }
  },

  /**
   * Enqueue a webhook delivery
   */
  async enqueueDelivery(messageDocumentId: string, agentDocumentId: string, event: string): Promise<void> {
    const agentUid = getUid('agent');
    const deliveryUid = getUid('delivery');

    const agents = await strapi.documents(agentUid).findMany({
      filters: { documentId: { $eq: agentDocumentId } },
      fields: ['webhookUrl', 'state', 'slug'],
    });

    if (!agents || agents.length === 0) {
      return;
    }

    const agent = agents[0];

    if (agent.state !== 'active' || !agent.webhookUrl) {
      // Skip delivery
      return;
    }

    const idempotencyKey = `${event}:${messageDocumentId}:${agent.slug}`;

    // Check if already exists
    const existing = await strapi.documents(deliveryUid).findMany({
      filters: { idempotencyKey: { $eq: idempotencyKey } },
      limit: 1,
    });

    if (existing && existing.length > 0) {
      return; // Already enqueued
    }

    await strapi.documents(deliveryUid).create({
      data: {
        message: { connect: [{ documentId: messageDocumentId }] },
        agent: { connect: [{ documentId: agentDocumentId }] },
        event,
        url: agent.webhookUrl,
        state: 'pending',
        attemptCount: 0,
        nextAttemptAt: new Date().toISOString(),
        idempotencyKey,
      },
    });
  },

  /**
   * Audit an action
   */
  async audit(data: {
    action: string;
    actorAgent?: string;
    actorLabel?: string;
    entityType?: string;
    entityDocumentId?: string;
    requestId?: string;
    metadata?: Record<string, any>;
  }): Promise<void> {
    const auditUid = getUid('audit-event');
    
    await strapi.documents(auditUid).create({
      data: {
        at: new Date().toISOString(),
        action: data.action,
        actorAgent: data.actorAgent ? { connect: [{ documentId: data.actorAgent }] } : undefined,
        actorLabel: data.actorLabel,
        entityType: data.entityType,
        entityDocumentId: data.entityDocumentId,
        requestId: data.requestId,
        metadata: data.metadata || {},
      },
    });
  },

  /**
   * Get inbox messages for an agent
   */
  async getInbox(caller: CallerInfo, options: {
    statuses?: string[];
    priority?: string;
    limit?: number;
    includeBody?: boolean;
  } = {}): Promise<any> {
    const messageUid = getUid('message');
    const limit = Math.min(options.limit || 20, 50);

    const filters: any = {
      to: { documentId: { $eq: caller.agentDocumentId } },
    };

    const openStatuses = [
      'queued',
      'notified',
      'claimed',
      'in_progress',
      'waiting_info',
      'waiting_approval',
      'scheduled',
    ];

    if (options.statuses && options.statuses.length > 0) {
      filters.state = { $in: options.statuses };
    } else {
      filters.state = { $in: openStatuses };
    }

    if (options.priority) {
      filters.priority = { $eq: options.priority };
    }

    const messages = await strapi.documents(messageUid).findMany({
      filters,
      populate: {
        from: { fields: ['slug', 'name'] },
        to: { fields: ['slug', 'name'] },
        thread: { fields: ['subject', 'documentId'] },
      },
      limit,
      sort: ['priority:asc', 'createdAt:asc'],
    });

    const summaries = messages.map((msg: any) => ({
      messageId: msg.documentId,
      threadId: msg.thread?.documentId,
      subject: msg.thread?.subject,
      type: msg.type,
      from: msg.from?.slug,
      priority: msg.priority,
      blastRadius: msg.blastRadius,
      flagged: msg.flagged,
      status: msg.state, // Map state to status for external API
      createdAt: msg.createdAt,
      ...(options.includeBody ? { body: msg.body, untrusted: msg.untrusted } : {}),
    }));

    const unreadCount = await strapi.documents(messageUid).count({
      filters: {
        to: { documentId: { $eq: caller.agentDocumentId } },
        state: { $in: openStatuses },
      },
    });

    return {
      messages: summaries,
      unreadCount,
    };
  },

  /**
   * Claim a message
   */
  async claimMessage(caller: CallerInfo, messageId: string, leaseMinutes: number = 15): Promise<any> {
    const messageUid = getUid('message');
    
    const messages = await strapi.documents(messageUid).findMany({
      filters: { documentId: { $eq: messageId } },
      populate: { to: true, claimedBy: true },
    });

    if (!messages || messages.length === 0) {
      throw new Error('Message not found');
    }

    const message = messages[0];

    // Check authorization
    if ((message.to as any)?.documentId !== caller.agentDocumentId) {
      throw new Error('Not authorized to claim this message');
    }

    // Check if claimable
    const claimableStatuses = ['queued', 'notified', 'claimed'];
    if (!claimableStatuses.includes(message.state)) {
      throw new Error(`Message cannot be claimed (status: ${message.state})`);
    }

    // If already claimed by same agent, extend lease
    const claimedUntil = new Date(Date.now() + leaseMinutes * 60 * 1000);

    await strapi.documents(messageUid).update({
      documentId: messageId,
      data: {
        state: 'claimed',
        claimedBy: { connect: [{ documentId: caller.agentDocumentId }] },
        claimedUntil: claimedUntil.toISOString(),
      },
    });

    await this.audit({
      action: 'message.claim',
      actorAgent: caller.agentDocumentId,
      actorLabel: caller.agentSlug,
      entityType: 'message',
      entityDocumentId: messageId,
      metadata: { leaseMinutes },
    });

    return {
      messageId,
      status: 'claimed', // External API uses status
      claimedUntil: claimedUntil.toISOString(),
    };
  },
});
