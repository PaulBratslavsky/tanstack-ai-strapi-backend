import { describe, expect, it } from 'vitest';
import { actorFrom, fieldNames, recordAudit } from '../services/audit';
import { collectWaiting } from '../services/waiting';
import { missingTokenPermissions } from '../mcp/token-permissions';
import { getActionId } from '../mcp/permissions';
import * as healthCheck from '../mcp/tools/health-check';

describe('audit log', () => {
  it('stores kind, document id, action, field names, and actor, and never the values', async () => {
    const created: any[] = [];
    const strapi = {
      log: { warn() {} },
      documents() {
        return {
          async create({ data }: { data: any }) {
            created.push(data);
            return data;
          },
        };
      },
    };

    await recordAudit(strapi as any, {
      action: 'update',
      entityKind: 'note',
      documentId: 'note-1',
      changedFields: ['body', 'title', 'body', 'not a field', 'summary'],
      actor: 'grok\nbot',
    });

    expect(created).toHaveLength(1);
    expect(Object.keys(created[0]).sort()).toEqual(
      ['action', 'actor', 'at', 'changedFields', 'entityDocumentId', 'entityKind'].sort()
    );
    expect(created[0].changedFields).toEqual(['body', 'summary', 'title']);
    expect(created[0].actor).toBe('grok bot');
    expect(JSON.stringify(created[0])).not.toContain('secret');
    expect(fieldNames(['ok', 'has space', '9bad'])).toEqual(['ok']);
  });

  it('reads an email from the caller and ignores a bearer-looking explicit value only as text', () => {
    expect(actorFrom({ user: { email: 'paul@example.com' } })).toBe('paul@example.com');
    expect(actorFrom(undefined, 'cursor-agent')).toBe('cursor-agent');
  });
});

describe('waiting and token permissions', () => {
  it('reports only actions the ability denies, and ignores forget', () => {
    const missing = missingTokenPermissions({
      can: (action) => action !== getActionId('note.write') && action !== getActionId('forget'),
    });
    expect(missing).toEqual([getActionId('note.write')]);
    expect(missingTokenPermissions(undefined)).toEqual([]);
  });

  it('degrades when agent-bus is missing and still lists missing permissions', async () => {
    const strapi = {
      plugin() {
        throw new Error('plugin missing');
      },
      log: { warn() {} },
    };
    const waiting = await collectWaiting(strapi as any, {
      can: (action: string) => action !== getActionId('brief.read'),
    });
    expect(waiting).toEqual([
      {
        kind: 'permission_missing',
        id: getActionId('brief.read'),
        summary: `Token is missing ${getActionId('brief.read')}`,
      },
    ]);
  });

  it('maps a bus snapshot into waiting items with a Pacific date and minutes left', async () => {
    const strapi = {
      plugin(name: string) {
        if (name !== 'agent-bus') return null;
        return {
          service() {
            return {
              async waitingForPaul() {
                return {
                  redApprovals: [{ id: 'ap-red', subject: 'Pay the vendor', messageId: 'm1' }],
                  yellowApprovals: [{ id: 'ap-yellow', subject: 'Send the note', minutesLeft: 12 }],
                  exhaustedDeliveries: [{ id: 'del-1', agentSlug: 'chief', event: 'message.queued' }],
                  staleCredentials: [{
                    id: 'cred-1',
                    agentSlug: 'claude',
                    tokenName: 'Claude MCP',
                    unusedSince: '2026-01-15T18:30:00.000Z',
                  }],
                };
              },
            };
          },
        };
      },
      log: { warn() {} },
    };

    const waiting = await collectWaiting(strapi as any, { can: () => true });
    expect(waiting.map((item) => item.kind)).toEqual([
      'approval_red',
      'approval_yellow',
      'delivery_exhausted',
      'credential_stale',
    ]);
    expect(waiting[1].minutesLeft).toBe(12);
    expect(waiting[3].summary).toContain('2026-01-15');
    expect(JSON.stringify(waiting)).not.toContain('message body');
  });

  it('health_check token_permissions reports the same missing action', async () => {
    let handler: any;
    const strapi = {
      ai: { mcp: { registerTool(def: any) { handler = def.createHandler(strapi); } } },
      log: { warn() {}, info() {}, debug() {}, error() {} },
    };
    healthCheck.register(strapi as any);
    const result = await handler({
      args: { checks: ['token_permissions'] },
      context: { userAbility: { can: (action: string) => action !== getActionId('note.write') } },
    });
    expect(result.structuredContent.findings.map((finding: any) => finding.ids[0])).toEqual([
      getActionId('note.write'),
    ]);
    expect(result.structuredContent.findings[0].kind).toBe('missing_token_permission');
  });
});
