import type { Core } from '@strapi/strapi';
import { getUid } from '../mcp/types';

/**
 * Expiry and lease worker
 * - Releases expired leases
 * - Marks expired messages
 * - Processes veto window auto-completion
 */

export const startExpiryWorker = (strapi: Core.Strapi) => {
  const intervalMs = 30000; // Check every 30 seconds

  const processExpiry = async () => {
    try {
      const messageUid = getUid('message');
      const approvalUid = getUid('approval');
      const now = new Date().toISOString();

      // Release expired leases
      const claimedMessages = await strapi.documents(messageUid).findMany({
        filters: {
          state: { $in: ['claimed', 'in_progress'] },
          claimedUntil: { $lt: now },
        },
        limit: 50,
      });

      for (const msg of claimedMessages) {
        const newState = msg.state === 'claimed' ? 'notified' : 'queued';
        
        await strapi.documents(messageUid).update({
          documentId: msg.documentId,
          data: {
            state: newState,
            claimedBy: null,
            claimedUntil: null,
          },
        });

        const busService = strapi.plugin('agent-bus').service('bus');
        await busService.audit({
          action: 'lease.expired',
          entityType: 'message',
          entityDocumentId: msg.documentId,
          metadata: { oldStatus: msg.state, newStatus: newState },
        });
      }

      // Mark expired messages
      const expiredMessages = await strapi.documents(messageUid).findMany({
        filters: {
          expiresAt: { $lt: now },
          state: { $notIn: ['expired', 'completed', 'answered', 'cancelled', 'declined'] },
        },
        limit: 50,
      });

      for (const msg of expiredMessages) {
        await strapi.documents(messageUid).update({
          documentId: msg.documentId,
          data: { state: 'expired' },
        });

        const busService = strapi.plugin('agent-bus').service('bus');
        await busService.audit({
          action: 'message.expired',
          entityType: 'message',
          entityDocumentId: msg.documentId,
          metadata: { expiresAt: msg.expiresAt },
        });
      }

      // Process veto window auto-completion
      const scheduledApprovals = await strapi.documents(approvalUid).findMany({
        filters: {
          state: { $eq: 'pending' },
          vetoUntil: { $lt: now },
        },
        populate: {
          message: { fields: ['documentId', 'state'] },
        },
        limit: 20,
      });

      for (const approval of scheduledApprovals) {
        const message = approval.message as any;

        // Update approval
        await strapi.documents(approvalUid).update({
          documentId: approval.documentId,
          data: {
            state: 'auto_approved',
            decidedAt: now,
            decidedByLabel: 'system',
            reason: 'Veto window elapsed without intervention',
          },
        });

        // Complete the message
        if (message && message.state === 'scheduled') {
          await strapi.documents(messageUid).update({
            documentId: message.documentId,
            data: { state: 'completed' },
          });
        }

        const busService = strapi.plugin('agent-bus').service('bus');
        await busService.audit({
          action: 'approval.auto_complete',
          entityType: 'approval',
          entityDocumentId: approval.documentId,
          metadata: {
            messageId: message.documentId,
            vetoUntil: approval.vetoUntil,
          },
        });
      }
    } catch (error) {
      strapi.log.error('[agent-bus] Expiry worker error:', error);
    }
  };

  // Start the interval
  const intervalId = setInterval(processExpiry, intervalMs);

  strapi.log.info('[agent-bus] Expiry worker started');

  return intervalId;
};
