import type { Core } from '@strapi/strapi';
import crypto from 'crypto';
import { getUid } from '../mcp/types';

/**
 * Webhook outbox worker
 * Processes pending deliveries and sends webhook notifications
 */

const BACKOFF_DELAYS_MS = [15000, 60000, 300000, 1500000, 7200000]; // 15s, 1m, 5m, 25m, 2h
const MAX_ATTEMPTS = 5;

export const startOutboxWorker = (strapi: Core.Strapi, config: any) => {
  const intervalMs = 10000; // Check every 10 seconds

  const processOutbox = async () => {
    try {
      const deliveryUid = getUid('delivery');
      const messageUid = getUid('message');
      const agentUid = getUid('agent');

      // Find due deliveries
      const deliveries = await strapi.documents(deliveryUid).findMany({
        filters: {
          status: { $in: ['pending', 'failed'] },
          nextAttemptAt: { $lte: new Date().toISOString() },
        },
        populate: {
          agent: { fields: ['webhookUrl', 'webhookSecret', 'webhookAuthHeader', 'webhookMode', 'webhookTimeoutMs', 'slug', 'status'] },
          message: {
            fields: ['type', 'body', 'payload', 'priority', 'blastRadius', 'flagged'],
            populate: {
              from: { fields: ['slug'] },
              to: { fields: ['slug'] },
              thread: { fields: ['documentId'] },
            },
          },
        },
        limit: 10,
      });

      for (const delivery of deliveries) {
        const agent = delivery.agent as any;
        const message = delivery.message as any;

        // Skip if agent is disabled or has no webhook
        if (agent.status !== 'active' || !agent.webhookUrl) {
          await strapi.documents(deliveryUid).update({
            documentId: delivery.documentId,
            data: { status: 'skipped' },
          });
          continue;
        }

        // Check HTTPS requirement (allow HTTP only in development)
        if (agent.webhookUrl.startsWith('http://') && !config.allowInsecureWebhooks) {
          await strapi.documents(deliveryUid).update({
            documentId: delivery.documentId,
            data: {
              status: 'skipped',
              lastError: 'HTTP webhooks not allowed in production',
            },
          });
          continue;
        }

        // Check max attempts
        if (delivery.attemptCount >= MAX_ATTEMPTS) {
          await strapi.documents(deliveryUid).update({
            documentId: delivery.documentId,
            data: {
              status: 'exhausted',
              lastError: 'Max attempts exceeded',
            },
          });

          // Audit exhausted delivery
          const busService = strapi.plugin('agent-bus').service('bus');
          await busService.audit({
            action: 'delivery.exhausted',
            entityType: 'delivery',
            entityDocumentId: delivery.documentId,
            metadata: {
              messageId: message.documentId,
              agentSlug: agent.slug,
              attempts: delivery.attemptCount,
            },
          });
          continue;
        }

        try {
          // Build webhook payload
          const timestamp = Math.floor(Date.now() / 1000);
          const payload: any = {
            event: delivery.event,
            messageId: message.documentId,
            threadId: message.thread?.documentId,
            type: message.type,
            from: message.from?.slug,
            to: message.to?.slug,
            priority: message.priority,
            blastRadius: message.blastRadius,
            flagged: message.flagged,
          };

          // Include body/payload for full mode
          if (agent.webhookMode === 'full') {
            payload.body = message.body;
            payload.payload = message.payload;
            payload.untrusted = true;
          }

          const body = JSON.stringify(payload);

          // Sign the request
          const signatureInput = `${timestamp}.${body}`;
          const signature = crypto
            .createHmac('sha256', agent.webhookSecret || '')
            .update(signatureInput)
            .digest('hex');

          // Send webhook
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), agent.webhookTimeoutMs || 5000);

          // Build headers
          const headers: Record<string, string> = {
            'Content-Type': 'application/json',
            'User-Agent': 'agent-bus/1',
            'X-Agent-Bus-Event': delivery.event,
            'X-Agent-Bus-Timestamp': timestamp.toString(),
            'X-Agent-Bus-Idempotency-Key': delivery.idempotencyKey,
            'X-Agent-Bus-Signature': `sha256=${signature}`,
          };

          // Add custom Authorization header if configured (for Grok Bot routine webhooks)
          if (agent.webhookAuthHeader) {
            headers.Authorization = agent.webhookAuthHeader;
          }

          const response = await fetch(agent.webhookUrl, {
            method: 'POST',
            headers,
            body,
            signal: controller.signal,
          });

          clearTimeout(timeoutId);

          if (response.ok) {
            // Success (2xx)
            await strapi.documents(deliveryUid).update({
              documentId: delivery.documentId,
              data: {
                status: 'delivered',
                deliveredAt: new Date().toISOString(),
                lastStatusCode: response.status,
                lastError: null,
              },
            });

            // Update message status to notified if it was queued
            if (message.status === 'queued') {
              await strapi.documents(messageUid).update({
                documentId: message.documentId,
                data: { status: 'notified' },
              });
            }

            const busService = strapi.plugin('agent-bus').service('bus');
            await busService.audit({
              action: 'delivery.delivered',
              entityType: 'delivery',
              entityDocumentId: delivery.documentId,
              metadata: {
                messageId: message.documentId,
                agentSlug: agent.slug,
                statusCode: response.status,
              },
            });
          } else if (response.status === 410 || response.status === 404) {
            // Gone/Not Found - might be intentional, mark as skipped
            await strapi.documents(deliveryUid).update({
              documentId: delivery.documentId,
              data: {
                status: 'skipped',
                lastStatusCode: response.status,
                lastError: `Endpoint returned ${response.status}`,
              },
            });
          } else {
            // Retry on other errors
            throw new Error(`HTTP ${response.status}`);
          }
        } catch (error: any) {
          // Failed - schedule retry with backoff
          const attemptCount = delivery.attemptCount + 1;
          const delayMs = BACKOFF_DELAYS_MS[Math.min(attemptCount - 1, BACKOFF_DELAYS_MS.length - 1)];
          const nextAttemptAt = new Date(Date.now() + delayMs);

          await strapi.documents(deliveryUid).update({
            documentId: delivery.documentId,
            data: {
              status: 'failed',
              attemptCount,
              nextAttemptAt: nextAttemptAt.toISOString(),
              lastError: error.message || String(error),
            },
          });

          strapi.log.warn(
            `[agent-bus] Delivery ${delivery.documentId} failed (attempt ${attemptCount}/${MAX_ATTEMPTS}): ${error.message}`
          );
        }
      }
    } catch (error) {
      strapi.log.error('[agent-bus] Outbox worker error:', error);
    }
  };

  // Start the interval
  const intervalId = setInterval(processOutbox, intervalMs);

  strapi.log.info('[agent-bus] Outbox worker started');

  return intervalId;
};
