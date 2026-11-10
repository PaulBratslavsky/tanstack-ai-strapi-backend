import { Shield } from '@strapi/icons';

const PLUGIN_ID = 'mcp-guard';

export default {
  register(app: any) {
    app.addMenuLink({
      to: `/plugins/${PLUGIN_ID}`,
      icon: Shield,
      intlLabel: { id: `${PLUGIN_ID}.menu.label`, defaultMessage: 'MCP Guard' },
      permissions: [{ action: 'plugin::mcp-guard.read', subject: null }],
      Component: async () => {
        const { Dashboard } = await import('./pages/Dashboard');
        return Dashboard;
      },
    });

    app.registerPlugin({
      id: PLUGIN_ID,
      name: 'MCP Guard',
    });
  },

  bootstrap() {},
};
