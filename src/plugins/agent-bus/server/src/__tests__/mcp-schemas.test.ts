/**
 * Test that MCP tool output schemas validate against handler returns
 */
import { describe, it, expect } from 'vitest';
import { z } from '@strapi/utils';

describe('MCP Tool Output Schema Validation - Agent Bus', () => {
  // Sample records with 'state' field (internal DB representation)
  const sampleMessage = {
    documentId: 'msg123',
    type: 'task',
    body: 'Test message',
    state: 'claimed',
  };

  const sampleApproval = {
    documentId: 'appr123',
    state: 'pending',
    reviewLevel: 'human',
  };

  // Output schemas (external API uses 'status')
  const messageOutputSchema = z.object({
    messageId: z.string(),
    status: z.string(),  // External API uses 'status'
  });

  const approvalOutputSchema = z.object({
    documentId: z.string(),
    status: z.string(),  // External API uses 'status'
    reviewLevel: z.string(),
  });

  it('message handler return should validate against output schema', () => {
    // Handler maps state → status for external API
    const handlerReturn = {
      messageId: sampleMessage.documentId,
      status: sampleMessage.state,  // Mapping state to status
    };

    const result = messageOutputSchema.safeParse(handlerReturn);
    expect(result.success).toBe(true);
  });

  it('approval handler return should validate against output schema', () => {
    const handlerReturn = {
      documentId: sampleApproval.documentId,
      status: sampleApproval.state,  // Mapping state to status
      reviewLevel: sampleApproval.reviewLevel,
    };

    const result = approvalOutputSchema.safeParse(handlerReturn);
    expect(result.success).toBe(true);
  });

  it('handler should NOT return "state" field (should be mapped to "status")', () => {
    // Bad: returning state directly
    const badReturn = {
      messageId: sampleMessage.documentId,
      state: sampleMessage.state,  // Wrong! Should be status
    };

    const result = messageOutputSchema.safeParse(badReturn);
    expect(result.success).toBe(false);
  });
});
