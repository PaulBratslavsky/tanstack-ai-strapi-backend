import type { Core } from '@strapi/strapi';
import { PERMISSIONS } from './mcp/permissions';

const register = ({ strapi }: { strapi: Core.Strapi }) => {
  const actionProvider = strapi.service('admin::permission').actionProvider;

  const existingActions = PERMISSIONS.filter(
    (permission) => actionProvider.has(`plugin::paul-brain.${permission.uid}`)
  );

  const newActions = PERMISSIONS.filter(
    (permission) => !actionProvider.has(`plugin::paul-brain.${permission.uid}`)
  );

  if (newActions.length > 0) {
    actionProvider.registerMany(newActions);
    strapi.log.info(
      `[paul-brain] Registered ${newActions.length} new permission actions in register phase`
    );
  }

  if (existingActions.length > 0) {
    strapi.log.debug(
      `[paul-brain] Skipped ${existingActions.length} already-registered permission actions`
    );
  }

  strapi.log.debug('[paul-brain] Plugin registered');
};

export default register;
