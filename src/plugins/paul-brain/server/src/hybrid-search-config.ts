/**
 * Field map paul-brain hands to the generic hybrid-search plugin.
 * The plugin itself does not mention these types.
 * Audit events are operational logs and are not indexed.
 */
export interface BrainHybridTypeConfig {
  fields: string[];
  titleField?: string;
  tagField?: string;
  aliasField?: string;
  pinnedField?: string;
  exclude?: { field: string; equals: string | boolean };
}

const archived = { field: 'archived', equals: true as const };

export const brainHybridSearchTypes: Record<string, BrainHybridTypeConfig> = {
  'plugin::paul-brain.note': {
    fields: ['title', 'body', 'summary', 'howToRecheck', 'videoId', 'source_bot', 'tags', 'aliases'],
    titleField: 'title',
    tagField: 'tags',
    aliasField: 'aliases',
    pinnedField: 'pinned',
    exclude: archived,
  },
  'plugin::paul-brain.person': {
    fields: ['name', 'role', 'org', 'email', 'notes_md', 'aliases'],
    titleField: 'name',
    aliasField: 'aliases',
    exclude: archived,
  },
  'plugin::paul-brain.project': {
    fields: ['name', 'summary', 'goals', 'repo_url', 'url', 'aliases'],
    titleField: 'name',
    aliasField: 'aliases',
    exclude: archived,
  },
  'plugin::paul-brain.decision': {
    fields: ['title', 'context', 'decision', 'rationale', 'aliases'],
    titleField: 'title',
    aliasField: 'aliases',
    exclude: archived,
  },
  'plugin::paul-brain.source': {
    fields: ['title', 'excerpt', 'url', 'videoId', 'external_id', 'aliases'],
    titleField: 'title',
    aliasField: 'aliases',
    exclude: archived,
  },
  'plugin::paul-brain.resource': {
    fields: ['title', 'summary', 'body', 'extractedText', 'altText', 'caption', 'snapshotMarkdown', 'tags'],
    titleField: 'title',
    tagField: 'tags',
    exclude: { field: 'state', equals: 'archived' },
  },
  'plugin::paul-brain.todo': {
    fields: ['title', 'goal', 'acceptanceCriteria', 'context', 'waitingOn', 'closingNote', 'capturedBy'],
    titleField: 'title',
  },
  'plugin::paul-brain.retro': {
    fields: ['title', 'task', 'failure', 'fix', 'fixLocation'],
    titleField: 'title',
  },
  'plugin::paul-brain.gap': {
    fields: ['title', 'request', 'whatWasNeeded'],
    titleField: 'title',
  },
  'plugin::paul-brain.capability': {
    fields: ['system', 'capability', 'howVerified', 'notes'],
    titleField: 'system',
  },
  'plugin::paul-brain.rule': {
    fields: ['name', 'match', 'action'],
    titleField: 'name',
  },
  'plugin::paul-brain.goal': {
    fields: ['title', 'description', 'target'],
    titleField: 'title',
  },
  'plugin::paul-brain.goal-checkin': {
    fields: ['note', 'loggedBy'],
    titleField: 'note',
  },
};
