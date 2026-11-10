/**
 * Prompt injection detection - reuses core patterns from MCP Guard scanner.
 * Imported inline to avoid build-time cross-plugin dependencies.
 */

export interface ScanResult {
  flagged: boolean;
  reason?: string;
}

type Severity = 'high' | 'medium';

type Rule = {
  id: string;
  severity: Severity;
  pattern: RegExp;
};

const RULES: Rule[] = [
  {
    id: 'instruction-override',
    severity: 'high',
    pattern:
      /\b(ignore|disregard|forget|override)\b[\s\S]{0,40}?\b(all\s+)?(previous|prior|earlier|above|preceding)\b[\s\S]{0,40}?\b(instruction|prompt|rule|direction|message|context)s?/i,
  },
  {
    id: 'role-hijack',
    severity: 'high',
    pattern:
      /\b(you are now|from now on,? you|act as an unrestricted|ignore your (?:system|safety)|developer mode|jailbreak)\b/i,
  },
  {
    id: 'system-tag',
    severity: 'high',
    pattern: /<\/?\s*(system|assistant|human|user)\s*>|\[\[?\s*(system|assistant)\s*\]?\]/i,
  },
  {
    id: 'tool-coercion',
    severity: 'high',
    pattern:
      /\b(call|invoke|execute|run|use)\b[\s\S]{0,30}?\b(tool|function|api)\b[\s\S]{0,40}?\b(delete|destroy|publish|unpublish|update|create|drop)\b/i,
  },
  {
    id: 'exfiltration-url',
    severity: 'high',
    pattern: /!?\[[^\]]{0,80}\]\(\s*https?:\/\/[^\s)]{0,200}[?&][^\s)]{0,200}=/i,
  },
  {
    id: 'secret-fishing',
    severity: 'medium',
    pattern:
      /\b(api[\s_-]?key|access[\s_-]?token|secret[\s_-]?key|password|\.env\b|environment variable)/i,
  },
  {
    id: 'hidden-html-comment',
    severity: 'medium',
    pattern: /<!--[\s\S]{0,500}?-->/,
  },
];

const normalizeForMatching = (text: string): string =>
  text
    .replace(/\\u[0-9a-fA-F]{4}/g, '      ')
    .replace(/\\x[0-9a-fA-F]{2}/g, '    ')
    .replace(/\\[nrtbfv"'\\/]/g, '  ');

/**
 * Scan text for prompt injection patterns
 */
export const scanForInjection = (text: string): ScanResult => {
  if (!text || typeof text !== 'string') {
    return { flagged: false };
  }

  const probe = normalizeForMatching(text);
  const findings: Array<{ rule: string; severity: Severity }> = [];

  for (const rule of RULES) {
    if (rule.pattern.test(probe)) {
      findings.push({ rule: rule.id, severity: rule.severity });
    }
  }

  if (findings.length > 0) {
    const highSeverity = findings.filter(f => f.severity === 'high');
    const rules = findings.map(f => f.rule).join(', ');
    
    return {
      flagged: true,
      reason: highSeverity.length > 0 
        ? `High-severity injection patterns detected: ${rules}`
        : `Injection patterns detected: ${rules}`,
    };
  }

  return { flagged: false };
};
