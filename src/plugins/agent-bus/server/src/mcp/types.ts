export const PLUGIN_NAME = 'agent-bus';

export const getUid = (contentType: string) => `plugin::${PLUGIN_NAME}.${contentType}`;
