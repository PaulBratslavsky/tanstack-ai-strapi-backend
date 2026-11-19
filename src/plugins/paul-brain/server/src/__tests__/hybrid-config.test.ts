import { describe, expect, it } from 'vitest';
import { brainHybridSearchTypes } from '../hybrid-search-config';
import { CONTENT_TYPES } from '../mcp/types';

describe('hybrid search config', () => {
  it('indexes every brain content type and skips audit events', () => {
    const uids = Object.keys(brainHybridSearchTypes).sort();
    expect(uids).toEqual(CONTENT_TYPES.map((type) => `plugin::paul-brain.${type}`).sort());
    expect(uids.some((uid) => uid.includes('audit'))).toBe(false);
    expect(brainHybridSearchTypes['plugin::paul-brain.resource'].fields).toEqual(
      expect.arrayContaining(['extractedText', 'caption', 'snapshotMarkdown', 'body'])
    );
    expect(brainHybridSearchTypes['plugin::paul-brain.note'].tagField).toBe('tags');
    expect(brainHybridSearchTypes['plugin::paul-brain.note'].aliasField).toBe('aliases');
    expect(brainHybridSearchTypes['plugin::paul-brain.resource'].exclude).toEqual({
      field: 'state',
      equals: 'archived',
    });
  });
});
