import type { Core } from '@strapi/strapi';
import { getUid } from '../mcp/types';
import { getActionId } from '../mcp/permissions';

const PERMISSION_PACK_ACTIONS: Record<string, string[]> = {
  asker: ['agent.read', 'message.send'],
  specialist: ['agent.read', 'message.send', 'message.inbox'],
  orchestrator: [
    'agent.read',
    'message.send',
    'message.inbox',
    'message.manage',
    'approval.read',
    'approval.decide',
    'delivery.read',
  ],
};

function sanitizeAgent(agent: any): any {
  if (!agent) return null;
  
  const sanitized = { ...agent };
  delete sanitized.webhookSecret;
  delete sanitized.webhookAuthHeader;
  
  sanitized.webhookConfigured = Boolean(agent.webhookUrl);
  sanitized.hasAuthHeader = Boolean(agent.webhookAuthHeader);
  
  if (agent.credentials && Array.isArray(agent.credentials)) {
    sanitized.credentials = agent.credentials.map((cred: any) => ({
      id: cred.id,
      kind: cred.kind,
      tokenName: cred.tokenName,
      state: cred.state,
      mintedByPlugin: cred.mintedByPlugin,
    }));
  }
  
  return sanitized;
}

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

const adminController = ({ strapi }: { strapi: Core.Strapi }) => {
  const agentUid = getUid('agent');
  const credentialUid = getUid('agent-credential');

  return {
    async listAgents(ctx: any) {
      try {
        const agents = await strapi.documents(agentUid).findMany({
          populate: {
            credentials: {
              fields: ['id', 'kind', 'tokenId', 'tokenName', 'state', 'mintedByPlugin'],
            },
          },
          sort: ['name:asc'],
        });

        ctx.body = { data: agents.map(sanitizeAgent) };
      } catch (error: any) {
        ctx.status = 400;
        ctx.body = { error: error.message };
      }
    },

    async getAgent(ctx: any) {
      try {
        const agents = await strapi.documents(agentUid).findMany({
          filters: { documentId: { $eq: ctx.params.documentId } },
          populate: {
            credentials: {
              fields: ['id', 'kind', 'tokenId', 'tokenName', 'state', 'mintedByPlugin'],
            },
          },
        });

        if (!agents || agents.length === 0) {
          ctx.status = 404;
          ctx.body = { error: 'Agent not found' };
          return;
        }

        ctx.body = { data: sanitizeAgent(agents[0]) };
      } catch (error: any) {
        ctx.status = 400;
        ctx.body = { error: error.message };
      }
    },

    async createAgent(ctx: any) {
      try {
        const body = ctx.request.body ?? {};
        const {
          name,
          slug,
          kind,
          permissionPack,
          description,
          webhookUrl,
          webhookSecret,
          webhookAuthHeader,
          webhookMode,
          credentialType,
          tokenId,
        } = body;

        if (!name || !name.trim()) {
          ctx.status = 400;
          ctx.body = { error: 'name is required' };
          return;
        }

        const finalSlug = slug && slug.trim() ? slug.trim() : generateSlug(name);

        const chiefExists = await strapi.documents(agentUid).findMany({
          filters: { slug: { $eq: 'chief' } },
        });

        if (chiefExists && chiefExists.length > 0) {
          if (finalSlug === 'chief') {
            ctx.status = 400;
            ctx.body = { error: 'slug "chief" is reserved and already exists' };
            return;
          }
          
          if (kind === 'orchestrator') {
            ctx.status = 400;
            ctx.body = { error: 'Only one orchestrator (chief) is allowed' };
            return;
          }
        }

        if (credentialType === 'mint') {
          const hasPermission = await checkMintPermissions(strapi, permissionPack || 'asker', ctx.state.user);
          if (!hasPermission.allowed) {
            ctx.status = 403;
            ctx.body = { error: `Cannot mint ${permissionPack || 'asker'} token: missing permissions - ${hasPermission.missing.join(', ')}` };
            return;
          }
        }

        const agent = await strapi.documents(agentUid).create({
          data: {
            name: name.trim(),
            slug: finalSlug,
            kind: kind || 'specialist',
            permissionPack: permissionPack || 'asker',
            description,
            webhookUrl,
            webhookSecret,
            webhookAuthHeader,
            webhookMode: webhookMode || 'reference',
            state: 'active',
          },
        });

        let token = null;

        if (credentialType === 'mint') {
          token = await mintTokenForAgent(strapi, agent, permissionPack || 'asker', ctx.state.user);
        } else if (credentialType === 'bind' && tokenId) {
          await bindTokenToAgent(strapi, agent, Number(tokenId));
        }

        const updated = await strapi.documents(agentUid).findMany({
          filters: { documentId: { $eq: agent.documentId } },
          populate: {
            credentials: {
              fields: ['id', 'kind', 'tokenId', 'tokenName', 'state', 'mintedByPlugin'],
            },
          },
        });

        ctx.status = 201;
        ctx.body = { data: { agent: sanitizeAgent(updated[0]), token } };
      } catch (error: any) {
        ctx.status = 400;
        ctx.body = { error: error.message };
      }
    },

    async updateAgent(ctx: any) {
      try {
        const body = ctx.request.body ?? {};
        const updateData: any = {};

        if (body.name !== undefined) updateData.name = body.name.trim();
        if (body.permissionPack !== undefined) updateData.permissionPack = body.permissionPack;
        if (body.description !== undefined) updateData.description = body.description;
        if (body.state !== undefined) updateData.state = body.state;
        if (body.webhookUrl !== undefined) updateData.webhookUrl = body.webhookUrl;
        if (body.webhookMode !== undefined) updateData.webhookMode = body.webhookMode;

        if (body.webhookSecret && body.webhookSecret.trim()) {
          updateData.webhookSecret = body.webhookSecret.trim();
        }

        if (body.webhookAuthHeader && body.webhookAuthHeader.trim()) {
          updateData.webhookAuthHeader = body.webhookAuthHeader.trim();
        }

        const currentAgent = await strapi.documents(agentUid).findMany({
          filters: { documentId: { $eq: ctx.params.documentId } },
        });

        if (!currentAgent || currentAgent.length === 0) {
          ctx.status = 404;
          ctx.body = { error: 'Agent not found' };
          return;
        }

        if (body.kind !== undefined && body.kind === 'orchestrator') {
          const chiefExists = await strapi.documents(agentUid).findMany({
            filters: { slug: { $eq: 'chief' } },
          });
          
          if (chiefExists && chiefExists.length > 0 && currentAgent[0].slug !== 'chief') {
            ctx.status = 400;
            ctx.body = { error: 'Only one orchestrator (chief) is allowed' };
            return;
          }
        }

        if (body.kind !== undefined) updateData.kind = body.kind;

        const agent = await strapi.documents(agentUid).update({
          documentId: ctx.params.documentId,
          data: updateData,
        });

        if (!agent) {
          ctx.status = 404;
          ctx.body = { error: 'Agent not found' };
          return;
        }

        const updated = await strapi.documents(agentUid).findMany({
          filters: { documentId: { $eq: agent.documentId } },
          populate: {
            credentials: {
              fields: ['id', 'kind', 'tokenId', 'tokenName', 'state', 'mintedByPlugin'],
            },
          },
        });

        ctx.body = { data: sanitizeAgent(updated[0]) };
      } catch (error: any) {
        ctx.status = 400;
        ctx.body = { error: error.message };
      }
    },

    async deleteAgent(ctx: any) {
      try {
        const agents = await strapi.documents(agentUid).findMany({
          filters: { documentId: { $eq: ctx.params.documentId } },
          populate: {
            credentials: true,
          },
        });

        if (!agents || agents.length === 0) {
          ctx.status = 404;
          ctx.body = { error: 'Agent not found' };
          return;
        }

        const agent = agents[0];

        if (agent.slug === 'chief') {
          ctx.status = 400;
          ctx.body = { error: 'Cannot delete the chief agent' };
          return;
        }

        const credentials = agent.credentials || [];
        const adminTokenService = strapi.service('admin::api-token-admin') as any;

        for (const credential of credentials) {
          await strapi.documents(credentialUid).update({
            documentId: credential.documentId,
            data: { state: 'revoked' },
          });

          if (credential.mintedByPlugin) {
            try {
              await adminTokenService.revoke(Number(credential.tokenId));
            } catch (error) {
              strapi.log.warn(`[agent-bus] Could not revoke token ${credential.tokenId}: ${(error as Error).message}`);
            }
          }
        }

        await strapi.documents(agentUid).delete({
          documentId: ctx.params.documentId,
        });

        ctx.body = { data: { deleted: true } };
      } catch (error: any) {
        ctx.status = 400;
        ctx.body = { error: error.message };
      }
    },

    async bindToken(ctx: any) {
      try {
        const { tokenId } = ctx.request.body ?? {};

        if (!tokenId) {
          ctx.status = 400;
          ctx.body = { error: 'tokenId is required' };
          return;
        }

        const agents = await strapi.documents(agentUid).findMany({
          filters: { documentId: { $eq: ctx.params.documentId } },
        });

        if (!agents || agents.length === 0) {
          ctx.status = 404;
          ctx.body = { error: 'Agent not found' };
          return;
        }

        await bindTokenToAgent(strapi, agents[0], Number(tokenId));

        ctx.body = { data: { bound: true } };
      } catch (error: any) {
        ctx.status = 400;
        ctx.body = { error: error.message };
      }
    },

    async mintToken(ctx: any) {
      try {
        const agents = await strapi.documents(agentUid).findMany({
          filters: { documentId: { $eq: ctx.params.documentId } },
        });

        if (!agents || agents.length === 0) {
          ctx.status = 404;
          ctx.body = { error: 'Agent not found' };
          return;
        }

        const agent = agents[0];
        
        const hasPermission = await checkMintPermissions(strapi, agent.permissionPack, ctx.state.user);
        if (!hasPermission.allowed) {
          ctx.status = 403;
          ctx.body = { error: `Cannot mint ${agent.permissionPack} token: missing permissions - ${hasPermission.missing.join(', ')}` };
          return;
        }
        
        const token = await mintTokenForAgent(strapi, agent, agent.permissionPack, ctx.state.user);

        ctx.status = 201;
        ctx.body = { data: token };
      } catch (error: any) {
        ctx.status = 400;
        ctx.body = { error: error.message };
      }
    },

    async revokeCredential(ctx: any) {
      try {
        const { credentialId, documentId } = ctx.params;

        const credentials = await strapi.documents(credentialUid).findMany({
          filters: { id: { $eq: Number(credentialId) } },
          populate: { agent: { fields: ['documentId'] } },
        });

        if (!credentials || credentials.length === 0) {
          ctx.status = 404;
          ctx.body = { error: 'Credential not found' };
          return;
        }

        const credential = credentials[0];
        
        if (credential.agent?.documentId !== documentId) {
          ctx.status = 404;
          ctx.body = { error: 'Credential not found' };
          return;
        }

        await strapi.documents(credentialUid).update({
          documentId: credential.documentId,
          data: { state: 'revoked' },
        });

        if (credential.mintedByPlugin) {
          try {
            const adminTokenService = strapi.service('admin::api-token-admin') as any;
            await adminTokenService.revoke(Number(credential.tokenId));
          } catch (error) {
            strapi.log.warn(`[agent-bus] Could not revoke token ${credential.tokenId}: ${(error as Error).message}`);
          }
        }

        ctx.body = { data: { revoked: true } };
      } catch (error: any) {
        ctx.status = 400;
        ctx.body = { error: error.message };
      }
    },

    async listTokens(ctx: any) {
      try {
        const tokens = await listSelectableTokens(strapi, ctx.state.user.id);
        ctx.body = { data: tokens };
      } catch (error: any) {
        ctx.status = 400;
        ctx.body = { error: error.message };
      }
    },
  };
};

