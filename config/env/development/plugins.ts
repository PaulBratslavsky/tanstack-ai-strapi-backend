import type { Core } from '@strapi/strapi';

/**
 * Development-only plugin overrides, merged over `config/plugins.ts` by Strapi
 * when NODE_ENV is "development" — the default for `strapi develop`.
 *
 * Point `tanstack-ai` at the sibling checkout so local work uses the plugin as
 * it is being written. Production (Strapi Cloud) never loads this file and
 * uses the npm package from package.json instead. A relative path here would
 * not exist on Cloud, which is why it cannot live in the base config.
 */
const config = (): Core.Config.Plugin => ({
  'tanstack-ai': {
    resolve: '../strapi-plugin-tanstack-ai',
  },
});

export default config;
