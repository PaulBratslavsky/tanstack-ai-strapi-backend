export default {
  'content-api': {
    type: 'content-api',
    routes: [
      {
        method: 'POST',
        path: '/v1/messages',
        handler: 'bus.sendMessage',
        config: {
          auth: true,
        },
      },
      {
        method: 'GET',
        path: '/v1/inbox',
        handler: 'bus.getInbox',
        config: {
          auth: true,
        },
      },
      {
        method: 'POST',
        path: '/v1/messages/:id/claim',
        handler: 'bus.claimMessage',
        config: {
          auth: true,
        },
      },
    ],
  },
};
