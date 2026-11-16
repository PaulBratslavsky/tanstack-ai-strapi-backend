import type { Core } from '@strapi/strapi';

const config: Core.Config.Middlewares = [
  'strapi::logger',
  'strapi::errors',
  'strapi::security',
  'strapi::cors',
  'strapi::poweredBy',
  'strapi::query',
  {
    name: 'strapi::body',
    config: {
      // attach_resource_file accepts a 25 MB file as base64 inside the MCP JSON body.
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
