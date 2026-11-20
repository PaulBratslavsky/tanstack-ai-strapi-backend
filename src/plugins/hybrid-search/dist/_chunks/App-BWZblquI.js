"use strict";
Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
const jsxRuntime = require("react/jsx-runtime");
const admin = require("@strapi/strapi/admin");
const reactRouterDom = require("react-router-dom");
const react = require("react");
const designSystem = require("@strapi/design-system");
const index = require("./index-BctnPZRt.js");
const formatPacific = (iso) => {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Los_Angeles",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  }).format(date);
};
const HomePage = () => {
  const { get, post } = admin.useFetchClient();
  const { toggleNotification } = admin.useNotification();
  const [status, setStatus] = react.useState(null);
  const [error, setError] = react.useState(null);
  const [busy, setBusy] = react.useState(false);
  const [report, setReport] = react.useState(null);
  const load = react.useCallback(async () => {
    try {
      const response = await get(`/${index.PLUGIN_ID}/admin/status`);
      setStatus(response.data);
      setError(null);
    } catch (err) {
      setError("Could not load hybrid search status. The admin token needs plugin::hybrid-search.read.");
    }
  }, [get]);
  react.useEffect(() => {
    load();
  }, [load]);
  const runReindex = async (dryRun) => {
    setBusy(true);
    try {
      const response = await post(`/${index.PLUGIN_ID}/admin/reindex`, { dryRun, wait: true });
      setReport(response.data);
      toggleNotification({
        type: response.data?.partial ? "warning" : "success",
        message: dryRun ? "Dry run finished" : "Reindex finished"
      });
      await load();
    } catch (err) {
      toggleNotification({
        type: "danger",
        message: "Reindex was rejected. Grant plugin::hybrid-search.reindex to this admin."
      });
    } finally {
      setBusy(false);
    }
  };
  return /* @__PURE__ */ jsxRuntime.jsxs(admin.Page.Main, { children: [
    /* @__PURE__ */ jsxRuntime.jsx(
      admin.Layouts.Header,
      {
        title: "Hybrid Search",
        subtitle: "Keyword search plus OpenAI embeddings, cached in memory"
      }
    ),
    /* @__PURE__ */ jsxRuntime.jsxs(admin.Layouts.Content, { children: [
      /* @__PURE__ */ jsxRuntime.jsxs(designSystem.Flex, { gap: 2, paddingBottom: 4, children: [
        /* @__PURE__ */ jsxRuntime.jsx(designSystem.Button, { onClick: () => runReindex(false), loading: busy, disabled: busy, children: "Reindex all" }),
        /* @__PURE__ */ jsxRuntime.jsx(designSystem.Button, { variant: "secondary", onClick: () => runReindex(true), disabled: busy, children: "Dry run" }),
        /* @__PURE__ */ jsxRuntime.jsx(designSystem.Button, { variant: "tertiary", onClick: load, disabled: busy, children: "Refresh" })
      ] }),
      error && /* @__PURE__ */ jsxRuntime.jsx(designSystem.Box, { paddingBottom: 4, children: /* @__PURE__ */ jsxRuntime.jsx(designSystem.Alert, { title: "Status unavailable", variant: "danger", closeLabel: "Close", children: error }) }),
      status?.statusMessage && /* @__PURE__ */ jsxRuntime.jsx(designSystem.Box, { paddingBottom: 4, children: /* @__PURE__ */ jsxRuntime.jsx(designSystem.Alert, { title: status.apiKeyConfigured ? "Reindex needed" : "Embeddings disabled", variant: "warning", closeLabel: "Close", children: status.statusMessage }) }),
      status && /* @__PURE__ */ jsxRuntime.jsxs(designSystem.Box, { paddingBottom: 4, children: [
        /* @__PURE__ */ jsxRuntime.jsxs(designSystem.Typography, { children: [
          "Model ",
          status.model,
          ", version ",
          status.embeddingVersion,
          ". Store: ",
          status.vectorStore,
          ". pgvector probe:",
          " ",
          status.pgvector,
          ". Keyword index: ",
          status.lexicalReady ? "ready" : "not ready",
          ". Last sync:",
          " ",
          formatPacific(status.lastSyncAt),
          " (Pacific)."
        ] }),
        status.job?.running && /* @__PURE__ */ jsxRuntime.jsxs(designSystem.Typography, { children: [
          "Reindex in progress. Scanned ",
          status.job.scanned,
          "."
        ] })
      ] }),
      report && /* @__PURE__ */ jsxRuntime.jsx(designSystem.Box, { paddingBottom: 4, children: /* @__PURE__ */ jsxRuntime.jsxs(designSystem.Alert, { title: report.dryRun ? "Dry run" : "Reindex", variant: report.partial ? "warning" : "success", closeLabel: "Close", children: [
        `Scanned ${report.scanned ?? 0}, embedded ${report.embedded ?? 0}, skipped ${report.skipped ?? 0}, deferred ${report.deferred ?? 0}, failed ${report.failed ?? 0}, removed ${report.removed ?? 0}.`,
        report.statusMessage ? ` ${report.statusMessage}` : ""
      ] }) }),
      /* @__PURE__ */ jsxRuntime.jsxs(designSystem.Table, { colCount: 6, rowCount: (status?.types.length ?? 0) + 1, children: [
        /* @__PURE__ */ jsxRuntime.jsx(designSystem.Thead, { children: /* @__PURE__ */ jsxRuntime.jsxs(designSystem.Tr, { children: [
          /* @__PURE__ */ jsxRuntime.jsx(designSystem.Th, { children: /* @__PURE__ */ jsxRuntime.jsx(designSystem.Typography, { variant: "sigma", children: "Type" }) }),
          /* @__PURE__ */ jsxRuntime.jsx(designSystem.Th, { children: /* @__PURE__ */ jsxRuntime.jsx(designSystem.Typography, { variant: "sigma", children: "Content" }) }),
          /* @__PURE__ */ jsxRuntime.jsx(designSystem.Th, { children: /* @__PURE__ */ jsxRuntime.jsx(designSystem.Typography, { variant: "sigma", children: "Current" }) }),
          /* @__PURE__ */ jsxRuntime.jsx(designSystem.Th, { children: /* @__PURE__ */ jsxRuntime.jsx(designSystem.Typography, { variant: "sigma", children: "Stale" }) }),
          /* @__PURE__ */ jsxRuntime.jsx(designSystem.Th, { children: /* @__PURE__ */ jsxRuntime.jsx(designSystem.Typography, { variant: "sigma", children: "Failed" }) }),
          /* @__PURE__ */ jsxRuntime.jsx(designSystem.Th, { children: /* @__PURE__ */ jsxRuntime.jsx(designSystem.Typography, { variant: "sigma", children: "Missing" }) })
        ] }) }),
        /* @__PURE__ */ jsxRuntime.jsx(designSystem.Tbody, { children: (status?.types ?? []).map((row) => /* @__PURE__ */ jsxRuntime.jsxs(designSystem.Tr, { children: [
          /* @__PURE__ */ jsxRuntime.jsx(designSystem.Td, { children: /* @__PURE__ */ jsxRuntime.jsx(designSystem.Typography, { children: row.uid }) }),
          /* @__PURE__ */ jsxRuntime.jsx(designSystem.Td, { children: /* @__PURE__ */ jsxRuntime.jsx(designSystem.Typography, { children: row.contentCount }) }),
          /* @__PURE__ */ jsxRuntime.jsx(designSystem.Td, { children: /* @__PURE__ */ jsxRuntime.jsx(designSystem.Typography, { children: row.current }) }),
          /* @__PURE__ */ jsxRuntime.jsx(designSystem.Td, { children: /* @__PURE__ */ jsxRuntime.jsx(designSystem.Typography, { children: row.stale }) }),
          /* @__PURE__ */ jsxRuntime.jsx(designSystem.Td, { children: /* @__PURE__ */ jsxRuntime.jsx(designSystem.Typography, { children: row.failed }) }),
          /* @__PURE__ */ jsxRuntime.jsx(designSystem.Td, { children: /* @__PURE__ */ jsxRuntime.jsx(designSystem.Typography, { children: row.missing }) })
        ] }, row.uid)) })
      ] })
    ] })
  ] });
};
const App = () => {
  return /* @__PURE__ */ jsxRuntime.jsxs(reactRouterDom.Routes, { children: [
    /* @__PURE__ */ jsxRuntime.jsx(reactRouterDom.Route, { index: true, element: /* @__PURE__ */ jsxRuntime.jsx(HomePage, {}) }),
    /* @__PURE__ */ jsxRuntime.jsx(reactRouterDom.Route, { path: "*", element: /* @__PURE__ */ jsxRuntime.jsx(admin.Page.Error, {}) })
  ] });
};
exports.App = App;
