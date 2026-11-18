/** Wake-up webhooks carry a pointer, not the message. */
export const WEBHOOK_SUBJECT_MAX = 80;

export function shortSubject(subject: unknown): string {
  if (typeof subject !== 'string') return '';
  const text = subject.replace(/\s+/g, ' ').trim();
  if (text.length <= WEBHOOK_SUBJECT_MAX) return text;
  return `${text.slice(0, WEBHOOK_SUBJECT_MAX - 1)}…`;
}

export interface WebhookDeliveryRef {
  event: string;
}

export interface WebhookMessageRef {
  documentId?: string;
  thread?: { documentId?: string; subject?: string } | null;
}

/**
 * Outbox body. Exactly four fields: event, messageId, threadId, and a short subject.
 * Message bodies, payloads, and risk metadata are intentionally absent.
 */
export function buildWebhookPayload(
  delivery: WebhookDeliveryRef,
  message: WebhookMessageRef
): { event: string; messageId: string; threadId: string; subject: string } {
  return {
    event: delivery.event,
    messageId: message?.documentId || '',
    threadId: message?.thread?.documentId || '',
    subject: shortSubject(message?.thread?.subject),
  };
}