async function listSelectableTokens(strapi: Core.Strapi, userId: number) {
  const credentialUid = getUid('agent-credential');
  const boundCredentials = await strapi.documents(credentialUid).findMany({
    filters: { state: { $eq: 'active' } },
    fields: ['tokenId'],
  });

  const boundTokenIds = new Set(boundCredentials.map((c: any) => c.tokenId));
  const now = Date.now();

  const user = await strapi.db.query('admin::user').findOne({
    where: { id: userId },
    populate: ['roles'],
  });
  
  const isSuperAdmin = user?.roles?.some((role: any) => role.code === 'strapi-super-admin');

  const adminTokens = await strapi.db.query('admin::api-token').findMany({
    where: isSuperAdmin ? {} : { adminUserOwner: userId },
    populate: ['adminUserOwner'],
  });

  const contentApiTokens = await strapi.db.query('admin::api-token').findMany({
    where: {
      type: { $in: ['custom', 'read-only', 'full-access'] },
    },
  });

  const allTokens = [...adminTokens, ...contentApiTokens];

  const selectableTokens = allTokens.filter((token: any) => {
    if (token.expiresAt && new Date(token.expiresAt).getTime() <= now) return false;
    if (boundTokenIds.has(String(token.id))) return false;
    return true;
  });

  return selectableTokens.map((token: any) => ({
    id: token.id,
    name: token.name,
    description: token.description,
    expiresAt: token.expiresAt,
    kind: token.kind || (token.type === 'admin' ? 'admin' : 'content-api'),
  }));
}

