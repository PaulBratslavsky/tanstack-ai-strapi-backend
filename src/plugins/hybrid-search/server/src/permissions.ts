export const PLUGIN_NAME = 'hybrid-search';

/**
 * Registered on every boot, with or without OPENAI_API_KEY.
 * Gating these on the key lets cleanPermissionsInDatabase() delete them
 * the next time the process starts without the key (yt-kb #8 / PR #45).
 */
export const PERMISSIONS = [
  {
    section: 'plugins',
    pluginName: PLUGIN_NAME,
    subCategory: 'search',
    uid: 'read',
    displayName: 'Search and view hybrid search status',
  },
  {
    section: 'plugins',
    pluginName: PLUGIN_NAME,
    subCategory: 'search',
    uid: 'reindex',
    displayName: 'Rebuild the hybrid search index',
  },
];

export const READ_ACTION = `plugin::${PLUGIN_NAME}.read`;
export const REINDEX_ACTION = `plugin::${PLUGIN_NAME}.reindex`;
