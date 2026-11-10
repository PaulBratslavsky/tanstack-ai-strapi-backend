'use strict';

const EVENT_UID = 'plugin::mcp-guard.event';

/**
 * Records what the guard did on every MCP request.
 *
 * Two tiers, because they answer different questions:
 *   - a ring buffer, always on, zero DB writes on the hot path. This is what
 *     the dashboard polls. It resets when the server restarts.
 *   - optional persistence to a content type, behind `persist: true`, for
 *     events that need to outlive a restart or be audited later.
 *
 * Persistence never blocks the request: writes are fire-and-forget and a
 * failure is logged, not thrown. A guard that takes the endpoint down when its
 * own audit table misbehaves would be worse than no guard.
 */
const createEventLog = ({ strapi, config }) => {
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
    clean: 0,
  };

  const push = (event) => {
    sequence += 1;
    const record = { id: sequence, ...event };

    buffer.push(record);
    if (buffer.length > capacity) {
      buffer.splice(0, buffer.length - capacity);
    }

    totals.requests += 1;
    if (record.method === 'tools/call') {
      totals.toolCalls += 1;
    }
    if (totals[record.action] !== undefined) {
      totals[record.action] += 1;
    }

    if (config.persist === true) {
      persist(record);
    }

    return record;
  };

  const persist = (record) => {
    strapi
      .documents(EVENT_UID)
      .create({
        data: {
          occurredAt: record.occurredAt,
          method: record.method,
          tool: record.tool,
          action: record.action,
          adminUser: record.adminUser === null ? null : String(record.adminUser),
          httpStatus: record.httpStatus,
          durationMs: record.durationMs,
          reason: record.reason,
          findings: record.findings,
        },
      })
      .catch((error) => {
        strapi.log.error(`[mcp-guard] failed to persist event: ${error.message}`);
      });
  };

  return {
    push,

    /** Newest first, optionally filtered. */
    list({ limit = 50, action, method, onlyFindings = false } = {}) {
      let events = [...buffer].reverse();

      if (action !== undefined && action !== '' && action !== 'all') {
        events = events.filter((event) => event.action === action);
      }
      if (method !== undefined && method !== '' && method !== 'all') {
        events = events.filter((event) => event.method === method);
      }
      if (onlyFindings === true) {
        events = events.filter((event) => event.findings.length > 0);
      }

      return events.slice(0, limit);
    },

    stats() {
      const withFindings = buffer.filter((event) => event.findings.length > 0);

      const ruleCounts = new Map();
      for (const event of withFindings) {
        for (const finding of event.findings) {
          ruleCounts.set(finding.rule, (ruleCounts.get(finding.rule) ?? 0) + 1);
        }
      }

      const durations = buffer
        .filter((event) => typeof event.durationMs === 'number')
        .map((event) => event.durationMs)
        .sort((a, b) => a - b);

      return {
        totals: { ...totals },
        buffered: buffer.length,
        capacity,
        persisting: config.persist === true,
        eventsWithFindings: withFindings.length,
        medianDurationMs:
          durations.length === 0 ? null : Number(durations[Math.floor(durations.length / 2)].toFixed(1)),
        topRules: [...ruleCounts.entries()]
          .map(([rule, count]) => ({ rule, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 8),
        lastEventAt: buffer.length === 0 ? null : buffer[buffer.length - 1].occurredAt,
      };
    },

    clear() {
      buffer.length = 0;
      for (const key of Object.keys(totals)) {
        totals[key] = 0;
      }
    },
  };
};

module.exports = { createEventLog, EVENT_UID };
