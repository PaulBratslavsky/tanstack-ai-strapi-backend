import { PLUGIN_NAME } from './types';

export { PLUGIN_NAME };

export const PERMISSIONS = [
  // Memory subcategory
  {
    section: 'plugins',
    pluginName: PLUGIN_NAME,
    subCategory: 'memory',
    uid: 'guide.read',
    displayName: 'Read usage guide',
  },
  {
    section: 'plugins',
    pluginName: PLUGIN_NAME,
    subCategory: 'memory',
    uid: 'brief.read',
    displayName: 'Read session briefing',
  },
  {
    section: 'plugins',
    pluginName: PLUGIN_NAME,
    subCategory: 'memory',
    uid: 'stats.read',
    displayName: 'Read knowledge base statistics',
  },
  {
    section: 'plugins',
    pluginName: PLUGIN_NAME,
    subCategory: 'memory',
    uid: 'read',
    displayName: 'Read memory',
  },
  {
    section: 'plugins',
    pluginName: PLUGIN_NAME,
    subCategory: 'memory',
    uid: 'note.write',
    displayName: 'Write notes and links',
  },
  {
    section: 'plugins',
    pluginName: PLUGIN_NAME,
    subCategory: 'memory',
    uid: 'entity.write',
    displayName: 'Upsert and update entities (person, source)',
  },
  {
    section: 'plugins',
    pluginName: PLUGIN_NAME,
    subCategory: 'memory',
    uid: 'decision.write',
    displayName: 'Log decisions',
  },
  
  // Tasks and goals subcategory
  {
    section: 'plugins',
    pluginName: PLUGIN_NAME,
    subCategory: 'tasks and goals',
    uid: 'todo.write',
    displayName: 'Manage to-dos',
  },
  {
    section: 'plugins',
    pluginName: PLUGIN_NAME,
    subCategory: 'tasks and goals',
    uid: 'goal.read',
    displayName: 'Read goals',
  },
  {
    section: 'plugins',
    pluginName: PLUGIN_NAME,
    subCategory: 'tasks and goals',
    uid: 'goal.write',
    displayName: 'Manage goals and check-ins',
  },
  
  // Diagnostics and ops subcategory
  {
    section: 'plugins',
    pluginName: PLUGIN_NAME,
    subCategory: 'diagnostics and ops',
    uid: 'health.read',
    displayName: 'Run health checks',
  },
  {
    section: 'plugins',
    pluginName: PLUGIN_NAME,
    subCategory: 'diagnostics and ops',
    uid: 'meta.write',
    displayName: 'Log retros and gaps',
  },
  {
    section: 'plugins',
    pluginName: PLUGIN_NAME,
    subCategory: 'diagnostics and ops',
    uid: 'retro.update',
    displayName: 'Update retros',
  },
  {
    section: 'plugins',
    pluginName: PLUGIN_NAME,
    subCategory: 'diagnostics and ops',
    uid: 'gap.update',
    displayName: 'Update gaps',
  },
  {
    section: 'plugins',
    pluginName: PLUGIN_NAME,
    subCategory: 'diagnostics and ops',
    uid: 'rule.write',
    displayName: 'Manage routing rules',
  },
  
  // Administration subcategory
  {
    section: 'plugins',
    pluginName: PLUGIN_NAME,
    subCategory: 'administration',
    uid: 'forget',
    displayName: 'Delete records',
  },
];

export const getActionId = (uid: string) => `plugin::${PLUGIN_NAME}.${uid}`;
