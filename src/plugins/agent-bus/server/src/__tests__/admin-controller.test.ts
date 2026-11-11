import { describe, it, expect, beforeEach } from 'vitest';
import adminController from '../controllers/admin';

/**
 * These tests drive the REAL admin controller against a small in-memory fake of
 * the Strapi APIs it uses (document service, db.query, admin services). State is
 * inspected after each call, so a broken controller line changes observable results.
 */

const AGENT = 'plugin::agent-bus.agent';
const CRED = 'plugin::agent-bus.agent-credential';
const P = (a: string) => `plugin::agent-bus.${a}`;

const SECRET = 'whsec-test-value-123';
const AUTH = 'Bearer auth-test-value-456';

const PACKS = {
  asker: [P('agent.read'), P('message.send')],
  specialist: [P('agent.read'), P('message.send'), P('message.inbox')],
  orchestrator: [
    P('agent.read'),
    P('message.send'),
    P('message.inbox'),
    P('message.manage'),
    P('approval.read'),
    P('approval.decide'),
    P('delivery.read'),
  ],
};

type Db = ReturnType<typeof makeDb>;

function makeDb() {
  return {
    agents: [] as any[],
    credentials: [] as any[],
    tokens: [] as any[],
    users: [] as any[],
    permissions: [] as any[],
    revokedTokenIds: [] as number[],
    seq: 100,
    failCredentialCreate: false,
  };
}

function matches(row: any, filters: any = {}) {
  return Object.entries(filters).every(([key, cond]: [string, any]) => {
    if (cond && typeof cond === 'object' && '$eq' in cond) return row[key] === cond.$eq;
    return row[key] === cond;
  });
}

