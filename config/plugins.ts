import type { Core } from '@strapi/strapi';

const allowedMediaTypes = [
  'image/*',
  'video/*',
  'audio/*',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.*',
  'text/plain',
  'text/csv',
];

const deniedTypes = [
  'image/svg+xml',
  'application/vnd.microsoft.portable-executable',
  'application/x-msdownload',
  'application/x-msdos-program',
  'application/x-executable',
  'application/x-dosexec',
  'application/x-sh',
  'text/x-shellscript',
  'application/x-mach-binary',
];

const config = ({ env }: Core.Config.Shared.ConfigParams): Core.Config.Plugin => ({
  // WHERE THE PLUGIN COMES FROM depends on the environment.
  //
  // Here, in the base config, there is no `resolve`: Strapi loads the
  // `strapi-plugin-tanstack-ai` package installed from npm (package.json
  // dependencies). That is what Strapi Cloud and any production build run.
  //
  // `config/env/development/plugins.ts` adds `resolve: '../strapi-plugin-tanstack-ai'`
  // on top, so `npm run develop` uses the sibling checkout instead. Strapi
  // merges that file over this one when NODE_ENV is "development", which is
  // also what it defaults NODE_ENV to when nothing sets it.
  //
  // The two halves are gated SEPARATELY: tools are always on and pull no AI SDK
  // at all, while chat is the only thing that reaches for the ESM-only
  // `@tanstack/ai`. Chat is on by default (plugin 1.3.0+); if its key or
  // packages are missing, Strapi still boots and the TanStack AI page says what
  // to add. Set TANSTACK_AI_CHAT=false to turn it off.
  'tanstack-ai': {
    enabled: true,
    config: {
      mcp: {
        // Both keys were dead until phase 7 — declared, validated, ignored.
        // They are set to the plugin's defaults explicitly here so the demo
        // shows the surface without diverging from documented behaviour: an
        // empty prefix (neither tool collides with a built-in) and a budget
        // just under what an MCP client accepts, counted DOUBLED because every
        // result rides the wire twice.
        toolPrefix: '',
        sizeLimitBytes: 950_000,
      },
      chat: {
        enabled: env.bool('TANSTACK_AI_CHAT', true),
        provider: env('TANSTACK_AI_PROVIDER', 'anthropic'),
        model: env('TANSTACK_AI_MODEL', 'claude-sonnet-5'),
        apiKey: env('ANTHROPIC_API_KEY'),
        baseURL: env('OLLAMA_HOST'),
      },
    },
  },

  'paul-brain': {
    enabled: true,
    resolve: './src/plugins/paul-brain',
  },

  'agent-bus': {
    enabled: true,
    resolve: './src/plugins/agent-bus',
  },

  'users-permissions': {
    config: {
      jwtManagement: 'refresh',
      sessions: {
        httpOnly: true,
      },
    },
  },
  upload: {
    config: {
      security: {
        allowedTypes: allowedMediaTypes,
        deniedTypes,
      },
    },
  },
});

export default config;
