import type { Core } from '@strapi/strapi';

/**
 * Production plugin options — Strapi Cloud always runs with NODE_ENV=production.
 *
 * Merged over `config/plugins.ts` by Strapi. The base already loads
 * `strapi-plugin-tanstack-ai` from npm (only `config/env/development/plugins.ts`
 * points it at the local checkout); this file sets the options that differ on
 * Cloud.
 */
const config = ({ env }: Core.Config.Shared.ConfigParams): Core.Config.Plugin => ({
  'tanstack-ai': {
    config: {
      chat: {
        // On unless TANSTACK_AI_CHAT=false. Since plugin 1.3.0 a deploy without
        // ANTHROPIC_API_KEY still boots: chat reports "not ready" and the
        // TanStack AI page names the missing key.
        enabled: env.bool('TANSTACK_AI_CHAT', true),
        // Ollama on a developer machine is not reachable from Cloud.
        provider: 'anthropic',
        model: env('TANSTACK_AI_MODEL', 'claude-sonnet-5'),
        apiKey: env('ANTHROPIC_API_KEY'),
      },
    },
  },

  'youtube-transcripts': {
    config: {
      proxyUrl: env('PROXY_URL'),
      chunkSizeSeconds: 300,
      previewLength: 500,
      maxFullTranscriptLength: 50000,
      searchSegmentSeconds: 30,
    },
  },
});

export default config;