async function bindTokenToAgent(strapi: Core.Strapi, agent: any, tokenId: number) {
  const credentialUid = getUid('agent-credential');

  const existingBinding = await strapi.documents(credentialUid).findMany({
    filters: { 
      tokenId: { $eq: String(tokenId) },
      state: { $eq: 'active' }
    },
  });

  if (existingBinding && existingBinding.length > 0) {
    throw new Error('Token is already bound to an agent');
  }

  const token = await strapi.db.query('admin::api-token').findOne({
    where: { id: tokenId },
  });

  if (!token) {
    throw new Error('Token not found');
  }

  const tokenKind = token.kind || (token.type === 'admin' ? 'admin' : 'content-api');

  if (token.expiresAt && new Date(token.expiresAt).getTime() <= Date.now()) {
    throw new Error('Token has expired');
  }

  const revokedBinding = await strapi.documents(credentialUid).findMany({
    filters: { 
      tokenId: { $eq: String(tokenId) },
      state: { $eq: 'revoked' }
    },
    limit: 1,
  });

  if (revokedBinding && revokedBinding.length > 0) {
    await strapi.documents(credentialUid).update({
      documentId: revokedBinding[0].documentId,
      data: {
        agent: { connect: [{ documentId: agent.documentId }] },
        kind: tokenKind,
        tokenName: token.name,
        state: 'active',
        mintedByPlugin: false,
      },
    });
  } else {
    await strapi.documents(credentialUid).create({
      data: {
        agent: { connect: [{ documentId: agent.documentId }] },
        kind: tokenKind,
        tokenId: String(token.id),
        tokenName: token.name,
        state: 'active',
        mintedByPlugin: false,
      },
    });
  }
}

