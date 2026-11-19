import type { Core } from '@strapi/strapi';
import { PERMISSIONS, PLUGIN_NAME } from './permissions';

const register = ({ strapi }: { strapi: Core.Strapi }) => {
  try {
    const actionProvider = strapi.service('admin::permission').actionProvider;
    const fresh = PERMISSIONS.filter((permission) => !actionProvider.has(`plugin::${PLUGIN_NAME}.${permission.uid}`));
    if (fresh.length > 0) {
      actionProvider.registerMany(fresh);
      strapi.log.info(`[hybrid-search] Registered ${fresh.length} permission actions`);
    }
  } catch (error) {
    strapi.log.error('[hybrid-search] Permission registration failed. Boot continues.', error);
  }
};

export default register;
