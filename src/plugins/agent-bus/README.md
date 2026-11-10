# Agent Bus Plugin

**Version:** 0.1.0

A Strapi 5 local plugin that provides a scoped, auditable message bus for registered agents. Agents can send typed messages to each other (primarily to Chief of Staff, the orchestrator) with risk classification, approval workflows, and webhook-based wake-up delivery.

## Features

- **Token-bound identity**: Each token is bound to exactly one agent; the server sets `from` field
- **Risk classification**: Green, yellow (60-minute veto window), and red (requires human approval)
- **Durable webhook delivery**: Outbox pattern with retry backoff and idempotency
- **Thread management**: Turn limits to prevent agent ping-pong
- **Idempotent sends**: Replay protection with client-supplied idempotency keys
- **Injection detection**: Write-time scanning and flagging of suspicious content
- **Audit trail**: Complete record of all actions and state changes

## Architecture

The plugin provides two interfaces to the same service layer:

1. **MCP Tools** - For agents with admin tokens (Claude, Chief of Staff)
2. **REST API** - For apps and scripts with Content API tokens

All messages are treated as untrusted data. Risk-sensitive actions (payments, deletions, external messages, credentials) are forced to red classification and require human approval.

## Security: Token Binding

The `resolveCaller` service is the **security core** of agent-bus. It enforces that every token is bound to exactly one agent:

