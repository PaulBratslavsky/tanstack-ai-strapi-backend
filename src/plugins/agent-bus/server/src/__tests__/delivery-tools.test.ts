import { readFileSync } from 'fs';
import { join } from 'path';
import { describe, expect, it } from 'vitest';
import bus from '../services/bus';
import { buildWebhookPayload } from '../services/webhook-payload';
import { sinceToIso } from '../mcp/utils';
import * as deliverySummary from '../mcp/tools/delivery-summary';
import * as listDeliveries from '../mcp/tools/list-deliveries';
import * as triageDelivery from '../mcp/tools/triage-delivery';
import { getActionId } from '../mcp/permissions';

describe('webhook payload', () => {
  it('keeps only event, messageId, threadId, and a short subject', () => {
    const payload = buildWebhookPayload(
      { event: 'message.queued' },
      {
        documentId: 'msg-1',
        body: 'secret message body',
        payload: { token: 'secret-token' },
        thread: {
          documentId: 'thread-1',
          subject: `Launch plan ${'x'.repeat(200)}`,
        },
      } as any
    );

    expect(Object.keys(payload).sort()).toEqual(['event', 'messageId', 'subject', 'threadId']);
    expect(payload.event).toBe('message.queued');
    expect(payload.messageId).toBe('msg-1');
    expect(payload.threadId).toBe('thread-1');
    expect(payload.subject.startsWith('Launch plan ')).toBe(true);
    expect(payload.subject.endsWith('…')).toBe(true);
    expect(payload.subject.length).toBe(80);
    expect(JSON.stringify(payload)).not.toContain('secret');
  });

  it('the outbox worker builds that payload and does not copy a message body', () => {
    const source = readFileSync(join(__dirname, '../workers/outbox.ts'), 'utf8');
    expect(source).toContain('buildWebhookPayload');
    expect(source).not.toMatch(/payload\.body/);
    expect(source).not.toMatch(/message\.body/);
    expect(source).toContain('resolveOlderExhausted');
  });
});

describe('Pacific since', () => {
  it('maps a calendar date to midnight in America/Los_Angeles', () => {
    expect(sinceToIso('2026-01-15')).toBe('2026-01-15T08:00:00.000Z');
    expect(sinceToIso('2026-07-15')).toBe('2026-07-15T07:00:00.000Z');
    expect(sinceToIso('2026-11-15T18:00:00.000Z')).toBe('2026-11-15T18:00:00.000Z');
  });
});

function deliveryDb(rows: any[]) {
  const table = rows.map((row) => ({ ...row }));
  const audits: any[] = [];
  const strapi = {
    log: { warn() {}, info() {}, debug() {}, error() {} },
    documents(uid: string) {
      return {
        async findMany(params: any = {}) {
          let list = table.filter((row) => match(row, params.filters || {}));
          if (params.sort?.[0] === 'createdAt:desc') {
            list = list.slice().sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
          }
          return list.slice(0, params.limit ?? list.length).map((row) => ({ ...row, agent: row.agent }));
        },
        async count(params: any = {}) {
          return table.filter((row) => match(row, params.filters || {})).length;
        },
        async update({ documentId, data }: { documentId: string; data: any }) {
          const row = table.find((item) => item.documentId === documentId);
          Object.assign(row, data);
          return { ...row };
        },
        async create({ data }: { data: any }) {
          if (uid.includes('audit')) audits.push(data);
          return data;
        },
      };
    },
    plugin() {
      return { service: () => service };
    },
  };
  const service = bus({ strapi: strapi as any });
  return { strapi, table, audits, service };
}

function match(row: any, filters: any): boolean {
  if (filters.state?.$eq && row.state !== filters.state.$eq) return false;
  if (Array.isArray(filters.state?.$in) && !filters.state.$in.includes(row.state)) return false;
  if (filters.createdAt?.$lt && !(row.createdAt < filters.createdAt.$lt)) return false;
  if (filters.createdAt?.$gte && !(row.createdAt >= filters.createdAt.$gte)) return false;
  if (filters.agent?.documentId?.$eq && row.agent?.documentId !== filters.agent.documentId.$eq) return false;
  if (filters.documentId?.$eq && row.documentId !== filters.documentId.$eq) return false;
  if (Array.isArray(filters.$or)) {
    const ok = filters.$or.some((clause: any) => {
      if (clause.agent?.documentId?.$eq) return row.agent?.documentId === clause.agent.documentId.$eq;
      if (clause.agent?.slug?.$eq) return row.agent?.slug === clause.agent.slug.$eq;
      return false;
    });
    if (!ok) return false;
  }
  return true;
}

