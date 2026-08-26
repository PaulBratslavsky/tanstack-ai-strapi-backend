import type { Core } from '@strapi/strapi';

const config = ({ env }: Core.Config.Shared.ConfigParams): Core.Config.Server => ({
  host: env('HOST', '0.0.0.0'),
  port: env.int('PORT', 1337),
  app: {
    keys: env.array('APP_KEYS')!,
  },
  webhooks: {
    populateRelations: env.bool('WEBHOOKS_POPULATE_RELATIONS', false),
  },
  // Official Strapi MCP server (5.47+), served at /mcp over streamable-http,
  // authenticated with admin-kind API tokens. Defaults: connectTimeoutMs 5000,
  // requestTimeoutMs 60000 — the latter is raised because MCP tool calls here
  // fan out to content queries that can exceed the default on a cold SQLite file.
  mcp: {
    enabled: env.bool('MCP_ENABLED', true),
    requestTimeoutMs: 120000,
  },
});

export default config;
