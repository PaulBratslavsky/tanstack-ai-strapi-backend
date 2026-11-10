import { PLUGIN_NAME } from './types';

export { PLUGIN_NAME };

export const PERMISSIONS = [
  // Directory subcategory
  {
    section: 'plugins',
    pluginName: PLUGIN_NAME,
    subCategory: 'directory',
    uid: 'agent.read',
    displayName: 'List agents and public capability cards',
  },
  {
    section: 'plugins',
    pluginName: PLUGIN_NAME,
    subCategory: 'directory',
    uid: 'agent.manage',
    displayName: 'Create and update agents, bind credentials, kill switch',
  },

  // Messaging subcategory
  {
    section: 'plugins',
    pluginName: PLUGIN_NAME,
    subCategory: 'messaging',
    uid: 'message.send',
    displayName: 'Send a message',
  },
  {
    section: 'plugins',
    pluginName: PLUGIN_NAME,
    subCategory: 'messaging',
    uid: 'message.inbox',
    displayName: 'Read and process own inbox (get, claim, reply, status, proof)',
  },
  {
    section: 'plugins',
    pluginName: PLUGIN_NAME,
    subCategory: 'messaging',
    uid: 'message.manage',
    displayName: 'Orchestrator: read any thread, delegate, cancel, triage, waive proof',
  },

  // Approvals subcategory
  {
    section: 'plugins',
    pluginName: PLUGIN_NAME,
    subCategory: 'approvals',
    uid: 'approval.read',
    displayName: 'List pending approvals',
  },
  {
    section: 'plugins',
    pluginName: PLUGIN_NAME,
    subCategory: 'approvals',
    uid: 'approval.decide',
    displayName: 'Approve, reject, or veto',
  },

  // Operations subcategory
  {
    section: 'plugins',
    pluginName: PLUGIN_NAME,
    subCategory: 'operations',
    uid: 'delivery.read',
    displayName: 'Inspect webhook deliveries',
  },
  {
    section: 'plugins',
    pluginName: PLUGIN_NAME,
    subCategory: 'operations',
    uid: 'audit.read',
    displayName: 'Read audit events',
  },
];

export const getActionId = (uid: string) => `plugin::${PLUGIN_NAME}.${uid}`;
