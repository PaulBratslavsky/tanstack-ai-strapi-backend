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
          state: { $in: ["pending", "failed"] },
          nextAttemptAt: { $lte: (/* @__PURE__ */ new Date()).toISOString() }
        },
        populate: {
          agent: true,
          message: {
            fields: ["type", "body", "payload", "priority", "blastRadius", "flagged", "state"],
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
        if (agent2.state !== "active" || !agent2.webhookUrl) {
          await strapi.documents(deliveryUid).update({
            documentId: delivery2.documentId,
            data: { state: "skipped" }
          });
          continue;
        }
        if (agent2.webhookUrl.startsWith("http://") && !config2.allowInsecureWebhooks) {
          await strapi.documents(deliveryUid).update({
            documentId: delivery2.documentId,
            data: {
              state: "skipped",
              lastError: "HTTP webhooks not allowed in production"
            }
          });
          continue;
        }
        if (delivery2.attemptCount >= MAX_ATTEMPTS) {
          await strapi.documents(deliveryUid).update({
            documentId: delivery2.documentId,
            data: {
              state: "exhausted",
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
          const headers = {
            "Content-Type": "application/json",
            "User-Agent": "agent-bus/1",
            "X-Agent-Bus-Event": delivery2.event,
            "X-Agent-Bus-Timestamp": timestamp.toString(),
            "X-Agent-Bus-Idempotency-Key": delivery2.idempotencyKey,
            "X-Agent-Bus-Signature": `sha256=${signature}`
          };
          if (agent2.webhookAuthHeader) {
            headers.Authorization = agent2.webhookAuthHeader;
          }
          const response = await fetch(agent2.webhookUrl, {
            method: "POST",
            headers,
            body,
            signal: controller.signal
          });
          clearTimeout(timeoutId);
          if (response.ok) {
            await strapi.documents(deliveryUid).update({
              documentId: delivery2.documentId,
              data: {
                state: "delivered",
                deliveredAt: (/* @__PURE__ */ new Date()).toISOString(),
                lastStatusCode: response.status,
                lastError: null
              }
            });
            if (message2.state === "queued") {
              await strapi.documents(messageUid).update({
                documentId: message2.documentId,
                data: { state: "notified" }
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
                state: "skipped",
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
              state: "failed",
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
          state: { $in: ["claimed", "in_progress"] },
          claimedUntil: { $lt: now }
        },
        limit: 50
      });
      for (const msg of claimedMessages) {
        const newState = msg.state === "claimed" ? "notified" : "queued";
        await strapi.documents(messageUid).update({
          documentId: msg.documentId,
          data: {
            state: newState,
            claimedBy: null,
            claimedUntil: null
          }
        });
        const busService = strapi.plugin("agent-bus").service("bus");
        await busService.audit({
          action: "lease.expired",
          entityType: "message",
          entityDocumentId: msg.documentId,
          metadata: { oldStatus: msg.state, newStatus: newState }
        });
      }
      const expiredMessages = await strapi.documents(messageUid).findMany({
        filters: {
          expiresAt: { $lt: now },
          state: { $notIn: ["expired", "completed", "answered", "cancelled", "declined"] }
        },
        limit: 50
      });
      for (const msg of expiredMessages) {
        await strapi.documents(messageUid).update({
          documentId: msg.documentId,
          data: { state: "expired" }
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
          state: { $eq: "pending" },
          vetoUntil: { $lt: now }
        },
        populate: {
          message: { fields: ["documentId", "state"] }
        },
        limit: 20
      });
      for (const approval2 of scheduledApprovals) {
        const message2 = approval2.message;
        await strapi.documents(approvalUid).update({
          documentId: approval2.documentId,
          data: {
            state: "auto_approved",
            decidedAt: now,
            decidedByLabel: "system",
            reason: "Veto window elapsed without intervention"
          }
        });
        if (message2 && message2.state === "scheduled") {
          await strapi.documents(messageUid).update({
            documentId: message2.documentId,
            data: { state: "completed" }
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
        state: "active",
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
    const { registerMcpTools } = await Promise.resolve().then(() => require("./mcp-B5duIJU9.js"));
    registerMcpTools(strapi);
  } else {
    strapi.log.info("[agent-bus] MCP is not enabled, skipping MCP tool registration");
  }
  const credentialUid = getUid("agent-credential");
  strapi.db.lifecycles.subscribe({
    models: ["admin::api-token"],
    async afterDelete(event) {
      const { result } = event;
      if (!result || !result.id) return;
      const tokenId = String(result.id);
      const credentials = await strapi.documents(credentialUid).findMany({
        filters: { tokenId: { $eq: tokenId }, state: { $eq: "active" } }
      });
      for (const credential of credentials) {
        await strapi.documents(credentialUid).update({
          documentId: credential.documentId,
          data: { state: "revoked", tokenName: "Deleted token" }
        });
      }
      if (credentials.length > 0) {
        strapi.log.info(`[agent-bus] Revoked ${credentials.length} credential(s) for deleted token ${tokenId}`);
      }
    }
  });
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
  webhookAuthHeader: {
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
  state: {
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
    visible: false
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
    required: true,
    unique: true
  },
  tokenName: {
    type: "string"
  },
  state: {
    type: "enumeration",
    "enum": [
      "active",
      "revoked"
    ],
    "default": "active"
  },
  lastUsedAt: {
    type: "datetime"
  },
  mintedByPlugin: {
    type: "boolean",
    "default": false
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
  state: {
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
  state: {
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
  state: {
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
  state: {
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
const extractBearerToken = (authorization) => {
  if (!authorization) {
    return null;
  }
  const parts = authorization.split(/\s+/);
  if (parts[0].toLowerCase() !== "bearer" || parts.length !== 2) {
    return null;
  }
  return parts[1];
};
const resolveCaller = async (strapi, ctxOrExtra) => {
  let tokenId;
  let kind2;
  if (ctxOrExtra?.state?.auth?.credentials) {
    const strategyName = ctxOrExtra.state.auth.strategy?.name;
    if (strategyName !== "content-api-token") {
      throw new Error(
        `Invalid auth strategy for agent-bus: ${strategyName || "unknown"}. Only content-api-token strategy is accepted.`
      );
    }
    tokenId = ctxOrExtra.state.auth.credentials.id;
    kind2 = "content-api";
  } else if (ctxOrExtra?.requestInfo?.headers) {
    const authorization = ctxOrExtra.requestInfo.headers.authorization;
    const token = extractBearerToken(authorization);
    if (!token) {
      throw new Error("No bearer token found in MCP request headers");
    }
    try {
      const authResult = await strapi.admin.services["api-token-admin"].authenticateAdminToken(token);
      if (!authResult.authenticated) {
        throw new Error("Token authentication failed");
      }
      tokenId = authResult.credentials.id;
      kind2 = "admin";
    } catch (error) {
      throw new Error(`Failed to authenticate admin token: ${error.message}`);
    }
  }
  if (tokenId === void 0 || !kind2) {
    throw new Error("No valid token found in request context");
  }
  const tokenIdString = String(tokenId);
  const credentialUid = getUid("agent-credential");
  const agentUid = getUid("agent");
  const credentials = await strapi.documents(credentialUid).findMany({
    filters: {
      tokenId: { $eq: tokenIdString },
      kind: { $eq: kind2 },
      state: { $eq: "active" }
    },
    populate: {
      agent: {
        fields: ["documentId", "slug", "state"]
      }
    }
  });
  if (!credentials || credentials.length === 0) {
    throw new Error("No active credential binding found for this token");
  }
  const credential = credentials[0];
  const agent2 = credential.agent;
  if (!agent2 || agent2.state !== "active") {
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
const RULES = [
  {
    id: "instruction-override",
    severity: "high",
    pattern: /\b(ignore|disregard|forget|override)\b[\s\S]{0,40}?\b(all\s+)?(previous|prior|earlier|above|preceding)\b[\s\S]{0,40}?\b(instruction|prompt|rule|direction|message|context)s?/i
  },
  {
    id: "role-hijack",
    severity: "high",
    pattern: /\b(you are now|from now on,? you|act as an unrestricted|ignore your (?:system|safety)|developer mode|jailbreak)\b/i
  },
  {
    id: "system-tag",
    severity: "high",
    pattern: /<\/?\s*(system|assistant|human|user)\s*>|\[\[?\s*(system|assistant)\s*\]?\]/i
  },
  {
    id: "tool-coercion",
    severity: "high",
    pattern: /\b(call|invoke|execute|run|use)\b[\s\S]{0,30}?\b(tool|function|api)\b[\s\S]{0,40}?\b(delete|destroy|publish|unpublish|update|create|drop)\b/i
  },
  {
    id: "exfiltration-url",
    severity: "high",
    pattern: /!?\[[^\]]{0,80}\]\(\s*https?:\/\/[^\s)]{0,200}[?&][^\s)]{0,200}=/i
  },
  {
    id: "secret-fishing",
    severity: "medium",
    pattern: /\b(api[\s_-]?key|access[\s_-]?token|secret[\s_-]?key|password|\.env\b|environment variable)/i
  },
  {
    id: "hidden-html-comment",
    severity: "medium",
    pattern: /<!--[\s\S]{0,500}?-->/
  }
];
const normalizeForMatching = (text) => text.replace(/\\u[0-9a-fA-F]{4}/g, "      ").replace(/\\x[0-9a-fA-F]{2}/g, "    ").replace(/\\[nrtbfv"'\\/]/g, "  ");
const scanForInjection = (text) => {
  if (!text || typeof text !== "string") {
    return { flagged: false };
  }
  const probe = normalizeForMatching(text);
  const findings = [];
  for (const rule of RULES) {
    if (rule.pattern.test(probe)) {
      findings.push({ rule: rule.id, severity: rule.severity });
    }
  }
  if (findings.length > 0) {
    const highSeverity = findings.filter((f) => f.severity === "high");
    const rules = findings.map((f) => f.rule).join(", ");
    return {
      flagged: true,
      reason: highSeverity.length > 0 ? `High-severity injection patterns detected: ${rules}` : `Injection patterns detected: ${rules}`
    };
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
          status: msg.state,
          // Map state to status for external API
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
        state: { $eq: "active" }
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
          state: "open",
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
        state: "queued",
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
      fields: ["webhookUrl", "state", "slug"]
    });
    if (!agents || agents.length === 0) {
      return;
    }
    const agent2 = agents[0];
    if (agent2.state !== "active" || !agent2.webhookUrl) {
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
        state: "pending",
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
      filters.state = { $in: options2.statuses };
    } else {
      filters.state = { $in: openStatuses };
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
      status: msg.state,
      // Map state to status for external API
      createdAt: msg.createdAt,
      ...options2.includeBody ? { body: msg.body, untrusted: msg.untrusted } : {}
    }));
    const unreadCount = await strapi.documents(messageUid).count({
      filters: {
        to: { documentId: { $eq: caller.agentDocumentId } },
        state: { $in: openStatuses }
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
    if (!claimableStatuses.includes(message2.state)) {
      throw new Error(`Message cannot be claimed (status: ${message2.state})`);
    }
    const claimedUntil = new Date(Date.now() + leaseMinutes * 60 * 1e3);
    await strapi.documents(messageUid).update({
      documentId: messageId,
      data: {
        state: "claimed",
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
      // External API uses status
      claimedUntil: claimedUntil.toISOString()
    };
  }
});
const services = {
  auth,
  bus: bus$1
};
const MANAGE_ACTION = "plugin::agent-bus.agent.manage";
const adminRoute = (method, path, handler) => ({
  method,
  path,
  handler,
  config: {
    policies: ["admin::isAuthenticatedAdmin", { name: "admin::hasPermissions", config: { actions: [MANAGE_ACTION] } }]
  }
});
const adminRoutes = [
  adminRoute("GET", "/admin/agents", "admin.listAgents"),
  adminRoute("POST", "/admin/agents", "admin.createAgent"),
  adminRoute("GET", "/admin/agents/:documentId", "admin.getAgent"),
  adminRoute("PUT", "/admin/agents/:documentId", "admin.updateAgent"),
  adminRoute("DELETE", "/admin/agents/:documentId", "admin.deleteAgent"),
  adminRoute("POST", "/admin/agents/:documentId/bind", "admin.bindToken"),
  adminRoute("POST", "/admin/agents/:documentId/mint", "admin.mintToken"),
  adminRoute("DELETE", "/admin/agents/:documentId/credentials/:credentialId", "admin.revokeCredential"),
  adminRoute("GET", "/admin/tokens", "admin.listTokens")
];
const routes = {
  admin: {
    type: "admin",
    routes: adminRoutes
  },
  "content-api": {
    type: "content-api",
    routes: [
      // Agents
      {
        method: "GET",
        path: "/v1/agents",
        handler: "bus.listAgents",
        config: {
          auth: {
            scope: ["plugin::agent-bus.bus.listAgents"]
          }
        }
      },
      // Messages
      {
        method: "POST",
        path: "/v1/messages",
        handler: "bus.sendMessage",
        config: {
          auth: {
            scope: ["plugin::agent-bus.bus.sendMessage"]
          }
        }
      },
      {
        method: "GET",
        path: "/v1/messages/:id",
        handler: "bus.getMessage",
        config: {
          auth: {
            scope: ["plugin::agent-bus.bus.getMessage"]
          }
        }
      },
      {
        method: "POST",
        path: "/v1/messages/:id/claim",
        handler: "bus.claimMessage",
        config: {
          auth: {
            scope: ["plugin::agent-bus.bus.claimMessage"]
          }
        }
      },
      {
        method: "POST",
        path: "/v1/messages/:id/reply",
        handler: "bus.reply",
        config: {
          auth: {
            scope: ["plugin::agent-bus.bus.reply"]
          }
        }
      },
      // Inbox
      {
        method: "GET",
        path: "/v1/inbox",
        handler: "bus.getInbox",
        config: {
          auth: {
            scope: ["plugin::agent-bus.bus.getInbox"]
          }
        }
      },
      // Threads
      {
        method: "GET",
        path: "/v1/threads/:id",
        handler: "bus.getThread",
        config: {
          auth: {
            scope: ["plugin::agent-bus.bus.getThread"]
          }
        }
      },
      // Approvals
      {
        method: "GET",
        path: "/v1/approvals",
        handler: "bus.listApprovals",
        config: {
          auth: {
            scope: ["plugin::agent-bus.bus.listApprovals"]
          }
        }
      },
      {
        method: "POST",
        path: "/v1/approvals/:id/decide",
        handler: "bus.decide",
        config: {
          auth: {
            scope: ["plugin::agent-bus.bus.decide"]
          }
        }
      }
    ]
  }
};
const bus = ({ strapi }) => ({
  /**
   * GET /api/agent-bus/v1/agents
   */
  async listAgents(ctx) {
    try {
      const agentUid = getUid("agent");
      const filters = {
        state: { $eq: ctx.query.status || "active" }
        // Accept status from query param but use state internally
      };
      if (ctx.query.kind) {
        filters.kind = { $eq: ctx.query.kind };
      }
      const agents = await strapi.documents(agentUid).findMany({
        filters,
        fields: ["documentId", "slug", "name", "kind", "description", "capabilities"],
        sort: ["kind:asc", "name:asc"]
      });
      ctx.body = { agents };
    } catch (error) {
      ctx.status = 400;
      ctx.body = { error: error.message };
    }
  },
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
   * GET /api/agent-bus/v1/messages/:id
   */
  async getMessage(ctx) {
    try {
      const authService = strapi.plugin("agent-bus").service("auth");
      const messageUid = getUid("message");
      const caller = await authService.resolveCaller(strapi, ctx);
      const messages = await strapi.documents(messageUid).findMany({
        filters: { documentId: { $eq: ctx.params.id } },
        populate: {
          thread: true,
          from: { fields: ["slug", "name"] },
          to: { fields: ["slug", "name"] }
        }
      });
      if (!messages || messages.length === 0) {
        ctx.status = 404;
        ctx.body = { error: "Message not found" };
        return;
      }
      const message2 = messages[0];
      const isRecipient = message2.to?.documentId === caller.agentDocumentId;
      const isSender = message2.from?.documentId === caller.agentDocumentId;
      if (!isRecipient && !isSender) {
        ctx.status = 404;
        ctx.body = { error: "Message not found" };
        return;
      }
      ctx.body = { message: message2 };
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
  },
  /**
   * POST /api/agent-bus/v1/messages/:id/reply
   */
  async reply(ctx) {
    try {
      const authService = strapi.plugin("agent-bus").service("auth");
      const busService = strapi.plugin("agent-bus").service("bus");
      const caller = await authService.resolveCaller(strapi, ctx);
      const result = await busService.sendMessage(caller, {
        ...ctx.request.body,
        threadId: ctx.params.id,
        parentId: ctx.params.id,
        type: ctx.request.body.type || "reply"
      });
      ctx.body = result;
    } catch (error) {
      ctx.status = 400;
      ctx.body = { error: error.message };
    }
  },
  /**
   * GET /api/agent-bus/v1/threads/:id
   */
  async getThread(ctx) {
    try {
      const authService = strapi.plugin("agent-bus").service("auth");
      const threadUid = getUid("thread");
      const messageUid = getUid("message");
      const caller = await authService.resolveCaller(strapi, ctx);
      const threads = await strapi.documents(threadUid).findMany({
        filters: { documentId: { $eq: ctx.params.id } },
        populate: { participants: { fields: ["documentId", "slug", "name"] } }
      });
      if (!threads || threads.length === 0) {
        ctx.status = 404;
        ctx.body = { error: "Thread not found" };
        return;
      }
      const thread2 = threads[0];
      const participantIds = thread2.participants?.map((p) => p.documentId) || [];
      if (!participantIds.includes(caller.agentDocumentId)) {
        ctx.status = 404;
        ctx.body = { error: "Thread not found" };
        return;
      }
      const messages = await strapi.documents(messageUid).findMany({
        filters: { thread: { documentId: { $eq: ctx.params.id } } },
        populate: {
          from: { fields: ["slug", "name"] },
          to: { fields: ["slug", "name"] }
        },
        sort: ["createdAt:asc"]
      });
      ctx.body = { thread: thread2, messages };
    } catch (error) {
      ctx.status = 400;
      ctx.body = { error: error.message };
    }
  },
  /**
   * GET /api/agent-bus/v1/approvals
   */
  async listApprovals(ctx) {
    try {
      const approvalUid = getUid("approval");
      const filters = {};
      if (ctx.query.status) {
        filters.state = { $eq: ctx.query.status };
      } else {
        filters.state = { $eq: "pending" };
      }
      const limit = ctx.query.limit ? Math.min(parseInt(ctx.query.limit, 10), 50) : 20;
      const approvals = await strapi.documents(approvalUid).findMany({
        filters,
        populate: {
          message: {
            populate: {
              from: { fields: ["slug", "name"] },
              to: { fields: ["slug", "name"] }
            }
          },
          thread: { fields: ["documentId", "subject"] }
        },
        limit,
        sort: ["createdAt:asc"]
      });
      ctx.body = { approvals };
    } catch (error) {
      ctx.status = 400;
      ctx.body = { error: error.message };
    }
  },
  /**
   * POST /api/agent-bus/v1/approvals/:id/decide
   */
  async decide(ctx) {
    try {
      const authService = strapi.plugin("agent-bus").service("auth");
      const busService = strapi.plugin("agent-bus").service("bus");
      const approvalUid = getUid("approval");
      const messageUid = getUid("message");
      const caller = await authService.resolveCaller(strapi, ctx);
      const { decision, reason } = ctx.request.body;
      if (!["approved", "rejected", "vetoed"].includes(decision)) {
        ctx.status = 400;
        ctx.body = { error: "Invalid decision" };
        return;
      }
      const approvals = await strapi.documents(approvalUid).findMany({
        filters: { documentId: { $eq: ctx.params.id } },
        populate: { message: { fields: ["documentId"] } }
      });
      if (!approvals || approvals.length === 0) {
        ctx.status = 404;
        ctx.body = { error: "Approval not found" };
        return;
      }
      const approval2 = approvals[0];
      if (approval2.state !== "pending") {
        ctx.status = 400;
        ctx.body = { error: `Approval already decided: ${approval2.state}` };
        return;
      }
      await strapi.documents(approvalUid).update({
        documentId: ctx.params.id,
        data: {
          state: decision,
          decidedAt: (/* @__PURE__ */ new Date()).toISOString(),
          decidedByAgent: { connect: [{ documentId: caller.agentDocumentId }] },
          decidedByLabel: caller.agentSlug,
          reason
        }
      });
      const messageStatus = decision === "approved" ? "completed" : decision === "vetoed" ? "vetoed" : "declined";
      await strapi.documents(messageUid).update({
        documentId: approval2.message.documentId,
        data: { state: messageStatus }
      });
      await busService.audit({
        action: "approval.decide",
        actorAgent: caller.agentDocumentId,
        actorLabel: caller.agentSlug,
        entityType: "approval",
        entityDocumentId: ctx.params.id,
        metadata: { decision, messageStatus }
      });
      ctx.body = {
        approvalId: ctx.params.id,
        status: decision,
        messageStatus
      };
    } catch (error) {
      ctx.status = 400;
      ctx.body = { error: error.message };
    }
  }
});
const PERMISSION_PACK_ACTIONS = {
  asker: ["agent.read", "message.send"],
  specialist: ["agent.read", "message.send", "message.inbox"],
  orchestrator: [
    "agent.read",
    "message.send",
    "message.inbox",
    "message.manage",
    "approval.read",
    "approval.decide",
    "delivery.read"
  ]
};
function sanitizeAgent(agent2) {
  if (!agent2) return null;
  const sanitized = { ...agent2 };
  delete sanitized.webhookSecret;
  delete sanitized.webhookAuthHeader;
  sanitized.webhookConfigured = Boolean(agent2.webhookUrl);
  sanitized.hasAuthHeader = Boolean(agent2.webhookAuthHeader);
  if (agent2.credentials && Array.isArray(agent2.credentials)) {
    sanitized.credentials = agent2.credentials.map((cred) => ({
      id: cred.id,
      kind: cred.kind,
      tokenName: cred.tokenName,
      state: cred.state,
      mintedByPlugin: cred.mintedByPlugin
    }));
  }
  return sanitized;
}
function generateSlug(name) {
  return name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}
const adminController = ({ strapi }) => {
  const agentUid = getUid("agent");
  const credentialUid = getUid("agent-credential");
  return {
    async listAgents(ctx) {
      try {
        const agents = await strapi.documents(agentUid).findMany({
          populate: {
            credentials: {
              fields: ["id", "kind", "tokenId", "tokenName", "state", "mintedByPlugin"]
            }
          },
          sort: ["name:asc"]
        });
        ctx.body = { data: agents.map(sanitizeAgent) };
      } catch (error) {
        ctx.status = 400;
        ctx.body = { error: error.message };
      }
    },
    async getAgent(ctx) {
      try {
        const agents = await strapi.documents(agentUid).findMany({
          filters: { documentId: { $eq: ctx.params.documentId } },
          populate: {
            credentials: {
              fields: ["id", "kind", "tokenId", "tokenName", "state", "mintedByPlugin"]
            }
          }
        });
        if (!agents || agents.length === 0) {
          ctx.status = 404;
          ctx.body = { error: "Agent not found" };
          return;
        }
        ctx.body = { data: sanitizeAgent(agents[0]) };
      } catch (error) {
        ctx.status = 400;
        ctx.body = { error: error.message };
      }
    },
    async createAgent(ctx) {
      try {
        const body = ctx.request.body ?? {};
        const {
          name,
          slug,
          kind: kind2,
          permissionPack,
          description,
          webhookUrl,
          webhookSecret,
          webhookAuthHeader,
          webhookMode,
          credentialType,
          tokenId
        } = body;
        if (!name || !name.trim()) {
          ctx.status = 400;
          ctx.body = { error: "name is required" };
          return;
        }
        const finalSlug = slug && slug.trim() ? slug.trim() : generateSlug(name);
        if (finalSlug === "chief") {
          const existing = await strapi.documents(agentUid).findMany({
            filters: { slug: { $eq: "chief" } }
          });
          if (existing && existing.length > 0) {
            ctx.status = 400;
            ctx.body = { error: 'slug "chief" is reserved and already exists' };
            return;
          }
        }
        const agent2 = await strapi.documents(agentUid).create({
          data: {
            name: name.trim(),
            slug: finalSlug,
            kind: kind2 || "specialist",
            permissionPack: permissionPack || "asker",
            description,
            webhookUrl,
            webhookSecret,
            webhookAuthHeader,
            webhookMode: webhookMode || "reference",
            state: "active"
          }
        });
        let token = null;
        if (credentialType === "mint") {
          const hasPermission = await checkMintPermissions(strapi, permissionPack || "asker", ctx.state.user);
          if (!hasPermission.allowed) {
            ctx.status = 403;
            ctx.body = { error: `Cannot mint ${permissionPack || "asker"} token: missing permissions - ${hasPermission.missing.join(", ")}` };
            return;
          }
          token = await mintTokenForAgent(strapi, agent2, permissionPack || "asker", ctx.state.user);
        } else if (credentialType === "bind" && tokenId) {
          await bindTokenToAgent(strapi, agent2, Number(tokenId));
        }
        const updated = await strapi.documents(agentUid).findMany({
          filters: { documentId: { $eq: agent2.documentId } },
          populate: {
            credentials: {
              fields: ["id", "kind", "tokenId", "tokenName", "state", "mintedByPlugin"]
            }
          }
        });
        ctx.status = 201;
        ctx.body = { data: { agent: sanitizeAgent(updated[0]), token } };
      } catch (error) {
        ctx.status = 400;
        ctx.body = { error: error.message };
      }
    },
    async updateAgent(ctx) {
      try {
        const body = ctx.request.body ?? {};
        const updateData = {};
        if (body.name !== void 0) updateData.name = body.name.trim();
        if (body.kind !== void 0) updateData.kind = body.kind;
        if (body.permissionPack !== void 0) updateData.permissionPack = body.permissionPack;
        if (body.description !== void 0) updateData.description = body.description;
        if (body.state !== void 0) updateData.state = body.state;
        if (body.webhookUrl !== void 0) updateData.webhookUrl = body.webhookUrl;
        if (body.webhookMode !== void 0) updateData.webhookMode = body.webhookMode;
        if (body.webhookSecret && body.webhookSecret.trim()) {
          updateData.webhookSecret = body.webhookSecret.trim();
        }
        if (body.webhookAuthHeader && body.webhookAuthHeader.trim()) {
          updateData.webhookAuthHeader = body.webhookAuthHeader.trim();
        }
        const agent2 = await strapi.documents(agentUid).update({
          documentId: ctx.params.documentId,
          data: updateData
        });
        if (!agent2) {
          ctx.status = 404;
          ctx.body = { error: "Agent not found" };
          return;
        }
        const updated = await strapi.documents(agentUid).findMany({
          filters: { documentId: { $eq: agent2.documentId } },
          populate: {
            credentials: {
              fields: ["id", "kind", "tokenId", "tokenName", "state", "mintedByPlugin"]
            }
          }
        });
        ctx.body = { data: sanitizeAgent(updated[0]) };
      } catch (error) {
        ctx.status = 400;
        ctx.body = { error: error.message };
      }
    },
    async deleteAgent(ctx) {
      try {
        const agents = await strapi.documents(agentUid).findMany({
          filters: { documentId: { $eq: ctx.params.documentId } },
          populate: {
            credentials: true
          }
        });
        if (!agents || agents.length === 0) {
          ctx.status = 404;
          ctx.body = { error: "Agent not found" };
          return;
        }
        const agent2 = agents[0];
        if (agent2.slug === "chief" || agent2.kind === "orchestrator") {
          ctx.status = 400;
          ctx.body = { error: "Cannot delete the orchestrator/chief agent" };
          return;
        }
        const credentials = agent2.credentials || [];
        const adminTokenService = strapi.service("admin::api-token-admin");
        for (const credential of credentials) {
          await strapi.documents(credentialUid).update({
            documentId: credential.documentId,
            data: { state: "revoked" }
          });
          if (credential.mintedByPlugin) {
            try {
              await adminTokenService.revoke(Number(credential.tokenId));
            } catch (error) {
              strapi.log.warn(`[agent-bus] Could not revoke token ${credential.tokenId}: ${error.message}`);
            }
          }
        }
        await strapi.documents(agentUid).delete({
          documentId: ctx.params.documentId
        });
        ctx.body = { data: { deleted: true } };
      } catch (error) {
        ctx.status = 400;
        ctx.body = { error: error.message };
      }
    },
    async bindToken(ctx) {
      try {
        const { tokenId } = ctx.request.body ?? {};
        if (!tokenId) {
          ctx.status = 400;
          ctx.body = { error: "tokenId is required" };
          return;
        }
        const agents = await strapi.documents(agentUid).findMany({
          filters: { documentId: { $eq: ctx.params.documentId } }
        });
        if (!agents || agents.length === 0) {
          ctx.status = 404;
          ctx.body = { error: "Agent not found" };
          return;
        }
        await bindTokenToAgent(strapi, agents[0], Number(tokenId));
        ctx.body = { data: { bound: true } };
      } catch (error) {
        ctx.status = 400;
        ctx.body = { error: error.message };
      }
    },
    async mintToken(ctx) {
      try {
        const agents = await strapi.documents(agentUid).findMany({
          filters: { documentId: { $eq: ctx.params.documentId } }
        });
        if (!agents || agents.length === 0) {
          ctx.status = 404;
          ctx.body = { error: "Agent not found" };
          return;
        }
        const agent2 = agents[0];
        const hasPermission = await checkMintPermissions(strapi, agent2.permissionPack, ctx.state.user);
        if (!hasPermission.allowed) {
          ctx.status = 403;
          ctx.body = { error: `Cannot mint ${agent2.permissionPack} token: missing permissions - ${hasPermission.missing.join(", ")}` };
          return;
        }
        const token = await mintTokenForAgent(strapi, agent2, agent2.permissionPack, ctx.state.user);
        ctx.status = 201;
        ctx.body = { data: token };
      } catch (error) {
        ctx.status = 400;
        ctx.body = { error: error.message };
      }
    },
    async revokeCredential(ctx) {
      try {
        const { credentialId, documentId } = ctx.params;
        const credentials = await strapi.documents(credentialUid).findMany({
          filters: { id: { $eq: Number(credentialId) } },
          populate: { agent: { fields: ["documentId"] } }
        });
        if (!credentials || credentials.length === 0) {
          ctx.status = 404;
          ctx.body = { error: "Credential not found" };
          return;
        }
        const credential = credentials[0];
        if (credential.agent?.documentId !== documentId) {
          ctx.status = 404;
          ctx.body = { error: "Credential not found" };
          return;
        }
        await strapi.documents(credentialUid).update({
          documentId: credential.documentId,
          data: { state: "revoked" }
        });
        if (credential.mintedByPlugin) {
          try {
            const adminTokenService = strapi.service("admin::api-token-admin");
            await adminTokenService.revoke(Number(credential.tokenId));
          } catch (error) {
            strapi.log.warn(`[agent-bus] Could not revoke token ${credential.tokenId}: ${error.message}`);
          }
        }
        ctx.body = { data: { revoked: true } };
      } catch (error) {
        ctx.status = 400;
        ctx.body = { error: error.message };
      }
    },
    async listTokens(ctx) {
      try {
        const tokens = await listSelectableTokens(strapi, ctx.state.user.id);
        ctx.body = { data: tokens };
      } catch (error) {
        ctx.status = 400;
        ctx.body = { error: error.message };
      }
    }
  };
};
async function listSelectableTokens(strapi, userId) {
  const credentialUid = getUid("agent-credential");
  const boundCredentials = await strapi.documents(credentialUid).findMany({
    filters: { state: { $eq: "active" } },
    fields: ["tokenId"]
  });
  const boundTokenIds = new Set(boundCredentials.map((c) => c.tokenId));
  const now = Date.now();
  const adminTokens = await strapi.db.query("admin::api-token").findMany({
    where: {
      adminUserOwner: userId
    }
  });
  const contentApiTokens = await strapi.db.query("admin::api-token").findMany({
    where: {
      type: "custom"
    }
  });
  const allTokens = [...adminTokens, ...contentApiTokens];
  const selectableTokens = allTokens.filter((token) => {
    if (token.expiresAt && new Date(token.expiresAt).getTime() <= now) return false;
    if (boundTokenIds.has(String(token.id))) return false;
    if (token.type === "admin" || token.kind === "admin") {
      const ownerId = typeof token.adminUserOwner === "object" ? token.adminUserOwner?.id : token.adminUserOwner;
      return ownerId === userId;
    }
    return token.type === "custom";
  });
  return selectableTokens.map((token) => ({
    id: token.id,
    name: token.name,
    description: token.description,
    expiresAt: token.expiresAt,
    kind: token.type === "custom" ? "content-api" : "admin"
  }));
}
async function bindTokenToAgent(strapi, agent2, tokenId) {
  const credentialUid = getUid("agent-credential");
  const existingBinding = await strapi.documents(credentialUid).findMany({
    filters: {
      tokenId: { $eq: String(tokenId) },
      state: { $eq: "active" }
    }
  });
  if (existingBinding && existingBinding.length > 0) {
    throw new Error("Token is already bound to an agent");
  }
  const token = await strapi.db.query("admin::api-token").findOne({
    where: { id: tokenId }
  });
  if (!token) {
    throw new Error("Token not found");
  }
  const tokenKind = token.type === "custom" ? "content-api" : "admin";
  if (token.expiresAt && new Date(token.expiresAt).getTime() <= Date.now()) {
    throw new Error("Token has expired");
  }
  const revokedBinding = await strapi.documents(credentialUid).findMany({
    filters: {
      tokenId: { $eq: String(tokenId) },
      state: { $eq: "revoked" }
    },
    limit: 1
  });
  if (revokedBinding && revokedBinding.length > 0) {
    await strapi.documents(credentialUid).update({
      documentId: revokedBinding[0].documentId,
      data: {
        agent: { connect: [{ documentId: agent2.documentId }] },
        kind: tokenKind,
        tokenName: token.name,
        state: "active",
        mintedByPlugin: false
      }
    });
  } else {
    await strapi.documents(credentialUid).create({
      data: {
        agent: { connect: [{ documentId: agent2.documentId }] },
        kind: tokenKind,
        tokenId: String(token.id),
        tokenName: token.name,
        state: "active",
        mintedByPlugin: false
      }
    });
  }
}
async function checkMintPermissions(strapi, permissionPack, user) {
  const actions = PERMISSION_PACK_ACTIONS[permissionPack] || PERMISSION_PACK_ACTIONS.asker;
  const actionIds = actions.map((uid) => getActionId(uid));
  const isSuperAdmin = user.roles?.some((role) => role.code === "strapi-super-admin");
  if (isSuperAdmin) {
    return { allowed: true, missing: [] };
  }
  const permissionService = strapi.service("admin::permission");
  const userPermissions = await permissionService.findUserPermissions(user);
  const userActionIds = new Set(userPermissions.map((p) => p.action));
  const missing = actionIds.filter((actionId) => !userActionIds.has(actionId));
  return {
    allowed: missing.length === 0,
    missing
  };
}
async function mintTokenForAgent(strapi, agent2, permissionPack, user) {
  const adminTokenService = strapi.service("admin::api-token-admin");
  const credentialUid = getUid("agent-credential");
  const actions = PERMISSION_PACK_ACTIONS[permissionPack] || PERMISSION_PACK_ACTIONS.asker;
  const actionIds = actions.map((uid) => getActionId(uid));
  const token = await adminTokenService.create(
    {
      kind: "admin",
      name: `${agent2.name} (${permissionPack}) - ${Date.now()}`,
      description: `Token for ${agent2.name} agent with ${permissionPack} permissions`,
      lifespan: null,
      adminUserOwner: user.id
    },
    user
  );
  for (const action of actionIds) {
    await strapi.db.query("admin::permission").create({
      data: { action, subject: null, properties: {}, conditions: [], apiToken: token.id }
    });
  }
  await strapi.documents(credentialUid).create({
    data: {
      agent: { connect: [{ documentId: agent2.documentId }] },
      kind: "admin",
      tokenId: String(token.id),
      tokenName: token.name,
      state: "active",
      mintedByPlugin: true
    }
  });
  return {
    accessKey: token.accessKey,
    tokenName: token.name
  };
}
const controllers = {
  bus,
  admin: adminController
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
