'use strict';

const { createGuardMiddleware } = require('./guard');
const { createEventLog } = require('./event-log');
const eventSchema = require('./content-types/event/schema.json');

/**
 * mcp-guard — server entry.
 *
 * The whole point of packaging this as a plugin: the middleware installs
 * itself. No `config/middlewares.ts` edit, no ordering for the user to get
 * wrong.
 *
 * The slot matters. Strapi's boot order is:
 *
 *   bootstrap()
 *     ├─ server.initMiddlewares()   ← config/middlewares.ts entries land here
 *     ├─ server.initRouting()
 *     ├─ plugin bootstrap()         ← WE ARE HERE
 *     ├─ provider bootstrap()       ← mcp provider mounts POST /mcp
 *     └─ user bootstrap()
 *   listen() → mount() → app.use(router.routes())
 *
 * A plugin's bootstrap() therefore runs *after* every config middleware
 * (so ctx.request.body is parsed) and *before* the MCP routes exist (so we are
 * upstream of them). register() would be too early — it runs before the body
 * parser, and ctx.request.body would be empty.
 */

const PERMISSION_ACTION = 'plugin::mcp-guard.read';

module.exports = {
  register({ strapi }) {
    // Gate the admin page behind a real RBAC permission.
    strapi.admin.services.permission.actionProvider.registerMany([
      {
        section: 'plugins',
        displayName: 'Read MCP guard events',
        uid: 'read',
        pluginName: 'mcp-guard',
      },
    ]);
  },

  bootstrap({ strapi }) {
    const config = strapi.config.get('plugin::mcp-guard');

    const eventLog = createEventLog({ strapi, config });
    strapi.plugin('mcp-guard').eventLog = eventLog;

    if (config.enabled === false) {
      strapi.log.info('[mcp-guard] disabled by config');
      return;
    }

    strapi.server.use(createGuardMiddleware({ strapi, config, eventLog }));

    strapi.log.info(
      `[mcp-guard] watching ${config.path} — inbound=${config.inbound} outbound=${config.outbound}` +
        `${config.persist ? ' persist=on' : ''}`
    );
  },

  config: {
    default: {
      enabled: true,
      path: '/mcp',
      inbound: 'block',
      outbound: 'sanitize',
      allowedMethods: [
        'initialize',
        'notifications/initialized',
        'ping',
        'tools/list',
        'tools/call',
        'prompts/list',
        'prompts/get',
        'resources/list',
        'resources/templates/list',
        'resources/read',
        'completion/complete',
      ],
      allowedTools: null,
      deniedTools: [],
      maxArgBytes: 32 * 1024,
      logArgs: true,
      bufferSize: 200,
      persist: false,
    },
    validator(config) {
      const inbound = ['block', 'warn', 'off'];
      const outbound = ['block', 'sanitize', 'warn', 'off'];

      if (inbound.includes(config.inbound) === false) {
        throw new Error(`inbound must be one of ${inbound.join(', ')}`);
      }
      if (outbound.includes(config.outbound) === false) {
        throw new Error(`outbound must be one of ${outbound.join(', ')}`);
      }
      if (Number.isInteger(config.bufferSize) === false || config.bufferSize < 1) {
        throw new Error('bufferSize must be a positive integer');
      }
    },
  },

  contentTypes: {
    event: { schema: eventSchema },
  },

  controllers: {
    events: {
      async find(ctx) {
        const eventLog = strapi.plugin('mcp-guard').eventLog;
        const { limit, action, method, onlyFindings } = ctx.query;

        ctx.body = {
          events: eventLog.list({
            limit: Math.min(Number(limit) || 50, 200),
            action,
            method,
            onlyFindings: onlyFindings === 'true',
          }),
        };
      },

      async stats(ctx) {
        ctx.body = strapi.plugin('mcp-guard').eventLog.stats();
      },

      async config(ctx) {
        const config = strapi.config.get('plugin::mcp-guard');
        ctx.body = {
          path: config.path,
          inbound: config.inbound,
          outbound: config.outbound,
          deniedTools: config.deniedTools,
          allowedTools: config.allowedTools,
          persist: config.persist,
          bufferSize: config.bufferSize,
        };
      },

      async clear(ctx) {
        strapi.plugin('mcp-guard').eventLog.clear();
        ctx.body = { ok: true };
      },
    },
  },

  routes: {
    admin: {
      type: 'admin',
      routes: [
        {
          method: 'GET',
          path: '/events',
          handler: 'events.find',
          config: { policies: [{ name: 'admin::hasPermissions', config: { actions: [PERMISSION_ACTION] } }] },
        },
        {
          method: 'GET',
          path: '/stats',
          handler: 'events.stats',
          config: { policies: [{ name: 'admin::hasPermissions', config: { actions: [PERMISSION_ACTION] } }] },
        },
        {
          method: 'GET',
          path: '/config',
          handler: 'events.config',
          config: { policies: [{ name: 'admin::hasPermissions', config: { actions: [PERMISSION_ACTION] } }] },
        },
        {
          method: 'POST',
          path: '/clear',
          handler: 'events.clear',
          config: { policies: [{ name: 'admin::hasPermissions', config: { actions: [PERMISSION_ACTION] } }] },
        },
      ],
    },
  },
};
