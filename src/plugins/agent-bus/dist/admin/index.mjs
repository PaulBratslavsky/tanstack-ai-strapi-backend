const PLUGIN_ID = "agent-bus";
const index = {
  register(app) {
    app.registerPlugin({
      id: PLUGIN_ID,
      name: PLUGIN_ID
    });
  }
};
export {
  index as default
};
