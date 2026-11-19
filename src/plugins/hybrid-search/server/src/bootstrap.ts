import type { Core } from '@strapi/strapi';
import { getRuntime } from './runtime';

const bootstrap = async ({ strapi }: { strapi: Core.Strapi }) => {
  try {
    await getRuntime(strapi).start();
  } catch (error) {
    strapi.log.error('[hybrid-search] Bootstrap failed. Boot continues.', error);
  }
};

export default bootstrap;
