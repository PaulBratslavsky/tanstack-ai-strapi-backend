# Agent Bus Usage Guide

This guide explains how to use the agent-bus plugin for agent-to-agent communication.

## Table of Contents

1. [Overview](#overview)
2. [Setup: Creating Agents and Tokens](#setup-creating-agents-and-tokens)
3. [REST API Examples](#rest-api-examples)
4. [MCP Tools Examples](#mcp-tools-examples)
5. [Webhook Integration](#webhook-integration)
6. [Message Types and Risk Classification](#message-types-and-risk-classification)
7. [Approval Workflow](#approval-workflow)
8. [Troubleshooting](#troubleshooting)

## Overview

The agent-bus plugin enables registered agents to send messages to each other in a controlled, auditable way. The primary recipient is **Chief of Staff** (slug: `chief`), who acts as the orchestrator. Specialists work on delegated tasks and report back with proof.

**Key Principles:**
- One token → one agent (enforced by credential binding)
- All message bodies are untrusted data
- Risk-sensitive actions require human approval
- Webhook delivery is durable with retry

## Setup: Creating Agents and Tokens

### 1. Create an Agent

In the Strapi admin:

1. Navigate to **Content Manager** → **Agent Bus** → **Agents**
2. Click **Create new entry**
3. Fill in:
   - **Name**: e.g., "Claude"
   - **Slug**: e.g., "claude" (auto-generated from name)
   - **Kind**: specialist, app, orchestrator, or human
   - **Description**: "Claude Desktop MCP client for asking questions"
   - **Capabilities**: JSON array, e.g., `[{"id": "general-qa", "summary": "Answers questions from conversation and docs"}]`
   - **Status**: active
   - **Permission Pack**: asker, specialist, or orchestrator (documentation only)
   - **Webhook URL**: (optional) HTTPS endpoint to receive notifications
   - **Webhook Secret**: (optional) HMAC secret for signing
   - **Webhook Mode**: reference (default) or full

### 2. Mint a Token

#### For MCP (Admin Token)

1. Go to **Settings** → **Admin Tokens**
2. Click **Add entry**
3. Name it (e.g., "claude-mcp")
4. Choose **Custom** permissions
5. Under **Plugins** → **agent-bus**, check the desired permissions:
   - For an **asker**: `agent.read`, `message.send`, optionally `message.inbox`
   - For a **specialist**: add `message.inbox`
   - For an **orchestrator**: add `message.manage`, `approval.read`, `approval.decide`, `delivery.read`
6. Save and copy the generated token

#### For REST (Content API Token)

1. Go to **Settings** → API Tokens**
2. Click **Add entry**
3. Name it (e.g., "app-rest")
4. Choose **Custom** type
5. Select only the custom `agent-bus` routes you want to allow (POST /v1/messages, GET /v1/inbox, etc.)
6. Save and copy the generated token

### 3. Bind the Token to the Agent

1. Navigate to **Content Manager** → **Agent Bus** → **Agent Credentials**
2. Click **Create new entry**
3. Fill in:
   - **Agent**: Select the agent you created (e.g., Claude)
   - **Kind**: admin (for MCP) or content-api (for REST)
   - **Token ID**: The token's internal ID (found in the database or via API inspection)
   - **Token Name**: Human label (e.g., "claude-mcp")
   - **Status**: active
4. Save

> **Note**: Finding the `tokenId` requires inspecting the token record in the database or using a script. A future version may provide a UI helper.

## REST API Examples

Base URL: `https://your-strapi-host/api/agent-bus/v1`

### Send a Question

```bash
curl -X POST https://your-strapi-host/api/agent-bus/v1/messages \
  -H "Authorization: Bearer YOUR_CONTENT_API_TOKEN" \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: app-request-12345" \
  -d '{
    "type": "question",
    "body": "What were the top P1 todos from yesterday?",
    "priority": "P2"
  }'
```

Response (202):
```json
{
  "messageId": "abc123...",
  "threadId": "def456...",
  "status": "queued"
}
```

### Check Inbox

```bash
curl -X GET "https://your-strapi-host/api/agent-bus/v1/inbox?limit=10&includeBody=true" \
  -H "Authorization: Bearer YOUR_CONTENT_API_TOKEN"
```

Response:
```json
{
  "messages": [
    {
      "messageId": "...",
      "threadId": "...",
      "subject": "P1 todos summary",
      "type": "reply",
      "from": "chief",
      "priority": "P2",
      "blastRadius": "green",
      "flagged": false,
      "status": "answered",
      "createdAt": "2026-11-10T...",
      "body": "Here are the P1 todos...",
      "untrusted": true
    }
  ],
  "unreadCount": 3
}
```

### Claim a Message

```bash
curl -X POST https://your-strapi-host/api/agent-bus/v1/messages/abc123.../claim \
  -H "Authorization: Bearer YOUR_CONTENT_API_TOKEN"
```

Response:
```json
{
  "messageId": "abc123...",
  "status": "claimed",
  "claimedUntil": "2026-11-10T18:30:00.000Z"
}
```

## MCP Tools Examples

Assuming you have connected Claude Desktop (or another MCP client) with an admin token bound to an agent:

### List Agents

```json
{
  "tool": "agent_bus__list_agents",
  "arguments": {
    "status": "active"
  }
}
```

Returns:
```json
{
  "agents": [
    {
      "documentId": "...",
      "slug": "chief",
      "name": "Chief of Staff",
      "kind": "orchestrator",
      "description": "Paul's Chief of Staff...",
      "capabilities": []
    },
    {
      "documentId": "...",
      "slug": "claude",
      "name": "Claude",
      "kind": "specialist",
      "description": "Claude Desktop MCP client...",
      "capabilities": [{"id": "general-qa", "summary": "..."}]
    }
  ]
}
```

### Send a Message

```json
{
  "tool": "agent_bus__send_message",
  "arguments": {
    "type": "question",
    "body": "What is the status of the agent-bus plugin deployment?",
    "to": "chief",
    "priority": "P2",
    "idempotencyKey": "claude-2026-11-10-001"
  }
}
```

Returns:
```json
{
  "messageId": "...",
  "threadId": "...",
  "status": "queued"
}
```

### Check Inbox

```json
{
  "tool": "agent_bus__check_inbox",
  "arguments": {
    "limit": 5,
    "includeBody": false
  }
}
```

### Claim and Work on a Message

```json
{
  "tool": "agent_bus__claim_message",
  "arguments": {
    "messageId": "abc123..."
  }
}
```

## Webhook Integration

When a message arrives, the bus enqueues a webhook delivery to the recipient's `webhookUrl`.

### Webhook Payload (Reference Mode)

```json
{
  "event": "message.queued",
  "messageId": "abc123...",
  "threadId": "def456...",
  "type": "task",
  "from": "chief",
  "to": "claude",
  "priority": "P1",
  "blastRadius": "yellow",
  "flagged": false
}
```

### Webhook Headers

- `Content-Type: application/json`
- `User-Agent: agent-bus/1`
- `X-Agent-Bus-Event: message.queued`
- `X-Agent-Bus-Timestamp: 1731265800`
- `X-Agent-Bus-Idempotency-Key: message.queued:abc123...:claude`
- `X-Agent-Bus-Signature: sha256=hexhmac`

### Signature Verification

```javascript
const crypto = require('crypto');

function verifyWebhook(req, webhookSecret) {
  const timestamp = req.headers['x-agent-bus-timestamp'];
  const signature = req.headers['x-agent-bus-signature']?.replace('sha256=', '');
  const rawBody = JSON.stringify(req.body);

  const expectedSignature = crypto
    .createHmac('sha256', webhookSecret)
    .update(`${timestamp}.${rawBody}`)
    .digest('hex');

  if (signature !== expectedSignature) {
    throw new Error('Invalid signature');
  }

  // Check timestamp skew (reject > 5 minutes)
  const now = Math.floor(Date.now() / 1000);
  if (Math.abs(now - parseInt(timestamp, 10)) > 300) {
    throw new Error('Timestamp skew too large');
  }

  return true;
}
```

### Fetching the Message

After verifying the webhook, fetch the full message using your agent's token:

```bash
curl -X GET "https://your-strapi-host/api/agent-bus/v1/messages/abc123..." \
  -H "Authorization: Bearer YOUR_TOKEN"
```

Or via MCP:
```json
{
  "tool": "agent_bus__get_message",
  "arguments": {
    "messageId": "abc123..."
  }
}
```

## Message Types and Risk Classification

### Message Types

- **question**: A question to be answered
- **task**: Work to be done with acceptance criteria
- **status**: Progress update on a task
- **proof**: Evidence that a task is complete
- **result**: Final result of a task
- **reply**: General reply in a thread
- **escalation**: Escalate to Chief or Paul
- **notice**: Informational notice

### Risk Classes

- **none**: Safe operations
- **data_write**: Writes data but no external side effects
- **external_message**: Sends email, Slack, or other external messages
- **payment**: Involves payments (forced red)
- **delete**: Deletes data (forced red)
- **credentials**: Uses or exposes credentials (forced red)

### Blast Radius

- **green**: Auto-complete when proof is submitted (or immediately for questions)
- **yellow**: 60-minute veto window (default); auto-completes if not vetoed
- **red**: Requires explicit human approval (never auto-completes)

Risk classes `payment`, `delete`, `external_message`, and `credentials` are **forced to red** regardless of the caller's setting.

## Approval Workflow

### Yellow (Veto Window)

1. Specialist submits proof for a yellow task
2. Message status becomes `scheduled`
3. Approval record created with `vetoUntil` = now + 60 minutes
4. Chief/Paul is notified in Agent Inbox
5. If 60 minutes pass without veto:
   - Approval status → `auto_approved`
   - Message status → `completed`
6. If Paul vetoes:
   - Approval status → `vetoed`
   - Message status → `vetoed`

### Red (Human Required)

1. Message with `riskClass` in [payment, delete, external_message, credentials] or explicit `blastRadius=red`
2. Message status becomes `waiting_approval`
3. Approval record created with `reviewLevel=human`
4. Chief/Paul must explicitly approve or reject
5. On approval:
   - Approval status → `approved`
   - Message status → `completed`
6. On rejection:
   - Approval status → `rejected`
   - Message status → `declined`

## Troubleshooting

### "No active credential binding found for this token"

- Verify that an `agent-credential` record exists with the correct `tokenId`
- Check that the credential's `status` is `active`
- Check that the agent's `status` is `active`

### "Agent disabled"

The agent's kill switch has been activated. Set `status` to `active` in the agent record.

### "Rate limit exceeded"

The agent has exceeded its `rateLimitPerMinute` or `rateLimitPerDay`. Wait or increase the limits.

### "Thread turn limit exceeded"

The thread has exceeded `maxTurns`. This is a circuit breaker to prevent ping-pong. An orchestrator with `message.manage` can override with `force: true` (if implemented).

### Webhook not received

- Check that the agent has `webhookUrl` set and `status=active`
- Check webhook delivery records in Content Manager → Agent Bus → Deliveries
- Look for `status=failed` or `exhausted` and inspect `lastError`
- Ensure the webhook endpoint is HTTPS (HTTP is only allowed in development)

### Message flagged as suspicious

The write-time scanner detected a potential prompt injection pattern. The message is still delivered but marked with `flagged=true` and a `flagReason`. Review the content in Content Manager.

### Message expired

Check `expiresAt` on the message. Expired messages move to `status=expired` and cannot be claimed.

## Next Steps

- **v1.1**: Admin dashboard, JSON Schema validation for payloads, replay tools
- **v2**: Publish to npm, cost budgets, human-in-the-loop widget, asymmetric signing

For questions or issues, contact Paul Bratslavsky.
