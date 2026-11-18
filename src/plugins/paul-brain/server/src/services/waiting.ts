import type { Core } from '@strapi/strapi';
import { missingTokenPermissions, type TokenAbility } from '../mcp/token-permissions';

export type WaitingKind =
  | 'approval_red'
  | 'approval_yellow'
  | 'delivery_exhausted'
  | 'credential_stale'
  | 'permission_missing';

export interface WaitingItem {
  kind: WaitingKind;
  id: string;
  summary: string;
  minutesLeft?: number;
}

interface BusWaiting {
  redApprovals?: Array<{ id: string; subject?: string; messageId?: string }>;
  yellowApprovals?: Array<{ id: string; subject?: string; messageId?: string; minutesLeft?: number }>;
  exhaustedDeliveries?: Array<{ id: string; agentSlug?: string; event?: string }>;
  staleCredentials?: Array<{ id: string; agentSlug?: string; tokenName?: string; unusedSince?: string }>;
}

function pacificDate(iso: string | undefined): string | undefined {
  if (!iso) return undefined;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return undefined;
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Los_Angeles',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

function readBus(strapi: Core.Strapi): { waitingForPaul?: () => Promise<BusWaiting> } | null {
  try {
    const plugin = strapi.plugin?.('agent-bus');
    if (!plugin || typeof plugin.service !== 'function') return null;
    const bus = plugin.service('bus');
    if (!bus || typeof bus.waitingForPaul !== 'function') return null;
    return bus;
  } catch {
    return null;
  }
}

function label(subject: string | undefined, fallback: string): string {
  const text = (subject || '').replace(/\s+/g, ' ').trim();
  return text || fallback;
}

/**
 * Live "waiting on Paul" items. No new content type.
 * Agent-bus sections are omitted when that plugin (or the snapshot method) is absent.
 */
export async function collectWaiting(strapi: Core.Strapi, userAbility?: TokenAbility | null): Promise<WaitingItem[]> {
  const items: WaitingItem[] = [];
  const bus = readBus(strapi);

  if (bus?.waitingForPaul) {
    try {
      const snap = await bus.waitingForPaul();

      for (const approval of snap.redApprovals || []) {
        if (!approval?.id) continue;
        items.push({
          kind: 'approval_red',
          id: approval.id,
          summary: `Red approval pending: ${label(approval.subject, approval.messageId || approval.id)}`,
        });
      }

      for (const approval of snap.yellowApprovals || []) {
        if (!approval?.id) continue;
        const minutesLeft = Math.max(1, Math.ceil(approval.minutesLeft || 0));
        items.push({
          kind: 'approval_yellow',
          id: approval.id,
          summary: `Yellow veto window: ${label(approval.subject, approval.messageId || approval.id)} (${minutesLeft} min left)`,
          minutesLeft,
        });
      }

      for (const delivery of snap.exhaustedDeliveries || []) {
        if (!delivery?.id) continue;
        const who = delivery.agentSlug || 'unknown agent';
        const event = delivery.event || 'webhook';
        items.push({
          kind: 'delivery_exhausted',
          id: delivery.id,
          summary: `Webhook delivery exhausted for ${who} (${event})`,
        });
      }

      for (const credential of snap.staleCredentials || []) {
        if (!credential?.id) continue;
        const who = credential.agentSlug || 'unknown agent';
        const name = credential.tokenName || 'unnamed credential';
        const since = pacificDate(credential.unusedSince);
        items.push({
          kind: 'credential_stale',
          id: credential.id,
          summary: since
            ? `Credential ${name} for ${who} unused since ${since}`
            : `Credential ${name} for ${who} unused for more than 30 days`,
        });
      }
    } catch (err) {
      strapi.log?.warn?.('[paul-brain] agent-bus waiting snapshot failed', err);
    }
  }

  for (const action of missingTokenPermissions(userAbility)) {
    items.push({
      kind: 'permission_missing',
      id: action,
      summary: `Token is missing ${action}`,
    });
  }

  return items;
}