async function checkMintPermissions(strapi: Core.Strapi, permissionPack: string, user: any): Promise<{ allowed: boolean; missing: string[] }> {
  const actions = PERMISSION_PACK_ACTIONS[permissionPack] || PERMISSION_PACK_ACTIONS.asker;
  const actionIds = actions.map((uid) => getActionId(uid));
  
  const isSuperAdmin = user.roles?.some((role: any) => role.code === 'strapi-super-admin');
  if (isSuperAdmin) {
    return { allowed: true, missing: [] };
  }
  
  const permissionService = strapi.service('admin::permission') as any;
  const userPermissions = await permissionService.findUserPermissions(user);
  const userActionIds = new Set(userPermissions.map((p: any) => p.action));
  
  const missing = actionIds.filter(actionId => !userActionIds.has(actionId));
  
  return {
    allowed: missing.length === 0,
    missing,
  };
}

async function mintTokenForAgent(strapi: Core.Strapi, agent: any, permissionPack: string, user: any) {
  const adminTokenService = strapi.service('admin::api-token-admin') as any;
  const credentialUid = getUid('agent-credential');

  const actions = PERMISSION_PACK_ACTIONS[permissionPack] || PERMISSION_PACK_ACTIONS.asker;
  const actionIds = actions.map((uid) => getActionId(uid));

  const token = await adminTokenService.create(
    {
      kind: 'admin',
      name: `${agent.name} (${permissionPack}) - ${Date.now()}`,
      description: `Token for ${agent.name} agent with ${permissionPack} permissions`,
      lifespan: null,
      adminUserOwner: user.id,
    },
    user
  );

  for (const action of actionIds) {
    await strapi.db.query('admin::permission').create({
      data: { action, subject: null, properties: {}, conditions: [], apiToken: token.id },
    });
  }

  await strapi.documents(credentialUid).create({
    data: {
      agent: { connect: [{ documentId: agent.documentId }] },
      kind: 'admin',
      tokenId: String(token.id),
      tokenName: token.name,
      state: 'active',
      mintedByPlugin: true,
    },
  });

  return {
    accessKey: token.accessKey,
    tokenName: token.name,
  };
}

export default adminController;