function makeStrapi(db: Db) {
  const agentView = (a: any, populate?: any) => {
    const out: any = { ...a };
    if (populate?.credentials) {
      out.credentials = db.credentials
        .filter((c) => c.agentDocumentId === a.documentId)
        .map((c) => {
          const { agentDocumentId, ...rest } = c;
          return { ...rest };
        });
    }
    return out;
  };
  const credView = (c: any, populate?: any) => {
    const { agentDocumentId, ...rest } = c;
    const out: any = { ...rest };
    if (populate?.agent) out.agent = agentDocumentId ? { documentId: agentDocumentId } : null;
    return out;
  };
  const connectTarget = (data: any) => data?.agent?.connect?.[0]?.documentId;

  const documents = (uid: string) => {
    if (uid === AGENT) {
      return {
        findMany: async ({ filters, populate }: any = {}) =>
          db.agents.filter((a) => matches(a, filters)).map((a) => agentView(a, populate)),
        create: async ({ data }: any) => {
          if (db.agents.some((a) => a.slug === data.slug)) throw new Error('This attribute must be unique');
          const row = { id: ++db.seq, documentId: `agent-${db.seq}`, ...data };
          db.agents.push(row);
          return { ...row };
        },
        update: async ({ documentId, data }: any) => {
          const row = db.agents.find((a) => a.documentId === documentId);
          if (!row) return null;
          Object.assign(row, data);
          return { ...row };
        },
        delete: async ({ documentId }: any) => {
          db.agents = db.agents.filter((a) => a.documentId !== documentId);
          db.credentials.forEach((c) => {
            if (c.agentDocumentId === documentId) c.agentDocumentId = null;
          });
          return {};
        },
      };
    }
    if (uid === CRED) {
      return {
        findMany: async ({ filters, populate }: any = {}) =>
          db.credentials.filter((c) => matches(c, filters)).map((c) => credView(c, populate)),
        create: async ({ data }: any) => {
          if (db.failCredentialCreate) throw new Error('simulated credential write failure');
          if (db.credentials.some((c) => c.tokenId === data.tokenId)) throw new Error('This attribute must be unique');
          const { agent, ...rest } = data;
          const row = { id: ++db.seq, documentId: `cred-${db.seq}`, ...rest, agentDocumentId: connectTarget(data) };
          db.credentials.push(row);
          return credView(row);
        },
        update: async ({ documentId, data }: any) => {
          const row = db.credentials.find((c) => c.documentId === documentId);
          if (!row) return null;
          const { agent, ...rest } = data;
          Object.assign(row, rest);
          if (connectTarget(data)) row.agentDocumentId = connectTarget(data);
          return credView(row);
        },
      };
    }
    throw new Error(`unexpected uid ${uid}`);
  };

  const tokenView = (t: any, populateOwner: boolean) => ({
    ...t,
    adminUserOwner: populateOwner ? (t.ownerId ? { id: t.ownerId } : null) : undefined,
  });

  const query = (model: string) => {
    if (model === 'admin::api-token') {
      return {
        findMany: async ({ where = {}, populate }: any = {}) =>
          db.tokens
            .filter((t) => {
              if (where.kind !== undefined && t.kind !== where.kind) return false;
              if (where.adminUserOwner !== undefined && t.ownerId !== where.adminUserOwner) return false;
              if (where.type?.$in && !where.type.$in.includes(t.type)) return false;
              if (typeof where.type === 'string' && t.type !== where.type) return false;
              return true;
            })
            .map((t) => tokenView(t, !!populate)),
        findOne: async ({ where, populate }: any) => {
          const t = db.tokens.find((x) => x.id === where.id);
          return t ? tokenView(t, !!populate) : null;
        },
      };
    }
    if (model === 'admin::user') {
      return { findOne: async ({ where }: any) => db.users.find((u) => u.id === where.id) ?? null };
    }
    if (model === 'admin::permission') {
      return {
        create: async ({ data }: any) => {
          db.permissions.push(data);
          return data;
        },
      };
    }
    throw new Error(`unexpected model ${model}`);
  };

  const service = (name: string) => {
    if (name === 'admin::api-token-admin') {
      return {
        create: async (attrs: any, user: any) => {
          const id = ++db.seq;
          const token = { id, kind: 'admin', type: 'read-only', name: attrs.name, ownerId: user.id, expiresAt: null };
          db.tokens.push(token);
          return { ...token, accessKey: `access-key-${id}` };
        },
        revoke: async (id: number) => {
          db.revokedTokenIds.push(id);
          db.tokens = db.tokens.filter((t) => t.id !== id);
        },
      };
    }
    if (name === 'admin::permission') {
      return {
        findUserPermissions: async (user: any) =>
          (db.users.find((u) => u.id === user.id)?.permissions ?? []).map((action: string) => ({ action })),
      };
    }
    throw new Error(`unexpected service ${name}`);
  };

  return { documents, db: { query }, service, log: { warn: () => {}, info: () => {} } } as any;
}

const SUPER = { id: 1, roles: [{ code: 'strapi-super-admin' }], permissions: [] as string[] };
const MANAGER = { id: 2, roles: [{ code: 'agent-manager' }], permissions: [P('agent.manage'), ...PACKS.orchestrator] };
const MANAGE_ONLY = { id: 3, roles: [{ code: 'manage-only' }], permissions: [P('agent.manage')] };

function ctxFor(user: any, { params = {}, body = {} }: any = {}) {
  return { params, request: { body }, state: { user }, status: 200, body: null as any };
}

