const READ_ACTION = 'plugin::paul-brain.resource.read';

export default {
  admin: {
    type: 'admin',
    routes: [
      {
        method: 'GET',
        path: '/resources/:documentId/file',
        handler: 'resourceFile.download',
        config: {
          policies: [
            'admin::isAuthenticatedAdmin',
            { name: 'admin::hasPermissions', config: { actions: [READ_ACTION] } },
          ],
        },
      },
    ],
  },
  'content-api': {
    type: 'content-api',
    routes: [
      {
        method: 'GET',
        path: '/resource-file/:token',
        handler: 'resourceFile.signed',
        config: {
          auth: false,
        },
      },
    ],
  },
};
