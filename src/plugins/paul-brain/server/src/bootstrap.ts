import type { Core } from '@strapi/strapi';
import { registerMcpTools } from './mcp';

const bootstrap = async ({ strapi }: { strapi: Core.Strapi }) => {
  registerMcpTools(strapi);
  strapi.log.info('[paul-brain] Bootstrap complete');
};

export default bootstrap;