describe('agent-bus admin controller (real controller, in-memory Strapi)', () => {
  let db: Db;
  let controller: any;
  let chief: any;
  let spec: any;

  beforeEach(() => {
    db = makeDb();
    db.users.push(SUPER, MANAGER, MANAGE_ONLY);
    chief = { id: 1, documentId: 'chief-doc', slug: 'chief', name: 'Chief', kind: 'orchestrator', permissionPack: 'orchestrator', state: 'active', webhookUrl: 'https://hook.example', webhookSecret: SECRET, webhookAuthHeader: AUTH };
    spec = { id: 2, documentId: 'spec-doc', slug: 'spec', name: 'Spec', kind: 'specialist', permissionPack: 'specialist', state: 'active', webhookUrl: null, webhookSecret: SECRET, webhookAuthHeader: AUTH };
    db.agents.push(chief, spec);
    db.tokens.push(
      { id: 10, kind: 'admin', type: 'read-only', name: 'super-tok', ownerId: SUPER.id, expiresAt: null },
      { id: 11, kind: 'admin', type: 'read-only', name: 'manager-tok', ownerId: MANAGER.id, expiresAt: null },
      { id: 20, kind: 'content-api', type: 'custom', name: 'ca-custom', ownerId: null, expiresAt: null },
      { id: 21, kind: 'content-api', type: 'read-only', name: 'ca-ro', ownerId: null, expiresAt: null },
      { id: 22, kind: 'content-api', type: 'full-access', name: 'ca-full', ownerId: null, expiresAt: null },
    );
    controller = adminController({ strapi: makeStrapi(db) });
  });

  describe('mint permission check', () => {
    it('create+mint without the pack permissions returns 403 and creates nothing', async () => {
      const ctx = ctxFor(MANAGE_ONLY, { body: { name: 'New Orch', permissionPack: 'orchestrator', credentialType: 'mint' } });
      await controller.createAgent(ctx);
      expect(ctx.status).toBe(403);
      expect(ctx.body.error).toContain('missing permissions');
      expect(db.agents).toHaveLength(2);
      expect(db.tokens).toHaveLength(5);
      expect(db.credentials).toHaveLength(0);
      expect(db.permissions).toHaveLength(0);
    });

    it('mint route without the pack permissions returns 403 and mints nothing', async () => {
      const ctx = ctxFor(MANAGE_ONLY, { params: { documentId: 'spec-doc' } });
      await controller.mintToken(ctx);
      expect(ctx.status).toBe(403);
      expect(db.tokens).toHaveLength(5);
      expect(db.credentials).toHaveLength(0);
    });

    it('a user holding the pack permissions can mint', async () => {
      const ctx = ctxFor(MANAGER, { params: { documentId: 'chief-doc' } });
      await controller.mintToken(ctx);
      expect(ctx.status).toBe(201);
      expect(typeof ctx.body.data.accessKey).toBe('string');
      expect(db.credentials).toHaveLength(1);
      expect(db.credentials[0]).toMatchObject({ kind: 'admin', mintedByPlugin: true, state: 'active', agentDocumentId: 'chief-doc' });
    });

    it('create+mint rolls back the agent and revokes the token if the credential write fails', async () => {
      db.failCredentialCreate = true;
      const ctx = ctxFor(SUPER, { body: { name: 'Rollback Me', permissionPack: 'asker', credentialType: 'mint' } });
      await controller.createAgent(ctx);
      expect(ctx.status).toBe(400);
      expect(db.agents.map((a) => a.slug)).toEqual(['chief', 'spec']);
      expect(db.revokedTokenIds).toHaveLength(1);
      expect(db.tokens).toHaveLength(5);
    });
  });

  describe('permission packs', () => {
    for (const pack of ['asker', 'specialist', 'orchestrator'] as const) {
      it(`mint grants exactly the ${pack} pack and never agent.manage`, async () => {
        db.agents.push({ id: 50, documentId: `${pack}-doc`, slug: `${pack}-agent`, name: pack, kind: 'specialist', permissionPack: pack, state: 'active' });
        const ctx = ctxFor(SUPER, { params: { documentId: `${pack}-doc` } });
        await controller.mintToken(ctx);
        expect(ctx.status).toBe(201);
        const granted = db.permissions.map((p) => p.action).sort();
        expect(granted).toEqual([...PACKS[pack]].sort());
        expect(granted).not.toContain(P('agent.manage'));
        expect(db.permissions.every((p) => p.subject === null && p.apiToken === db.tokens[db.tokens.length - 1].id)).toBe(true);
      });
    }
  });

  describe('secret sanitizing', () => {
    const assertClean = (payload: any) => {
      const raw = JSON.stringify(payload);
      expect(raw).not.toContain('webhookSecret');
      expect(raw).not.toContain('webhookAuthHeader');
      expect(raw).not.toContain(SECRET);
      expect(raw).not.toContain(AUTH);
    };

    it('listAgents', async () => {
      const ctx = ctxFor(SUPER);
      await controller.listAgents(ctx);
      expect(ctx.body.data).toHaveLength(2);
      assertClean(ctx.body);
      const c = ctx.body.data.find((a: any) => a.slug === 'chief');
      expect(c.webhookConfigured).toBe(true);
      expect(c.hasAuthHeader).toBe(true);
    });

    it('getAgent', async () => {
      const ctx = ctxFor(SUPER, { params: { documentId: 'chief-doc' } });
      await controller.getAgent(ctx);
      expect(ctx.body.data.slug).toBe('chief');
      assertClean(ctx.body);
    });

    it('createAgent', async () => {
      const ctx = ctxFor(SUPER, { body: { name: 'Hooked', webhookUrl: 'https://x.example', webhookSecret: SECRET, webhookAuthHeader: AUTH } });
      await controller.createAgent(ctx);
      expect(ctx.status).toBe(201);
      assertClean(ctx.body);
      expect(db.agents.find((a) => a.slug === 'hooked').webhookSecret).toBe(SECRET);
    });

    it('updateAgent', async () => {
      const ctx = ctxFor(SUPER, { params: { documentId: 'spec-doc' }, body: { description: 'd', webhookSecret: SECRET, webhookAuthHeader: AUTH } });
      await controller.updateAgent(ctx);
      expect(ctx.status).toBe(200);
      assertClean(ctx.body);
    });
  });

  describe('create: slug and orchestrator rules', () => {
    it('auto-generates the slug from the name', async () => {
      const ctx = ctxFor(SUPER, { body: { name: 'Test Agent 123!' } });
      await controller.createAgent(ctx);
      expect(ctx.status).toBe(201);
      expect(ctx.body.data.agent.slug).toBe('test-agent-123');
    });

    it('rejects slug "chief" when chief exists and creates nothing', async () => {
      const ctx = ctxFor(SUPER, { body: { name: 'Fake', slug: 'chief' } });
      await controller.createAgent(ctx);
      expect(ctx.status).toBe(400);
      expect(db.agents).toHaveLength(2);
    });

    it('rejects a second orchestrator on create', async () => {
      const ctx = ctxFor(SUPER, { body: { name: 'Orch Two', kind: 'orchestrator' } });
      await controller.createAgent(ctx);
      expect(ctx.status).toBe(400);
      expect(ctx.body.error).toContain('Only one orchestrator');
      expect(db.agents).toHaveLength(2);
    });
  });

  describe('update rules', () => {
    it('returns 404 for an unknown agent', async () => {
      const ctx = ctxFor(SUPER, { params: { documentId: 'nope' }, body: { description: 'x' } });
      await controller.updateAgent(ctx);
      expect(ctx.status).toBe(404);
    });

    it('rejects changing another agent to orchestrator', async () => {
      const ctx = ctxFor(SUPER, { params: { documentId: 'spec-doc' }, body: { kind: 'orchestrator' } });
      await controller.updateAgent(ctx);
      expect(ctx.status).toBe(400);
      expect(spec.kind).toBe('specialist');
    });

    it('locks chief kind', async () => {
      const ctx = ctxFor(SUPER, { params: { documentId: 'chief-doc' }, body: { kind: 'specialist' } });
      await controller.updateAgent(ctx);
      expect(ctx.status).toBe(400);
      expect(chief.kind).toBe('orchestrator');
    });

    it('locks chief slug', async () => {
      const ctx = ctxFor(SUPER, { params: { documentId: 'chief-doc' }, body: { slug: 'boss' } });
      await controller.updateAgent(ctx);
      expect(ctx.status).toBe(400);
      expect(chief.slug).toBe('chief');
    });

    it('still allows chief webhook and state edits', async () => {
      const ctx = ctxFor(SUPER, {
        params: { documentId: 'chief-doc' },
        body: { kind: 'orchestrator', state: 'disabled', webhookUrl: 'https://new.example', webhookSecret: 'new-secret-value', webhookAuthHeader: 'Bearer new-auth' },
      });
      await controller.updateAgent(ctx);
      expect(ctx.status).toBe(200);
      expect(chief).toMatchObject({ state: 'disabled', webhookUrl: 'https://new.example', webhookSecret: 'new-secret-value', webhookAuthHeader: 'Bearer new-auth' });
    });
  });

  describe('delete rules', () => {
    it('refuses to delete chief', async () => {
      const ctx = ctxFor(SUPER, { params: { documentId: 'chief-doc' } });
      await controller.deleteAgent(ctx);
      expect(ctx.status).toBe(400);
      expect(db.agents.some((a) => a.slug === 'chief')).toBe(true);
    });

    it('deleting an agent revokes its credentials and only plugin-minted tokens', async () => {
      db.credentials.push(
        { id: 1, documentId: 'c1', kind: 'admin', tokenId: '11', state: 'active', mintedByPlugin: true, agentDocumentId: 'spec-doc' },
        { id: 2, documentId: 'c2', kind: 'content-api', tokenId: '20', state: 'active', mintedByPlugin: false, agentDocumentId: 'spec-doc' },
      );
      const ctx = ctxFor(SUPER, { params: { documentId: 'spec-doc' } });
      await controller.deleteAgent(ctx);
      expect(ctx.status).toBe(200);
      expect(db.credentials.every((c) => c.state === 'revoked')).toBe(true);
      expect(db.revokedTokenIds).toEqual([11]);
    });
  });

  describe('revoke', () => {
    it('returns 404 when the credential belongs to another agent', async () => {
      db.credentials.push({ id: 7, documentId: 'c7', kind: 'admin', tokenId: '10', state: 'active', mintedByPlugin: true, agentDocumentId: 'chief-doc' });
      const ctx = ctxFor(SUPER, { params: { documentId: 'spec-doc', credentialId: '7' } });
      await controller.revokeCredential(ctx);
      expect(ctx.status).toBe(404);
      expect(db.credentials[0].state).toBe('active');
      expect(db.revokedTokenIds).toEqual([]);
    });
  });

  describe('bind', () => {
    it('non-super binding another user\'s admin token returns 403 and writes nothing', async () => {
      const ctx = ctxFor(MANAGER, { params: { documentId: 'spec-doc' }, body: { tokenId: 10 } });
      await controller.bindToken(ctx);
      expect(ctx.status).toBe(403);
      expect(ctx.body.error).toBe('Cannot bind admin token owned by another user');
      expect(db.credentials).toHaveLength(0);
    });

    it('non-super can bind their own admin token', async () => {
      const ctx = ctxFor(MANAGER, { params: { documentId: 'spec-doc' }, body: { tokenId: 11 } });
      await controller.bindToken(ctx);
      expect(ctx.status).toBe(200);
      expect(db.credentials[0]).toMatchObject({ tokenId: '11', kind: 'admin', agentDocumentId: 'spec-doc' });
    });

    it('super admin can bind another user\'s admin token', async () => {
      const ctx = ctxFor(SUPER, { params: { documentId: 'spec-doc' }, body: { tokenId: 11 } });
      await controller.bindToken(ctx);
      expect(ctx.status).toBe(200);
    });

    it('stores full-access and read-only content-api tokens with kind content-api', async () => {
      for (const id of [21, 22]) {
        const ctx = ctxFor(MANAGER, { params: { documentId: 'spec-doc' }, body: { tokenId: id } });
        await controller.bindToken(ctx);
        expect(ctx.status).toBe(200);
      }
      expect(db.credentials.map((c) => c.kind)).toEqual(['content-api', 'content-api']);
    });

    it('rejects an already-bound token with 400', async () => {
      db.credentials.push({ id: 3, documentId: 'c3', kind: 'content-api', tokenId: '20', state: 'active', mintedByPlugin: false, agentDocumentId: 'chief-doc' });
      const ctx = ctxFor(SUPER, { params: { documentId: 'spec-doc' }, body: { tokenId: 20 } });
      await controller.bindToken(ctx);
      expect(ctx.status).toBe(400);
      expect(db.credentials).toHaveLength(1);
    });
  });

  describe('create + bind never leaves an orphan agent', () => {
    it('another user\'s admin token: 403 and agent count unchanged', async () => {
      const ctx = ctxFor(MANAGER, { body: { name: 'Bind Create', credentialType: 'bind', tokenId: 10 } });
      await controller.createAgent(ctx);
      expect(ctx.status).toBe(403);
      expect(db.agents).toHaveLength(2);
      expect(db.credentials).toHaveLength(0);
    });

    it('unknown token: 400 and agent count unchanged', async () => {
      const ctx = ctxFor(SUPER, { body: { name: 'Bind Create', credentialType: 'bind', tokenId: 999 } });
      await controller.createAgent(ctx);
      expect(ctx.status).toBe(400);
      expect(db.agents).toHaveLength(2);
    });

    it('missing tokenId: 400 and agent count unchanged', async () => {
      const ctx = ctxFor(SUPER, { body: { name: 'Bind Create', credentialType: 'bind' } });
      await controller.createAgent(ctx);
      expect(ctx.status).toBe(400);
      expect(db.agents).toHaveLength(2);
    });

    it('rolls back the agent when the credential write fails', async () => {
      db.failCredentialCreate = true;
      const ctx = ctxFor(SUPER, { body: { name: 'Bind Create', credentialType: 'bind', tokenId: 20 } });
      await controller.createAgent(ctx);
      expect(ctx.status).toBe(400);
      expect(db.agents).toHaveLength(2);
    });

    it('valid own token: 201 with the credential attached', async () => {
      const ctx = ctxFor(MANAGER, { body: { name: 'Bind Create', credentialType: 'bind', tokenId: 11 } });
      await controller.createAgent(ctx);
      expect(ctx.status).toBe(201);
      expect(db.agents).toHaveLength(3);
      expect(ctx.body.data.agent.credentials).toEqual([
        expect.objectContaining({ tokenName: 'manager-tok', kind: 'admin', state: 'active' }),
      ]);
    });
  });

  describe('token picker', () => {
    it('non-super sees only their own admin tokens plus all content-api tokens', async () => {
      const ctx = ctxFor(MANAGER);
      await controller.listTokens(ctx);
      const got = ctx.body.data.map((t: any) => [t.id, t.kind]).sort((a: any, b: any) => a[0] - b[0]);
      expect(got).toEqual([[11, 'admin'], [20, 'content-api'], [21, 'content-api'], [22, 'content-api']]);
    });

    it('super admin sees every token exactly once with the right kind', async () => {
      const ctx = ctxFor(SUPER);
      await controller.listTokens(ctx);
      const got = ctx.body.data.map((t: any) => [t.id, t.kind]).sort((a: any, b: any) => a[0] - b[0]);
      expect(got).toEqual([[10, 'admin'], [11, 'admin'], [20, 'content-api'], [21, 'content-api'], [22, 'content-api']]);
    });

    it('hides tokens that are actively bound', async () => {
      db.credentials.push({ id: 4, documentId: 'c4', kind: 'content-api', tokenId: '20', state: 'active', mintedByPlugin: false, agentDocumentId: 'spec-doc' });
      const ctx = ctxFor(SUPER);
      await controller.listTokens(ctx);
      expect(ctx.body.data.map((t: any) => t.id)).not.toContain(20);
    });
  });
});
