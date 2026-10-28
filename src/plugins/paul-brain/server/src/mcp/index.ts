import type { Core } from '@strapi/strapi';
import { tools } from './tools';

export const registerMcpTools = (strapi: Core.Strapi) => {
  if (!strapi.ai?.mcp?.isEnabled()) {
    strapi.log.info('[paul-brain] MCP is not enabled, skipping tool registration');
    return;
  }

  strapi.log.info('[paul-brain] Registering MCP tools...');

  for (const tool of tools) {
    try {
      tool.register(strapi);
      strapi.log.debug(`[paul-brain] Registered tool: ${tool.register.name}`);
    } catch (err) {
      strapi.log.error(`[paul-brain] Failed to register tool:`, err);
    }
  }

  strapi.log.info(`[paul-brain] Registered ${tools.length} MCP tools`);
};
