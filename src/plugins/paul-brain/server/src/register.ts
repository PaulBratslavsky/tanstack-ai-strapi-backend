import type { Core } from '@strapi/strapi';

const register = ({ strapi }: { strapi: Core.Strapi }) => {
  // Permissions are now registered in bootstrap.ts
  // This follows the pattern from strapi-plugin-youtube-transcripts
  strapi.log.debug('[paul-brain] Plugin registered');
};

export default register;
