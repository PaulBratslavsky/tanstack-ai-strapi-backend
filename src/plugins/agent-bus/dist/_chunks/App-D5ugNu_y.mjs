import { jsx, jsxs } from "react/jsx-runtime";
import { useFetchClient, useNotification, Page, Layouts, ConfirmDialog } from "@strapi/strapi/admin";
import { Routes, Route } from "react-router-dom";
import { useState, useCallback, useEffect } from "react";
import { Alert, Button, Box, Flex, Typography, EmptyStateLayout, Table, Thead, Tr, Th, Tbody, Td, Badge, Switch, IconButton, Dialog, Modal, Field, TextInput, SingleSelect, SingleSelectOption, Textarea, Radio } from "@strapi/design-system";
import { Trash, WarningCircle, Plus, Duplicate } from "@strapi/icons";
import { P as PLUGIN_ID } from "./index-DfIC86M6.mjs";
const PERMISSION_PACKS = [
  { value: "asker", label: "Asker (agent.read, message.send)" },
  { value: "specialist", label: "Specialist (+ message.inbox)" },
  { value: "orchestrator", label: "Orchestrator (+ message.manage, approval.*, delivery.read)" },
  { value: "custom", label: "Custom" }
];
const KINDS = [
  { value: "orchestrator", label: "Orchestrator" },
  { value: "specialist", label: "Specialist" },
  { value: "human", label: "Human" },
  { value: "app", label: "App" }
];
const WEBHOOK_MODES = [
  { value: "reference", label: "Reference (message ID only)" },
  { value: "full", label: "Full (complete message body)" }
];
const formatDate = (value) => value ? new Date(value).toLocaleString() : "—";
const CopyValue = ({ label, value }) => {
  const { toggleNotification } = useNotification();
  return /* @__PURE__ */ jsxs(Flex, { gap: 2, alignItems: "center", paddingBottom: 2, children: [
    /* @__PURE__ */ jsx(Box, { minWidth: "220px", children: /* @__PURE__ */ jsx(Typography, { variant: "omega", fontWeight: "semiBold", children: label }) }),
    /* @__PURE__ */ jsx(Typography, { variant: "omega", style: { fontFamily: "monospace", wordBreak: "break-all" }, children: value }),
    /* @__PURE__ */ jsx(
      IconButton,
      {
        label: `Copy ${label}`,
        variant: "ghost",
        onClick: async () => {
          await navigator.clipboard.writeText(value);
          toggleNotification({ type: "success", message: `${label} copied` });
        },
        children: /* @__PURE__ */ jsx(Duplicate, {})
      }
    )
  ] });
};
const TokenSelect = ({
  tokens,
  value,
  onChange,
  disabled
}) => {
  return /* @__PURE__ */ jsx(
    SingleSelect,
    {
      "aria-label": "API Token",
      placeholder: "Choose an unbound token",
      value: value || null,
      disabled,
      onChange: (next) => onChange(String(next)),
      children: tokens.map((token) => /* @__PURE__ */ jsx(SingleSelectOption, { value: String(token.id), children: token.name }, token.id))
    }
  );
};
const AddAgentModal = ({ onCreated, tokens }) => {
  const { post } = useFetchClient();
  const { toggleNotification } = useNotification();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [kind, setKind] = useState("specialist");
  const [permissionPack, setPermissionPack] = useState("asker");
  const [description, setDescription] = useState("");
  const [webhookUrl, setWebhookUrl] = useState("");
  const [webhookSecret, setWebhookSecret] = useState("");
  const [webhookAuthHeader, setWebhookAuthHeader] = useState("");
  const [webhookMode, setWebhookMode] = useState("reference");
  const [credentialType, setCredentialType] = useState("mint");
  const [tokenId, setTokenId] = useState("");
  const [created, setCreated] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const generateSlug = (value) => {
    return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  };
  const handleNameChange = (value) => {
    setName(value);
    if (!slug || slug === generateSlug(name)) {
      setSlug(generateSlug(value));
    }
  };
  const reset = () => {
    setName("");
    setSlug("");
    setKind("specialist");
    setPermissionPack("asker");
    setDescription("");
    setWebhookUrl("");
    setWebhookSecret("");
    setWebhookAuthHeader("");
    setWebhookMode("reference");
    setCredentialType("mint");
    setTokenId("");
    setCreated(null);
  };
  const submit = async () => {
    setSubmitting(true);
    try {
      const { data } = await post(`/${PLUGIN_ID}/admin/agents`, {
        name,
        slug: slug.trim() || void 0,
        kind,
        permissionPack,
        description,
        webhookUrl: webhookUrl.trim() || null,
        webhookSecret: webhookSecret.trim() || null,
        webhookAuthHeader: webhookAuthHeader.trim() || null,
        webhookMode,
        credentialType,
        tokenId: credentialType === "bind" ? Number(tokenId) : void 0
      });
      if (data.data.token) {
        setCreated(data.data.token);
      }
      onCreated();
      if (!data.data.token) {
        setOpen(false);
        reset();
      }
    } catch (error) {
      toggleNotification({ type: "danger", message: error?.response?.data?.error?.message ?? "Could not create agent" });
    } finally {
      setSubmitting(false);
    }
  };
  return /* @__PURE__ */ jsxs(
    Modal.Root,
    {
      open,
      onOpenChange: (next) => {
        setOpen(next);
        if (!next) reset();
      },
      children: [
        /* @__PURE__ */ jsx(Modal.Trigger, { children: /* @__PURE__ */ jsx(Button, { startIcon: /* @__PURE__ */ jsx(Plus, {}), children: "Add agent" }) }),
        /* @__PURE__ */ jsxs(Modal.Content, { children: [
          /* @__PURE__ */ jsx(Modal.Header, { children: /* @__PURE__ */ jsx(Modal.Title, { children: created ? "Agent created" : "Add an agent" }) }),
          /* @__PURE__ */ jsx(Modal.Body, { children: created ? /* @__PURE__ */ jsxs(Flex, { direction: "column", alignItems: "stretch", gap: 4, children: [
            /* @__PURE__ */ jsx(Alert, { variant: "warning", title: "Copy this now", closeLabel: "Close", children: "The access key is shown only once. Save it securely." }),
            /* @__PURE__ */ jsx(CopyValue, { label: "Token name", value: created.tokenName }),
            /* @__PURE__ */ jsx(CopyValue, { label: "Access key", value: created.accessKey })
          ] }) : /* @__PURE__ */ jsxs(Flex, { direction: "column", alignItems: "stretch", gap: 4, children: [
            /* @__PURE__ */ jsxs(Field.Root, { name: "name", required: true, children: [
              /* @__PURE__ */ jsx(Field.Label, { children: "Name" }),
              /* @__PURE__ */ jsx(TextInput, { value: name, onChange: (e) => handleNameChange(e.target.value), placeholder: "My Agent" })
            ] }),
            /* @__PURE__ */ jsxs(Field.Root, { name: "slug", required: true, hint: "Auto-generated from name. Use lowercase letters, numbers, and hyphens only.", children: [
              /* @__PURE__ */ jsx(Field.Label, { children: "Slug" }),
              /* @__PURE__ */ jsx(TextInput, { value: slug, onChange: (e) => setSlug(e.target.value), placeholder: "my-agent" }),
              /* @__PURE__ */ jsx(Field.Hint, {})
            ] }),
            /* @__PURE__ */ jsxs(Field.Root, { name: "kind", children: [
              /* @__PURE__ */ jsx(Field.Label, { children: "Kind" }),
              /* @__PURE__ */ jsx(SingleSelect, { value: kind, onChange: (value) => setKind(String(value)), children: KINDS.map((k) => /* @__PURE__ */ jsx(SingleSelectOption, { value: k.value, children: k.label }, k.value)) })
            ] }),
            /* @__PURE__ */ jsxs(Field.Root, { name: "permissionPack", children: [
              /* @__PURE__ */ jsx(Field.Label, { children: "Permission Pack" }),
              /* @__PURE__ */ jsx(SingleSelect, { value: permissionPack, onChange: (value) => setPermissionPack(String(value)), children: PERMISSION_PACKS.map((p) => /* @__PURE__ */ jsx(SingleSelectOption, { value: p.value, children: p.label }, p.value)) })
            ] }),
            /* @__PURE__ */ jsxs(Field.Root, { name: "description", children: [
              /* @__PURE__ */ jsx(Field.Label, { children: "Description" }),
              /* @__PURE__ */ jsx(Textarea, { value: description, onChange: (e) => setDescription(e.target.value) })
            ] }),
            /* @__PURE__ */ jsxs(Field.Root, { name: "webhookUrl", children: [
              /* @__PURE__ */ jsx(Field.Label, { children: "Webhook URL" }),
              /* @__PURE__ */ jsx(TextInput, { value: webhookUrl, onChange: (e) => setWebhookUrl(e.target.value), placeholder: "https://example.com/webhook" })
            ] }),
            /* @__PURE__ */ jsxs(Field.Root, { name: "webhookSecret", children: [
              /* @__PURE__ */ jsx(Field.Label, { children: "Webhook Secret (optional)" }),
              /* @__PURE__ */ jsx(TextInput, { value: webhookSecret, onChange: (e) => setWebhookSecret(e.target.value), type: "password", placeholder: "Signature verification secret" })
            ] }),
            /* @__PURE__ */ jsxs(Field.Root, { name: "webhookAuthHeader", children: [
              /* @__PURE__ */ jsx(Field.Label, { children: "Webhook Auth Header (optional)" }),
              /* @__PURE__ */ jsx(TextInput, { value: webhookAuthHeader, onChange: (e) => setWebhookAuthHeader(e.target.value), type: "password", placeholder: "Bearer token..." })
            ] }),
            /* @__PURE__ */ jsxs(Field.Root, { name: "webhookMode", children: [
              /* @__PURE__ */ jsx(Field.Label, { children: "Webhook Mode" }),
              /* @__PURE__ */ jsx(SingleSelect, { value: webhookMode, onChange: (value) => setWebhookMode(String(value)), children: WEBHOOK_MODES.map((m) => /* @__PURE__ */ jsx(SingleSelectOption, { value: m.value, children: m.label }, m.value)) })
            ] }),
            /* @__PURE__ */ jsxs(Field.Root, { name: "credentialType", hint: "Mint: create a new token with permissions from the pack. Bind: attach an existing unbound token.", children: [
              /* @__PURE__ */ jsx(Field.Label, { children: "Credential" }),
              /* @__PURE__ */ jsxs(Radio.Group, { value: credentialType, onValueChange: (value) => setCredentialType(value), "aria-label": "Credential type", children: [
                /* @__PURE__ */ jsx(Radio.Item, { value: "mint", children: "Mint new token" }),
                /* @__PURE__ */ jsx(Radio.Item, { value: "bind", children: "Bind existing token" })
              ] }),
              /* @__PURE__ */ jsx(Field.Hint, {})
            ] }),
            credentialType === "bind" && /* @__PURE__ */ jsxs(Field.Root, { name: "tokenId", required: true, children: [
              /* @__PURE__ */ jsx(Field.Label, { children: "Select Token" }),
              /* @__PURE__ */ jsx(TokenSelect, { tokens, value: tokenId, onChange: setTokenId })
            ] })
          ] }) }),
          /* @__PURE__ */ jsxs(Modal.Footer, { children: [
            /* @__PURE__ */ jsx(Modal.Close, { children: /* @__PURE__ */ jsx(Button, { variant: "tertiary", children: created ? "Done" : "Cancel" }) }),
            !created && /* @__PURE__ */ jsx(Button, { onClick: submit, loading: submitting, disabled: !name.trim() || credentialType === "bind" && !tokenId, children: "Create" })
          ] })
        ] })
      ]
    }
  );
};
const EditAgentModal = ({ agent, onUpdated, tokens }) => {
  const { put } = useFetchClient();
  const { toggleNotification } = useNotification();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(agent.name);
  const [kind, setKind] = useState(agent.kind);
  const [permissionPack, setPermissionPack] = useState(agent.permissionPack);
  const [description, setDescription] = useState("");
  const [webhookUrl, setWebhookUrl] = useState(agent.webhookUrl || "");
  const [webhookSecret, setWebhookSecret] = useState("");
  const [webhookAuthHeader, setWebhookAuthHeader] = useState("");
  const [webhookMode, setWebhookMode] = useState("reference");
  const [submitting, setSubmitting] = useState(false);
  const submit = async () => {
    setSubmitting(true);
    try {
      await put(`/${PLUGIN_ID}/admin/agents/${agent.documentId}`, {
        name,
        kind,
        permissionPack,
        description: description || void 0,
        webhookUrl: webhookUrl.trim() || null,
        webhookSecret: webhookSecret.trim() || void 0,
        webhookAuthHeader: webhookAuthHeader.trim() || void 0,
        webhookMode
      });
      toggleNotification({ type: "success", message: "Agent updated" });
      onUpdated();
      setOpen(false);
    } catch (error) {
      toggleNotification({ type: "danger", message: error?.response?.data?.error?.message ?? "Could not update agent" });
    } finally {
      setSubmitting(false);
    }
  };
  return /* @__PURE__ */ jsxs(Modal.Root, { open, onOpenChange: setOpen, children: [
    /* @__PURE__ */ jsx(Modal.Trigger, { children: /* @__PURE__ */ jsx(Button, { variant: "secondary", size: "S", children: "Edit" }) }),
    /* @__PURE__ */ jsxs(Modal.Content, { children: [
      /* @__PURE__ */ jsx(Modal.Header, { children: /* @__PURE__ */ jsxs(Modal.Title, { children: [
        "Edit ",
        agent.name
      ] }) }),
      /* @__PURE__ */ jsx(Modal.Body, { children: /* @__PURE__ */ jsxs(Flex, { direction: "column", alignItems: "stretch", gap: 4, children: [
        /* @__PURE__ */ jsxs(Field.Root, { name: "name", required: true, children: [
          /* @__PURE__ */ jsx(Field.Label, { children: "Name" }),
          /* @__PURE__ */ jsx(TextInput, { value: name, onChange: (e) => setName(e.target.value) })
        ] }),
        /* @__PURE__ */ jsxs(Field.Root, { name: "kind", children: [
          /* @__PURE__ */ jsx(Field.Label, { children: "Kind" }),
          /* @__PURE__ */ jsx(SingleSelect, { value: kind, onChange: (value) => setKind(String(value)), children: KINDS.map((k) => /* @__PURE__ */ jsx(SingleSelectOption, { value: k.value, children: k.label }, k.value)) })
        ] }),
        /* @__PURE__ */ jsxs(Field.Root, { name: "permissionPack", children: [
          /* @__PURE__ */ jsx(Field.Label, { children: "Permission Pack" }),
          /* @__PURE__ */ jsx(SingleSelect, { value: permissionPack, onChange: (value) => setPermissionPack(String(value)), children: PERMISSION_PACKS.map((p) => /* @__PURE__ */ jsx(SingleSelectOption, { value: p.value, children: p.label }, p.value)) })
        ] }),
        /* @__PURE__ */ jsxs(Field.Root, { name: "description", children: [
          /* @__PURE__ */ jsx(Field.Label, { children: "Description" }),
          /* @__PURE__ */ jsx(Textarea, { value: description, onChange: (e) => setDescription(e.target.value) })
        ] }),
        /* @__PURE__ */ jsxs(Field.Root, { name: "webhookUrl", children: [
          /* @__PURE__ */ jsx(Field.Label, { children: "Webhook URL" }),
          /* @__PURE__ */ jsx(TextInput, { value: webhookUrl, onChange: (e) => setWebhookUrl(e.target.value), placeholder: "https://example.com/webhook" })
        ] }),
        /* @__PURE__ */ jsxs(Field.Root, { name: "webhookSecret", hint: "Leave empty to keep current secret", children: [
          /* @__PURE__ */ jsx(Field.Label, { children: "Webhook Secret (optional)" }),
          /* @__PURE__ */ jsx(TextInput, { value: webhookSecret, onChange: (e) => setWebhookSecret(e.target.value), type: "password", placeholder: "Leave empty to keep current" }),
          /* @__PURE__ */ jsx(Field.Hint, {})
        ] }),
        /* @__PURE__ */ jsxs(Field.Root, { name: "webhookAuthHeader", hint: "Leave empty to keep current header", children: [
          /* @__PURE__ */ jsx(Field.Label, { children: "Webhook Auth Header (optional)" }),
          /* @__PURE__ */ jsx(TextInput, { value: webhookAuthHeader, onChange: (e) => setWebhookAuthHeader(e.target.value), type: "password", placeholder: "Leave empty to keep current" }),
          /* @__PURE__ */ jsx(Field.Hint, {})
        ] }),
        /* @__PURE__ */ jsxs(Field.Root, { name: "webhookMode", children: [
          /* @__PURE__ */ jsx(Field.Label, { children: "Webhook Mode" }),
          /* @__PURE__ */ jsx(SingleSelect, { value: webhookMode, onChange: (value) => setWebhookMode(String(value)), children: WEBHOOK_MODES.map((m) => /* @__PURE__ */ jsx(SingleSelectOption, { value: m.value, children: m.label }, m.value)) })
        ] })
      ] }) }),
      /* @__PURE__ */ jsxs(Modal.Footer, { children: [
        /* @__PURE__ */ jsx(Modal.Close, { children: /* @__PURE__ */ jsx(Button, { variant: "tertiary", children: "Cancel" }) }),
        /* @__PURE__ */ jsx(Button, { onClick: submit, loading: submitting, disabled: !name.trim(), children: "Save" })
      ] })
    ] })
  ] });
};
const BindTokenModal = ({ agent, onBound, tokens }) => {
  const { post } = useFetchClient();
  const { toggleNotification } = useNotification();
  const [open, setOpen] = useState(false);
  const [tokenId, setTokenId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const submit = async () => {
    setSubmitting(true);
    try {
      await post(`/${PLUGIN_ID}/admin/agents/${agent.documentId}/bind`, {
        tokenId: Number(tokenId)
      });
      toggleNotification({ type: "success", message: "Token bound" });
      onBound();
      setOpen(false);
      setTokenId("");
    } catch (error) {
      toggleNotification({ type: "danger", message: error?.response?.data?.error?.message ?? "Could not bind token" });
    } finally {
      setSubmitting(false);
    }
  };
  return /* @__PURE__ */ jsxs(Modal.Root, { open, onOpenChange: setOpen, children: [
    /* @__PURE__ */ jsx(Modal.Trigger, { children: /* @__PURE__ */ jsx(Button, { variant: "secondary", size: "S", children: "Bind Token" }) }),
    /* @__PURE__ */ jsxs(Modal.Content, { children: [
      /* @__PURE__ */ jsx(Modal.Header, { children: /* @__PURE__ */ jsxs(Modal.Title, { children: [
        "Bind Token to ",
        agent.name
      ] }) }),
      /* @__PURE__ */ jsx(Modal.Body, { children: /* @__PURE__ */ jsxs(Field.Root, { name: "tokenId", required: true, children: [
        /* @__PURE__ */ jsx(Field.Label, { children: "Select Token" }),
        /* @__PURE__ */ jsx(TokenSelect, { tokens, value: tokenId, onChange: setTokenId })
      ] }) }),
      /* @__PURE__ */ jsxs(Modal.Footer, { children: [
        /* @__PURE__ */ jsx(Modal.Close, { children: /* @__PURE__ */ jsx(Button, { variant: "tertiary", children: "Cancel" }) }),
        /* @__PURE__ */ jsx(Button, { onClick: submit, loading: submitting, disabled: !tokenId, children: "Bind" })
      ] })
    ] })
  ] });
};
const MintTokenModal = ({ agent, onMinted }) => {
  const { post } = useFetchClient();
  const { toggleNotification } = useNotification();
  const [open, setOpen] = useState(false);
  const [created, setCreated] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const submit = async () => {
    setSubmitting(true);
    try {
      const { data } = await post(`/${PLUGIN_ID}/admin/agents/${agent.documentId}/mint`, {});
      setCreated(data.data);
      onMinted();
    } catch (error) {
      toggleNotification({ type: "danger", message: error?.response?.data?.error?.message ?? "Could not mint token" });
    } finally {
      setSubmitting(false);
    }
  };
  return /* @__PURE__ */ jsxs(
    Modal.Root,
    {
      open,
      onOpenChange: (next) => {
        setOpen(next);
        if (!next) setCreated(null);
      },
      children: [
        /* @__PURE__ */ jsx(Modal.Trigger, { children: /* @__PURE__ */ jsx(Button, { variant: "secondary", size: "S", children: "Mint Token" }) }),
        /* @__PURE__ */ jsxs(Modal.Content, { children: [
          /* @__PURE__ */ jsx(Modal.Header, { children: /* @__PURE__ */ jsx(Modal.Title, { children: created ? "Token created" : `Mint Token for ${agent.name}` }) }),
          /* @__PURE__ */ jsx(Modal.Body, { children: created ? /* @__PURE__ */ jsxs(Flex, { direction: "column", alignItems: "stretch", gap: 4, children: [
            /* @__PURE__ */ jsx(Alert, { variant: "warning", title: "Copy this now", closeLabel: "Close", children: "The access key is shown only once. Save it securely." }),
            /* @__PURE__ */ jsx(CopyValue, { label: "Token name", value: created.tokenName }),
            /* @__PURE__ */ jsx(CopyValue, { label: "Access key", value: created.accessKey })
          ] }) : /* @__PURE__ */ jsxs(Typography, { children: [
            "This will create a new admin token with permissions from the ",
            agent.permissionPack,
            " pack and bind it to ",
            agent.name,
            "."
          ] }) }),
          /* @__PURE__ */ jsxs(Modal.Footer, { children: [
            /* @__PURE__ */ jsx(Modal.Close, { children: /* @__PURE__ */ jsx(Button, { variant: "tertiary", children: created ? "Done" : "Cancel" }) }),
            !created && /* @__PURE__ */ jsx(Button, { onClick: submit, loading: submitting, children: "Mint" })
          ] })
        ] })
      ]
    }
  );
};
const HomePage = () => {
  const { get, del, put } = useFetchClient();
  const { toggleNotification } = useNotification();
  const [agents, setAgents] = useState([]);
  const [tokens, setTokens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [confirmation, setConfirmation] = useState(null);
  const load = useCallback(async () => {
    try {
      const [a, t] = await Promise.all([
        get(`/${PLUGIN_ID}/admin/agents`),
        get(`/${PLUGIN_ID}/admin/tokens`)
      ]);
      setAgents(a.data.data);
      setTokens(t.data.data);
      setLoadError(false);
    } catch {
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  }, [get]);
  useEffect(() => {
    load();
  }, [load]);
  const run = async (action, message) => {
    try {
      await action();
      toggleNotification({ type: "success", message });
    } catch (error) {
      toggleNotification({ type: "danger", message: error?.response?.data?.error?.message ?? "Something went wrong" });
    }
    load();
  };
  if (loading) {
    return /* @__PURE__ */ jsx(Page.Loading, {});
  }
  if (loadError) {
    return /* @__PURE__ */ jsxs(Page.Main, { children: [
      /* @__PURE__ */ jsx(Page.Title, { children: "Agent Bus" }),
      /* @__PURE__ */ jsx(Layouts.Header, { title: "Agent Bus" }),
      /* @__PURE__ */ jsx(Layouts.Content, { children: /* @__PURE__ */ jsx(
        Alert,
        {
          variant: "danger",
          title: "Could not load Agent Bus data",
          closeLabel: "Close",
          action: /* @__PURE__ */ jsx(
            Button,
            {
              variant: "tertiary",
              onClick: () => {
                setLoading(true);
                load();
              },
              children: "Retry"
            }
          ),
          children: "Check that you have the Manage Agent Bus permission and that Strapi is running."
        }
      ) })
    ] });
  }
  return /* @__PURE__ */ jsxs(Page.Main, { children: [
    /* @__PURE__ */ jsx(Page.Title, { children: "Agent Bus" }),
    /* @__PURE__ */ jsx(
      Layouts.Header,
      {
        title: "Agent Bus",
        subtitle: "Manage registered agents and their token bindings for secure agent-to-agent communication."
      }
    ),
    /* @__PURE__ */ jsx(Layouts.Content, { children: /* @__PURE__ */ jsxs(Box, { background: "neutral0", hasRadius: true, shadow: "tableShadow", padding: 6, children: [
      /* @__PURE__ */ jsxs(Flex, { justifyContent: "space-between", alignItems: "flex-start", gap: 4, paddingBottom: 4, children: [
        /* @__PURE__ */ jsxs(Flex, { direction: "column", alignItems: "flex-start", gap: 1, children: [
          /* @__PURE__ */ jsx(Typography, { variant: "delta", tag: "h2", children: "Agents" }),
          /* @__PURE__ */ jsx(Typography, { textColor: "neutral600", children: "Registered agents with their credentials and webhook configurations" })
        ] }),
        /* @__PURE__ */ jsx(AddAgentModal, { onCreated: load, tokens })
      ] }),
      agents.length === 0 ? /* @__PURE__ */ jsx(EmptyStateLayout, { content: "No agents registered yet." }) : /* @__PURE__ */ jsxs(Table, { colCount: 9, rowCount: agents.length + 1, children: [
        /* @__PURE__ */ jsx(Thead, { children: /* @__PURE__ */ jsxs(Tr, { children: [
          /* @__PURE__ */ jsx(Th, { children: /* @__PURE__ */ jsx(Typography, { variant: "sigma", children: "Name" }) }),
          /* @__PURE__ */ jsx(Th, { children: /* @__PURE__ */ jsx(Typography, { variant: "sigma", children: "Slug" }) }),
          /* @__PURE__ */ jsx(Th, { children: /* @__PURE__ */ jsx(Typography, { variant: "sigma", children: "Kind" }) }),
          /* @__PURE__ */ jsx(Th, { children: /* @__PURE__ */ jsx(Typography, { variant: "sigma", children: "State" }) }),
          /* @__PURE__ */ jsx(Th, { children: /* @__PURE__ */ jsx(Typography, { variant: "sigma", children: "Pack" }) }),
          /* @__PURE__ */ jsx(Th, { children: /* @__PURE__ */ jsx(Typography, { variant: "sigma", children: "Credentials" }) }),
          /* @__PURE__ */ jsx(Th, { children: /* @__PURE__ */ jsx(Typography, { variant: "sigma", children: "Webhook" }) }),
          /* @__PURE__ */ jsx(Th, { children: /* @__PURE__ */ jsx(Typography, { variant: "sigma", children: "Last Seen" }) }),
          /* @__PURE__ */ jsx(Th, { children: /* @__PURE__ */ jsx(Typography, { variant: "sigma", children: "Actions" }) })
        ] }) }),
        /* @__PURE__ */ jsx(Tbody, { children: agents.map((agent) => /* @__PURE__ */ jsxs(Tr, { children: [
          /* @__PURE__ */ jsx(Td, { children: /* @__PURE__ */ jsx(Typography, { fontWeight: "semiBold", children: agent.name }) }),
          /* @__PURE__ */ jsx(Td, { children: /* @__PURE__ */ jsx(Typography, { variant: "pi", style: { fontFamily: "monospace" }, children: agent.slug }) }),
          /* @__PURE__ */ jsx(Td, { children: /* @__PURE__ */ jsx(Badge, { children: agent.kind }) }),
          /* @__PURE__ */ jsx(Td, { children: /* @__PURE__ */ jsx(
            Switch,
            {
              "aria-label": `${agent.name} active`,
              checked: agent.state === "active",
              onCheckedChange: (checked) => run(
                () => put(`/${PLUGIN_ID}/admin/agents/${agent.documentId}`, { state: checked ? "active" : "disabled" }),
                checked ? "Agent activated" : "Agent disabled"
              )
            }
          ) }),
          /* @__PURE__ */ jsx(Td, { children: /* @__PURE__ */ jsx(Typography, { children: agent.permissionPack }) }),
          /* @__PURE__ */ jsx(Td, { children: /* @__PURE__ */ jsx(Flex, { direction: "column", alignItems: "flex-start", gap: 1, children: agent.credentials.length === 0 ? /* @__PURE__ */ jsx(Typography, { textColor: "neutral600", children: "None" }) : agent.credentials.map((cred) => /* @__PURE__ */ jsxs(Flex, { gap: 2, alignItems: "center", children: [
            /* @__PURE__ */ jsx(Badge, { variant: cred.state === "active" ? "success" : "secondary", children: cred.kind }),
            /* @__PURE__ */ jsx(Typography, { variant: "pi", children: cred.tokenName || "Deleted token" }),
            cred.mintedByPlugin && /* @__PURE__ */ jsx(Badge, { variant: "secondary", children: "minted" }),
            /* @__PURE__ */ jsx(
              IconButton,
              {
                label: "Revoke credential",
                variant: "ghost",
                onClick: () => setConfirmation({
                  title: "Revoke credential?",
                  body: `This will revoke the binding${cred.mintedByPlugin ? " and delete the token" : ""}. The agent will no longer authenticate.`,
                  action: () => del(`/${PLUGIN_ID}/admin/agents/${agent.documentId}/credentials/${cred.id}`),
                  successMessage: "Credential revoked"
                }),
                children: /* @__PURE__ */ jsx(Trash, {})
              }
            )
          ] }, cred.id)) }) }),
          /* @__PURE__ */ jsx(Td, { children: agent.webhookUrl ? /* @__PURE__ */ jsx(Badge, { variant: "success", children: "Configured" }) : /* @__PURE__ */ jsx(Typography, { textColor: "neutral600", children: "—" }) }),
          /* @__PURE__ */ jsx(Td, { children: /* @__PURE__ */ jsx(Typography, { variant: "pi", children: formatDate(agent.lastSeenAt) }) }),
          /* @__PURE__ */ jsx(Td, { children: /* @__PURE__ */ jsxs(Flex, { gap: 1, direction: "column", alignItems: "flex-start", children: [
            /* @__PURE__ */ jsx(EditAgentModal, { agent, onUpdated: load, tokens }),
            /* @__PURE__ */ jsx(BindTokenModal, { agent, onBound: load, tokens }),
            /* @__PURE__ */ jsx(MintTokenModal, { agent, onMinted: load })
          ] }) })
        ] }, agent.id)) })
      ] })
    ] }) }),
    /* @__PURE__ */ jsx(Dialog.Root, { open: confirmation !== null, onOpenChange: (open) => !open && setConfirmation(null), children: confirmation && /* @__PURE__ */ jsx(
      ConfirmDialog,
      {
        title: confirmation.title,
        variant: "danger-light",
        icon: /* @__PURE__ */ jsx(WarningCircle, {}),
        onConfirm: async () => {
          const pending = confirmation;
          setConfirmation(null);
          await run(pending.action, pending.successMessage);
        },
        children: confirmation.body
      }
    ) })
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
