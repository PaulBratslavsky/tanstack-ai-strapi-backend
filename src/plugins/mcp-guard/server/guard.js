'use strict';

const {
  formatFindings,
  hasSeverity,
  sanitizeValue,
  scanValue,
  summarizeFindings,
} = require('./scanner');

/**
 * The guard middleware, as installed by the plugin.
 *
 * Identical interception strategy to the app-level version (see MCP-GUARD.md),
 * with one difference: instead of writing to strapi.log it records a structured
 * event, which the admin dashboard reads back.
 */

const MAX_ARG_LOG_CHARS = 400;
const REDACTED_KEYS = /^(password|token|secret|apiKey|authorization|accessKey)$/i;

const asMessages = (body) => {
  const list = Array.isArray(body) ? body : [body];
  return list.filter((item) => typeof item === 'object' && item !== null);
};

const summarizeArgs = (args) => {
  if (args === undefined || args === null) {
    return '{}';
  }
  const json = JSON.stringify(args, (key, value) =>
    REDACTED_KEYS.test(key) ? '[redacted]' : value
  );
  return json.length > MAX_ARG_LOG_CHARS ? `${json.slice(0, MAX_ARG_LOG_CHARS)}…` : json;
};

const resultPayload = (result) => ({
  content: result.content,
  structuredContent: result.structuredContent,
});

const blockedResult = (findings) => ({
  isError: true,
  content: [
    {
      type: 'text',
      text:
        'Blocked by mcp-guard: the stored content in this result matched prompt-injection ' +
        `rules (${formatFindings(findings)}). Inspect the record in the Strapi admin panel.`,
    },
  ],
});

const transformSse = (raw, transform) =>
  raw
    .split('\n\n')
    .map((frame) => {
      if (frame.trim() === '') {
        return frame;
      }

      const lines = frame.split('\n');
      const dataLines = lines.filter((line) => line.startsWith('data:'));

      if (dataLines.length === 0) {
        return frame;
      }

      const payload = dataLines.map((line) => line.slice('data:'.length).trim()).join('\n');

      let message;
      try {
        message = JSON.parse(payload);
      } catch {
        return frame;
      }

      const rewritten = JSON.stringify(transform(message));
      const otherLines = lines.filter((line) => !line.startsWith('data:'));

      return [...otherLines, `data: ${rewritten}`].join('\n');
    })
    .join('\n\n');

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
  return key === undefined ? '' : String(headers[key]);
};

