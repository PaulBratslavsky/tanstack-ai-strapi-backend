import type { Core } from '@strapi/strapi';

/**
 * Production middlewares. Strapi Cloud overwrites the global
 * `config/middlewares.ts` on every deploy, so production changes live here.
 *
 * CORS allows and exposes the MCP session header, so browser-based MCP clients
 * (the MCP Inspector, a web chat) can keep a session with /mcp, and exposes
 * WWW-Authenticate so they can read an auth challenge. The admin tokens MCP
 * uses are bearer tokens, not cookies, so an open origin does not hand out
 * ambient credentials.
 *
 * Security stays on Strapi's defaults: nothing here needs framing or inline
 * scripts.
 */
const config: Core.Config.Middlewares = [
  'strapi::logger',
  'strapi::errors',
  'strapi::security',
  {
    name: 'strapi::cors',
    config: {
      origin: '*',
      headers: ['Content-Type', 'Authorization', 'Accept', 'mcp-session-id'],
      expose: ['mcp-session-id', 'WWW-Authenticate'],
    },
  },
  'strapi::poweredBy',
  'strapi::query',
  {
    name: 'strapi::body',
    config: {
      // attach_resource_file accepts a 25 MB file as base64 inside the MCP JSON body.
      // Cloud overwrites config/middlewares.ts, so the limit has to live here too.
      jsonLimit: '48mb',
      formLimit: '48mb',
      textLimit: '48mb',
      formidable: {
        maxFileSize: 25 * 1024 * 1024,
      },
    },
  },
  'strapi::session',
  'strapi::favicon',
  'strapi::public',
];

export default config;
