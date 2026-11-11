import { Shield } from "@strapi/icons";
const PLUGIN_ID = "mcp-guard";
const index = {
  register(app) {
    app.addMenuLink({
      to: `/plugins/${PLUGIN_ID}`,
      icon: Shield,
      intlLabel: { id: `${PLUGIN_ID}.menu.label`, defaultMessage: "MCP Guard" },
      permissions: [{ action: "plugin::mcp-guard.read", subject: null }],
      Component: async () => {
        const { Dashboard } = await import("../_chunks/Dashboard-DnO__ZPU.mjs");
        return Dashboard;
      }
    });
    app.registerPlugin({
      id: PLUGIN_ID,
      name: "MCP Guard"
    });
  },
  bootstrap() {
  }
};
export {
  index as default
};
