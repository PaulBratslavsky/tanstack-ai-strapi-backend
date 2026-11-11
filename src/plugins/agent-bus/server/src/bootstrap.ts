import type { Core } from '@strapi/strapi';
import { getUid } from './mcp/types';
import { startOutboxWorker } from './workers/outbox';
import { startExpiryWorker } from './workers/expiry';

const bootstrap = async ({ strapi }: { strapi: Core.Strapi }) => {
  const agentUid = getUid('agent');

  // Seed chief agent (idempotent)
  const existing = await strapi.documents(agentUid).findMany({
    filters: { slug: { $eq: 'chief' } },
  });

  if (!existing || existing.length === 0) {
    await strapi.documents(agentUid).create({
      data: {
        name: 'Chief of Staff',
        slug: 'chief',
        kind: 'orchestrator',
        description: "Paul's Chief of Staff. Default inbox and manager. Delegates work, checks proof, escalates to Paul.",
        capabilities: [],
        state: 'active',
        permissionPack: 'orchestrator',
      },
    });

    strapi.log.info('[agent-bus] Seeded chief agent');
  } else {
    strapi.log.debug('[agent-bus] Chief agent already exists');
  }

  // Get plugin config
  const config = strapi.config.get('plugin.agent-bus') || {};
  const finalConfig = {
    ...{ vetoWindowMinutes: 60, leaseMinutes: 15, allowInsecureWebhooks: false },
    ...config,
  };

  // Start workers
  startOutboxWorker(strapi, finalConfig);
  startExpiryWorker(strapi);

  // Register MCP tools if MCP is enabled
  if (strapi.ai?.mcp?.isEnabled()) {
    // Import and register tools
    const { registerMcpTools } = await import('./mcp');
    registerMcpTools(strapi);
  } else {
    strapi.log.info('[agent-bus] MCP is not enabled, skipping MCP tool registration');
  }

  // Subscribe to token deletion to revoke credentials
  const credentialUid = getUid('agent-credential');
  strapi.db.lifecycles.subscribe({
    models: ['admin::api-token'],
    async afterDelete(event: any) {
      const { result } = event;
      if (!result || !result.id) return;

      const tokenId = String(result.id);
      const credentials = await strapi.documents(credentialUid).findMany({
        filters: { tokenId: { $eq: tokenId }, state: { $eq: 'active' } },
      });

      for (const credential of credentials) {
        await strapi.documents(credentialUid).update({
          documentId: credential.documentId,
          data: { state: 'revoked', tokenName: 'Deleted token' },
        });
      }

      if (credentials.length > 0) {
        strapi.log.info(`[agent-bus] Revoked ${credentials.length} credential(s) for deleted token ${tokenId}`);
      }
    },
  });

  strapi.log.info('[agent-bus] Bootstrap complete');
};

export default bootstrap;
