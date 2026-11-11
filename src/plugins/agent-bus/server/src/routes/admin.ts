const MANAGE_ACTION = 'plugin::agent-bus.agent.manage';

const adminRoute = (method: string, path: string, handler: string) => ({
  method,
  path,
  handler,
  config: {
    policies: ['admin::isAuthenticatedAdmin', { name: 'admin::hasPermissions', config: { actions: [MANAGE_ACTION] } }],
  },
});

export default [
  adminRoute('GET', '/admin/agents', 'admin.listAgents'),
  adminRoute('POST', '/admin/agents', 'admin.createAgent'),
  adminRoute('GET', '/admin/agents/:documentId', 'admin.getAgent'),
  adminRoute('PUT', '/admin/agents/:documentId', 'admin.updateAgent'),
  adminRoute('DELETE', '/admin/agents/:documentId', 'admin.deleteAgent'),
  adminRoute('POST', '/admin/agents/:documentId/bind', 'admin.bindToken'),
  adminRoute('POST', '/admin/agents/:documentId/mint', 'admin.mintToken'),
  adminRoute('DELETE', '/admin/agents/:documentId/credentials/:credentialId', 'admin.revokeCredential'),
  adminRoute('GET', '/admin/tokens', 'admin.listTokens'),
];
