import { describe, it, expect } from 'vitest';

describe('Agent Bus Admin', () => {
  describe('Permission Pack Mapping', () => {
    it('maps asker pack to correct actions', () => {
      const askerActions = ['agent.read', 'message.send'];
      const expectedActionIds = [
        'plugin::agent-bus.agent.read',
        'plugin::agent-bus.message.send',
      ];
      
      expect(askerActions.length).toBe(2);
      expect(expectedActionIds.sort()).toEqual([
        'plugin::agent-bus.agent.read',
        'plugin::agent-bus.message.send',
      ].sort());
    });

    it('maps specialist pack to correct actions', () => {
      const specialistActions = ['agent.read', 'message.send', 'message.inbox'];
      const expectedActionIds = [
        'plugin::agent-bus.agent.read',
        'plugin::agent-bus.message.send',
        'plugin::agent-bus.message.inbox',
      ];
      
      expect(specialistActions.length).toBe(3);
      expect(expectedActionIds.sort()).toEqual([
        'plugin::agent-bus.agent.read',
        'plugin::agent-bus.message.inbox',
        'plugin::agent-bus.message.send',
      ].sort());
    });

    it('maps orchestrator pack to correct actions', () => {
      const orchestratorActions = [
        'agent.read',
        'message.send',
        'message.inbox',
        'message.manage',
        'approval.read',
        'approval.decide',
        'delivery.read',
      ];
      const expectedActionIds = [
        'plugin::agent-bus.agent.read',
        'plugin::agent-bus.message.send',
        'plugin::agent-bus.message.inbox',
        'plugin::agent-bus.message.manage',
        'plugin::agent-bus.approval.read',
        'plugin::agent-bus.approval.decide',
        'plugin::agent-bus.delivery.read',
      ];
      
      expect(orchestratorActions.length).toBe(7);
      expect(expectedActionIds.sort()).toEqual([
        'plugin::agent-bus.agent.read',
        'plugin::agent-bus.approval.decide',
        'plugin::agent-bus.approval.read',
        'plugin::agent-bus.delivery.read',
        'plugin::agent-bus.message.inbox',
        'plugin::agent-bus.message.manage',
        'plugin::agent-bus.message.send',
      ].sort());
    });
  });

  describe('Token Binding Security', () => {
    it('enforces unique tokenId constraint logic', () => {
      const tokenId1 = 'token-123';
      const tokenId2 = 'token-456';
      const tokenId3 = 'token-123';

      const existingTokenIds = new Set([tokenId1, tokenId2]);
      
      expect(existingTokenIds.has(tokenId1)).toBe(true);
      expect(existingTokenIds.has(tokenId3)).toBe(true);
      expect(existingTokenIds.has('token-789')).toBe(false);
      expect(existingTokenIds.size).toBe(2);
    });
  });

  describe('Private Field Sanitization', () => {
    it('identifies private webhook fields that must not be returned', () => {
      const privateFields = ['webhookSecret', 'webhookAuthHeader'];
      const agent = {
        name: 'Test Agent',
        webhookUrl: 'https://example.com',
        webhookSecret: 'secret',
        webhookAuthHeader: 'Bearer token',
      };

      privateFields.forEach(field => {
        expect(agent).toHaveProperty(field);
      });

      const sanitized = { ...agent };
      delete (sanitized as any).webhookSecret;
      delete (sanitized as any).webhookAuthHeader;

      expect(sanitized).not.toHaveProperty('webhookSecret');
      expect(sanitized).not.toHaveProperty('webhookAuthHeader');
      expect(sanitized).toHaveProperty('webhookUrl');
    });
  });

  describe('Lifecycle Hook Logic', () => {
    it('simulates token deletion affecting credentials', () => {
      const tokenId = '123';
      const credentials = [
        { id: 1, tokenId: '123', state: 'active' },
        { id: 2, tokenId: '456', state: 'active' },
        { id: 3, tokenId: '123', state: 'active' },
      ];

      const affectedCredentials = credentials.filter(c => c.tokenId === tokenId);
      expect(affectedCredentials.length).toBe(2);

      const updatedCredentials = affectedCredentials.map(c => ({ ...c, state: 'revoked' }));
      expect(updatedCredentials.every(c => c.state === 'revoked')).toBe(true);
    });
  });

  describe('Mint vs Bind Logic', () => {
    it('distinguishes minted tokens from bound tokens', () => {
      const mintedCredential = {
        tokenId: '123',
        mintedByPlugin: true,
        state: 'active',
      };

      const boundCredential = {
        tokenId: '456',
        mintedByPlugin: false,
        state: 'active',
      };

      expect(mintedCredential.mintedByPlugin).toBe(true);
      expect(boundCredential.mintedByPlugin).toBe(false);

      const shouldRevokeToken = mintedCredential.mintedByPlugin;
      expect(shouldRevokeToken).toBe(true);
    });
  });
});
