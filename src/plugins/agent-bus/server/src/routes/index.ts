export default {
  'content-api': {
    type: 'content-api',
    routes: [
      // Agents
      {
        method: 'GET',
        path: '/v1/agents',
        handler: 'bus.listAgents',
        config: {
          auth: {
            scope: ['plugin::agent-bus.bus.listAgents'],
          },
        },
      },
      
      // Messages
      {
        method: 'POST',
        path: '/v1/messages',
        handler: 'bus.sendMessage',
        config: {
          auth: {
            scope: ['plugin::agent-bus.bus.sendMessage'],
          },
        },
      },
      {
        method: 'GET',
        path: '/v1/messages/:id',
        handler: 'bus.getMessage',
        config: {
          auth: {
            scope: ['plugin::agent-bus.bus.getMessage'],
          },
        },
      },
      {
        method: 'POST',
        path: '/v1/messages/:id/claim',
        handler: 'bus.claimMessage',
        config: {
          auth: {
            scope: ['plugin::agent-bus.bus.claimMessage'],
          },
        },
      },
      {
        method: 'POST',
        path: '/v1/messages/:id/reply',
        handler: 'bus.reply',
        config: {
          auth: {
            scope: ['plugin::agent-bus.bus.reply'],
          },
        },
      },
      
      // Inbox
      {
        method: 'GET',
        path: '/v1/inbox',
        handler: 'bus.getInbox',
        config: {
          auth: {
            scope: ['plugin::agent-bus.bus.getInbox'],
          },
        },
      },
      
      // Threads
      {
        method: 'GET',
        path: '/v1/threads/:id',
        handler: 'bus.getThread',
        config: {
          auth: {
            scope: ['plugin::agent-bus.bus.getThread'],
          },
        },
      },
      
      // Approvals
      {
        method: 'GET',
        path: '/v1/approvals',
        handler: 'bus.listApprovals',
        config: {
          auth: {
            scope: ['plugin::agent-bus.bus.listApprovals'],
          },
        },
      },
      {
        method: 'POST',
        path: '/v1/approvals/:id/decide',
        handler: 'bus.decide',
        config: {
          auth: {
            scope: ['plugin::agent-bus.bus.decide'],
          },
        },
      },
    ],
  },
};
