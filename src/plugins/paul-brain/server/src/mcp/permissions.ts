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
    displayName: 'Read brain (recall, get_entity, list_recent, list_retros, list_gaps, list_capabilities, list_rules, list_todos, get_todo)',
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
    uid: 'meta.write',
    displayName: 'Write meta (log_retro, log_gap, record_capability)',
  },
  {
    section: 'plugins',
    pluginName: PLUGIN_NAME,
    uid: 'rule.write',
    displayName: 'Write rules (add_rule)',
  },
  {
    section: 'plugins',
    pluginName: PLUGIN_NAME,
    uid: 'todo.write',
    displayName: 'Write todos (add_todo, update_todo, complete_todo)',
  },
  {
    section: 'plugins',
    pluginName: PLUGIN_NAME,
    uid: 'goal.read',
    displayName: 'Read goals (list_goals, get_goal_progress)',
  },
  {
    section: 'plugins',
    pluginName: PLUGIN_NAME,
    uid: 'goal.write',
    displayName: 'Write goals (add_goal, update_goal, log_checkin)',
  },
  {
    section: 'plugins',
    pluginName: PLUGIN_NAME,
    uid: 'forget',
    displayName: 'Delete entities (forget)',
  },
];

export const getActionId = (uid: string) => `plugin::${PLUGIN_NAME}.${uid}`;
