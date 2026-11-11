"use strict";
Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
const jsxRuntime = require("react/jsx-runtime");
const React = require("react");
const designSystem = require("@strapi/design-system");
const icons = require("@strapi/icons");
const admin = require("@strapi/strapi/admin");
function _interopNamespace(e) {
  if (e && e.__esModule) return e;
  const n = Object.create(null, { [Symbol.toStringTag]: { value: "Module" } });
  if (e) {
    for (const k in e) {
      if (k !== "default") {
        const d = Object.getOwnPropertyDescriptor(e, k);
        Object.defineProperty(n, k, d.get ? d : {
          enumerable: true,
          get: () => e[k]
        });
      }
    }
  }
  n.default = e;
  return Object.freeze(n);
}
const React__namespace = /* @__PURE__ */ _interopNamespace(React);
const ACTION_STYLE = {
  clean: { bg: "success100", fg: "success600" },
  sanitized: { bg: "warning100", fg: "warning600" },
  blocked: { bg: "danger100", fg: "danger600" },
  rejected: { bg: "neutral150", fg: "neutral700" },
  errored: { bg: "secondary100", fg: "secondary600" }
};
const REFRESH_MS = 5e3;
const formatTime = (iso) => new Date(iso).toLocaleTimeString(void 0, {
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit"
});
const Tile = ({
  label,
  value,
  tone = "neutral800",
  hint
}) => /* @__PURE__ */ jsxRuntime.jsx(
  designSystem.Box,
  {
    background: "neutral0",
    hasRadius: true,
    shadow: "tableShadow",
    padding: 4,
    borderColor: "neutral150",
    style: { flex: "1 1 9rem", minWidth: "9rem" },
    children: /* @__PURE__ */ jsxRuntime.jsxs(designSystem.Flex, { direction: "column", alignItems: "flex-start", gap: 1, children: [
      /* @__PURE__ */ jsxRuntime.jsx(designSystem.Typography, { variant: "sigma", textColor: "neutral600", children: label }),
      /* @__PURE__ */ jsxRuntime.jsx(designSystem.Typography, { variant: "alpha", textColor: tone, children: value }),
      hint ? /* @__PURE__ */ jsxRuntime.jsx(designSystem.Typography, { variant: "pi", textColor: "neutral500", children: hint }) : null
    ] })
  }
);
const FindingBadges = ({ findings }) => {
  if (findings.length === 0) {
    return /* @__PURE__ */ jsxRuntime.jsx(designSystem.Typography, { variant: "pi", textColor: "neutral500", children: "—" });
  }
  return /* @__PURE__ */ jsxRuntime.jsx(designSystem.Flex, { gap: 1, wrap: "wrap", children: findings.map((finding) => /* @__PURE__ */ jsxRuntime.jsx(
    designSystem.Tooltip,
    {
      label: `${finding.description}
${finding.paths.join(", ")}

${finding.sample}`,
      children: /* @__PURE__ */ jsxRuntime.jsx("span", { children: /* @__PURE__ */ jsxRuntime.jsxs(
        designSystem.Badge,
        {
          backgroundColor: finding.severity === "high" ? "danger100" : "warning100",
          textColor: finding.severity === "high" ? "danger600" : "warning600",
          children: [
            finding.rule,
            finding.count > 1 ? ` ×${finding.count}` : ""
          ]
        }
      ) })
    },
    finding.rule
  )) });
};
const ActionBadge = ({
  action,
  reason
}) => {
  const badge = /* @__PURE__ */ jsxRuntime.jsx(designSystem.Badge, { backgroundColor: ACTION_STYLE[action].bg, textColor: ACTION_STYLE[action].fg, children: action });
  if (reason === null) {
    return badge;
  }
  return /* @__PURE__ */ jsxRuntime.jsx(designSystem.Tooltip, { label: reason, children: /* @__PURE__ */ jsxRuntime.jsx("span", { children: badge }) });
};
const Dashboard = () => {
  const { get, post } = admin.useFetchClient();
  const { toggleNotification } = admin.useNotification();
  const [events, setEvents] = React__namespace.useState([]);
  const [stats, setStats] = React__namespace.useState(null);
  const [config, setConfig] = React__namespace.useState(null);
  const [loading, setLoading] = React__namespace.useState(true);
  const [actionFilter, setActionFilter] = React__namespace.useState("all");
  const [autoRefresh, setAutoRefresh] = React__namespace.useState(true);
  const load = React__namespace.useCallback(async () => {
    try {
      const [eventsRes, statsRes, configRes] = await Promise.all([
        get(`/mcp-guard/events?limit=100&action=${actionFilter}`),
        get("/mcp-guard/stats"),
        get("/mcp-guard/config")
      ]);
      setEvents(eventsRes.data.events);
      setStats(statsRes.data);
      setConfig(configRes.data);
    } catch (error) {
      toggleNotification({
        type: "danger",
        message: "Could not load MCP guard events."
      });
    } finally {
      setLoading(false);
    }
  }, [get, actionFilter, toggleNotification]);
  React__namespace.useEffect(() => {
    load();
  }, [load]);
  React__namespace.useEffect(() => {
    if (autoRefresh === false) {
      return void 0;
    }
    const timer = setInterval(load, REFRESH_MS);
    return () => clearInterval(timer);
  }, [autoRefresh, load]);
  const clear = async () => {
    await post("/mcp-guard/clear");
    toggleNotification({ type: "success", message: "Event buffer cleared." });
    load();
  };
  const totals = stats?.totals ?? {};
  const flagged = stats?.eventsWithFindings ?? 0;
  return /* @__PURE__ */ jsxRuntime.jsxs(admin.Layouts.Root, { children: [
    /* @__PURE__ */ jsxRuntime.jsx(
      admin.Layouts.Header,
      {
        title: "MCP Guard",
        subtitle: config === null ? "Loading…" : `Watching ${config.path} · inbound ${config.inbound} · outbound ${config.outbound}${config.persist ? " · persisting" : ""}`,
        primaryAction: /* @__PURE__ */ jsxRuntime.jsxs(designSystem.Flex, { gap: 2, children: [
          /* @__PURE__ */ jsxRuntime.jsx(
            designSystem.Button,
            {
              variant: "tertiary",
              startIcon: /* @__PURE__ */ jsxRuntime.jsx(icons.ArrowClockwise, {}),
              onClick: () => setAutoRefresh((on) => !on),
              children: autoRefresh ? "Auto-refresh on" : "Auto-refresh off"
            }
          ),
          /* @__PURE__ */ jsxRuntime.jsx(designSystem.Button, { variant: "danger-light", startIcon: /* @__PURE__ */ jsxRuntime.jsx(icons.Trash, {}), onClick: clear, children: "Clear buffer" })
        ] })
      }
    ),
    /* @__PURE__ */ jsxRuntime.jsx(admin.Layouts.Content, { children: loading ? /* @__PURE__ */ jsxRuntime.jsx(designSystem.Flex, { justifyContent: "center", padding: 10, children: /* @__PURE__ */ jsxRuntime.jsx(designSystem.Loader, { children: "Loading events…" }) }) : /* @__PURE__ */ jsxRuntime.jsxs(designSystem.Flex, { direction: "column", alignItems: "stretch", gap: 6, children: [
      /* @__PURE__ */ jsxRuntime.jsxs(designSystem.Flex, { gap: 4, wrap: "wrap", alignItems: "stretch", children: [
        /* @__PURE__ */ jsxRuntime.jsx(Tile, { label: "Requests", value: totals.requests ?? 0, hint: `${totals.toolCalls ?? 0} tool calls` }),
        /* @__PURE__ */ jsxRuntime.jsx(
          Tile,
          {
            label: "Rejected",
            value: totals.rejected ?? 0,
            tone: (totals.rejected ?? 0) > 0 ? "neutral800" : "neutral500",
            hint: "blocked inbound"
          }
        ),
        /* @__PURE__ */ jsxRuntime.jsx(
          Tile,
          {
            label: "Sanitized",
            value: totals.sanitized ?? 0,
            tone: (totals.sanitized ?? 0) > 0 ? "warning600" : "neutral500",
            hint: "rewritten outbound"
          }
        ),
        /* @__PURE__ */ jsxRuntime.jsx(
          Tile,
          {
            label: "Blocked",
            value: totals.blocked ?? 0,
            tone: (totals.blocked ?? 0) > 0 ? "danger600" : "neutral500",
            hint: "result discarded"
          }
        ),
        /* @__PURE__ */ jsxRuntime.jsx(
          Tile,
          {
            label: "Flagged",
            value: flagged,
            hint: `of ${stats?.buffered ?? 0} buffered`
          }
        ),
        /* @__PURE__ */ jsxRuntime.jsx(
          Tile,
          {
            label: "Median",
            value: stats?.medianDurationMs === null ? "—" : `${stats?.medianDurationMs}ms`,
            hint: "request duration"
          }
        )
      ] }),
      stats !== null && stats.topRules.length > 0 ? /* @__PURE__ */ jsxRuntime.jsx(designSystem.Box, { background: "neutral0", hasRadius: true, shadow: "tableShadow", padding: 4, children: /* @__PURE__ */ jsxRuntime.jsxs(designSystem.Flex, { direction: "column", alignItems: "flex-start", gap: 3, children: [
        /* @__PURE__ */ jsxRuntime.jsx(designSystem.Typography, { variant: "sigma", textColor: "neutral600", children: "Most frequent rules" }),
        /* @__PURE__ */ jsxRuntime.jsx(designSystem.Flex, { gap: 2, wrap: "wrap", children: stats.topRules.map((rule) => /* @__PURE__ */ jsxRuntime.jsxs(designSystem.Badge, { backgroundColor: "neutral150", textColor: "neutral700", children: [
          rule.rule,
          " · ",
          rule.count
        ] }, rule.rule)) })
      ] }) }) : null,
      /* @__PURE__ */ jsxRuntime.jsx(designSystem.Divider, {}),
      /* @__PURE__ */ jsxRuntime.jsxs(designSystem.Flex, { justifyContent: "space-between", alignItems: "center", gap: 4, children: [
        /* @__PURE__ */ jsxRuntime.jsx(designSystem.Box, { style: { minWidth: "14rem" }, children: /* @__PURE__ */ jsxRuntime.jsxs(
          designSystem.SingleSelect,
          {
            label: "Action",
            value: actionFilter,
            onChange: (value) => setActionFilter(value),
            children: [
              /* @__PURE__ */ jsxRuntime.jsx(designSystem.SingleSelectOption, { value: "all", children: "All events" }),
              /* @__PURE__ */ jsxRuntime.jsx(designSystem.SingleSelectOption, { value: "clean", children: "Clean" }),
              /* @__PURE__ */ jsxRuntime.jsx(designSystem.SingleSelectOption, { value: "sanitized", children: "Sanitized" }),
              /* @__PURE__ */ jsxRuntime.jsx(designSystem.SingleSelectOption, { value: "blocked", children: "Blocked" }),
              /* @__PURE__ */ jsxRuntime.jsx(designSystem.SingleSelectOption, { value: "rejected", children: "Rejected" }),
              /* @__PURE__ */ jsxRuntime.jsx(designSystem.SingleSelectOption, { value: "errored", children: "Errored" })
            ]
          }
        ) }),
        /* @__PURE__ */ jsxRuntime.jsxs(designSystem.Typography, { variant: "pi", textColor: "neutral500", children: [
          "Buffer holds the last ",
          stats?.capacity ?? 0,
          " events",
          stats?.persisting ? " · also persisted to MCP Guard Event" : " · resets on restart"
        ] })
      ] }),
      events.length === 0 ? /* @__PURE__ */ jsxRuntime.jsx(
        designSystem.EmptyStateLayout,
        {
          content: "No MCP requests recorded yet. Call a tool against /mcp and it will appear here."
        }
      ) : /* @__PURE__ */ jsxRuntime.jsxs(designSystem.Table, { colCount: 7, rowCount: events.length, children: [
        /* @__PURE__ */ jsxRuntime.jsx(designSystem.Thead, { children: /* @__PURE__ */ jsxRuntime.jsxs(designSystem.Tr, { children: [
          /* @__PURE__ */ jsxRuntime.jsx(designSystem.Th, { children: /* @__PURE__ */ jsxRuntime.jsx(designSystem.Typography, { variant: "sigma", children: "Time" }) }),
          /* @__PURE__ */ jsxRuntime.jsx(designSystem.Th, { children: /* @__PURE__ */ jsxRuntime.jsx(designSystem.Typography, { variant: "sigma", children: "Method / tool" }) }),
          /* @__PURE__ */ jsxRuntime.jsx(designSystem.Th, { children: /* @__PURE__ */ jsxRuntime.jsx(designSystem.Typography, { variant: "sigma", children: "Action" }) }),
          /* @__PURE__ */ jsxRuntime.jsx(designSystem.Th, { children: /* @__PURE__ */ jsxRuntime.jsx(designSystem.Typography, { variant: "sigma", children: "Findings" }) }),
          /* @__PURE__ */ jsxRuntime.jsx(designSystem.Th, { children: /* @__PURE__ */ jsxRuntime.jsx(designSystem.Typography, { variant: "sigma", children: "User" }) }),
          /* @__PURE__ */ jsxRuntime.jsx(designSystem.Th, { children: /* @__PURE__ */ jsxRuntime.jsx(designSystem.Typography, { variant: "sigma", children: "Status" }) }),
          /* @__PURE__ */ jsxRuntime.jsx(designSystem.Th, { children: /* @__PURE__ */ jsxRuntime.jsx(designSystem.Typography, { variant: "sigma", children: "Duration" }) })
        ] }) }),
        /* @__PURE__ */ jsxRuntime.jsx(designSystem.Tbody, { children: events.map((event) => /* @__PURE__ */ jsxRuntime.jsxs(designSystem.Tr, { children: [
          /* @__PURE__ */ jsxRuntime.jsx(designSystem.Td, { children: /* @__PURE__ */ jsxRuntime.jsx(designSystem.Typography, { variant: "pi", textColor: "neutral600", children: formatTime(event.occurredAt) }) }),
          /* @__PURE__ */ jsxRuntime.jsx(designSystem.Td, { children: /* @__PURE__ */ jsxRuntime.jsxs(designSystem.Flex, { direction: "column", alignItems: "flex-start", children: [
            /* @__PURE__ */ jsxRuntime.jsx(designSystem.Typography, { fontWeight: "semiBold", children: event.tool ?? event.method }),
            event.tool !== null ? /* @__PURE__ */ jsxRuntime.jsx(designSystem.Typography, { variant: "pi", textColor: "neutral500", children: event.method }) : null
          ] }) }),
          /* @__PURE__ */ jsxRuntime.jsx(designSystem.Td, { children: /* @__PURE__ */ jsxRuntime.jsx(ActionBadge, { action: event.action, reason: event.reason }) }),
          /* @__PURE__ */ jsxRuntime.jsx(designSystem.Td, { children: /* @__PURE__ */ jsxRuntime.jsx(FindingBadges, { findings: event.findings }) }),
          /* @__PURE__ */ jsxRuntime.jsx(designSystem.Td, { children: /* @__PURE__ */ jsxRuntime.jsx(designSystem.Typography, { variant: "pi", textColor: "neutral600", children: event.adminUser ?? "anon" }) }),
          /* @__PURE__ */ jsxRuntime.jsx(designSystem.Td, { children: /* @__PURE__ */ jsxRuntime.jsx(
            designSystem.Typography,
            {
              variant: "pi",
              textColor: event.httpStatus >= 400 ? "danger600" : "neutral600",
              children: event.httpStatus
            }
          ) }),
          /* @__PURE__ */ jsxRuntime.jsx(designSystem.Td, { children: /* @__PURE__ */ jsxRuntime.jsxs(designSystem.Typography, { variant: "pi", textColor: "neutral600", children: [
            event.durationMs,
            "ms"
          ] }) })
        ] }, event.id)) })
      ] })
    ] }) })
  ] });
};
exports.Dashboard = Dashboard;
