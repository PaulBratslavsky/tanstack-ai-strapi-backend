import { jsxs, jsx } from "react/jsx-runtime";
import { useFetchClient, useNotification, Page, Layouts } from "@strapi/strapi/admin";
import { Routes, Route } from "react-router-dom";
import { useState, useCallback, useEffect } from "react";
import { Flex, Button, Box, Alert, Typography, Table, Thead, Tr, Th, Tbody, Td } from "@strapi/design-system";
import { P as PLUGIN_ID } from "./index-BAXXqC7H.mjs";
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
  const { get, post } = useFetchClient();
  const { toggleNotification } = useNotification();
  const [status, setStatus] = useState(null);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const [report, setReport] = useState(null);
  const load = useCallback(async () => {
    try {
      const response = await get(`/${PLUGIN_ID}/admin/status`);
      setStatus(response.data);
      setError(null);
    } catch (err) {
      setError("Could not load hybrid search status. The admin token needs plugin::hybrid-search.read.");
    }
  }, [get]);
  useEffect(() => {
    load();
  }, [load]);
  const runReindex = async (dryRun) => {
    setBusy(true);
    try {
      const response = await post(`/${PLUGIN_ID}/admin/reindex`, { dryRun, wait: true });
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
  return /* @__PURE__ */ jsxs(Page.Main, { children: [
    /* @__PURE__ */ jsx(
      Layouts.Header,
      {
        title: "Hybrid Search",
        subtitle: "Keyword search plus OpenAI embeddings, cached in memory"
      }
    ),
    /* @__PURE__ */ jsxs(Layouts.Content, { children: [
      /* @__PURE__ */ jsxs(Flex, { gap: 2, paddingBottom: 4, children: [
        /* @__PURE__ */ jsx(Button, { onClick: () => runReindex(false), loading: busy, disabled: busy, children: "Reindex all" }),
        /* @__PURE__ */ jsx(Button, { variant: "secondary", onClick: () => runReindex(true), disabled: busy, children: "Dry run" }),
        /* @__PURE__ */ jsx(Button, { variant: "tertiary", onClick: load, disabled: busy, children: "Refresh" })
      ] }),
      error && /* @__PURE__ */ jsx(Box, { paddingBottom: 4, children: /* @__PURE__ */ jsx(Alert, { title: "Status unavailable", variant: "danger", closeLabel: "Close", children: error }) }),
      status?.statusMessage && /* @__PURE__ */ jsx(Box, { paddingBottom: 4, children: /* @__PURE__ */ jsx(Alert, { title: status.apiKeyConfigured ? "Reindex needed" : "Embeddings disabled", variant: "warning", closeLabel: "Close", children: status.statusMessage }) }),
      status && /* @__PURE__ */ jsxs(Box, { paddingBottom: 4, children: [
        /* @__PURE__ */ jsxs(Typography, { children: [
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
        status.job?.running && /* @__PURE__ */ jsxs(Typography, { children: [
          "Reindex in progress. Scanned ",
          status.job.scanned,
          "."
        ] })
      ] }),
      report && /* @__PURE__ */ jsx(Box, { paddingBottom: 4, children: /* @__PURE__ */ jsxs(Alert, { title: report.dryRun ? "Dry run" : "Reindex", variant: report.partial ? "warning" : "success", closeLabel: "Close", children: [
        `Scanned ${report.scanned ?? 0}, embedded ${report.embedded ?? 0}, skipped ${report.skipped ?? 0}, deferred ${report.deferred ?? 0}, failed ${report.failed ?? 0}, removed ${report.removed ?? 0}.`,
        report.statusMessage ? ` ${report.statusMessage}` : ""
      ] }) }),
      /* @__PURE__ */ jsxs(Table, { colCount: 6, rowCount: (status?.types.length ?? 0) + 1, children: [
        /* @__PURE__ */ jsx(Thead, { children: /* @__PURE__ */ jsxs(Tr, { children: [
          /* @__PURE__ */ jsx(Th, { children: /* @__PURE__ */ jsx(Typography, { variant: "sigma", children: "Type" }) }),
          /* @__PURE__ */ jsx(Th, { children: /* @__PURE__ */ jsx(Typography, { variant: "sigma", children: "Content" }) }),
          /* @__PURE__ */ jsx(Th, { children: /* @__PURE__ */ jsx(Typography, { variant: "sigma", children: "Current" }) }),
          /* @__PURE__ */ jsx(Th, { children: /* @__PURE__ */ jsx(Typography, { variant: "sigma", children: "Stale" }) }),
          /* @__PURE__ */ jsx(Th, { children: /* @__PURE__ */ jsx(Typography, { variant: "sigma", children: "Failed" }) }),
          /* @__PURE__ */ jsx(Th, { children: /* @__PURE__ */ jsx(Typography, { variant: "sigma", children: "Missing" }) })
        ] }) }),
        /* @__PURE__ */ jsx(Tbody, { children: (status?.types ?? []).map((row) => /* @__PURE__ */ jsxs(Tr, { children: [
          /* @__PURE__ */ jsx(Td, { children: /* @__PURE__ */ jsx(Typography, { children: row.uid }) }),
          /* @__PURE__ */ jsx(Td, { children: /* @__PURE__ */ jsx(Typography, { children: row.contentCount }) }),
          /* @__PURE__ */ jsx(Td, { children: /* @__PURE__ */ jsx(Typography, { children: row.current }) }),
          /* @__PURE__ */ jsx(Td, { children: /* @__PURE__ */ jsx(Typography, { children: row.stale }) }),
          /* @__PURE__ */ jsx(Td, { children: /* @__PURE__ */ jsx(Typography, { children: row.failed }) }),
          /* @__PURE__ */ jsx(Td, { children: /* @__PURE__ */ jsx(Typography, { children: row.missing }) })
        ] }, row.uid)) })
      ] })
    ] })
  ] });
};
const App = () => {
  return /* @__PURE__ */ jsxs(Routes, { children: [
    /* @__PURE__ */ jsx(Route, { index: true, element: /* @__PURE__ */ jsx(HomePage, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "*", element: /* @__PURE__ */ jsx(Page.Error, {}) })
  ] });
};
export {
  App
};
