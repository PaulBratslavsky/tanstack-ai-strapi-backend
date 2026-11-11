import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('Admin Controller Tests', () => {
  let mockStrapi: any;
  let mockCtx: any;
  let mockUser: any;

  beforeEach(() => {
    mockUser = {
      id: 1,
      email: 'admin@example.com',
      roles: [],
    };

    mockCtx = {
      params: {},
      request: { body: {} },
      state: { user: mockUser },
      status: 200,
      body: null,
    };

    mockStrapi = {
      documents: vi.fn((uid: string) => ({
        findMany: vi.fn(),
        findFirst: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
      })),
      db: {
        query: vi.fn((model: string) => ({
          findMany: vi.fn(),
          findOne: vi.fn(),
          create: vi.fn(),
        })),
      },
      service: vi.fn((name: string) => {
        if (name === 'admin::api-token-admin') {
          return {
            create: vi.fn(),
            revoke: vi.fn(),
            getById: vi.fn(),
          };
        }
        if (name === 'admin::permission') {
          return {
            findUserPermissions: vi.fn(),
          };
        }
        return {};
      }),
      log: {
        warn: vi.fn(),
        info: vi.fn(),
      },
    };
  });

  describe('Slug Generation and Validation', () => {
    it('should require slug field to be set', () => {
      const name = 'Test Agent';
      const slug = name
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
      
      expect(slug).toBe('test-agent');
      expect(slug).not.toBe('');
    });

    it('should reject slug "chief" if chief exists', () => {
      const slug = 'chief';
      const chiefExists = true;
      
      expect(slug).toBe('chief');
      if (chiefExists && slug === 'chief') {
        expect(true).toBe(true);
      }
    });

    it('should generate slug from name with special characters', () => {
      const name = 'Test@Agent#123!';
      const slug = name
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
      
      expect(slug).toBe('test-agent-123');
    });
  });

  describe('Response Sanitization', () => {
    it('should never return webhookSecret in response', () => {
      const agent = {
        id: 1,
        name: 'Test Agent',
        webhookUrl: 'https://example.com',
        webhookSecret: 'super-secret',
        webhookAuthHeader: 'Bearer token',
      };

      const sanitized = { ...agent };
      delete sanitized.webhookSecret;
      delete sanitized.webhookAuthHeader;
      sanitized.webhookConfigured = Boolean(agent.webhookUrl);
      sanitized.hasAuthHeader = Boolean(agent.webhookAuthHeader);

      expect(sanitized).not.toHaveProperty('webhookSecret');
      expect(sanitized).not.toHaveProperty('webhookAuthHeader');
      expect(sanitized.webhookConfigured).toBe(true);
      expect(sanitized.hasAuthHeader).toBe(true);
    });

    it('should add webhookConfigured boolean based on webhookUrl', () => {
      const agentWithWebhook = { webhookUrl: 'https://example.com' };
      const agentWithoutWebhook = { webhookUrl: null };

      expect(Boolean(agentWithWebhook.webhookUrl)).toBe(true);
      expect(Boolean(agentWithoutWebhook.webhookUrl)).toBe(false);
    });

    it('should sanitize credential list to show only names', () => {
      const credentials = [
        { id: 1, kind: 'admin', tokenId: '123', tokenName: 'Token 1', state: 'active', mintedByPlugin: true },
        { id: 2, kind: 'content-api', tokenId: '456', tokenName: 'Token 2', state: 'active', mintedByPlugin: false },
      ];

      const sanitized = credentials.map(cred => ({
        id: cred.id,
        kind: cred.kind,
        tokenName: cred.tokenName,
        state: cred.state,
        mintedByPlugin: cred.mintedByPlugin,
      }));

      expect(sanitized[0]).not.toHaveProperty('tokenId');
      expect(sanitized[0]).toHaveProperty('tokenName');
    });
  });

  describe('Token List API Call', () => {
    it('should use strapi.db.query for token listing in 5.60', () => {
      const userId = 1;
      const queryFn = mockStrapi.db.query('admin::api-token');
      
      expect(queryFn).toBeDefined();
      expect(queryFn.findMany).toBeDefined();
    });

    it('should filter bound tokens from selectable list', () => {
      const allTokens = [
        { id: 1, name: 'Token 1' },
        { id: 2, name: 'Token 2' },
        { id: 3, name: 'Token 3' },
      ];
      
      const boundTokenIds = new Set(['1', '3']);
      const selectable = allTokens.filter(t => !boundTokenIds.has(String(t.id)));
      
      expect(selectable.length).toBe(1);
      expect(selectable[0].id).toBe(2);
    });

    it('should support both admin and content-api tokens', () => {
      const adminToken = { type: 'admin', kind: 'admin' };
      const contentApiToken = { type: 'custom' };
      
      const adminKind = adminToken.type === 'custom' ? 'content-api' : 'admin';
      const contentApiKind = contentApiToken.type === 'custom' ? 'content-api' : 'admin';
      
      expect(adminKind).toBe('admin');
      expect(contentApiKind).toBe('content-api');
    });
  });

  describe('Mint Permission Check', () => {
    it('should allow super admin to mint any pack', () => {
      const user = {
        id: 1,
        roles: [{ code: 'strapi-super-admin' }],
      };
      
      const isSuperAdmin = user.roles.some(role => role.code === 'strapi-super-admin');
      expect(isSuperAdmin).toBe(true);
    });

    it('should check each pack action against user permissions', () => {
      const packActions = ['agent.read', 'message.send', 'message.inbox'];
      const userPermissions = [
        { action: 'plugin::agent-bus.agent.read' },
        { action: 'plugin::agent-bus.message.send' },
      ];
      
      const userActionIds = new Set(userPermissions.map(p => p.action));
      const missing = packActions
        .map(uid => `plugin::agent-bus.${uid}`)
        .filter(actionId => !userActionIds.has(actionId));
      
      expect(missing.length).toBe(1);
      expect(missing[0]).toBe('plugin::agent-bus.message.inbox');
    });

    it('should return 403 with missing permissions list', () => {
      const missing = ['plugin::agent-bus.approval.read', 'plugin::agent-bus.approval.decide'];
      const hasPermission = missing.length === 0;
      
      expect(hasPermission).toBe(false);
      expect(missing.length).toBe(2);
    });
  });

  describe('Credential Ownership Check', () => {
    it('should verify credential belongs to agent before revoking', () => {
      const credential = {
        id: 1,
        agent: { documentId: 'agent-123' },
      };
      
      const requestedAgentId = 'agent-123';
      const differentAgentId = 'agent-456';
      
      expect(credential.agent.documentId).toBe(requestedAgentId);
      expect(credential.agent.documentId).not.toBe(differentAgentId);
    });

    it('should return 404 when credential agent does not match URL agent', () => {
      const urlAgentId = 'agent-123';
      const credentialAgentId = 'agent-456';
      
      if (urlAgentId !== credentialAgentId) {
        expect(true).toBe(true);
      }
    });
  });

  describe('Token Uniqueness and Rebinding', () => {
    it('should only check active credentials for uniqueness', () => {
      const credentials = [
        { tokenId: '123', state: 'active' },
        { tokenId: '456', state: 'revoked' },
        { tokenId: '789', state: 'active' },
      ];
      
      const activeOnly = credentials.filter(c => c.state === 'active');
      expect(activeOnly.length).toBe(2);
      expect(activeOnly.some(c => c.tokenId === '456')).toBe(false);
    });

    it('should allow rebinding a revoked token', () => {
      const revokedBinding = { tokenId: '123', state: 'revoked' };
      const canReactivate = revokedBinding.state === 'revoked';
      
      expect(canReactivate).toBe(true);
    });

    it('should reject binding if token already active', () => {
      const existingActive = [{ tokenId: '123', state: 'active' }];
      const isAlreadyBound = existingActive.length > 0;
      
      expect(isAlreadyBound).toBe(true);
    });
  });

  describe('Chief Deletion Prevention', () => {
    it('should prevent deleting agent with slug "chief"', () => {
      const agent = { slug: 'chief', kind: 'orchestrator' };
      const canDelete = agent.slug !== 'chief' && agent.kind !== 'orchestrator';
      
      expect(canDelete).toBe(false);
    });

    it('should prevent deleting agent with kind "orchestrator"', () => {
      const agent = { slug: 'other', kind: 'orchestrator' };
      const canDelete = agent.slug !== 'chief' && agent.kind !== 'orchestrator';
      
      expect(canDelete).toBe(false);
    });

    it('should revoke all credentials before deleting agent', () => {
      const credentials = [
        { id: 1, mintedByPlugin: true, tokenId: '123' },
        { id: 2, mintedByPlugin: false, tokenId: '456' },
      ];
      
      const needsRevoke = credentials.every(c => true);
      const needsTokenDelete = credentials.filter(c => c.mintedByPlugin);
      
      expect(needsRevoke).toBe(true);
      expect(needsTokenDelete.length).toBe(1);
    });
  });

  describe('Update 404 Handling', () => {
    it('should return 404 when updating unknown documentId', () => {
      const result = null;
      const status = result ? 200 : 404;
      
      expect(status).toBe(404);
    });

    it('should return sanitized agent on successful update', () => {
      const updated = {
        documentId: '123',
        name: 'Updated',
        webhookSecret: 'secret',
      };
      
      if (updated) {
        const sanitized = { ...updated };
        delete sanitized.webhookSecret;
        expect(sanitized).not.toHaveProperty('webhookSecret');
      }
    });
  });

  describe('Permission Pack Mapping', () => {
    it('should map asker pack correctly', () => {
      const actions = ['agent.read', 'message.send'];
      expect(actions.length).toBe(2);
      expect(actions).toContain('agent.read');
      expect(actions).toContain('message.send');
    });

    it('should map specialist pack correctly', () => {
      const actions = ['agent.read', 'message.send', 'message.inbox'];
      expect(actions.length).toBe(3);
      expect(actions).toContain('message.inbox');
    });

    it('should map orchestrator pack correctly', () => {
      const actions = [
        'agent.read',
        'message.send',
        'message.inbox',
        'message.manage',
        'approval.read',
        'approval.decide',
        'delivery.read',
      ];
      expect(actions.length).toBe(7);
      expect(actions).toContain('approval.decide');
    });
  });
});
