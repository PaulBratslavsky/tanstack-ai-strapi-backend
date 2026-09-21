import type { Core } from '@strapi/strapi';

/**
 * Production server options, merged over `config/server.ts`.
 *
 * Strapi Cloud sits behind a TLS proxy, so the origin Strapi sees is not the
 * public one. `proxy: true` trusts the forwarded headers, and `url` is the
 * public https address — set PUBLIC_URL to the project's Cloud URL. Anything
 * that builds absolute links (MCP OAuth discovery, admin redirects) uses it.
 */
const config = ({ env }: Core.Config.Shared.ConfigParams): Partial<Core.Config.Server> => ({
  url: env('PUBLIC_URL'),
  proxy: true,
});

export default config;
