'use strict';

/**
 * Prompt-injection heuristics. Defence in depth, not a security boundary —
 * the real controls are the admin token's permission scope and the tool
 * denylist. See MCP-GUARD.md for the reasoning.
 */

const INVISIBLE_CHARS = /[\u200B-\u200F\u202A-\u202E\u2060-\u2064\uFEFF]|[\u{E0000}-\u{E007F}]/gu;

/** The same characters JSON-escaped, e.g. the six literal chars \\u200b. */
const ESCAPED_INVISIBLE = /\\u(?:200[b-f]|202[a-e]|206[0-4]|feff|e0[0-7][0-9a-f])/gi;

const RULES = [
  {
    id: 'instruction-override',
    severity: 'high',
    description: 'Attempts to void earlier instructions',
    pattern:
      /\b(ignore|disregard|forget|override)\b[\s\S]{0,40}?\b(all\s+)?(previous|prior|earlier|above|preceding)\b[\s\S]{0,40}?\b(instruction|prompt|rule|direction|message|context)s?/i,
  },
  {
    id: 'role-hijack',
    severity: 'high',
    description: 'Tries to reassign the assistant persona or unlock restrictions',
    pattern:
      /\b(you are now|from now on,? you|act as an unrestricted|ignore your (?:system|safety)|developer mode|jailbreak)\b/i,
  },
  {
    id: 'system-tag',
    severity: 'high',
    description: 'Forged conversation-role or system markers',
    pattern: /<\/?\s*(system|assistant|human|user)\s*>|\[\[?\s*(system|assistant)\s*\]?\]/i,
  },
  {
    id: 'tool-coercion',
    severity: 'high',
    description: 'Instructs the model to invoke a tool or mutate data',
    pattern:
      /\b(call|invoke|execute|run|use)\b[\s\S]{0,30}?\b(tool|function|api)\b[\s\S]{0,40}?\b(delete|destroy|publish|unpublish|update|create|drop)\b/i,
  },
  {
    id: 'exfiltration-url',
    severity: 'high',
    description: 'Markdown image/link that would leak data into a query string',
    pattern: /!?\[[^\]]{0,80}\]\(\s*https?:\/\/[^\s)]{0,200}[?&][^\s)]{0,200}=/i,
  },
  {
    id: 'secret-fishing',
    severity: 'medium',
    description: 'Mentions credentials or environment secrets',
    pattern:
      /\b(api[\s_-]?key|access[\s_-]?token|secret[\s_-]?key|password|\.env\b|environment variable)/i,
  },
  {
    id: 'hidden-html-comment',
    severity: 'medium',
    description: 'HTML comment — invisible when rendered, visible to the model',
    pattern: /<!--[\s\S]{0,500}?-->/,
  },
];

const SAMPLE_CHARS = 160;

const toSample = (text) => {
  const flat = text.replace(/\s+/g, ' ').trim();
  return flat.length > SAMPLE_CHARS ? `${flat.slice(0, SAMPLE_CHARS)}…` : flat;
};

/**
 * MCP returns a record inside `content[0].text` as a JSON *string*, so a real
 * newline arrives as the two characters backslash + n. That trailing `n` is a
 * word character: it glues onto the next token and defeats every `\b` anchor.
 *
 *   /\b(ignore)/i.test('a\nIGNORE')   -> true
 *   /\b(ignore)/i.test('a\\nIGNORE')  -> false
 *
 * Match against a copy with the seams blanked out. Substitutions are
 * LENGTH-PRESERVING so offsets still index into the original string.
 */
const normalizeForMatching = (text) =>
  text
    .replace(/\\u[0-9a-fA-F]{4}/g, '      ')
    .replace(/\\x[0-9a-fA-F]{2}/g, '    ')
    .replace(/\\[nrtbfv"'\\/]/g, '  ');

const stripInvisible = (text) =>
  text.replace(INVISIBLE_CHARS, '').replace(ESCAPED_INVISIBLE, '');

const containsInvisible = (text) => {
  INVISIBLE_CHARS.lastIndex = 0;
  ESCAPED_INVISIBLE.lastIndex = 0;
  const found = INVISIBLE_CHARS.test(text) || ESCAPED_INVISIBLE.test(text);
  INVISIBLE_CHARS.lastIndex = 0;
  ESCAPED_INVISIBLE.lastIndex = 0;
  return found;
};

const scanText = (text, path = '') => {
  const findings = [];

  if (containsInvisible(text)) {
    findings.push({
      rule: 'invisible-characters',
      severity: 'high',
      description: 'Zero-width or Unicode tag characters hidden in the text',
      sample: toSample(text),
      path,
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
        path,
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
    const global = new RegExp(rule.pattern.source, `${rule.pattern.flags.replace('g', '')}g`);
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
    if (last !== undefined && hit.start <= last.end) {
      last.end = Math.max(last.end, hit.end);
      last.rules.add(hit.rule);
    } else {
      merged.push({ start: hit.start, end: hit.end, rules: new Set([hit.rule]) });
    }
  }

  let output = '';
  let cursor = 0;

  for (const span of merged) {
    const label = [...span.rules].join('+');
    output += `${base.slice(cursor, span.start)}[removed: possible prompt injection — ${label}]`;
    cursor = span.end;
  }

  return output + base.slice(cursor);
};

const scanValue = (value, path = '$') => {
  if (typeof value === 'string') {
    return scanText(value, path);
  }
  if (Array.isArray(value)) {
    return value.flatMap((item, index) => scanValue(item, `${path}[${index}]`));
  }
  if (typeof value === 'object' && value !== null) {
    return Object.entries(value).flatMap(([key, item]) => scanValue(item, `${path}.${key}`));
  }
  return [];
};

const sanitizeValue = (value) => {
  if (typeof value === 'string') {
    return sanitizeText(value);
  }
  if (Array.isArray(value)) {
    return value.map(sanitizeValue);
  }
  if (typeof value === 'object' && value !== null) {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, sanitizeValue(v)]));
  }
  return value;
};

const hasSeverity = (findings, severity) => findings.some((f) => f.severity === severity);

const formatFindings = (findings) => findings.map((f) => `${f.rule}@${f.path}`).join(', ');

/** Collapse duplicate rule hits so the dashboard shows one row per rule. */
const summarizeFindings = (findings) => {
  const byRule = new Map();

  for (const finding of findings) {
    const existing = byRule.get(finding.rule);
    if (existing === undefined) {
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

module.exports = {
  RULES,
  scanText,
  sanitizeText,
  scanValue,
  sanitizeValue,
  stripInvisible,
  hasSeverity,
  formatFindings,
  summarizeFindings,
};
