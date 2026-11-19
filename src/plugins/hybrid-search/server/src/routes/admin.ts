import { READ_ACTION, REINDEX_ACTION } from '../permissions';

const adminRoute = (method: string, path: string, handler: string, action: string) => ({
  method,
  path,
  handler,
  config: {
    policies: [
      'admin::isAuthenticatedAdmin',
      { name: 'admin::hasPermissions', config: { actions: [action] } },
    ],
  },
});

const routes = [
  adminRoute('GET', '/status', 'search.status', READ_ACTION),
  adminRoute('GET', '/admin/status', 'search.status', READ_ACTION),
  adminRoute('POST', '/search', 'search.search', READ_ACTION),
  adminRoute('POST', '/admin/search', 'search.search', READ_ACTION),
  adminRoute('POST', '/reindex', 'search.reindex', REINDEX_ACTION),
  adminRoute('POST', '/admin/reindex', 'search.reindex', REINDEX_ACTION),
];

export default routes;
