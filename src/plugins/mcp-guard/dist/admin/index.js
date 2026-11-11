"use strict";
const icons = require("@strapi/icons");
const PLUGIN_ID = "mcp-guard";
const index = {
  register(app) {
    app.addMenuLink({
      to: `/plugins/${PLUGIN_ID}`,
      icon: icons.Shield,
      intlLabel: { id: `${PLUGIN_ID}.menu.label`, defaultMessage: "MCP Guard" },
      permissions: [{ action: "plugin::mcp-guard.read", subject: null }],
      Component: async () => {
        const { Dashboard } = await Promise.resolve().then(() => require("../_chunks/Dashboard-DY7Kkf9z.js"));
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
module.exports = index;
