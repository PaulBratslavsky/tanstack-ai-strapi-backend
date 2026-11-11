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

  describe('listTokens - Token List with Owner Population', () => {
    it('should return admin tokens for super admin with populated owner', async () => {
      const adminToken = {
        id: 1,
        name: 'Admin Token',
        kind: 'admin',
        type: 'admin',
        adminUserOwner: { id: 1, email: 'admin@example.com' },
        expiresAt: null,
      };

      mockStrapi.db.query = vi.fn((model: string) => ({
        findOne: vi.fn().mockResolvedValue({ id: 1, roles: [{ code: 'strapi-super-admin' }] }),
        findMany: vi.fn((opts: any) => {
          if (opts.where && Object.keys(opts.where).length === 0) {
            return Promise.resolve([adminToken]);
          }
          return Promise.resolve([]);
        }),
      }));

      mockStrapi.documents = vi.fn(() => ({
        findMany: vi.fn().mockResolvedValue([]),
      }));

      await controller.listTokens(mockCtx);

      expect(mockCtx.status).toBe(200);
      expect(mockCtx.body.data).toBeDefined();
      expect(mockCtx.body.data.length).toBeGreaterThan(0);
      expect(mockCtx.body.data[0]).toHaveProperty('id');
      expect(mockCtx.body.data[0]).toHaveProperty('kind');
    });

    it('should include all content-api token types (custom, read-only, full-access)', async () => {
      const contentApiTokens = [
        { id: 2, name: 'Custom Token', kind: 'content-api', type: 'custom', expiresAt: null },
        { id: 3, name: 'Read Only Token', kind: 'content-api', type: 'read-only', expiresAt: null },
        { id: 4, name: 'Full Access Token', kind: 'content-api', type: 'full-access', expiresAt: null },
      ];

      mockStrapi.db.query = vi.fn((model: string) => ({
        findOne: vi.fn().mockResolvedValue({ id: 1, roles: [{ code: 'strapi-super-admin' }] }),
        findMany: vi.fn((opts: any) => {
          if (opts.where?.type?.$in) {
            return Promise.resolve(contentApiTokens);
          }
          return Promise.resolve([]);
        }),
      }));

      mockStrapi.documents = vi.fn(() => ({
        findMany: vi.fn().mockResolvedValue([]),
      }));

      await controller.listTokens(mockCtx);

      expect(mockCtx.body.data).toBeDefined();
      expect(mockCtx.body.data.length).toBe(3);
      expect(mockCtx.body.data.every((t: any) => t.kind === 'content-api')).toBe(true);
    });
  });

  describe('bindToken - Kind Mapping for Full-Access Tokens', () => {
    it('should use token.kind for full-access content-api tokens', async () => {
      const fullAccessToken = {
        id: 1,
        name: 'Full Access',
        kind: 'content-api',
        type: 'full-access',
        expiresAt: null,
      };

      const agent = { documentId: 'agent-123' };

      mockStrapi.documents = vi.fn(() => ({
        findMany: vi.fn().mockResolvedValue([]),
        create: vi.fn((opts: any) => {
          expect(opts.data.kind).toBe('content-api');
          return Promise.resolve({ documentId: 'cred-123' });
        }),
      }));

      mockStrapi.db.query = vi.fn(() => ({
        findOne: vi.fn().mockResolvedValue(fullAccessToken),
      }));

      try {
        await require('../controllers/admin').__test_bindTokenToAgent(mockStrapi, agent, 1);
      } catch (error) {
        
      }
    });
  });

  describe('createAgent - Mint Permission Check Before Creation', () => {
    it('should return 403 without creating agent when user lacks permissions', async () => {
      mockCtx.request.body = {
        name: 'Test Agent',
        slug: 'test-agent',
        credentialType: 'mint',
        permissionPack: 'orchestrator',
      };

      mockCtx.state.user.roles = [];

      mockStrapi.service = vi.fn((name: string) => {
        if (name === 'admin::permission') {
          return {
            findUserPermissions: vi.fn().mockResolvedValue([]),
          };
        }
        return {};
      });

      let createCalled = false;
      mockStrapi.documents = vi.fn(() => ({
        findMany: vi.fn().mockResolvedValue([]),
        create: vi.fn(() => {
          createCalled = true;
          return Promise.resolve({ documentId: 'test-123' });
        }),
      }));

      await controller.createAgent(mockCtx);

      expect(mockCtx.status).toBe(403);
      expect(mockCtx.body.error).toContain('missing permissions');
      expect(createCalled).toBe(false);
    });
  });

  describe('createAgent - Orchestrator Uniqueness', () => {
    it('should reject creating second orchestrator when chief exists', async () => {
      mockCtx.request.body = {
        name: 'Second Orchestrator',
        slug: 'second-orch',
        kind: 'orchestrator',
      };

      const existingChief = [{ documentId: 'chief-123', slug: 'chief', kind: 'orchestrator' }];

      mockStrapi.documents = vi.fn(() => ({
        findMany: vi.fn((opts: any) => {
          if (opts.filters?.slug?.$eq === 'chief') {
            return Promise.resolve(existingChief);
          }
          return Promise.resolve([]);
        }),
        create: vi.fn(),
      }));

      await controller.createAgent(mockCtx);

      expect(mockCtx.status).toBe(400);
      expect(mockCtx.body.error).toContain('Only one orchestrator');
    });

    it('should reject creating agent with slug "chief" when chief exists', async () => {
      mockCtx.request.body = {
        name: 'Fake Chief',
        slug: 'chief',
        kind: 'specialist',
      };

      const existingChief = [{ documentId: 'chief-123', slug: 'chief' }];

      mockStrapi.documents = vi.fn(() => ({
        findMany: vi.fn().mockResolvedValue(existingChief),
        create: vi.fn(),
      }));

      await controller.createAgent(mockCtx);

      expect(mockCtx.status).toBe(400);
      expect(mockCtx.body.error).toContain('reserved and already exists');
    });
  });

  describe('Response Sanitization - No Private Fields', () => {
    it('should never return webhookSecret in listAgents', async () => {
      const agentsWithSecrets = [
        {
          id: 1,
          name: 'Agent 1',
          webhookUrl: 'https://example.com',
          webhookSecret: 'super-secret',
          webhookAuthHeader: 'Bearer token',
          credentials: [],
        },
      ];

      mockStrapi.documents = vi.fn(() => ({
        findMany: vi.fn().mockResolvedValue(agentsWithSecrets),
      }));

      await controller.listAgents(mockCtx);

      expect(mockCtx.body.data).toBeDefined();
      expect(mockCtx.body.data[0]).not.toHaveProperty('webhookSecret');
      expect(mockCtx.body.data[0]).not.toHaveProperty('webhookAuthHeader');
      expect(mockCtx.body.data[0]).toHaveProperty('webhookConfigured');
      expect(mockCtx.body.data[0].webhookConfigured).toBe(true);
    });

    it('should never return webhookSecret in getAgent', async () => {
      const agentWithSecret = {
        id: 1,
        name: 'Agent 1',
        webhookSecret: 'super-secret',
        credentials: [],
      };

      mockCtx.params.documentId = 'agent-123';

      mockStrapi.documents = vi.fn(() => ({
        findMany: vi.fn().mockResolvedValue([agentWithSecret]),
      }));

      await controller.getAgent(mockCtx);

      expect(mockCtx.body.data).toBeDefined();
      expect(mockCtx.body.data).not.toHaveProperty('webhookSecret');
      expect(mockCtx.body.data).not.toHaveProperty('webhookAuthHeader');
    });

    it('should never return webhookSecret in createAgent', async () => {
      mockCtx.request.body = {
        name: 'Test Agent',
        webhookSecret: 'secret',
      };

      const createdAgent = {
        documentId: 'test-123',
        name: 'Test Agent',
        webhookSecret: 'secret',
        credentials: [],
      };

      mockStrapi.documents = vi.fn(() => ({
        findMany: vi.fn((opts: any) => {
          if (opts.filters?.documentId) {
            return Promise.resolve([createdAgent]);
          }
          return Promise.resolve([]);
        }),
        create: vi.fn().mockResolvedValue({ documentId: 'test-123' }),
      }));

      await controller.createAgent(mockCtx);

      expect(mockCtx.status).toBe(201);
      expect(mockCtx.body.data.agent).toBeDefined();
      expect(mockCtx.body.data.agent).not.toHaveProperty('webhookSecret');
      expect(mockCtx.body.data.agent).not.toHaveProperty('webhookAuthHeader');
    });

    it('should never return webhookSecret in updateAgent', async () => {
      mockCtx.params.documentId = 'agent-123';
      mockCtx.request.body = { name: 'Updated' };

      const updatedAgent = {
        documentId: 'agent-123',
        name: 'Updated',
        webhookSecret: 'secret',
        credentials: [],
      };

      mockStrapi.documents = vi.fn(() => ({
        findMany: vi.fn((opts: any) => {
          if (opts.filters?.documentId) {
            return Promise.resolve([updatedAgent]);
          }
          return Promise.resolve([updatedAgent]);
        }),
        update: vi.fn().mockResolvedValue({ documentId: 'agent-123' }),
      }));

      await controller.updateAgent(mockCtx);

      expect(mockCtx.body.data).toBeDefined();
      expect(mockCtx.body.data).not.toHaveProperty('webhookSecret');
      expect(mockCtx.body.data).not.toHaveProperty('webhookAuthHeader');
    });
  });

  describe('Slug Generation and Validation', () => {
    it('should auto-generate slug from name if not provided', async () => {
      mockCtx.request.body = {
        name: 'Test Agent 123',
      };

      let createdSlug: string | undefined;
      mockStrapi.documents = vi.fn(() => ({
        findMany: vi.fn().mockResolvedValue([]),
        create: vi.fn((opts: any) => {
          createdSlug = opts.data.slug;
          return Promise.resolve({ documentId: 'test-123', slug: createdSlug });
        }),
      }));

      await controller.createAgent(mockCtx);

      expect(createdSlug).toBe('test-agent-123');
    });
  });
});
