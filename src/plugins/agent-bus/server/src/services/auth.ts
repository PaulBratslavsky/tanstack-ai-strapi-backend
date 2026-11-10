import type { Core } from '@strapi/strapi';
import { getUid } from '../mcp/types';

export interface CallerInfo {
  agentDocumentId: string;
  agentSlug: string;
  credentialId: string;
  credentialKind: 'content-api' | 'admin';
}

/**
 * Extract bearer token from authorization header
 */
const extractBearerToken = (authorization: string | undefined): string | null => {
  if (!authorization) {
    return null;
  }
  const parts = authorization.split(/\s+/);
  if (parts[0].toLowerCase() !== 'bearer' || parts.length !== 2) {
    return null;
  }
  return parts[1];
};

/**
 * Resolve the calling agent from a Content API or MCP request.
 * 
 * This is the security core of agent-bus: it enforces that every token
 * is bound to exactly one agent, and that `from` is server-set.
 * 
 * SECURITY CRITICAL:
 * - MCP: Reads the actual bearer token from request headers, authenticates it,
 *   and binds on authResult.credentials.id (the admin TOKEN id, NOT the user id)
 * - Content API: Reads ctx.state.auth.credentials.id (the API token's database id)
 * 
 * Verified against Strapi 5.60 source:
 * - @strapi/core/dist/services/mcp/authentication.js returns credentials.id = token id
 * - @strapi/admin/dist/server/server/src/strategies/content-api-token.js sets credentials = apiToken
 * - Context.user.id is the admin USER who owns the token, which would break binding
 */
export const resolveCaller = async (
  strapi: Core.Strapi,
  ctxOrExtra: any
): Promise<CallerInfo> => {
  let tokenId: string | number | undefined;
  let kind: 'content-api' | 'admin' | undefined;

  // Content API context (Koa ctx from REST routes)
  // The strategy sets ctx.state.auth.credentials = apiToken (full token object with id)
  if (ctxOrExtra?.state?.auth?.credentials) {
    tokenId = ctxOrExtra.state.auth.credentials.id;
    kind = 'content-api';
  }
  // MCP handler extra (from createMcpCapabilityHandlerContext)
  // We must extract and authenticate the token ourselves - do NOT use context.user.id
  // because that's the admin user who owns the token, not the token itself
  else if (ctxOrExtra?.requestInfo?.headers) {
    const authorization = ctxOrExtra.requestInfo.headers.authorization;
    const token = extractBearerToken(authorization);
    
    if (!token) {
      throw new Error('No bearer token found in MCP request headers');
    }

    // Authenticate the token to get the token id (NOT the user id)
    try {
      const authResult = await strapi.admin.services['api-token-admin'].authenticateAdminToken(token);
      
      if (!authResult.authenticated) {
        throw new Error('Token authentication failed');
      }

      // CRITICAL: Use authResult.credentials.id (the token id)
      // NOT authResult.user.id (the admin user who owns the token)
      tokenId = authResult.credentials.id;
      kind = 'admin';
    } catch (error: any) {
      throw new Error(`Failed to authenticate admin token: ${error.message}`);
    }
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
