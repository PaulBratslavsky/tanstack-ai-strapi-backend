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
 * Content API: ctx.state.auth contains user/apiToken
 * MCP: context may have auth information (verify)
 * 
 * Returns the bound agent or throws.
 */
export const resolveCaller = async (
  strapi: Core.Strapi,
  ctxOrContext: any
): Promise<CallerInfo> => {
  let tokenId: string | undefined;
  let kind: 'content-api' | 'admin' | undefined;

  // Try Content API context first (ctx.state.auth)
  if (ctxOrContext?.state?.auth) {
    const auth = ctxOrContext.state.auth;
    
    if (auth.apiToken) {
      tokenId = auth.apiToken.id;
      kind = 'content-api';
    }
  }

  // Try MCP context (admin tokens)
  // verify: check actual MCP context structure in Strapi 5.60
  if (!tokenId && ctxOrContext?.auth) {
    const auth = ctxOrContext.auth;
    
    // Admin tokens in MCP context
    if (auth.type === 'token' && auth.token?.id) {
      tokenId = auth.token.id;
      kind = 'admin';
    }
  }

  if (!tokenId || !kind) {
    throw new Error('No valid token found in request context');
  }

  // Look up the binding
  const credentialUid = getUid('agent-credential');
  const agentUid = getUid('agent');

  const credentials = await strapi.documents(credentialUid).findMany({
    filters: {
      tokenId: { $eq: tokenId },
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
