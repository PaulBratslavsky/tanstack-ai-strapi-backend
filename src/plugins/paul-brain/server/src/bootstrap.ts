import type { Core } from '@strapi/strapi';
import { registerMcpTools } from './mcp';

const bootstrap = ({ strapi }: { strapi: Core.Strapi }) => {
  registerMcpTools(strapi);
};

export default bootstrap;
