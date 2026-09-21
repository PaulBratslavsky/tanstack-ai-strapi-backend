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
        // On whenever an Anthropic key is configured, unless TANSTACK_AI_CHAT
        // says otherwise. Chat with provider "anthropic" and no key fails the
        // plugin's config validation, so a deploy without the key must default
        // to chat off rather than refuse to boot.
        enabled: env.bool('TANSTACK_AI_CHAT', Boolean(env('ANTHROPIC_API_KEY'))),
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
