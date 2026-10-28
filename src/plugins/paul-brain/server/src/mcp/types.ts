import type { Core } from '@strapi/strapi';

export const PLUGIN_NAME = 'paul-brain';

export interface ToolContext {
  strapi: Core.Strapi;
  userAbility: any;
}

export const CONTENT_TYPES = ['note', 'person', 'project', 'decision', 'source'] as const;
export type ContentType = typeof CONTENT_TYPES[number];

export const getUid = (type: ContentType) => `plugin::${PLUGIN_NAME}.${type}`;
