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
  // Developed as a SIBLING directory, not inside this app, so it stays an
  // independently publishable package. `strapi-plugin watch:link` from the
  // plugin repo hot-reloads edits into here without a reinstall.
  //
  // The two halves are gated SEPARATELY and that is the point of the design:
  // tools are always on and pull no AI SDK at all, while chat is opt-in and is
  // the only thing that reaches for the ESM-only `@tanstack/ai`. A host that
  // never enables chat never loads it.
  'tanstack-ai': {
    enabled: true,
    resolve: '../strapi-plugin-tanstack-ai',
    config: {
      mcp: {
        toolPrefix: 'tsai',
        sizeLimitBytes: 100_000,
      },
      chat: {
        enabled: env.bool('TANSTACK_AI_CHAT', false),
        provider: env('TANSTACK_AI_PROVIDER', 'anthropic'),
        model: env('TANSTACK_AI_MODEL', 'claude-sonnet-5'),
        apiKey: env('ANTHROPIC_API_KEY'),
        baseURL: env('OLLAMA_HOST'),
      },
    },
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