describe('delivery triage', () => {
  it('resolves, ignores, and retries only exhausted deliveries', async () => {
    const { service, table } = deliveryDb([
      {
        documentId: 'del-old',
        state: 'exhausted',
        event: 'message.queued',
        createdAt: '2026-11-01T00:00:00.000Z',
        attemptCount: 5,
        agent: { documentId: 'agent-1', slug: 'chief' },
      },
    ]);

    await expect(service.triageDelivery({ deliveryId: 'missing', action: 'resolved' })).rejects.toThrow(/not found/);

    const resolved = await service.triageDelivery({
      deliveryId: 'del-old',
      action: 'resolved',
      note: 'Paul looked at it',
    });
    expect(resolved.status).toBe('resolved');
    expect(table[0].triageNote).toBe('Paul looked at it');

    table[0].state = 'exhausted';
    const retried = await service.triageDelivery({ deliveryId: 'del-old', action: 'retry' });
    expect(retried.status).toBe('pending');
    expect(table[0].attemptCount).toBe(0);
    expect(table[0].state).toBe('pending');
  });

  it('auto-resolves older exhausted deliveries for that agent after a later success', async () => {
    const { service, table } = deliveryDb([
      {
        documentId: 'old',
        state: 'exhausted',
        createdAt: '2026-11-01T00:00:00.000Z',
        agent: { documentId: 'agent-1', slug: 'chief' },
      },
      {
        documentId: 'other-agent',
        state: 'exhausted',
        createdAt: '2026-11-01T00:00:00.000Z',
        agent: { documentId: 'agent-2', slug: 'claude' },
      },
      {
        documentId: 'newer',
        state: 'exhausted',
        createdAt: '2026-11-18T00:00:00.000Z',
        agent: { documentId: 'agent-1', slug: 'chief' },
      },
    ]);

    const count = await service.resolveOlderExhausted('agent-1', '2026-11-10T00:00:00.000Z');
    expect(count).toBe(1);
    expect(table.find((row) => row.documentId === 'old')?.state).toBe('resolved');
    expect(table.find((row) => row.documentId === 'other-agent')?.state).toBe('exhausted');
    expect(table.find((row) => row.documentId === 'newer')?.state).toBe('exhausted');
  });

  it('registers summary, list, and triage on the delivery permissions', () => {
    const registered: any[] = [];
    const strapi = {
      ai: { mcp: { registerTool(def: any) { registered.push(def); } } },
      log: { warn() {}, info() {}, debug() {}, error() {} },
    };
    deliverySummary.register(strapi as any);
    listDeliveries.register(strapi as any);
    triageDelivery.register(strapi as any);

    const byName = Object.fromEntries(registered.map((tool) => [tool.name, tool.auth.policies[0].action]));
    expect(byName).toEqual({
      agent_bus__delivery_summary: getActionId('delivery.read'),
      agent_bus__list_deliveries: getActionId('delivery.read'),
      agent_bus__triage_delivery: getActionId('delivery.manage'),
    });
  });

  it('lists deliveries filtered by state and a Pacific since date', async () => {
    const rows = [
      {
        documentId: 'old',
        state: 'delivered',
        event: 'message.queued',
        createdAt: '2026-01-01T00:00:00.000Z',
        agent: { documentId: 'agent-1', slug: 'chief' },
      },
      {
        documentId: 'new',
        state: 'exhausted',
        event: 'message.queued',
        createdAt: '2026-11-18T12:00:00.000Z',
        lastError: 'HTTP 500',
        agent: { documentId: 'agent-1', slug: 'chief' },
      },
    ];
    let handler: any;
    const strapi = {
      ai: { mcp: { registerTool(def: any) { handler = def.createHandler(strapi); } } },
      log: { warn() {} },
      documents() {
        return {
          async findMany(params: any) {
            return rows.filter((row) => match(row, params.filters || {}));
          },
        };
      },
    };
    listDeliveries.register(strapi as any);
    const result = await handler({
      args: { state: 'exhausted', since: '2026-11-01', agentId: 'chief' },
    });
    expect(result.structuredContent.deliveries.map((row: any) => row.documentId)).toEqual(['new']);
    expect(result.structuredContent.deliveries[0].status).toBe('exhausted');
    expect(result.structuredContent.deliveries[0].body).toBeUndefined();
  });
});
