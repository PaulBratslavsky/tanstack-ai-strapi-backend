import { describe, it, expect, beforeEach, vi } from 'vitest';
import adminController from '../controllers/admin';

describe('Admin Controller Integration Tests', () => {
  let mockStrapi: any;
  let mockCtx: any;
  let mockUser: any;
  let controller: any;

  beforeEach(() => {
    mockUser = {
      id: 1,
      email: 'admin@example.com',
      roles: [{ code: 'strapi-super-admin' }],
    };

    mockCtx = {
      params: {},
      request: { body: {} },
      state: { user: mockUser },
      status: 200,
      body: null,
    };

    const mockDocuments = (uid: string) => ({
      findMany: vi.fn().mockResolvedValue([]),
      findFirst: vi.fn().mockResolvedValue(null),
      create: vi.fn().mockResolvedValue({ documentId: 'test-123', slug: 'test-agent' }),
      update: vi.fn().mockResolvedValue({ documentId: 'test-123' }),
      delete: vi.fn().mockResolvedValue({}),
    });

    mockStrapi = {
      documents: mockDocuments,
      db: {
        query: vi.fn((model: string) => ({
          findMany: vi.fn().mockResolvedValue([]),
          findOne: vi.fn().mockResolvedValue(null),
          create: vi.fn().mockResolvedValue({}),
        })),
      },
      service: vi.fn((name: string) => {
        if (name === 'admin::api-token-admin') {
          return {
            create: vi.fn().mockResolvedValue({ id: 1, accessKey: 'test-key' }),
            revoke: vi.fn().mockResolvedValue({}),
            getById: vi.fn().mockResolvedValue(null),
          };
        }
        if (name === 'admin::permission') {
          return {
            findUserPermissions: vi.fn().mockResolvedValue([]),
          };
        }
        return {};
      }),
      log: {
        warn: vi.fn(),
        info: vi.fn(),
      },
    };

    controller = adminController({ strapi: mockStrapi });
  });

  describe('Token Picker Tests', () => {
    it('should not return duplicate tokens for super admin', async () => {
      const adminToken = { id: 1, name: 'Admin Token', kind: 'admin', adminUserOwner: { id: 1 }, expiresAt: null };
      const contentApiToken = { id: 2, name: 'Content API', kind: 'content-api', expiresAt: null };

      mockStrapi.db.query = vi.fn((model: string) => ({
        findOne: vi.fn().mockResolvedValue({ id: 1, roles: [{ code: 'strapi-super-admin' }] }),
        findMany: vi.fn((opts: any) => {
          if (opts.where?.kind === 'admin') return Promise.resolve([adminToken]);
          if (opts.where?.kind === 'content-api') return Promise.resolve([contentApiToken]);
          return Promise.resolve([]);
        }),
      }));

      mockStrapi.documents = vi.fn(() => ({
        findMany: vi.fn().mockResolvedValue([]),
      }));

      await controller.listTokens(mockCtx);

      const ids = mockCtx.body.data.map((t: any) => t.id);
      expect(new Set(ids).size).toBe(ids.length);
    });

    it('should filter admin tokens by owner for non-super users', async () => {
      mockCtx.state.user.roles = [{ code: 'strapi-editor' }];

      const myToken = { id: 1, name: 'My Admin Token', kind: 'admin', adminUserOwner: { id: 1 }, expiresAt: null };
      const otherToken = { id: 2, name: 'Other Admin Token', kind: 'admin', adminUserOwner: { id: 2 }, expiresAt: null };
      const contentToken = { id: 3, name: 'Content API', kind: 'content-api', expiresAt: null };

      mockStrapi.db.query = vi.fn((model: string) => ({
        findOne: vi.fn().mockResolvedValue({ id: 1, roles: [{ code: 'strapi-editor' }] }),
        findMany: vi.fn((opts: any) => {
          if (opts.where?.kind === 'admin' && opts.where?.adminUserOwner === 1) return Promise.resolve([myToken]);
          if (opts.where?.kind === 'content-api') return Promise.resolve([contentToken]);
          return Promise.resolve([]);
        }),
      }));

      mockStrapi.documents = vi.fn(() => ({
        findMany: vi.fn().mockResolvedValue([]),
      }));

      await controller.listTokens(mockCtx);

      expect(mockCtx.body.data.some((t: any) => t.id === 2)).toBe(false);
      expect(mockCtx.body.data.some((t: any) => t.id === 1)).toBe(true);
      expect(mockCtx.body.data.some((t: any) => t.id === 3)).toBe(true);
    });
  });

  describe('Bind Token - Owner Check', () => {
    it('should return 400 when non-super user binds another users admin token', async () => {
      mockCtx.state.user.roles = [{ code: 'strapi-editor' }];
      mockCtx.params.documentId = 'agent-123';
      mockCtx.request.body = { tokenId: 1 };

      const agent = { documentId: 'agent-123' };
      const token = { id: 1, name: 'Other Admin Token', kind: 'admin', type: 'read-only', adminUserOwner: { id: 2 }, expiresAt: null };

      mockStrapi.documents = vi.fn(() => ({
        findMany: vi.fn((opts: any) => {
          if (opts.filters?.documentId) return Promise.resolve([agent]);
          if (opts.filters?.tokenId) return Promise.resolve([]);
          return Promise.resolve([]);
        }),
      }));

      mockStrapi.db.query = vi.fn((model: string) => ({
        findOne: vi.fn((opts: any) => {
          if (model === 'admin::api-token' && opts.where?.id === 1) return Promise.resolve(token);
          if (model === 'admin::user') return Promise.resolve({ id: 1, roles: [{ code: 'strapi-editor' }] });
          return Promise.resolve(null);
        }),
      }));

      await controller.bindToken(mockCtx);

      expect(mockCtx.status).toBe(400);
      expect(mockCtx.body.error).toContain('Cannot bind admin token owned by another user');
    });
  });

  describe('Chief Protection', () => {
    it('should reject changing chief kind', async () => {
      mockCtx.params.documentId = 'chief-123';
      mockCtx.request.body = { kind: 'specialist' };

      const chief = { documentId: 'chief-123', slug: 'chief', kind: 'orchestrator' };

      mockStrapi.documents = vi.fn(() => ({
        findMany: vi.fn().mockResolvedValue([chief]),
      }));

      await controller.updateAgent(mockCtx);

      expect(mockCtx.status).toBe(400);
      expect(mockCtx.body.error).toContain('Cannot change chief kind');
    });

    it('should reject changing chief slug', async () => {
      mockCtx.params.documentId = 'chief-123';
      mockCtx.request.body = { slug: 'new-slug' };

      const chief = { documentId: 'chief-123', slug: 'chief', kind: 'orchestrator' };

      mockStrapi.documents = vi.fn(() => ({
        findMany: vi.fn().mockResolvedValue([chief]),
      }));

      await controller.updateAgent(mockCtx);

      expect(mockCtx.status).toBe(400);
      expect(mockCtx.body.error).toContain('Cannot change chief slug');
    });
  });

  describe('Mutation Tests', () => {
    it('MUTATION: credential kind uses token.kind not token.type', async () => {
      mockCtx.params.documentId = 'agent-123';
      mockCtx.request.body = { tokenId: 1 };

      const agent = { documentId: 'agent-123' };
      const token = { id: 1, name: 'Full Access', kind: 'content-api', type: 'full-access', expiresAt: null, adminUserOwner: null };

      let credKind: string | undefined;

      mockStrapi.documents = vi.fn(() => ({
        findMany: vi.fn((opts: any) => {
          if (opts.filters?.documentId) return Promise.resolve([agent]);
          if (opts.filters?.tokenId) return Promise.resolve([]);
          return Promise.resolve([]);
        }),
        create: vi.fn((opts: any) => {
          credKind = opts.data.kind;
          return Promise.resolve({ documentId: 'cred-123' });
        }),
      }));

      mockStrapi.db.query = vi.fn((model: string) => ({
        findOne: vi.fn((opts: any) => {
          if (model === 'admin::api-token') return Promise.resolve(token);
          if (model === 'admin::user') return Promise.resolve({ id: 1, roles: [{ code: 'strapi-super-admin' }] });
          return Promise.resolve(null);
        }),
      }));

      await controller.bindToken(mockCtx);

      expect(credKind).toBe('content-api');
    });

    it('MUTATION: revoke checks credential belongs to same agent', async () => {
      mockCtx.params = { documentId: 'agent-123', credentialId: 1 };

      const credential = { id: 1, documentId: 'cred-123', agent: { documentId: 'other-agent' } };

      mockStrapi.documents = vi.fn(() => ({
        findMany: vi.fn().mockResolvedValue([credential]),
      }));

      await controller.revokeCredential(mockCtx);

      expect(mockCtx.status).toBe(404);
    });

    it('MUTATION: update returns 404 for unknown agent', async () => {
      mockCtx.params.documentId = 'unknown-123';
      mockCtx.request.body = { name: 'Updated' };

      mockStrapi.documents = vi.fn(() => ({
        findMany: vi.fn().mockResolvedValue([]),
      }));

      await controller.updateAgent(mockCtx);

      expect(mockCtx.status).toBe(404);
    });

    it('MUTATION: reject second orchestrator', async () => {
      mockCtx.request.body = { name: 'Second Orch', kind: 'orchestrator' };

      const chief = [{ slug: 'chief', kind: 'orchestrator' }];

      mockStrapi.documents = vi.fn(() => ({
        findMany: vi.fn((opts: any) => {
          if (opts.filters?.slug?.$eq === 'chief') return Promise.resolve(chief);
          return Promise.resolve([]);
        }),
      }));

      await controller.createAgent(mockCtx);

      expect(mockCtx.status).toBe(400);
      expect(mockCtx.body.error).toContain('Only one orchestrator');
    });
  });
});