const createGuardMiddleware = ({ strapi, config, eventLog }) => {
  return async (ctx, next) => {
    if (ctx.path !== config.path || ctx.method !== 'POST') {
      return next();
    }

    const startedAt = process.hrtime.bigint();
    const messages = asMessages(ctx.request.body);
    const primary = messages.find((m) => typeof m.method === 'string') ?? {};

    const elapsed = () => Number(process.hrtime.bigint() - startedAt) / 1e6;

    const record = (event) =>
      eventLog.push({
        occurredAt: new Date().toISOString(),
        method: primary.method ?? 'unknown',
        tool: primary.params?.name ?? null,
        adminUser: ctx.state.user?.id ?? null,
        httpStatus: ctx.res.statusCode,
        durationMs: Number(elapsed().toFixed(1)),
        args: config.logArgs ? summarizeArgs(primary.params?.arguments) : null,
        reason: null,
        findings: [],
        ...event,
      });

    /** Reply with a JSON-RPC error and never reach the MCP handler. */
    const reject = (httpStatus, code, message, id = null, findings = []) => {
      ctx.status = httpStatus;
      ctx.body = { jsonrpc: '2.0', error: { code, message }, id: id ?? null };
      record({ action: 'rejected', httpStatus, reason: message, findings });
      strapi.log.warn(`[mcp-guard] rejected: ${message}`);
    };

    // --- 1. inbound validation ----------------------------------------------

    if (messages.length === 0) {
      return reject(400, -32600, 'Invalid Request: body is not a JSON-RPC message');
    }

    for (const message of messages) {
      if (typeof message.method !== 'string') {
        continue;
      }

      if (config.allowedMethods.includes(message.method) === false) {
        return reject(403, -32601, `Method not allowed: ${message.method}`, message.id);
      }

      if (message.method !== 'tools/call') {
        continue;
      }

      const toolName = message.params?.name;

      if (typeof toolName !== 'string' || toolName === '') {
        return reject(400, -32602, 'Invalid params: tools/call requires params.name', message.id);
      }

      if (config.allowedTools !== null && config.allowedTools.includes(toolName) === false) {
        return reject(403, -32000, `Tool not allowed: ${toolName}`, message.id);
      }

      if (config.deniedTools.includes(toolName)) {
        return reject(403, -32000, `Tool denied: ${toolName}`, message.id);
      }

      const argBytes = Buffer.byteLength(JSON.stringify(message.params?.arguments ?? {}), 'utf8');

      if (argBytes > config.maxArgBytes) {
        return reject(
          413,
          -32602,
          `Arguments too large: ${argBytes} bytes exceeds ${config.maxArgBytes}`,
          message.id
        );
      }

      if (config.inbound !== 'off') {
        const findings = scanValue(message.params?.arguments ?? {}, '$.arguments');

        if (findings.length > 0 && config.inbound === 'block' && hasSeverity(findings, 'high')) {
          return reject(
            403,
            -32000,
            `Blocked: tool arguments matched prompt-injection rules (${formatFindings(findings)})`,
            message.id,
            summarizeFindings(findings)
          );
        }

        if (findings.length > 0) {
          strapi.log.warn(
            `[mcp-guard] inbound findings on ${toolName}: ${formatFindings(findings)}`
          );
        }
      }
    }

    // --- 2. outbound capture --------------------------------------------------

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
      if (chunk === undefined || chunk === null || typeof chunk === 'function') {
        return null;
      }
      if (Buffer.isBuffer(chunk)) {
        return chunk;
      }
      // @hono/node-server pipes the web stream as Uint8Array. Stringifying one
      // yields "101,118,101,…" (comma-joined byte values), so convert by view.
      if (ArrayBuffer.isView(chunk)) {
        return Buffer.from(chunk.buffer, chunk.byteOffset, chunk.byteLength);
      }
      if (chunk instanceof ArrayBuffer) {
        return Buffer.from(chunk);
      }
      if (typeof chunk === 'string') {
        return Buffer.from(chunk, typeof encoding === 'string' ? encoding : 'utf8');
      }
      return null;
    };

    // Only the FIRST writeHead wins. Because we swallow the real one, Node still
    // considers the headers unsent, so the first res.write() triggers
    // _implicitHeader() -> writeHead(res.statusCode) with Koa's default 404,
    // which would clobber the 200 the transport already set.
    res.writeHead = (status, arg2, arg3) => {
      if (head === null) {
        const headers = (typeof arg2 === 'object' && arg2 !== null ? arg2 : arg3) ?? {};
        head = { status, headers };
      }
      return res;
    };

    res.write = (chunk, encoding, callback) => {
      const buffer = toBuffer(chunk, encoding);
      if (buffer !== null) {
        chunks.push(buffer);
      }
      const done = typeof encoding === 'function' ? encoding : callback;
      if (typeof done === 'function') {
        done();
      }
      return true;
    };

    const transformMessage = (message) => {
      if (message.result === undefined || message.result === null || config.outbound === 'off') {
        // A JSON-RPC `error` member means the SDK refused the call outright
        // (unknown tool, bad params). Worth surfacing as its own outcome —
        // reporting it as "clean" on a security dashboard reads as success.
        if (message.error !== undefined && message.error !== null) {
          toolError = true;
        }
        return message;
      }

      // A tool that ran but returned isError: true is also not a success.
      if (message.result.isError === true) {
        toolError = true;
      }

      const findings = scanValue(resultPayload(message.result), '$.result');

      if (findings.length === 0) {
        return message;
      }

      outboundFindings.push(...findings);

      if (config.outbound === 'warn') {
        return message;
      }

      if (config.outbound === 'block' && hasSeverity(findings, 'high')) {
        blocked = true;
        return { ...message, result: blockedResult(findings) };
      }

      if (config.outbound === 'sanitize') {
        sanitized = true;
        return {
          ...message,
          result: {
            ...message.result,
            content: sanitizeValue(message.result.content),
            structuredContent: sanitizeValue(message.result.structuredContent),
          },
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

      const raw = Buffer.concat(chunks).toString('utf8');
      const contentType =
        head === null
          ? String(res.getHeader('content-type') ?? '')
          : headerValue(head.headers, 'content-type');

      let output = raw;
      if (raw !== '') {
        output = contentType.includes('text/event-stream')
          ? transformSse(raw, transformMessage)
          : transformJson(raw, transformMessage);
      }

      const outBuffer = Buffer.from(output, 'utf8');

      if (head !== null) {
        const headers = { ...head.headers };
        const lengthKey = Object.keys(headers).find((k) => k.toLowerCase() === 'content-length');
        if (lengthKey !== undefined) {
          headers[lengthKey] = String(outBuffer.byteLength);
        }
        originalWriteHead(head.status, headers);
      } else if (res.getHeader('content-length') !== undefined) {
        res.setHeader('content-length', String(outBuffer.byteLength));
      }

      if (outBuffer.byteLength > 0) {
        originalWrite(outBuffer);
      }

      const done =
        typeof chunk === 'function' ? chunk : typeof encoding === 'function' ? encoding : callback;
      return originalEnd(typeof done === 'function' ? done : undefined);
    };

    // --- 3. run the handler, then record -------------------------------------

    try {
      await next();
    } finally {
      const action = blocked
        ? 'blocked'
        : sanitized
          ? 'sanitized'
          : toolError
            ? 'errored'
            : 'clean';
      const findings = summarizeFindings(outboundFindings);

      record({ action, findings });

      if (outboundFindings.length > 0) {
        strapi.log.warn(
          `[mcp-guard] ${action} ${primary.params?.name ?? primary.method}: ` +
            `${findings.map((f) => f.rule).join(', ')}`
        );
      }
    }
  };
};

module.exports = { createGuardMiddleware };
