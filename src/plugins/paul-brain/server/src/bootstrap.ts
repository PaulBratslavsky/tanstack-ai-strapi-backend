import type { Core } from '@strapi/strapi';
import { registerMcpTools } from './mcp';
import { PERMISSIONS } from './mcp/permissions';

const bootstrap = async ({ strapi }: { strapi: Core.Strapi }) => {
  const actionProvider = strapi.service('admin::permission').actionProvider;

  const existingActions = PERMISSIONS.filter(
    (permission) => actionProvider.has(`plugin::paul-brain.${permission.uid}`)
  );

  const newActions = PERMISSIONS.filter(
    (permission) => !actionProvider.has(`plugin::paul-brain.${permission.uid}`)
  );

  if (newActions.length > 0) {
    await actionProvider.registerMany(newActions);
    strapi.log.info(
      `[paul-brain] Registered ${newActions.length} new permission actions`
    );
  }

  if (existingActions.length > 0) {
    strapi.log.debug(
      `[paul-brain] Skipped ${existingActions.length} already-registered permission actions`
    );
  }

  registerMcpTools(strapi);
};

export default bootstrap;
