"use strict";
const crypto = require("crypto");
const _interopDefault = (e) => e && e.__esModule ? e : { default: e };
const crypto__default = /* @__PURE__ */ _interopDefault(crypto);
const PLUGIN_NAME = "agent-bus";
const getUid = (contentType) => `plugin::${PLUGIN_NAME}.${contentType}`;
const PERMISSIONS = [
  // Directory subcategory
  {
    section: "plugins",
    pluginName: PLUGIN_NAME,
    subCategory: "directory",
    uid: "agent.read",
    displayName: "List agents and public capability cards"
  },
  {
    section: "plugins",
    pluginName: PLUGIN_NAME,
    subCategory: "directory",
    uid: "agent.manage",
    displayName: "Create and update agents, bind credentials, kill switch"
  },
  // Messaging subcategory
  {
    section: "plugins",
    pluginName: PLUGIN_NAME,
    subCategory: "messaging",
    uid: "message.send",
    displayName: "Send a message"
  },
  {
    section: "plugins",
    pluginName: PLUGIN_NAME,
    subCategory: "messaging",
    uid: "message.inbox",
    displayName: "Read and process own inbox (get, claim, reply, status, proof)"
  },
  {
    section: "plugins",
    pluginName: PLUGIN_NAME,
    subCategory: "messaging",
    uid: "message.manage",
    displayName: "Orchestrator: read any thread, delegate, cancel, triage, waive proof"
  },
  // Approvals subcategory
  {
    section: "plugins",
    pluginName: PLUGIN_NAME,
    subCategory: "approvals",
    uid: "approval.read",
    displayName: "List pending approvals"
  },
  {
    section: "plugins",
    pluginName: PLUGIN_NAME,
    subCategory: "approvals",
    uid: "approval.decide",
    displayName: "Approve, reject, or veto"
  },
  // Operations subcategory
  {
    section: "plugins",
    pluginName: PLUGIN_NAME,
    subCategory: "operations",
    uid: "delivery.read",
    displayName: "Inspect webhook deliveries"
  },
  {
    section: "plugins",
    pluginName: PLUGIN_NAME,
    subCategory: "operations",
    uid: "audit.read",
    displayName: "Read audit events"
  }
];
const getActionId = (uid) => `plugin::${PLUGIN_NAME}.${uid}`;
const register = ({ strapi }) => {
  const actionProvider = strapi.service("admin::permission").actionProvider;
  const existingActions = PERMISSIONS.filter(
    (permission) => actionProvider.has(`plugin::agent-bus.${permission.uid}`)
  );
  const newActions = PERMISSIONS.filter(
    (permission) => !actionProvider.has(`plugin::agent-bus.${permission.uid}`)
  );
  if (newActions.length > 0) {
    actionProvider.registerMany(newActions);
    strapi.log.info(
      `[agent-bus] Registered ${newActions.length} new permission actions in register phase`
    );
  }
  if (existingActions.length > 0) {
    strapi.log.debug(
      `[agent-bus] Skipped ${existingActions.length} already-registered permission actions`
    );
  }
  strapi.log.debug("[agent-bus] Plugin registered");
};
const BACKOFF_DELAYS_MS = [15e3, 6e4, 3e5, 15e5, 72e5];
const MAX_ATTEMPTS = 5;
const startOutboxWorker = (strapi, config2) => {
  const intervalMs = 1e4;
  const processOutbox = async () => {
    try {
      const deliveryUid = getUid("delivery");
      const messageUid = getUid("message");
      const agentUid = getUid("agent");
      const deliveries = await strapi.documents(deliveryUid).findMany({
        filters: {
          status: { $in: ["pending", "failed"] },
          nextAttemptAt: { $lte: (/* @__PURE__ */ new Date()).toISOString() }
        },
        populate: {
          agent: { fields: ["webhookUrl", "webhookSecret", "webhookMode", "webhookTimeoutMs", "slug", "status"] },
          message: {
            fields: ["type", "body", "payload", "priority", "blastRadius", "flagged"],
            populate: {
              from: { fields: ["slug"] },
              to: { fields: ["slug"] },
              thread: { fields: ["documentId"] }
            }
          }
        },
        limit: 10
      });
      for (const delivery2 of deliveries) {
        const agent2 = delivery2.agent;
        const message2 = delivery2.message;
        if (agent2.status !== "active" || !agent2.webhookUrl) {
          await strapi.documents(deliveryUid).update({
            documentId: delivery2.documentId,
            data: { status: "skipped" }
          });
          continue;
        }
        if (agent2.webhookUrl.startsWith("http://") && !config2.allowInsecureWebhooks) {
          await strapi.documents(deliveryUid).update({
            documentId: delivery2.documentId,
            data: {
              status: "skipped",
              lastError: "HTTP webhooks not allowed in production"
            }
          });
          continue;
        }
        if (delivery2.attemptCount >= MAX_ATTEMPTS) {
          await strapi.documents(deliveryUid).update({
            documentId: delivery2.documentId,
            data: {
              status: "exhausted",
              lastError: "Max attempts exceeded"
            }
          });
          const busService = strapi.plugin("agent-bus").service("bus");
          await busService.audit({
            action: "delivery.exhausted",
            entityType: "delivery",
            entityDocumentId: delivery2.documentId,
            metadata: {
              messageId: message2.documentId,
              agentSlug: agent2.slug,
              attempts: delivery2.attemptCount
            }
          });
          continue;
        }
        try {
          const timestamp = Math.floor(Date.now() / 1e3);
          const payload = {
            event: delivery2.event,
            messageId: message2.documentId,
            threadId: message2.thread?.documentId,
            type: message2.type,
            from: message2.from?.slug,
            to: message2.to?.slug,
            priority: message2.priority,
            blastRadius: message2.blastRadius,
            flagged: message2.flagged
          };
          if (agent2.webhookMode === "full") {
            payload.body = message2.body;
            payload.payload = message2.payload;
            payload.untrusted = true;
          }
          const body = JSON.stringify(payload);
          const signatureInput = `${timestamp}.${body}`;
          const signature = crypto__default.default.createHmac("sha256", agent2.webhookSecret || "").update(signatureInput).digest("hex");
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), agent2.webhookTimeoutMs || 5e3);
          const response = await fetch(agent2.webhookUrl, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "User-Agent": "agent-bus/1",
              "X-Agent-Bus-Event": delivery2.event,
              "X-Agent-Bus-Timestamp": timestamp.toString(),
              "X-Agent-Bus-Idempotency-Key": delivery2.idempotencyKey,
              "X-Agent-Bus-Signature": `sha256=${signature}`
            },
            body,
            signal: controller.signal
          });
          clearTimeout(timeoutId);
          if (response.ok) {
            await strapi.documents(deliveryUid).update({
              documentId: delivery2.documentId,
              data: {
                status: "delivered",
                deliveredAt: (/* @__PURE__ */ new Date()).toISOString(),
                lastStatusCode: response.status,
                lastError: null
              }
            });
            if (message2.status === "queued") {
              await strapi.documents(messageUid).update({
                documentId: message2.documentId,
                data: { status: "notified" }
              });
            }
            const busService = strapi.plugin("agent-bus").service("bus");
            await busService.audit({
              action: "delivery.delivered",
              entityType: "delivery",
              entityDocumentId: delivery2.documentId,
              metadata: {
                messageId: message2.documentId,
                agentSlug: agent2.slug,
                statusCode: response.status
              }
            });
          } else if (response.status === 410 || response.status === 404) {
            await strapi.documents(deliveryUid).update({
              documentId: delivery2.documentId,
              data: {
                status: "skipped",
                lastStatusCode: response.status,
                lastError: `Endpoint returned ${response.status}`
              }
            });
          } else {
            throw new Error(`HTTP ${response.status}`);
          }
        } catch (error) {
          const attemptCount = delivery2.attemptCount + 1;
          const delayMs = BACKOFF_DELAYS_MS[Math.min(attemptCount - 1, BACKOFF_DELAYS_MS.length - 1)];
          const nextAttemptAt = new Date(Date.now() + delayMs);
          await strapi.documents(deliveryUid).update({
            documentId: delivery2.documentId,
            data: {
              status: "failed",
              attemptCount,
              nextAttemptAt: nextAttemptAt.toISOString(),
              lastError: error.message || String(error)
            }
          });
          strapi.log.warn(
            `[agent-bus] Delivery ${delivery2.documentId} failed (attempt ${attemptCount}/${MAX_ATTEMPTS}): ${error.message}`
          );
        }
      }
    } catch (error) {
      strapi.log.error("[agent-bus] Outbox worker error:", error);
    }
  };
  const intervalId = setInterval(processOutbox, intervalMs);
  strapi.log.info("[agent-bus] Outbox worker started");
  return intervalId;
};
const startExpiryWorker = (strapi) => {
  const intervalMs = 3e4;
  const processExpiry = async () => {
    try {
      const messageUid = getUid("message");
      const approvalUid = getUid("approval");
      const now = (/* @__PURE__ */ new Date()).toISOString();
      const claimedMessages = await strapi.documents(messageUid).findMany({
        filters: {
          status: { $in: ["claimed", "in_progress"] },
          claimedUntil: { $lt: now }
        },
        limit: 50
      });
      for (const msg of claimedMessages) {
        const newStatus = msg.status === "claimed" ? "notified" : "queued";
        await strapi.documents(messageUid).update({
          documentId: msg.documentId,
          data: {
            status: newStatus,
            claimedBy: null,
            claimedUntil: null
          }
        });
        const busService = strapi.plugin("agent-bus").service("bus");
        await busService.audit({
          action: "lease.expired",
          entityType: "message",
          entityDocumentId: msg.documentId,
          metadata: { oldStatus: msg.status, newStatus }
        });
      }
      const expiredMessages = await strapi.documents(messageUid).findMany({
        filters: {
          expiresAt: { $lt: now },
          status: { $notIn: ["expired", "completed", "answered", "cancelled", "declined"] }
        },
        limit: 50
      });
      for (const msg of expiredMessages) {
        await strapi.documents(messageUid).update({
          documentId: msg.documentId,
          data: { status: "expired" }
        });
        const busService = strapi.plugin("agent-bus").service("bus");
        await busService.audit({
          action: "message.expired",
          entityType: "message",
          entityDocumentId: msg.documentId,
          metadata: { expiresAt: msg.expiresAt }
        });
      }
      const scheduledApprovals = await strapi.documents(approvalUid).findMany({
        filters: {
          status: { $eq: "pending" },
          vetoUntil: { $lt: now }
        },
        populate: {
          message: { fields: ["documentId", "status"] }
        },
        limit: 20
      });
      for (const approval2 of scheduledApprovals) {
        const message2 = approval2.message;
        await strapi.documents(approvalUid).update({
          documentId: approval2.documentId,
          data: {
            status: "auto_approved",
            decidedAt: now,
            decidedByLabel: "system",
            reason: "Veto window elapsed without intervention"
          }
        });
        if (message2 && message2.status === "scheduled") {
          await strapi.documents(messageUid).update({
            documentId: message2.documentId,
            data: { status: "completed" }
          });
        }
        const busService = strapi.plugin("agent-bus").service("bus");
        await busService.audit({
          action: "approval.auto_complete",
          entityType: "approval",
          entityDocumentId: approval2.documentId,
          metadata: {
            messageId: message2.documentId,
            vetoUntil: approval2.vetoUntil
          }
        });
      }
    } catch (error) {
      strapi.log.error("[agent-bus] Expiry worker error:", error);
    }
  };
  const intervalId = setInterval(processExpiry, intervalMs);
  strapi.log.info("[agent-bus] Expiry worker started");
  return intervalId;
};
const bootstrap = async ({ strapi }) => {
  const agentUid = getUid("agent");
  const existing = await strapi.documents(agentUid).findMany({
    filters: { slug: { $eq: "chief" } }
  });
  if (!existing || existing.length === 0) {
    await strapi.documents(agentUid).create({
      data: {
        name: "Chief of Staff",
        slug: "chief",
        kind: "orchestrator",
        description: "Paul's Chief of Staff. Default inbox and manager. Delegates work, checks proof, escalates to Paul.",
        capabilities: [],
        status: "active",
        permissionPack: "orchestrator"
      }
    });
    strapi.log.info("[agent-bus] Seeded chief agent");
  } else {
    strapi.log.debug("[agent-bus] Chief agent already exists");
  }
  const config2 = strapi.config.get("plugin.agent-bus") || {};
  const finalConfig = {
    ...{ vetoWindowMinutes: 60, leaseMinutes: 15, allowInsecureWebhooks: false },
    ...config2
  };
  startOutboxWorker(strapi, finalConfig);
  startExpiryWorker(strapi);
  if (strapi.ai?.mcp?.isEnabled()) {
    const { registerMcpTools } = await Promise.resolve().then(() => require("./mcp-CcsA8n6B.js"));
    registerMcpTools(strapi);
  } else {
    strapi.log.info("[agent-bus] MCP is not enabled, skipping MCP tool registration");
  }
  strapi.log.info("[agent-bus] Bootstrap complete");
};
const kind$6 = "collectionType";
const collectionName$6 = "agent_bus_agents";
const info$6 = {
  singularName: "agent",
  pluralName: "agents",
  displayName: "Agent",
  description: "Registered agents that can send and receive messages on the bus"
};
const options$6 = {
  draftAndPublish: false
};
const pluginOptions$6 = {
  "content-manager": {
    visible: true
  },
  "content-api": {
    visible: false
  }
};
const attributes$6 = {
  name: {
    type: "string",
    required: true
  },
  slug: {
    type: "uid",
    targetField: "name",
    required: true
  },
  kind: {
    type: "enumeration",
    "enum": [
      "orchestrator",
      "specialist",
      "human",
      "app"
    ],
    "default": "specialist"
  },
  description: {
    type: "text"
  },
  capabilities: {
    type: "json",
    "default": []
  },
  webhookUrl: {
    type: "string"
  },
  webhookSecret: {
    type: "string",
    "private": true
  },
  webhookMode: {
    type: "enumeration",
    "enum": [
      "reference",
      "full"
    ],
    "default": "reference"
  },
  webhookTimeoutMs: {
    type: "integer",
    "default": 5e3,
    min: 1e3,
    max: 15e3
  },
  status: {
    type: "enumeration",
    "enum": [
      "active",
      "disabled"
    ],
    "default": "active"
  },
  permissionPack: {
    type: "enumeration",
    "enum": [
      "asker",
      "specialist",
      "orchestrator",
      "custom"
    ],
    "default": "asker"
  },
  rateLimitPerMinute: {
    type: "integer",
    "default": 30
  },
  rateLimitPerDay: {
    type: "integer",
    "default": 500
  },
  maxTurnsPerThread: {
    type: "integer",
    "default": 8
  },
  lastSeenAt: {
    type: "datetime"
  },
  notes: {
    type: "text"
  },
  credentials: {
    type: "relation",
    relation: "oneToMany",
    target: "plugin::agent-bus.agent-credential",
    mappedBy: "agent"
  },
  threads: {
    type: "relation",
    relation: "manyToMany",
    target: "plugin::agent-bus.thread",
    mappedBy: "participants"
  }
};
const schema$6 = {
  kind: kind$6,
  collectionName: collectionName$6,
  info: info$6,
  options: options$6,
  pluginOptions: pluginOptions$6,
  attributes: attributes$6
};
const agent = {
  schema: schema$6
};
const kind$5 = "collectionType";
const collectionName$5 = "agent_bus_credentials";
const info$5 = {
  singularName: "agent-credential",
  pluralName: "agent-credentials",
  displayName: "Agent Credential",
  description: "Binds a Strapi token to exactly one agent"
};
const options$5 = {
  draftAndPublish: false
};
const pluginOptions$5 = {
  "content-manager": {
    visible: true
  },
  "content-api": {
    visible: false
  }
};
const attributes$5 = {
  agent: {
    type: "relation",
    relation: "manyToOne",
    target: "plugin::agent-bus.agent",
    inversedBy: "credentials",
    required: true
  },
  kind: {
    type: "enumeration",
    "enum": [
      "content-api",
      "admin"
    ],
    required: true
  },
  tokenId: {
    type: "string",
    required: true
  },
  tokenName: {
    type: "string"
  },
  status: {
    type: "enumeration",
    "enum": [
      "active",
      "revoked"
    ],
    "default": "active"
  },
  lastUsedAt: {
    type: "datetime"
  }
};
const schema$5 = {
  kind: kind$5,
  collectionName: collectionName$5,
  info: info$5,
  options: options$5,
  pluginOptions: pluginOptions$5,
  attributes: attributes$5
};
const agentCredential = {
  schema: schema$5
};
const kind$4 = "collectionType";
const collectionName$4 = "agent_bus_threads";
const info$4 = {
  singularName: "thread",
  pluralName: "threads",
  displayName: "Thread",
  description: "Message threads between agents"
};
const options$4 = {
  draftAndPublish: false
};
const pluginOptions$4 = {
  "content-manager": {
    visible: true
  },
  "content-api": {
    visible: false
  }
};
const attributes$4 = {
  subject: {
    type: "string",
    required: true
  },
  status: {
    type: "enumeration",
    "enum": [
      "open",
      "waiting",
      "closed"
    ],
    "default": "open"
  },
  originAgent: {
    type: "relation",
    relation: "manyToOne",
    target: "plugin::agent-bus.agent",
    required: true
  },
  participants: {
    type: "relation",
    relation: "manyToMany",
    target: "plugin::agent-bus.agent",
    inversedBy: "threads"
  },
  turnCount: {
    type: "integer",
    "default": 0
  },
  maxTurns: {
    type: "integer",
    "default": 8
  },
  correlationId: {
    type: "string"
  },
  externalRefs: {
    type: "json",
    "default": []
  },
  lastMessageAt: {
    type: "datetime"
  },
  messages: {
    type: "relation",
    relation: "oneToMany",
    target: "plugin::agent-bus.message",
    mappedBy: "thread"
  }
};
const schema$4 = {
  kind: kind$4,
  collectionName: collectionName$4,
  info: info$4,
  options: options$4,
  pluginOptions: pluginOptions$4,
  attributes: attributes$4
};
const thread = {
  schema: schema$4
};
const kind$3 = "collectionType";
const collectionName$3 = "agent_bus_messages";
const info$3 = {
  singularName: "message",
  pluralName: "messages",
  displayName: "Message",
  description: "Messages sent between agents on the bus"
};
const options$3 = {
  draftAndPublish: false
};
const pluginOptions$3 = {
  "content-manager": {
    visible: true
  },
  "content-api": {
    visible: false
  }
};
const attributes$3 = {
  thread: {
    type: "relation",
    relation: "manyToOne",
    target: "plugin::agent-bus.thread",
    inversedBy: "messages",
    required: true
  },
  from: {
    type: "relation",
    relation: "manyToOne",
    target: "plugin::agent-bus.agent",
    required: true
  },
  to: {
    type: "relation",
    relation: "manyToOne",
    target: "plugin::agent-bus.agent",
    required: true
  },
  parent: {
    type: "relation",
    relation: "oneToOne",
    target: "plugin::agent-bus.message"
  },
  type: {
    type: "enumeration",
    "enum": [
      "question",
      "task",
      "status",
      "proof",
      "result",
      "reply",
      "escalation",
      "notice"
    ],
    required: true
  },
  body: {
    type: "text",
    required: true,
    maxLength: 2e4
  },
  payload: {
    type: "json",
    "default": {}
  },
  status: {
    type: "enumeration",
    "enum": [
      "queued",
      "notified",
      "claimed",
      "in_progress",
      "waiting_info",
      "waiting_approval",
      "scheduled",
      "answered",
      "completed",
      "declined",
      "vetoed",
      "expired",
      "cancelled",
      "dead_letter"
    ],
    "default": "queued"
  },
  priority: {
    type: "enumeration",
    "enum": [
      "P0",
      "P1",
      "P2",
      "P3"
    ],
    "default": "P2"
  },
  blastRadius: {
    type: "enumeration",
    "enum": [
      "green",
      "yellow",
      "red"
    ],
    "default": "green"
  },
  reviewLevel: {
    type: "enumeration",
    "enum": [
      "auto",
      "ai",
      "human"
    ]
  },
  riskClass: {
    type: "enumeration",
    "enum": [
      "none",
      "data_write",
      "external_message",
      "payment",
      "delete",
      "credentials"
    ],
    "default": "none"
  },
  acceptanceCriteria: {
    type: "text"
  },
  proof: {
    type: "text"
  },
  idempotencyKey: {
    type: "string"
  },
  correlationId: {
    type: "string"
  },
  expiresAt: {
    type: "datetime"
  },
  claimedBy: {
    type: "relation",
    relation: "manyToOne",
    target: "plugin::agent-bus.agent"
  },
  claimedUntil: {
    type: "datetime"
  },
  untrusted: {
    type: "boolean",
    "default": true
  },
  flagged: {
    type: "boolean",
    "default": false
  },
  flagReason: {
    type: "string"
  },
  sourceLabel: {
    type: "string"
  }
};
const schema$3 = {
  kind: kind$3,
  collectionName: collectionName$3,
  info: info$3,
  options: options$3,
  pluginOptions: pluginOptions$3,
  attributes: attributes$3
};
const message = {
  schema: schema$3
};
const kind$2 = "collectionType";
const collectionName$2 = "agent_bus_approvals";
const info$2 = {
  singularName: "approval",
  pluralName: "approvals",
  displayName: "Approval",
  description: "Approval records for messages requiring review"
};
const options$2 = {
  draftAndPublish: false
};
const pluginOptions$2 = {
  "content-manager": {
    visible: true
  },
  "content-api": {
    visible: false
  }
};
const attributes$2 = {
  message: {
    type: "relation",
    relation: "manyToOne",
    target: "plugin::agent-bus.message",
    required: true
  },
  thread: {
    type: "relation",
    relation: "manyToOne",
    target: "plugin::agent-bus.thread",
    required: true
  },
  status: {
    type: "enumeration",
    "enum": [
      "pending",
      "approved",
      "rejected",
      "auto_approved",
      "vetoed",
      "expired"
    ],
    "default": "pending"
  },
  reviewLevel: {
    type: "enumeration",
    "enum": [
      "auto",
      "ai",
      "human"
    ],
    required: true
  },
  vetoUntil: {
    type: "datetime"
  },
  decidedAt: {
    type: "datetime"
  },
  decidedByAgent: {
    type: "relation",
    relation: "manyToOne",
    target: "plugin::agent-bus.agent"
  },
  decidedByLabel: {
    type: "string"
  },
  reason: {
    type: "text"
  }
};
const schema$2 = {
  kind: kind$2,
  collectionName: collectionName$2,
  info: info$2,
  options: options$2,
  pluginOptions: pluginOptions$2,
  attributes: attributes$2
};
const approval = {
  schema: schema$2
};
const kind$1 = "collectionType";
const collectionName$1 = "agent_bus_deliveries";
const info$1 = {
  singularName: "delivery",
  pluralName: "deliveries",
  displayName: "Delivery",
  description: "Durable webhook outbox for agent wake-up calls"
};
const options$1 = {
  draftAndPublish: false
};
const pluginOptions$1 = {
  "content-manager": {
    visible: true
  },
  "content-api": {
    visible: false
  }
};
const attributes$1 = {
  message: {
    type: "relation",
    relation: "manyToOne",
    target: "plugin::agent-bus.message",
    required: true
  },
  agent: {
    type: "relation",
    relation: "manyToOne",
    target: "plugin::agent-bus.agent",
    required: true
  },
  event: {
    type: "string",
    required: true
  },
  url: {
    type: "string",
    required: true
  },
  status: {
    type: "enumeration",
    "enum": [
      "pending",
      "delivered",
      "failed",
      "exhausted",
      "skipped"
    ],
    "default": "pending"
  },
  attemptCount: {
    type: "integer",
    "default": 0
  },
  nextAttemptAt: {
    type: "datetime"
  },
  lastError: {
    type: "text"
  },
  lastStatusCode: {
    type: "integer"
  },
  idempotencyKey: {
    type: "string",
    required: true
  },
  deliveredAt: {
    type: "datetime"
  }
};
const schema$1 = {
  kind: kind$1,
  collectionName: collectionName$1,
  info: info$1,
  options: options$1,
  pluginOptions: pluginOptions$1,
  attributes: attributes$1
};
const delivery = {
  schema: schema$1
};
const kind = "collectionType";
const collectionName = "agent_bus_audit_events";
const info = {
  singularName: "audit-event",
  pluralName: "audit-events",
  displayName: "Audit Event",
  description: "Audit trail for agent-bus actions and state changes"
};
const options = {
  draftAndPublish: false
};
const pluginOptions = {
  "content-manager": {
    visible: true
  },
  "content-api": {
    visible: false
  }
};
const attributes = {
  at: {
    type: "datetime",
    required: true
  },
  action: {
    type: "string",
    required: true
  },
  actorAgent: {
    type: "relation",
    relation: "manyToOne",
    target: "plugin::agent-bus.agent"
  },
  actorLabel: {
    type: "string"
  },
  entityType: {
    type: "string"
  },
  entityDocumentId: {
    type: "string"
  },
  requestId: {
    type: "string"
  },
  metadata: {
    type: "json",
    "default": {}
  }
};
const schema = {
  kind,
  collectionName,
  info,
  options,
  pluginOptions,
  attributes
};
const auditEvent = {
  schema
};
const contentTypes = {
  agent,
  "agent-credential": agentCredential,
  thread,
  message,
  approval,
  delivery,
  "audit-event": auditEvent
};
const resolveCaller = async (strapi, ctxOrContext) => {
  let tokenId;
  let kind2;
  if (ctxOrContext?.state?.auth) {
    const auth2 = ctxOrContext.state.auth;
    if (auth2.apiToken) {
      tokenId = auth2.apiToken.id;
      kind2 = "content-api";
    }
  }
  if (!tokenId && ctxOrContext?.auth) {
    const auth2 = ctxOrContext.auth;
    if (auth2.type === "token" && auth2.token?.id) {
      tokenId = auth2.token.id;
      kind2 = "admin";
    }
  }
  if (!tokenId || !kind2) {
    throw new Error("No valid token found in request context");
  }
  const credentialUid = getUid("agent-credential");
  const agentUid = getUid("agent");
  const credentials = await strapi.documents(credentialUid).findMany({
    filters: {
      tokenId: { $eq: tokenId },
      kind: { $eq: kind2 },
      status: { $eq: "active" }
    },
    populate: {
      agent: {
        fields: ["documentId", "slug", "status"]
      }
    }
  });
  if (!credentials || credentials.length === 0) {
    throw new Error("No active credential binding found for this token");
  }
  const credential = credentials[0];
  const agent2 = credential.agent;
  if (!agent2 || agent2.status !== "active") {
    throw new Error("Agent is not active or binding is invalid");
  }
  await strapi.documents(credentialUid).update({
    documentId: credential.documentId,
    data: {
      lastUsedAt: (/* @__PURE__ */ new Date()).toISOString()
    }
  });
  await strapi.documents(agentUid).update({
    documentId: agent2.documentId,
    data: {
      lastSeenAt: (/* @__PURE__ */ new Date()).toISOString()
    }
  });
  return {
    agentDocumentId: agent2.documentId,
    agentSlug: agent2.slug,
    credentialId: credential.documentId,
    credentialKind: kind2
  };
};
const auth = () => ({
  resolveCaller
});
const SUSPICIOUS_PATTERNS = [
  /ignore\s+(previous|all|the)\s+instructions?/i,
  /disregard\s+(previous|all|the)\s+instructions?/i,
  /forget\s+(previous|all|the)\s+instructions?/i,
  /system\s*:\s*you\s+are/i,
  /new\s+instructions?:/i,
  /\[INST\]/i,
  /\[\/INST\]/i,
  /<\|system\|>/i,
  /<\|user\|>/i,
  /<\|assistant\|>/i,
  /assistant\s*:\s*certainly/i,
  /override\s+your\s+instructions?/i,
  /reveal\s+(your\s+)?(instructions?|prompt|system\s+message)/i,
  /what\s+(are|were)\s+your\s+original\s+instructions?/i
];
const scanForInjection = (text) => {
  if (!text || typeof text !== "string") {
    return { flagged: false };
  }
  for (const pattern of SUSPICIOUS_PATTERNS) {
    if (pattern.test(text)) {
      return {
        flagged: true,
        reason: `Suspicious pattern detected: ${pattern.source}`
      };
    }
  }
  return { flagged: false };
};
const bus$1 = ({ strapi }) => ({
  /**
   * Send a message
   */
  async sendMessage(caller, input) {
    const messageUid = getUid("message");
    const threadUid = getUid("thread");
    const agentUid = getUid("agent");
    if (input.type === "task" && !input.acceptanceCriteria) {
      throw new Error("acceptanceCriteria is required for task messages");
    }
    if (input.body.length > 2e4) {
      throw new Error("Message body exceeds 20,000 character limit");
    }
    if (input.payload && JSON.stringify(input.payload).length > 32768) {
      throw new Error("Payload exceeds 32KB limit");
    }
    if (input.idempotencyKey) {
      const existing = await strapi.documents(messageUid).findMany({
        filters: {
          idempotencyKey: { $eq: input.idempotencyKey },
          from: { documentId: { $eq: caller.agentDocumentId } }
        },
        limit: 1
      });
      if (existing && existing.length > 0) {
        const msg = existing[0];
        return {
          messageId: msg.documentId,
          threadId: msg.thread?.documentId || "",
          status: msg.status,
          duplicate: true
        };
      }
    }
    const toSlugOrId = input.to || "chief";
    const toAgents = await strapi.documents(agentUid).findMany({
      filters: {
        $or: [
          { slug: { $eq: toSlugOrId } },
          { documentId: { $eq: toSlugOrId } }
        ],
        status: { $eq: "active" }
      },
      limit: 1
    });
    if (!toAgents || toAgents.length === 0) {
      throw new Error(`Agent '${toSlugOrId}' not found or not active`);
    }
    const toAgent = toAgents[0];
    await this.checkRateLimits(caller.agentDocumentId);
    const scanResult = scanForInjection(input.body);
    let blastRadius = input.blastRadius || "green";
    let reviewLevel = input.blastRadius === "red" ? "human" : void 0;
    const forcedRedRisks = ["payment", "delete", "external_message", "credentials"];
    if (input.riskClass && forcedRedRisks.includes(input.riskClass)) {
      blastRadius = "red";
      reviewLevel = "human";
    }
    let thread2;
    if (input.threadId) {
      const threads = await strapi.documents(threadUid).findMany({
        filters: { documentId: { $eq: input.threadId } },
        populate: { participants: true }
      });
      if (!threads || threads.length === 0) {
        throw new Error("Thread not found");
      }
      thread2 = threads[0];
      const participantIds = thread2.participants?.map((p) => p.documentId) || [];
      if (!participantIds.includes(caller.agentDocumentId)) {
        throw new Error("Not authorized to post in this thread");
      }
      if (thread2.turnCount >= thread2.maxTurns) {
        throw new Error("Thread turn limit exceeded");
      }
      await strapi.documents(threadUid).update({
        documentId: thread2.documentId,
        data: {
          turnCount: thread2.turnCount + 1,
          lastMessageAt: (/* @__PURE__ */ new Date()).toISOString()
        }
      });
    } else {
      const subject = input.subject || input.body.substring(0, 80).replace(/\n/g, " ");
      thread2 = await strapi.documents(threadUid).create({
        data: {
          subject,
          status: "open",
          originAgent: { connect: [{ documentId: caller.agentDocumentId }] },
          participants: {
            connect: [
              { documentId: caller.agentDocumentId },
              { documentId: toAgent.documentId }
            ]
          },
          turnCount: 1,
          correlationId: input.correlationId,
          externalRefs: input.externalRefs || [],
          lastMessageAt: (/* @__PURE__ */ new Date()).toISOString()
        }
      });
    }
    const callerAgents = await strapi.documents(agentUid).findMany({
      filters: { documentId: { $eq: caller.agentDocumentId } },
      fields: ["slug"]
    });
    const callerSlug = callerAgents[0]?.slug || "unknown";
    const message2 = await strapi.documents(messageUid).create({
      data: {
        thread: { connect: [{ documentId: thread2.documentId }] },
        from: { connect: [{ documentId: caller.agentDocumentId }] },
        to: { connect: [{ documentId: toAgent.documentId }] },
        parent: input.parentId ? { connect: [{ documentId: input.parentId }] } : void 0,
        type: input.type,
        body: input.body,
        payload: input.payload || {},
        status: "queued",
        priority: input.priority || "P2",
        blastRadius,
        reviewLevel,
        riskClass: input.riskClass || "none",
        acceptanceCriteria: input.acceptanceCriteria,
        idempotencyKey: input.idempotencyKey,
        correlationId: input.correlationId || thread2.correlationId,
        expiresAt: input.expiresAt,
        untrusted: true,
        flagged: scanResult.flagged,
        flagReason: scanResult.reason,
        sourceLabel: callerSlug
      }
    });
    await this.audit({
      action: "message.send",
      actorAgent: caller.agentDocumentId,
      actorLabel: callerSlug,
      entityType: "message",
      entityDocumentId: message2.documentId,
      metadata: {
        type: input.type,
        to: toAgent.slug,
        threadId: thread2.documentId,
        blastRadius,
        flagged: scanResult.flagged
      }
    });
    await this.enqueueDelivery(message2.documentId, toAgent.documentId, "message.queued");
    return {
      messageId: message2.documentId,
      threadId: thread2.documentId,
      status: "queued"
    };
  },
  /**
   * Check rate limits for an agent
   */
  async checkRateLimits(agentDocumentId) {
    const agentUid = getUid("agent");
    const auditUid = getUid("audit-event");
    const agents = await strapi.documents(agentUid).findMany({
      filters: { documentId: { $eq: agentDocumentId } },
      fields: ["rateLimitPerMinute", "rateLimitPerDay"]
    });
    if (!agents || agents.length === 0) {
      throw new Error("Agent not found");
    }
    const agent2 = agents[0];
    const now = /* @__PURE__ */ new Date();
    const oneMinuteAgo = new Date(now.getTime() - 60 * 1e3);
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1e3);
    const recentMinute = await strapi.documents(auditUid).findMany({
      filters: {
        actorAgent: { documentId: { $eq: agentDocumentId } },
        action: { $in: ["message.send", "message.claim", "message.reply"] },
        at: { $gte: oneMinuteAgo.toISOString() }
      }
    });
    const recentDay = await strapi.documents(auditUid).findMany({
      filters: {
        actorAgent: { documentId: { $eq: agentDocumentId } },
        action: { $in: ["message.send", "message.claim", "message.reply"] },
        at: { $gte: oneDayAgo.toISOString() }
      }
    });
    if (recentMinute.length >= agent2.rateLimitPerMinute) {
      await this.audit({
        action: "rate_limit",
        actorAgent: agentDocumentId,
        entityType: "agent",
        entityDocumentId: agentDocumentId,
        metadata: { window: "minute", limit: agent2.rateLimitPerMinute }
      });
      throw new Error("Rate limit exceeded (per minute)");
    }
    if (recentDay.length >= agent2.rateLimitPerDay) {
      await this.audit({
        action: "rate_limit",
        actorAgent: agentDocumentId,
        entityType: "agent",
        entityDocumentId: agentDocumentId,
        metadata: { window: "day", limit: agent2.rateLimitPerDay }
      });
      throw new Error("Rate limit exceeded (per day)");
    }
  },
  /**
   * Enqueue a webhook delivery
   */
  async enqueueDelivery(messageDocumentId, agentDocumentId, event) {
    const agentUid = getUid("agent");
    const deliveryUid = getUid("delivery");
    const agents = await strapi.documents(agentUid).findMany({
      filters: { documentId: { $eq: agentDocumentId } },
      fields: ["webhookUrl", "status", "slug"]
    });
    if (!agents || agents.length === 0) {
      return;
    }
    const agent2 = agents[0];
    if (agent2.status !== "active" || !agent2.webhookUrl) {
      return;
    }
    const idempotencyKey = `${event}:${messageDocumentId}:${agent2.slug}`;
    const existing = await strapi.documents(deliveryUid).findMany({
      filters: { idempotencyKey: { $eq: idempotencyKey } },
      limit: 1
    });
    if (existing && existing.length > 0) {
      return;
    }
    await strapi.documents(deliveryUid).create({
      data: {
        message: { connect: [{ documentId: messageDocumentId }] },
        agent: { connect: [{ documentId: agentDocumentId }] },
        event,
        url: agent2.webhookUrl,
        status: "pending",
        attemptCount: 0,
        nextAttemptAt: (/* @__PURE__ */ new Date()).toISOString(),
        idempotencyKey
      }
    });
  },
  /**
   * Audit an action
   */
  async audit(data) {
    const auditUid = getUid("audit-event");
    await strapi.documents(auditUid).create({
      data: {
        at: (/* @__PURE__ */ new Date()).toISOString(),
        action: data.action,
        actorAgent: data.actorAgent ? { connect: [{ documentId: data.actorAgent }] } : void 0,
        actorLabel: data.actorLabel,
        entityType: data.entityType,
        entityDocumentId: data.entityDocumentId,
        requestId: data.requestId,
        metadata: data.metadata || {}
      }
    });
  },
  /**
   * Get inbox messages for an agent
   */
  async getInbox(caller, options2 = {}) {
    const messageUid = getUid("message");
    const limit = Math.min(options2.limit || 20, 50);
    const filters = {
      to: { documentId: { $eq: caller.agentDocumentId } }
    };
    const openStatuses = [
      "queued",
      "notified",
      "claimed",
      "in_progress",
      "waiting_info",
      "waiting_approval",
      "scheduled"
    ];
    if (options2.statuses && options2.statuses.length > 0) {
      filters.status = { $in: options2.statuses };
    } else {
      filters.status = { $in: openStatuses };
    }
    if (options2.priority) {
      filters.priority = { $eq: options2.priority };
    }
    const messages = await strapi.documents(messageUid).findMany({
      filters,
      populate: {
        from: { fields: ["slug", "name"] },
        to: { fields: ["slug", "name"] },
        thread: { fields: ["subject", "documentId"] }
      },
      limit,
      sort: ["priority:asc", "createdAt:asc"]
    });
    const summaries = messages.map((msg) => ({
      messageId: msg.documentId,
      threadId: msg.thread?.documentId,
      subject: msg.thread?.subject,
      type: msg.type,
      from: msg.from?.slug,
      priority: msg.priority,
      blastRadius: msg.blastRadius,
      flagged: msg.flagged,
      status: msg.status,
      createdAt: msg.createdAt,
      ...options2.includeBody ? { body: msg.body, untrusted: msg.untrusted } : {}
    }));
    const unreadCount = await strapi.documents(messageUid).count({
      filters: {
        to: { documentId: { $eq: caller.agentDocumentId } },
        status: { $in: openStatuses }
      }
    });
    return {
      messages: summaries,
      unreadCount
    };
  },
  /**
   * Claim a message
   */
  async claimMessage(caller, messageId, leaseMinutes = 15) {
    const messageUid = getUid("message");
    const messages = await strapi.documents(messageUid).findMany({
      filters: { documentId: { $eq: messageId } },
      populate: { to: true, claimedBy: true }
    });
    if (!messages || messages.length === 0) {
      throw new Error("Message not found");
    }
    const message2 = messages[0];
    if (message2.to?.documentId !== caller.agentDocumentId) {
      throw new Error("Not authorized to claim this message");
    }
    const claimableStatuses = ["queued", "notified", "claimed"];
    if (!claimableStatuses.includes(message2.status)) {
      throw new Error(`Message cannot be claimed (status: ${message2.status})`);
    }
    const claimedUntil = new Date(Date.now() + leaseMinutes * 60 * 1e3);
    await strapi.documents(messageUid).update({
      documentId: messageId,
      data: {
        status: "claimed",
        claimedBy: { connect: [{ documentId: caller.agentDocumentId }] },
        claimedUntil: claimedUntil.toISOString()
      }
    });
    await this.audit({
      action: "message.claim",
      actorAgent: caller.agentDocumentId,
      actorLabel: caller.agentSlug,
      entityType: "message",
      entityDocumentId: messageId,
      metadata: { leaseMinutes }
    });
    return {
      messageId,
      status: "claimed",
      claimedUntil: claimedUntil.toISOString()
    };
  }
});
const services = {
  auth,
  bus: bus$1
};
const routes = {
  "content-api": {
    type: "content-api",
    routes: [
      {
        method: "POST",
        path: "/v1/messages",
        handler: "bus.sendMessage",
        config: {
          auth: true
        }
      },
      {
        method: "GET",
        path: "/v1/inbox",
        handler: "bus.getInbox",
        config: {
          auth: true
        }
      },
      {
        method: "POST",
        path: "/v1/messages/:id/claim",
        handler: "bus.claimMessage",
        config: {
          auth: true
        }
      }
    ]
  }
};
const bus = ({ strapi }) => ({
  /**
   * POST /api/agent-bus/v1/messages
   */
  async sendMessage(ctx) {
    try {
      const authService = strapi.plugin("agent-bus").service("auth");
      const busService = strapi.plugin("agent-bus").service("bus");
      const caller = await authService.resolveCaller(strapi, ctx);
      const result = await busService.sendMessage(caller, ctx.request.body);
      ctx.status = 202;
      ctx.body = result;
    } catch (error) {
      ctx.status = error.message.includes("not found") || error.message.includes("not authorized") ? 404 : 400;
      ctx.body = { error: error.message };
    }
  },
  /**
   * GET /api/agent-bus/v1/inbox
   */
  async getInbox(ctx) {
    try {
      const authService = strapi.plugin("agent-bus").service("auth");
      const busService = strapi.plugin("agent-bus").service("bus");
      const caller = await authService.resolveCaller(strapi, ctx);
      const options2 = {
        statuses: ctx.query.statuses ? ctx.query.statuses.split(",") : void 0,
        priority: ctx.query.priority,
        limit: ctx.query.limit ? parseInt(ctx.query.limit, 10) : 20,
        includeBody: ctx.query.includeBody === "true"
      };
      const result = await busService.getInbox(caller, options2);
      ctx.body = result;
    } catch (error) {
      ctx.status = 400;
      ctx.body = { error: error.message };
    }
  },
  /**
   * POST /api/agent-bus/v1/messages/:id/claim
   */
  async claimMessage(ctx) {
    try {
      const authService = strapi.plugin("agent-bus").service("auth");
      const busService = strapi.plugin("agent-bus").service("bus");
      const caller = await authService.resolveCaller(strapi, ctx);
      const config2 = strapi.config.get("plugin.agent-bus") || {};
      const leaseMinutes = config2.leaseMinutes || 15;
      const result = await busService.claimMessage(caller, ctx.params.id, leaseMinutes);
      ctx.body = result;
    } catch (error) {
      ctx.status = error.message.includes("not authorized") ? 404 : 400;
      ctx.body = { error: error.message };
    }
  }
});
const controllers = {
  bus
};
const config = {
  default: {
    vetoWindowMinutes: 60,
    leaseMinutes: 15,
    defaultMaxTurns: 8,
    maxBodyChars: 2e4,
    maxPayloadBytes: 32768,
    webhookMaxAttempts: 5,
    allowInsecureWebhooks: false
  }
};
const index = {
  register,
  bootstrap,
  contentTypes,
  services,
  routes,
  controllers,
  config
};
exports.PLUGIN_NAME = PLUGIN_NAME;
exports.getActionId = getActionId;
exports.getUid = getUid;
exports.index = index;
