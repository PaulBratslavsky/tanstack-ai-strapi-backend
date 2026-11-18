import type { Core } from '@strapi/strapi';
import { getUid } from '../mcp/types';

const FIELD_NAME = /^[A-Za-z][A-Za-z0-9_]{0,63}$/;

export type AuditAction = 'create' | 'update' | 'merge' | 'supersede' | 'archive' | 'delete';

export interface AuditEvent {
  action: AuditAction;
  entityKind: string;
  documentId: string;
  /** Attribute names that changed. Values are never stored. */
  changedFields: string[];
  actor?: string;
}

export function actorFrom(context: any, explicit?: string): string {
  const preferred = typeof explicit === 'string' ? explicit.trim() : '';
  if (preferred) return clipActor(preferred);
  const user = context?.user || context?.state?.user;
  const label = user?.email || user?.username || user?.name;
  if (typeof label === 'string' && label.trim()) return clipActor(label.trim());
  return 'token';
}

function clipActor(value: string): string {
  return value.replace(/[\r\n]+/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 160) || 'token';
}

export function fieldNames(names: string[]): string[] {
  return [...new Set(names.filter((name) => typeof name === 'string' && FIELD_NAME.test(name)))].sort();
}

/**
 * Append-only audit row: kind, document id, action, changed field names, actor.
 * The content type has no body/title/summary attributes, and this writer never copies values.
 */
export async function recordAudit(strapi: Core.Strapi, event: AuditEvent): Promise<void> {
  if (!event?.documentId || !event.entityKind || !event.action) return;
  const data = {
    at: new Date().toISOString(),
    action: event.action,
    actor: clipActor(event.actor || 'token'),
    entityKind: String(event.entityKind).slice(0, 64),
    entityDocumentId: String(event.documentId).slice(0, 128),
    changedFields: fieldNames(event.changedFields || []),
  };

  try {
    await strapi.documents(getUid('audit-event')).create({ data });
  } catch (err) {
    strapi.log?.warn?.('[paul-brain] audit write failed', err);
  }
}

const audit = ({ strapi }: { strapi: Core.Strapi }) => ({
  record(event: AuditEvent) {
    return recordAudit(strapi, event);
  },
});

export default audit;
