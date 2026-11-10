"use strict";
function getDefaultExportFromCjs(x) {
  return x && x.__esModule && Object.prototype.hasOwnProperty.call(x, "default") ? x["default"] : x;
}
const INVISIBLE_CHARS = /[\u200B-\u200F\u202A-\u202E\u2060-\u2064\uFEFF]|[\u{E0000}-\u{E007F}]/gu;
const ESCAPED_INVISIBLE = /\\u(?:200[b-f]|202[a-e]|206[0-4]|feff|e0[0-7][0-9a-f])/gi;
const RULES = [
  {
    id: "instruction-override",
    severity: "high",
    description: "Attempts to void earlier instructions",
    pattern: /\b(ignore|disregard|forget|override)\b[\s\S]{0,40}?\b(all\s+)?(previous|prior|earlier|above|preceding)\b[\s\S]{0,40}?\b(instruction|prompt|rule|direction|message|context)s?/i
  },
  {
    id: "role-hijack",
    severity: "high",
    description: "Tries to reassign the assistant persona or unlock restrictions",
    pattern: /\b(you are now|from now on,? you|act as an unrestricted|ignore your (?:system|safety)|developer mode|jailbreak)\b/i
  },
  {
    id: "system-tag",
    severity: "high",
    description: "Forged conversation-role or system markers",
    pattern: /<\/?\s*(system|assistant|human|user)\s*>|\[\[?\s*(system|assistant)\s*\]?\]/i
  },
  {
    id: "tool-coercion",
    severity: "high",
    description: "Instructs the model to invoke a tool or mutate data",
    pattern: /\b(call|invoke|execute|run|use)\b[\s\S]{0,30}?\b(tool|function|api)\b[\s\S]{0,40}?\b(delete|destroy|publish|unpublish|update|create|drop)\b/i
  },
  {
    id: "exfiltration-url",
    severity: "high",
    description: "Markdown image/link that would leak data into a query string",
    pattern: /!?\[[^\]]{0,80}\]\(\s*https?:\/\/[^\s)]{0,200}[?&][^\s)]{0,200}=/i
  },
  {
    id: "secret-fishing",
    severity: "medium",
    description: "Mentions credentials or environment secrets",
    pattern: /\b(api[\s_-]?key|access[\s_-]?token|secret[\s_-]?key|password|\.env\b|environment variable)/i
  },
  {
    id: "hidden-html-comment",
    severity: "medium",
    description: "HTML comment — invisible when rendered, visible to the model",
    pattern: /<!--[\s\S]{0,500}?-->/
  }
];
const SAMPLE_CHARS = 160;
const toSample = (text) => {
  const flat = text.replace(/\s+/g, " ").trim();
  return flat.length > SAMPLE_CHARS ? `${flat.slice(0, SAMPLE_CHARS)}…` : flat;
};
const normalizeForMatching = (text) => text.replace(/\\u[0-9a-fA-F]{4}/g, "      ").replace(/\\x[0-9a-fA-F]{2}/g, "    ").replace(/\\[nrtbfv"'\\/]/g, "  ");
const stripInvisible = (text) => text.replace(INVISIBLE_CHARS, "").replace(ESCAPED_INVISIBLE, "");
const containsInvisible = (text) => {
  INVISIBLE_CHARS.lastIndex = 0;
  ESCAPED_INVISIBLE.lastIndex = 0;
  const found = INVISIBLE_CHARS.test(text) || ESCAPED_INVISIBLE.test(text);
  INVISIBLE_CHARS.lastIndex = 0;
  ESCAPED_INVISIBLE.lastIndex = 0;
  return found;
};
const scanText = (text, path = "") => {
  const findings = [];
  if (containsInvisible(text)) {
    findings.push({
      rule: "invisible-characters",
      severity: "high",
      description: "Zero-width or Unicode tag characters hidden in the text",
      sample: toSample(text),
      path
    });
  }
  const probe = normalizeForMatching(text);
  for (const rule of RULES) {
    const match = rule.pattern.exec(probe);
    if (match !== null) {
      findings.push({
        rule: rule.id,
        severity: rule.severity,
        description: rule.description,
        sample: toSample(text.slice(match.index, match.index + match[0].length)),
        path
      });
    }
  }
  return findings;
};
const sanitizeText = (text) => {
  const base = stripInvisible(text);
  const probe = normalizeForMatching(base);
  const hits = [];
  for (const rule of RULES) {
    const global = new RegExp(rule.pattern.source, `${rule.pattern.flags.replace("g", "")}g`);
    let match = global.exec(probe);
    while (match !== null) {
      if (match[0].length === 0) {
        global.lastIndex += 1;
      } else {
        hits.push({ start: match.index, end: match.index + match[0].length, rule: rule.id });
      }
      match = global.exec(probe);
    }
  }
  if (hits.length === 0) {
    return base;
  }
  hits.sort((a, b) => a.start - b.start || b.end - a.end);
  const merged = [];
  for (const hit of hits) {
    const last = merged[merged.length - 1];
    if (last !== void 0 && hit.start <= last.end) {
      last.end = Math.max(last.end, hit.end);
      last.rules.add(hit.rule);
    } else {
      merged.push({ start: hit.start, end: hit.end, rules: /* @__PURE__ */ new Set([hit.rule]) });
    }
  }
  let output = "";
  let cursor = 0;
  for (const span of merged) {
    const label = [...span.rules].join("+");
    output += `${base.slice(cursor, span.start)}[removed: possible prompt injection — ${label}]`;
    cursor = span.end;
  }
  return output + base.slice(cursor);
};
const scanValue$1 = (value, path = "$") => {
  if (typeof value === "string") {
    return scanText(value, path);
  }
  if (Array.isArray(value)) {
    return value.flatMap((item, index2) => scanValue$1(item, `${path}[${index2}]`));
  }
  if (typeof value === "object" && value !== null) {
    return Object.entries(value).flatMap(([key, item]) => scanValue$1(item, `${path}.${key}`));
  }
  return [];
};
const sanitizeValue$1 = (value) => {
  if (typeof value === "string") {
    return sanitizeText(value);
  }
  if (Array.isArray(value)) {
    return value.map(sanitizeValue$1);
  }
  if (typeof value === "object" && value !== null) {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, sanitizeValue$1(v)]));
  }
  return value;
};
const hasSeverity$1 = (findings, severity) => findings.some((f) => f.severity === severity);
const formatFindings$1 = (findings) => findings.map((f) => `${f.rule}@${f.path}`).join(", ");
const summarizeFindings$1 = (findings) => {
  const byRule = /* @__PURE__ */ new Map();
  for (const finding of findings) {
    const existing = byRule.get(finding.rule);
    if (existing === void 0) {
      byRule.set(finding.rule, { ...finding, count: 1, paths: [finding.path] });
    } else {
      existing.count += 1;
      if (existing.paths.length < 5) {
        existing.paths.push(finding.path);
      }
    }
  }
  return [...byRule.values()];
};
var scanner = {
  scanValue: scanValue$1,
  sanitizeValue: sanitizeValue$1,
  hasSeverity: hasSeverity$1,
  formatFindings: formatFindings$1,
  summarizeFindings: summarizeFindings$1
};
const {
  formatFindings,
  hasSeverity,
  sanitizeValue,
  scanValue,
  summarizeFindings
} = scanner;
const MAX_ARG_LOG_CHARS = 400;
const REDACTED_KEYS = /^(password|token|secret|apiKey|authorization|accessKey)$/i;
const asMessages = (body) => {
  const list = Array.isArray(body) ? body : [body];
  return list.filter((item) => typeof item === "object" && item !== null);
};
const summarizeArgs = (args) => {
  if (args === void 0 || args === null) {
    return "{}";
  }
  const json = JSON.stringify(
    args,
    (key, value) => REDACTED_KEYS.test(key) ? "[redacted]" : value
  );
  return json.length > MAX_ARG_LOG_CHARS ? `${json.slice(0, MAX_ARG_LOG_CHARS)}…` : json;
};
const resultPayload = (result) => ({
  content: result.content,
  structuredContent: result.structuredContent
});
const blockedResult = (findings) => ({
  isError: true,
  content: [
    {
      type: "text",
      text: `Blocked by mcp-guard: the stored content in this result matched prompt-injection rules (${formatFindings(findings)}). Inspect the record in the Strapi admin panel.`
    }
  ]
});
const transformSse = (raw, transform) => raw.split("\n\n").map((frame) => {
  if (frame.trim() === "") {
    return frame;
  }
  const lines = frame.split("\n");
  const dataLines = lines.filter((line) => line.startsWith("data:"));
  if (dataLines.length === 0) {
    return frame;
  }
  const payload = dataLines.map((line) => line.slice("data:".length).trim()).join("\n");
  let message;
  try {
    message = JSON.parse(payload);
  } catch {
    return frame;
  }
  const rewritten = JSON.stringify(transform(message));
  const otherLines = lines.filter((line) => !line.startsWith("data:"));
  return [...otherLines, `data: ${rewritten}`].join("\n");
}).join("\n\n");
const transformJson = (raw, transform) => {
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return raw;
  }
  const rewritten = Array.isArray(parsed) ? parsed.map(transform) : transform(parsed);
  return JSON.stringify(rewritten);
};
const headerValue = (headers, name) => {
  const key = Object.keys(headers).find((k) => k.toLowerCase() === name.toLowerCase());
  return key === void 0 ? "" : String(headers[key]);
};
const createGuardMiddleware$1 = ({ strapi: strapi2, config, eventLog: eventLog2 }) => {
  return async (ctx, next) => {
    if (ctx.path !== config.path || ctx.method !== "POST") {
      return next();
    }
    const startedAt = process.hrtime.bigint();
    const messages = asMessages(ctx.request.body);
    const primary = messages.find((m) => typeof m.method === "string") ?? {};
    const elapsed = () => Number(process.hrtime.bigint() - startedAt) / 1e6;
    const record = (event) => eventLog2.push({
      occurredAt: (/* @__PURE__ */ new Date()).toISOString(),
      method: primary.method ?? "unknown",
      tool: primary.params?.name ?? null,
      adminUser: ctx.state.user?.id ?? null,
      httpStatus: ctx.res.statusCode,
      durationMs: Number(elapsed().toFixed(1)),
      args: config.logArgs ? summarizeArgs(primary.params?.arguments) : null,
      reason: null,
      findings: [],
      ...event
    });
    const reject = (httpStatus, code, message, id = null, findings = []) => {
      ctx.status = httpStatus;
      ctx.body = { jsonrpc: "2.0", error: { code, message }, id: id ?? null };
      record({ action: "rejected", httpStatus, reason: message, findings });
      strapi2.log.warn(`[mcp-guard] rejected: ${message}`);
    };
    if (messages.length === 0) {
      return reject(400, -32600, "Invalid Request: body is not a JSON-RPC message");
    }
    for (const message of messages) {
      if (typeof message.method !== "string") {
        continue;
      }
      if (config.allowedMethods.includes(message.method) === false) {
        return reject(403, -32601, `Method not allowed: ${message.method}`, message.id);
      }
      if (message.method !== "tools/call") {
        continue;
      }
      const toolName = message.params?.name;
      if (typeof toolName !== "string" || toolName === "") {
        return reject(400, -32602, "Invalid params: tools/call requires params.name", message.id);
      }
      if (config.allowedTools !== null && config.allowedTools.includes(toolName) === false) {
        return reject(403, -32e3, `Tool not allowed: ${toolName}`, message.id);
      }
      if (config.deniedTools.includes(toolName)) {
        return reject(403, -32e3, `Tool denied: ${toolName}`, message.id);
      }
      const argBytes = Buffer.byteLength(JSON.stringify(message.params?.arguments ?? {}), "utf8");
      if (argBytes > config.maxArgBytes) {
        return reject(
          413,
          -32602,
          `Arguments too large: ${argBytes} bytes exceeds ${config.maxArgBytes}`,
          message.id
        );
      }
      if (config.inbound !== "off") {
        const findings = scanValue(message.params?.arguments ?? {}, "$.arguments");
        if (findings.length > 0 && config.inbound === "block" && hasSeverity(findings, "high")) {
          return reject(
            403,
            -32e3,
            `Blocked: tool arguments matched prompt-injection rules (${formatFindings(findings)})`,
            message.id,
            summarizeFindings(findings)
          );
        }
        if (findings.length > 0) {
          strapi2.log.warn(
            `[mcp-guard] inbound findings on ${toolName}: ${formatFindings(findings)}`
          );
        }
      }
    }
    const res = ctx.res;
    const originalWriteHead = res.writeHead.bind(res);
    const originalWrite = res.write.bind(res);
    const originalEnd = res.end.bind(res);
    let head = null;
    const chunks = [];
    const outboundFindings = [];
    let blocked = false;
    let sanitized = false;
    let toolError = false;
    const toBuffer = (chunk, encoding) => {
      if (chunk === void 0 || chunk === null || typeof chunk === "function") {
        return null;
      }
      if (Buffer.isBuffer(chunk)) {
        return chunk;
      }
      if (ArrayBuffer.isView(chunk)) {
        return Buffer.from(chunk.buffer, chunk.byteOffset, chunk.byteLength);
      }
      if (chunk instanceof ArrayBuffer) {
        return Buffer.from(chunk);
      }
      if (typeof chunk === "string") {
        return Buffer.from(chunk, typeof encoding === "string" ? encoding : "utf8");
      }
      return null;
    };
    res.writeHead = (status, arg2, arg3) => {
      if (head === null) {
        const headers = (typeof arg2 === "object" && arg2 !== null ? arg2 : arg3) ?? {};
        head = { status, headers };
      }
      return res;
    };
    res.write = (chunk, encoding, callback) => {
      const buffer = toBuffer(chunk, encoding);
      if (buffer !== null) {
        chunks.push(buffer);
      }
      const done = typeof encoding === "function" ? encoding : callback;
      if (typeof done === "function") {
        done();
      }
      return true;
    };
    const transformMessage = (message) => {
      if (message.result === void 0 || message.result === null || config.outbound === "off") {
        if (message.error !== void 0 && message.error !== null) {
          toolError = true;
        }
        return message;
      }
      if (message.result.isError === true) {
        toolError = true;
      }
      const findings = scanValue(resultPayload(message.result), "$.result");
      if (findings.length === 0) {
        return message;
      }
      outboundFindings.push(...findings);
      if (config.outbound === "warn") {
        return message;
      }
      if (config.outbound === "block" && hasSeverity(findings, "high")) {
        blocked = true;
        return { ...message, result: blockedResult(findings) };
      }
      if (config.outbound === "sanitize") {
        sanitized = true;
        return {
          ...message,
          result: {
            ...message.result,
            content: sanitizeValue(message.result.content),
            structuredContent: sanitizeValue(message.result.structuredContent)
          }
        };
      }
      return message;
    };
    res.end = (chunk, encoding, callback) => {
      const buffer = toBuffer(chunk, encoding);
      if (buffer !== null) {
        chunks.push(buffer);
      }
      res.writeHead = originalWriteHead;
      res.write = originalWrite;
      res.end = originalEnd;
      const raw = Buffer.concat(chunks).toString("utf8");
      const contentType = head === null ? String(res.getHeader("content-type") ?? "") : headerValue(head.headers, "content-type");
      let output = raw;
      if (raw !== "") {
        output = contentType.includes("text/event-stream") ? transformSse(raw, transformMessage) : transformJson(raw, transformMessage);
      }
      const outBuffer = Buffer.from(output, "utf8");
      if (head !== null) {
        const headers = { ...head.headers };
        const lengthKey = Object.keys(headers).find((k) => k.toLowerCase() === "content-length");
        if (lengthKey !== void 0) {
          headers[lengthKey] = String(outBuffer.byteLength);
        }
        originalWriteHead(head.status, headers);
      } else if (res.getHeader("content-length") !== void 0) {
        res.setHeader("content-length", String(outBuffer.byteLength));
      }
      if (outBuffer.byteLength > 0) {
        originalWrite(outBuffer);
      }
      const done = typeof chunk === "function" ? chunk : typeof encoding === "function" ? encoding : callback;
      return originalEnd(typeof done === "function" ? done : void 0);
    };
    try {
      await next();
    } finally {
      const action = blocked ? "blocked" : sanitized ? "sanitized" : toolError ? "errored" : "clean";
      const findings = summarizeFindings(outboundFindings);
      record({ action, findings });
      if (outboundFindings.length > 0) {
        strapi2.log.warn(
          `[mcp-guard] ${action} ${primary.params?.name ?? primary.method}: ${findings.map((f) => f.rule).join(", ")}`
        );
      }
    }
  };
};
var guard = { createGuardMiddleware: createGuardMiddleware$1 };
const EVENT_UID = "plugin::mcp-guard.event";
const createEventLog$1 = ({ strapi: strapi2, config }) => {
  const capacity = config.bufferSize;
  const buffer = [];
  let sequence = 0;
  const totals = {
    requests: 0,
    toolCalls: 0,
    rejected: 0,
    sanitized: 0,
    blocked: 0,
    errored: 0,
    clean: 0
  };
  const push = (event) => {
    sequence += 1;
    const record = { id: sequence, ...event };
    buffer.push(record);
    if (buffer.length > capacity) {
      buffer.splice(0, buffer.length - capacity);
    }
    totals.requests += 1;
    if (record.method === "tools/call") {
      totals.toolCalls += 1;
    }
    if (totals[record.action] !== void 0) {
      totals[record.action] += 1;
    }
    if (config.persist === true) {
      persist(record);
    }
    return record;
  };
  const persist = (record) => {
    strapi2.documents(EVENT_UID).create({
      data: {
        occurredAt: record.occurredAt,
        method: record.method,
        tool: record.tool,
        action: record.action,
        adminUser: record.adminUser === null ? null : String(record.adminUser),
        httpStatus: record.httpStatus,
        durationMs: record.durationMs,
        reason: record.reason,
        findings: record.findings
      }
    }).catch((error) => {
      strapi2.log.error(`[mcp-guard] failed to persist event: ${error.message}`);
    });
  };
  return {
    push,
    /** Newest first, optionally filtered. */
    list({ limit = 50, action, method, onlyFindings = false } = {}) {
      let events = [...buffer].reverse();
      if (action !== void 0 && action !== "" && action !== "all") {
        events = events.filter((event) => event.action === action);
      }
      if (method !== void 0 && method !== "" && method !== "all") {
        events = events.filter((event) => event.method === method);
      }
      if (onlyFindings === true) {
        events = events.filter((event) => event.findings.length > 0);
      }
      return events.slice(0, limit);
    },
    stats() {
      const withFindings = buffer.filter((event) => event.findings.length > 0);
      const ruleCounts = /* @__PURE__ */ new Map();
      for (const event of withFindings) {
        for (const finding of event.findings) {
          ruleCounts.set(finding.rule, (ruleCounts.get(finding.rule) ?? 0) + 1);
        }
      }
      const durations = buffer.filter((event) => typeof event.durationMs === "number").map((event) => event.durationMs).sort((a, b) => a - b);
      return {
        totals: { ...totals },
        buffered: buffer.length,
        capacity,
        persisting: config.persist === true,
        eventsWithFindings: withFindings.length,
        medianDurationMs: durations.length === 0 ? null : Number(durations[Math.floor(durations.length / 2)].toFixed(1)),
        topRules: [...ruleCounts.entries()].map(([rule, count]) => ({ rule, count })).sort((a, b) => b.count - a.count).slice(0, 8),
        lastEventAt: buffer.length === 0 ? null : buffer[buffer.length - 1].occurredAt
      };
    },
    clear() {
      buffer.length = 0;
      for (const key of Object.keys(totals)) {
        totals[key] = 0;
      }
    }
  };
};
var eventLog = { createEventLog: createEventLog$1 };
const kind = "collectionType";
const collectionName = "mcp_guard_events";
const info = {
  singularName: "event",
  pluralName: "events",
  displayName: "MCP Guard Event",
  description: "Persisted record of what the MCP guard did on a request"
};
const options = {
  draftAndPublish: false
};
const pluginOptions = {
  "content-manager": {
    visible: true
  },
  "content-type-builder": {
    visible: false
  }
};
const attributes = {
  occurredAt: {
    type: "datetime"
  },
  method: {
    type: "string"
  },
  tool: {
    type: "string"
  },
  action: {
    type: "string"
  },
  adminUser: {
    type: "string"
  },
  httpStatus: {
    type: "integer"
  },
  durationMs: {
    type: "float"
  },
  reason: {
    type: "text"
  },
  findings: {
    type: "json"
  }
};
const require$$2 = {
  kind,
  collectionName,
  info,
  options,
  pluginOptions,
  attributes
};
const { createGuardMiddleware } = guard;
const { createEventLog } = eventLog;
const eventSchema = require$$2;
const PERMISSION_ACTION = "plugin::mcp-guard.read";
var server = {
  register({ strapi: strapi2 }) {
    strapi2.admin.services.permission.actionProvider.registerMany([
      {
        section: "plugins",
        displayName: "Read MCP guard events",
        uid: "read",
        pluginName: "mcp-guard"
      }
    ]);
  },
  bootstrap({ strapi: strapi2 }) {
    const config = strapi2.config.get("plugin::mcp-guard");
    const eventLog2 = createEventLog({ strapi: strapi2, config });
    strapi2.plugin("mcp-guard").eventLog = eventLog2;
    if (config.enabled === false) {
      strapi2.log.info("[mcp-guard] disabled by config");
      return;
    }
    strapi2.server.use(createGuardMiddleware({ strapi: strapi2, config, eventLog: eventLog2 }));
    strapi2.log.info(
      `[mcp-guard] watching ${config.path} — inbound=${config.inbound} outbound=${config.outbound}${config.persist ? " persist=on" : ""}`
    );
  },
  config: {
    default: {
      enabled: true,
      path: "/mcp",
      inbound: "block",
      outbound: "sanitize",
      allowedMethods: [
        "initialize",
        "notifications/initialized",
        "ping",
        "tools/list",
        "tools/call",
        "prompts/list",
        "prompts/get",
        "resources/list",
        "resources/templates/list",
        "resources/read",
        "completion/complete"
      ],
      allowedTools: null,
      deniedTools: [],
      maxArgBytes: 32 * 1024,
      logArgs: true,
      bufferSize: 200,
      persist: false
    },
    validator(config) {
      const inbound = ["block", "warn", "off"];
      const outbound = ["block", "sanitize", "warn", "off"];
      if (inbound.includes(config.inbound) === false) {
        throw new Error(`inbound must be one of ${inbound.join(", ")}`);
      }
      if (outbound.includes(config.outbound) === false) {
        throw new Error(`outbound must be one of ${outbound.join(", ")}`);
      }
      if (Number.isInteger(config.bufferSize) === false || config.bufferSize < 1) {
        throw new Error("bufferSize must be a positive integer");
      }
    }
  },
  contentTypes: {
    event: { schema: eventSchema }
  },
  controllers: {
    events: {
      async find(ctx) {
        const eventLog2 = strapi.plugin("mcp-guard").eventLog;
        const { limit, action, method, onlyFindings } = ctx.query;
        ctx.body = {
          events: eventLog2.list({
            limit: Math.min(Number(limit) || 50, 200),
            action,
            method,
            onlyFindings: onlyFindings === "true"
          })
        };
      },
      async stats(ctx) {
        ctx.body = strapi.plugin("mcp-guard").eventLog.stats();
      },
      async config(ctx) {
        const config = strapi.config.get("plugin::mcp-guard");
        ctx.body = {
          path: config.path,
          inbound: config.inbound,
          outbound: config.outbound,
          deniedTools: config.deniedTools,
          allowedTools: config.allowedTools,
          persist: config.persist,
          bufferSize: config.bufferSize
        };
      },
      async clear(ctx) {
        strapi.plugin("mcp-guard").eventLog.clear();
        ctx.body = { ok: true };
      }
    }
  },
  routes: {
    admin: {
      type: "admin",
      routes: [
        {
          method: "GET",
          path: "/events",
          handler: "events.find",
          config: { policies: [{ name: "admin::hasPermissions", config: { actions: [PERMISSION_ACTION] } }] }
        },
        {
          method: "GET",
          path: "/stats",
          handler: "events.stats",
          config: { policies: [{ name: "admin::hasPermissions", config: { actions: [PERMISSION_ACTION] } }] }
        },
        {
          method: "GET",
          path: "/config",
          handler: "events.config",
          config: { policies: [{ name: "admin::hasPermissions", config: { actions: [PERMISSION_ACTION] } }] }
        },
        {
          method: "POST",
          path: "/clear",
          handler: "events.clear",
          config: { policies: [{ name: "admin::hasPermissions", config: { actions: [PERMISSION_ACTION] } }] }
        }
      ]
    }
  }
};
const index = /* @__PURE__ */ getDefaultExportFromCjs(server);
module.exports = index;
