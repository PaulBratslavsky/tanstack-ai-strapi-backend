/**
 * Simple prompt injection detector.
 * Flags suspicious patterns that might try to override instructions.
 * 
 * This is a conservative check - we flag and log, but still deliver the message.
 */

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
  /what\s+(are|were)\s+your\s+original\s+instructions?/i,
];

export interface ScanResult {
  flagged: boolean;
  reason?: string;
}

export const scanForInjection = (text: string): ScanResult => {
  if (!text || typeof text !== 'string') {
    return { flagged: false };
  }

  for (const pattern of SUSPICIOUS_PATTERNS) {
    if (pattern.test(text)) {
      return {
        flagged: true,
        reason: `Suspicious pattern detected: ${pattern.source}`,
      };
    }
  }

  return { flagged: false };
};
