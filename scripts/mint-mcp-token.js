/**
 * Mints an ADMIN-KIND API token for the official Strapi MCP server.
 *
 * Run with:  npx strapi console < scripts/mint-mcp-token.js
 *
 * Why not the admin UI: Settings -> API Tokens mints CONTENT tokens
 * (kind: 'api-token'). The MCP server calls authenticateAdminToken and
 * rejects those with 401. Only `admin::api-token-admin` mints the right kind.
 *
 * The grants below expose Strapi's built-in content-manager CRUD through MCP.
 * Custom plugin tools (phase 4) will add their own actions here.
 */
const user = (await strapi.db.query('admin::user').findMany({ populate: ['roles'] }))[0];
if (!user) throw new Error('No admin user found. Create one at /admin first.');

const token = await strapi.service('admin::api-token-admin').create(
  {
    name: 'tanstack-client-' + Date.now(),
    description: 'MCP access for the TanStack Start chat client',
    lifespan: null,
    adminUserOwner: user.id,
    adminPermissions: [
      { action: 'plugin::content-manager.explorer.read' },
      { action: 'plugin::content-manager.explorer.create' },
      { action: 'plugin::content-manager.explorer.update' },
    ],
  },
  user,
);

console.log('\n=========== COPY THIS TOKEN (shown once) ===========');
console.log(token.accessKey);
console.log('====================================================\n');
