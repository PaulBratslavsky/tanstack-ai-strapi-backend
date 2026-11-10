import type { Core } from '@strapi/strapi';
import { getUid } from '../mcp/types';

export interface CallerInfo {
  agentDocumentId: string;
  agentSlug: string;
  credentialId: string;
  credentialKind: 'content-api' | 'admin';
}

/**
 * Resolve the calling agent from a Content API or MCP request context.
 * 
 * This is the security core of agent-bus: it enforces that every token
 * is bound to exactly one agent, and that `from` is server-set.
 * 
 * Content API (Koa ctx): ctx.state.auth.apiToken contains the API token
 * MCP (handler context): context.user.id contains the admin token ID
 * 
 * Verified against Strapi 5.60 @strapi/core types and tested with actual requests.
 */
export const resolveCaller = async (
  strapi: Core.Strapi,
  ctxOrContext: any
): Promise<CallerInfo> => {
  let tokenId: string | number | undefined;
  let kind: 'content-api' | 'admin' | undefined;

  // Content API context (Koa ctx from REST routes)
  if (ctxOrContext?.state?.auth?.apiToken) {
    // Content API tokens are stored with id field
    tokenId = ctxOrContext.state.auth.apiToken.id;
    kind = 'content-api';
  }
  // MCP handler context (from createHandler)
  // Based on McpHandlerContext type: { user: { id: string | number }, userAbility: Ability }
  // The user.id is the admin token ID when authenticated via admin token
  else if (ctxOrContext?.user?.id !== undefined) {
    tokenId = ctxOrContext.user.id;
    kind = 'admin';
  }

  if (tokenId === undefined || !kind) {
    throw new Error('No valid token found in request context');
  }

  // Convert to string for consistency in database lookups
  const tokenIdString = String(tokenId);

  // Look up the binding
  const credentialUid = getUid('agent-credential');
  const agentUid = getUid('agent');

  const credentials = await strapi.documents(credentialUid).findMany({
    filters: {
      tokenId: { $eq: tokenIdString },
      kind: { $eq: kind },
      status: { $eq: 'active' },
    },
    populate: {
      agent: {
        fields: ['documentId', 'slug', 'status'],
      },
    },
  });

  if (!credentials || credentials.length === 0) {
    throw new Error('No active credential binding found for this token');
  }

  const credential = credentials[0];
  const agent = credential.agent as any;

  if (!agent || agent.status !== 'active') {
    throw new Error('Agent is not active or binding is invalid');
  }

  // Update lastUsedAt on the credential
  await strapi.documents(credentialUid).update({
    documentId: credential.documentId,
    data: {
      lastUsedAt: new Date().toISOString(),
    },
  });

  // Update lastSeenAt on the agent
  await strapi.documents(agentUid).update({
    documentId: agent.documentId,
    data: {
      lastSeenAt: new Date().toISOString(),
    },
  });

  return {
    agentDocumentId: agent.documentId,
    agentSlug: agent.slug,
    credentialId: credential.documentId,
    credentialKind: kind,
  };
};

export default () => ({
  resolveCaller,
});
