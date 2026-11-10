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

  strapi.log.info('[agent-bus] Bootstrap complete');
};

export default bootstrap;
