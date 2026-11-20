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
const PLUGIN_ID = "hybrid-search";
const Initializer = ({ setPlugin }) => {
  const ref = react.useRef(setPlugin);
  react.useEffect(() => {
    ref.current(PLUGIN_ID);
  }, []);
  return null;
};
const GLASS_PATH = "M13.5 2a8.5 8.5 0 1 0 5.3 15.1l6.6 6.6a1.5 1.5 0 0 0 2.1-2.1l-6.6-6.6A8.5 8.5 0 0 0 13.5 2Zm0 3a5.5 5.5 0 1 1 0 11 5.5 5.5 0 0 1 0-11Z";
const SearchIcon = react.forwardRef(
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
        children: /* @__PURE__ */ jsxRuntime.jsx("path", { fillRule: "evenodd", clipRule: "evenodd", d: GLASS_PATH })
      }
    );
  }
);
SearchIcon.displayName = "SearchIcon";
const PluginIcon = SearchIcon;
const index = {
  register(app) {
    app.addMenuLink({
      to: `plugins/${PLUGIN_ID}`,
      icon: PluginIcon,
      intlLabel: {
        id: `${PLUGIN_ID}.plugin.name`,
        defaultMessage: "Hybrid Search"
      },
      permissions: [{ action: `plugin::${PLUGIN_ID}.read`, subject: null }],
      Component: async () => {
        const { App } = await Promise.resolve().then(() => require("./App-BWZblquI.js"));
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
          const { default: data } = await __variableDynamicImportRuntimeHelper(/* @__PURE__ */ Object.assign({ "./translations/en.json": () => Promise.resolve().then(() => require("./en-BH-Xyec2.js")) }), `./translations/${locale}.json`, 3);
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
