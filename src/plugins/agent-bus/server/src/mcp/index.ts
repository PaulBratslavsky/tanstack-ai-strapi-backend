import type { Core } from '@strapi/strapi';
import { tools } from './tools';
import { PLUGIN_VERSION } from '../version';

export const registerMcpTools = (strapi: Core.Strapi) => {
  strapi.log.info(`[agent-bus] Registering MCP tools (v${PLUGIN_VERSION})...`);

  for (const tool of tools) {
    try {
      tool.register(strapi);
      strapi.log.debug(`[agent-bus] Registered tool: ${tool.register.name}`);
    } catch (err) {
      strapi.log.error(`[agent-bus] Failed to register tool:`, err);
    }
  }

  strapi.log.info(`[agent-bus] Registered ${tools.length} MCP tools`);
};
