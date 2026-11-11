"use strict";
const react = require("react");
const jsxRuntime = require("react/jsx-runtime");
const styledComponents = require("styled-components");
const __variableDynamicImportRuntimeHelper = (glob, path, segs) => {
  const v = glob[path];
  if (v) {
    return typeof v === "function" ? v() : Promise.resolve(v);
  }
  return new Promise((_, reject) => {
    (typeof queueMicrotask === "function" ? queueMicrotask : setTimeout)(
      reject.bind(
        null,
        new Error(
          "Unknown variable dynamic import: " + path + (path.split("/").length !== segs ? ". Note that variables only represent file names one level deep." : "")
        )
      )
    );
  });
};
const PLUGIN_ID = "agent-bus";
const Initializer = ({ setPlugin }) => {
  const ref = react.useRef(setPlugin);
  react.useEffect(() => {
    ref.current(PLUGIN_ID);
  }, []);
  return null;
};
const ROBOT_PATH = (
  // antenna ball + stem
  "M16 1a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5ZM15 6h2v3h-2ZM2.5 15A1.5 1.5 0 0 1 4 16.5v5a1.5 1.5 0 0 1-3 0v-5A1.5 1.5 0 0 1 2.5 15ZM29.5 15a1.5 1.5 0 0 1 1.5 1.5v5a1.5 1.5 0 0 1-3 0v-5a1.5 1.5 0 0 1 1.5-1.5ZM9 9h14a5 5 0 0 1 5 5v12a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5V14a5 5 0 0 1 5-5Zm2.5 6a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5Zm9 0a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5ZM11 24a1 1 0 1 0 0 2h10a1 1 0 1 0 0-2H11Z"
);
const RobotIcon = react.forwardRef(
  ({ fill = "currentColor", stroke, ...props }, ref) => {
    const theme = styledComponents.useTheme();
    const colors = theme?.colors ?? {};
    const resolvedFill = fill && fill in colors ? colors[fill] : fill;
    const resolvedStroke = stroke && stroke in colors ? colors[stroke] : stroke;
    return /* @__PURE__ */ jsxRuntime.jsx(
      "svg",
      {
        xmlns: "http://www.w3.org/2000/svg",
        viewBox: "0 0 32 32",
        width: 16,
        height: 16,
        fill: resolvedFill,
        stroke: resolvedStroke,
        "aria-hidden": "true",
        focusable: "false",
        ref,
        ...props,
        children: /* @__PURE__ */ jsxRuntime.jsx("path", { fillRule: "evenodd", clipRule: "evenodd", d: ROBOT_PATH })
      }
    );
  }
);
RobotIcon.displayName = "RobotIcon";
const PluginIcon = RobotIcon;
const index = {
  register(app) {
    app.addMenuLink({
      to: `plugins/${PLUGIN_ID}`,
      icon: PluginIcon,
      intlLabel: {
        id: `${PLUGIN_ID}.plugin.name`,
        defaultMessage: "Agent Bus"
      },
      permissions: [{ action: `plugin::${PLUGIN_ID}.agent.manage`, subject: null }],
      Component: async () => {
        const { App } = await Promise.resolve().then(() => require("./App-ClUdBWl8.js"));
        return App;
      }
    });
    app.registerPlugin({
      id: PLUGIN_ID,
      initializer: Initializer,
      isReady: false,
      name: PLUGIN_ID
    });
  },
  async registerTrads({ locales }) {
    return Promise.all(
      locales.map(async (locale) => {
        try {
          const { default: data } = await __variableDynamicImportRuntimeHelper(/* @__PURE__ */ Object.assign({ "./translations/en.json": () => Promise.resolve().then(() => require("./en-Cb92Mf0v.js")) }), `./translations/${locale}.json`, 3);
          return { data, locale };
        } catch {
          return { data: {}, locale };
        }
      })
    );
  }
};
exports.PLUGIN_ID = PLUGIN_ID;
exports.index = index;
