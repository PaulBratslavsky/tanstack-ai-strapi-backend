/**
 * Prompt-injection heuristics shared by the inbound and outbound halves of the
 * MCP guard middleware.
 *
 * This is defence in depth, NOT a security boundary. Pattern matching cannot
 * stop a determined attacker who controls stored content — the real controls
 * are the admin token's permission scope and the tool allowlist. What this
 * layer buys you is a loud, auditable signal the moment content in your
 * database starts trying to steer the model, plus the option to strip it
 * before it ever reaches the client's context window.
 */

export type Severity = 'high' | 'medium';

export type Rule = {
  id: string;
  severity: Severity;
  description: string;
  pattern: RegExp;
};

export type Finding = {
  rule: string;
  severity: Severity;
  description: string;
  sample: string;
  path: string;
};

/**
 * Zero-width, bidi-override and Unicode "tag" characters. Invisible to a human
 * reviewing content in the admin panel, fully legible to a model.
 */
const INVISIBLE_CHARS = /[\u200B-\u200F\u202A-\u202E\u2060-\u2064\uFEFF]|[\u{E0000}-\u{E007F}]/gu;

/**
 * The same characters in their JSON-escaped form. A tool result carries the
 * record as a JSON string, so a zero-width space arrives as the six literal
 * characters \\u200b rather than the character itself.
 */
const ESCAPED_INVISIBLE = /\\u(?:200[b-f]|202[a-e]|206[0-4]|feff|e0[0-7][0-9a-f])/gi;

export const RULES: Rule[] = [
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

const SAMPLE_CHARS = 120;

/** Collapse whitespace and cap length so a finding is safe to put in a log line. */
const toSample = (text: string): string => {
  const flat = text.replace(/\s+/g, ' ').trim();
  return flat.length > SAMPLE_CHARS ? `${flat.slice(0, SAMPLE_CHARS)}…` : flat;
};

/**
 * MCP tool results embed a record as a JSON *string*, so a real newline in the
 * data arrives as the two characters backslash + n. That trailing `n` is a word
 * character, which glues it to whatever follows and silently defeats every `\b`
 * anchor in the rules above:
 *
 *   /\b(ignore)/i.test('a\nIGNORE')   -> true   (real newline)
 *   /\b(ignore)/i.test('a\\nIGNORE')  -> false  (escaped newline)
 *
 * So we match against a copy with those seams blanked out. The substitutions are
 * deliberately LENGTH-PRESERVING, which lets a match offset found in the copy
 * index straight back into the original string.
 */
const normalizeForMatching = (text: string): string =>
  text
    .replace(/\\u[0-9a-fA-F]{4}/g, '      ') // 6 chars -> 6 spaces
    .replace(/\\x[0-9a-fA-F]{2}/g, '    ') // 4 chars -> 4 spaces
    .replace(/\\[nrtbfv"'\\/]/g, '  '); // 2 chars -> 2 spaces

/** Remove invisible characters in both their raw and JSON-escaped forms. */
export const stripInvisible = (text: string): string =>
  text.replace(INVISIBLE_CHARS, '').replace(ESCAPED_INVISIBLE, '');

const containsInvisible = (text: string): boolean => {
  INVISIBLE_CHARS.lastIndex = 0;
  ESCAPED_INVISIBLE.lastIndex = 0;
  const found = INVISIBLE_CHARS.test(text) || ESCAPED_INVISIBLE.test(text);
  INVISIBLE_CHARS.lastIndex = 0;
  ESCAPED_INVISIBLE.lastIndex = 0;
  return found;
};

/** Run every rule against one string. */
export const scanText = (text: string, path = ''): Finding[] => {
  const findings: Finding[] = [];

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
        // Offsets line up because normalization preserves length.
        sample: toSample(text.slice(match.index, match.index + match[0].length)),
        path,
      });
    }
  }

  return findings;
};

type Span = { start: number; end: number; rules: Set<string> };

/** Strip invisibles and neutralize every rule match in a single string. */
export const sanitizeText = (text: string): string => {
  const base = stripInvisible(text);
  const probe = normalizeForMatching(base);

  const hits: Array<{ start: number; end: number; rule: string }> = [];

  for (const rule of RULES) {
    const global = new RegExp(rule.pattern.source, `${rule.pattern.flags.replace('g', '')}g`);
    let match = global.exec(probe);

    while (match !== null) {
      if (match[0].length === 0) {
        global.lastIndex += 1; // a zero-width match would otherwise loop forever
      } else {
        hits.push({ start: match.index, end: match.index + match[0].length, rule: rule.id });
      }
      match = global.exec(probe);
    }
  }

  if (hits.length === 0) {
    return base;
  }

  // Merge overlapping spans so two rules hitting the same text yield one marker.
  hits.sort((a, b) => a.start - b.start || b.end - a.end);

  const merged: Span[] = [];
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

/** Walk any JSON-ish value and scan every string it contains. */
export const scanValue = (value: unknown, path = '$'): Finding[] => {
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

/** Deep copy of `value` with every string sanitized. */
export const sanitizeValue = <T>(value: T): T => {
  if (typeof value === 'string') {
    return sanitizeText(value) as unknown as T;
  }

  if (Array.isArray(value)) {
    return value.map((item) => sanitizeValue(item)) as unknown as T;
  }

  if (typeof value === 'object' && value !== null) {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, sanitizeValue(item)])
    ) as unknown as T;
  }

  return value;
};

export const hasSeverity = (findings: Finding[], severity: Severity): boolean =>
  findings.some((finding) => finding.severity === severity);

export const formatFindings = (findings: Finding[]): string =>
  findings.map((f) => `${f.rule}@${f.path}`).join(', ');