- **MCP Tools**: Extracts the bearer token from `extra.requestInfo.headers.authorization` on each request, authenticates it with `strapi.admin.services['api-token-admin'].authenticateAdminToken()`, and binds on `authResult.credentials.id` (the admin **token** ID, NOT `authResult.user.id` which is the admin **user** who owns the token).
- **Content API**: Binds on `ctx.state.auth.credentials.id` (the token's database ID).

This ensures that two different tokens owned by the same admin user resolve to different agents. For example, Claude's token and Chief's token both belong to Paul's admin user, but they resolve to different agent bindings.

Security properties:

- Always fails closed if authentication fails or no active binding exists
- Never caches credentials across requests (re-authenticates every call)
- Never logs raw bearer tokens
- Updates `lastUsedAt` on credentials and `lastSeenAt` on agents for audit purposes

Verified against Strapi 5.60 source.

## Content Types

- **agent** - Registered agents (Chief, Claude, apps, specialists)
- **agent-credential** - Token-to-agent bindings
- **thread** - Message threads with participants
- **message** - Individual messages with status, type, risk, proof
- **approval** - Approval records for yellow/red messages
- **delivery** - Webhook outbox for agent wake-up
- **audit-event** - Audit trail of all actions

## Permission Packs

### Asker
- `agent.read` - List agents
- `message.send` - Send messages
- Optionally `message.inbox` for two-way communication

### Specialist
- `agent.read` - List agents
- `message.send` - Send messages
- `message.inbox` - Read and process own inbox

### Orchestrator (Chief)
- All of the above
- `message.manage` - Read any thread, delegate, triage
- `approval.read` - List pending approvals
- `approval.decide` - Approve, reject, veto
- `delivery.read` - Inspect webhook deliveries

## Installation

The plugin is installed as a local plugin in the host app:

```bash
cd src/plugins/agent-bus
npm run build
```

Then enable in `config/plugins.ts`:

```typescript
'agent-bus': {
  enabled: true,
  resolve: './src/plugins/agent-bus',
}
```

## Configuration

Default configuration in `config/plugins.ts`:

```typescript
'agent-bus': {
  enabled: true,
  resolve: './src/plugins/agent-bus',
  config: {
    vetoWindowMinutes: 60,
    leaseMinutes: 15,
    defaultMaxTurns: 8,
    allowInsecureWebhooks: false, // true only in development
  },
}
```

## Setup

1. **Build the plugin** (required before first run and after every change):
   ```bash
   cd src/plugins/agent-bus
   npm run build
   ```

2. **Start Strapi**:
   ```bash
   npm run develop
   ```

3. **Chief agent is auto-seeded** with slug `chief` (webhook URL empty until you paste the routine webhook)

4. **Create additional agents** in Content Manager:
   - Navigate to Agent Bus → Agents
   - Create new agent with slug, kind, description, capabilities
   - Set `webhookUrl` and generate `webhookSecret` if needed
   - Optionally set `webhookAuthHeader` (e.g., `Bearer xyz`) if the webhook endpoint requires authentication (like Grok Bot routine webhooks)

5. **Mint tokens** (Admin UI):
   - **Admin tokens** for MCP (Settings → Admin Tokens) - grant MCP permission packs
   - **Content API tokens** for REST (Settings → API Tokens) - grant specific Content API actions

### Content API Token Permissions

When creating a Content API token, Strapi generates permissions from controller methods. For agent-bus, tick these actions:

**Required for basic messaging (asker/specialist):**
- ☑ `plugin::agent-bus.bus.listAgents` - View available agents
- ☑ `plugin::agent-bus.bus.sendMessage` - Send messages
- ☑ `plugin::agent-bus.bus.getMessage` - Read specific messages
- ☑ `plugin::agent-bus.bus.getInbox` - Check inbox

**For full inbox interaction:**
- ☑ `plugin::agent-bus.bus.claimMessage` - Claim messages
- ☑ `plugin::agent-bus.bus.reply` - Reply to messages
- ☑ `plugin::agent-bus.bus.getThread` - Read thread history

**For orchestrator (Chief):**
- ☑ `plugin::agent-bus.bus.listApprovals` - View pending approvals
- ☑ `plugin::agent-bus.bus.decide` - Approve/reject/veto

**Note:** The permission UIDs follow the pattern `plugin::agent-bus.bus.<controllerMethod>`, NOT `plugin::agent-bus.<pack>.<action>`. This is how Strapi 5 Content API generates permissions from route handlers.

6. **Bind tokens to agents**:
   - Create an agent-credential record
   - Set `tokenId` (the Strapi token's id), `kind` (admin or content-api), and link to the agent
   - Status should be `active`

See `AGENT-BUS.md` for detailed usage examples.

## Development

### Build
```bash
npm run build
```

### Watch mode
```bash
npm run watch
```

### Verify
```bash
npm run verify
```

**Important**: Always commit `dist/` after building. Strapi Cloud loads the plugin from the built exports.

## MCP Tools

All tools are prefixed with `agent_bus__`:

- `agent_bus__list_agents` - List active agents and capabilities
- `agent_bus__send_message` - Send a message (default to=chief)
- `agent_bus__check_inbox` - Check own inbox
- `agent_bus__claim_message` - Claim a message and acquire lease
- (Additional tools for get_message, reply, report_status, submit_proof, escalate, delegate, etc. - see spec for full list)

## REST Routes

Base path: `/api/agent-bus/v1`

- `POST /v1/messages` - Send message (202 response)
- `GET /v1/inbox` - Get inbox
- `POST /v1/messages/:id/claim` - Claim message
- (Additional routes for reply, status, proof, etc.)

## Security Model

1. **Token binding**: Every token is bound to exactly one agent
2. **Server-set identity**: `from` is assigned by the server, not client
3. **Untrusted data**: All message bodies are treated as data, never instructions
4. **Risk upgrades**: payment/delete/external_message/credentials force red
5. **Injection detection**: Write-time scanning flags suspicious patterns
6. **Rate limits**: Per-minute and per-day caps per agent
7. **Turn limits**: Circuit breaker for agent ping-pong
8. **Kill switch**: Disabled agents cannot send or receive

## Webhook Delivery

Agents can register a `webhookUrl` to be notified when messages arrive. The default mode is `reference` (sends only message IDs, not bodies).

### Authentication

If your webhook endpoint requires authentication (e.g., Grok Bot routine webhooks), set the `webhookAuthHeader` field on the agent. This value (e.g., `Bearer grok-token-xyz`) will be sent as the `Authorization` header on every webhook POST. The field is marked private and never appears in API responses or logs.

The HMAC signature (`X-Agent-Bus-Signature`) is always included for integrity verification, regardless of whether `webhookAuthHeader` is set.

### Webhook payload:
```json
{
  "event": "message.queued",
  "messageId": "...",
  "threadId": "...",
  "type": "question",
  "from": "claude",
  "to": "chief",
  "priority": "P2",
  "blastRadius": "green",
  "flagged": false
}
```

Headers:
- `X-Agent-Bus-Event`
- `X-Agent-Bus-Timestamp`
- `X-Agent-Bus-Idempotency-Key`
- `X-Agent-Bus-Signature: sha256={hmac}`

Signature verification:
```javascript
const hmac = crypto.createHmac('sha256', webhookSecret)
  .update(`${timestamp}.${rawBody}`)
  .digest('hex');
```

Retry backoff: 15s, 1m, 5m, 25m, 2h. After 5 failures, status becomes `exhausted`.

## License

MIT

## Author

Paul Bratslavsky
