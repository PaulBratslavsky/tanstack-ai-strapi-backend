import { PLUGIN_NAME } from './types';

export { PLUGIN_NAME };

export const PERMISSIONS = [
  {
    section: 'plugins',
    pluginName: PLUGIN_NAME,
    uid: 'guide.read',
    displayName: 'Read brain guide',
  },
  {
    section: 'plugins',
    pluginName: PLUGIN_NAME,
    uid: 'read',
    displayName: 'Read brain (recall, get_entity, list_recent)',
  },
  {
    section: 'plugins',
    pluginName: PLUGIN_NAME,
    uid: 'note.write',
    displayName: 'Write notes (remember, update_note, link)',
  },
  {
    section: 'plugins',
    pluginName: PLUGIN_NAME,
    uid: 'decision.write',
    displayName: 'Write decisions (log_decision)',
  },
  {
    section: 'plugins',
    pluginName: PLUGIN_NAME,
    uid: 'forget',
    displayName: 'Delete entities (forget)',
  },
];

export const getActionId = (uid: string) => `plugin::${PLUGIN_NAME}.${uid}`;
