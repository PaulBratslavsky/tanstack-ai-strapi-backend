import type { Core } from '@strapi/strapi';
import { PERMISSIONS } from './mcp/permissions';

const register = async ({ strapi }: { strapi: Core.Strapi }) => {
  await strapi
    .service('admin::permission')
    .actionProvider.registerMany(PERMISSIONS);

  strapi.log.info(`[paul-brain] Registered ${PERMISSIONS.length} permission actions`);
};

export default register;
