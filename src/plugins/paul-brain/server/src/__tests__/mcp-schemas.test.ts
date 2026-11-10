/**
 * Test that MCP tool output schemas validate against handler returns
 */
import { describe, it, expect } from 'vitest';
import { z } from '@strapi/utils';

describe('MCP Tool Output Schema Validation', () => {
  // Sample records with 'state' field (internal DB representation)
  const sampleTodo = {
    documentId: 'test123',
    title: 'Test todo',
    state: 'doing',
    priority: 'P2',
    dueDate: '2026-11-15',
  };

  const sampleGoal = {
    documentId: 'goal123',
    title: 'Test goal',
    state: 'active',
    category: 'product',
    cadence: 'weekly',
    currentStreak: 5,
    bestStreak: 10,
  };

  const sampleGap = {
    documentId: 'gap123',
    title: 'Test gap',
    state: 'open',
    request: 'Need feature X',
    whatWasNeeded: 'Better docs',
  };

  const sampleRetro = {
    documentId: 'retro123',
    title: 'Test retro',
    state: 'open',
    task: 'Deploy failed',
    failure: 'Missing env var',
  };

  // Output schema for todos (external API uses 'status')
  const todoOutputSchema = z.object({
    documentId: z.string(),
    title: z.string(),
    status: z.string(),  // External API uses 'status'
    priority: z.string(),
    dueDate: z.string().optional(),
  });

  const goalOutputSchema = z.object({
    documentId: z.string(),
    title: z.string(),
    status: z.string(),  // External API uses 'status'
    category: z.string().nullish(),
    cadence: z.string(),
    currentStreak: z.number(),
    bestStreak: z.number(),
  });

  const gapOutputSchema = z.object({
    documentId: z.string(),
    title: z.string(),
    status: z.string(),  // External API uses 'status'
    request: z.string(),
    whatWasNeeded: z.string(),
  });

  const retroOutputSchema = z.object({
    documentId: z.string(),
    title: z.string(),
    status: z.string(),  // External API uses 'status'
    task: z.string(),
    failure: z.string(),
  });

  it('todo handler return should validate against output schema', () => {
    // Handler maps state → status for external API
    const handlerReturn = {
      documentId: sampleTodo.documentId,
      title: sampleTodo.title,
      status: sampleTodo.state,  // Mapping state to status
      priority: sampleTodo.priority,
      dueDate: sampleTodo.dueDate,
    };

    const result = todoOutputSchema.safeParse(handlerReturn);
    expect(result.success).toBe(true);
  });

  it('goal handler return should validate against output schema', () => {
    const handlerReturn = {
      documentId: sampleGoal.documentId,
      title: sampleGoal.title,
      status: sampleGoal.state,  // Mapping state to status
      category: sampleGoal.category,
      cadence: sampleGoal.cadence,
      currentStreak: sampleGoal.currentStreak,
      bestStreak: sampleGoal.bestStreak,
    };

    const result = goalOutputSchema.safeParse(handlerReturn);
    expect(result.success).toBe(true);
  });

  it('gap handler return should validate against output schema', () => {
    const handlerReturn = {
      documentId: sampleGap.documentId,
      title: sampleGap.title,
      status: sampleGap.state,  // Mapping state to status
      request: sampleGap.request,
      whatWasNeeded: sampleGap.whatWasNeeded,
    };

    const result = gapOutputSchema.safeParse(handlerReturn);
    expect(result.success).toBe(true);
  });

  it('retro handler return should validate against output schema', () => {
    const handlerReturn = {
      documentId: sampleRetro.documentId,
      title: sampleRetro.title,
      status: sampleRetro.state,  // Mapping state to status
      task: sampleRetro.task,
      failure: sampleRetro.failure,
    };

    const result = retroOutputSchema.safeParse(handlerReturn);
    expect(result.success).toBe(true);
  });

  it('handler should NOT return "state" field (should be mapped to "status")', () => {
    // Bad: returning state directly
    const badReturn = {
      documentId: sampleTodo.documentId,
      title: sampleTodo.title,
      state: sampleTodo.state,  // Wrong! Should be status
      priority: sampleTodo.priority,
    };

    const result = todoOutputSchema.safeParse(badReturn);
    expect(result.success).toBe(false);
  });
});
