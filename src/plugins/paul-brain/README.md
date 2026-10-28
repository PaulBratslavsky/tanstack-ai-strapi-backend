# strapi-plugin-paul-brain

Shared long-term memory (brain) for Paul's AI assistants, accessible via Strapi's MCP server.

## What it does

This plugin provides a structured knowledge base that Paul's AI bots (Cursor agents, Grok, chat interfaces) can read and write via MCP. It maintains continuity across conversations by storing:

- **Notes**: Facts, preferences, ideas, todos, logs, and references
- **People**: Network contacts with roles, organizations, and handles
- **Projects**: Paul's initiatives with status, repos, and goals
- **Decisions**: Architecture decisions and rationales (ADR-style)
- **Sources**: External content (videos, articles, transcripts, chats)

All content types support slugs, aliases, tags, and rich relations for context traversal.

## MCP Tools

The plugin exposes 9 MCP tools:

| Tool | Description | Permission |
|------|-------------|------------|
| `get_brain_guide` | Returns usage guide, conventions, and best practices | `plugin::paul-brain.guide.read` |
| `remember` | Create or merge notes (auto-dedupe by slug) | `plugin::paul-brain.note.write` |
| `recall` | Ranked keyword search across all types | `plugin::paul-brain.read` |
| `get_entity` | Fetch one entity by type + documentId/slug | `plugin::paul-brain.read` |
| `list_recent` | Newest N items by updatedAt | `plugin::paul-brain.read` |
| `update_note` | Patch note fields (append body, add/remove tags) | `plugin::paul-brain.note.write` |
| `link` | Connect/disconnect note relations | `plugin::paul-brain.note.write` |
| `log_decision` | Create decision record, optionally supersede prior | `plugin::paul-brain.decision.write` |
| `forget` | Delete entity (requires confirm: true) | `plugin::paul-brain.forget` |

## Permissions

Each tool requires specific admin token permissions:

- `plugin::paul-brain.guide.read` — Read the brain guide
- `plugin::paul-brain.read` — Search and read entities
- `plugin::paul-brain.note.write` — Create and update notes
- `plugin::paul-brain.decision.write` — Log decisions
- `plugin::paul-brain.forget` — Delete entities (dangerous, usually not granted)

Plus standard `plugin::content-manager.explorer.read`, `.create`, `.update` on the paul-brain content types.

## Minting an Admin Token

Use the existing `scripts/mint-mcp-token.js` to create an admin token with the required permissions:

```bash
node scripts/mint-mcp-token.js \
  plugin::paul-brain.guide.read \
  plugin::paul-brain.read \
  plugin::paul-brain.note.write \
  plugin::paul-brain.decision.write
```

**Do not grant `plugin::paul-brain.forget` unless specifically needed.**

The script outputs `ACCESS_KEY=...` to stdout, which you can add to your MCP client configuration.

## Granting Permissions to an Existing Token

To add paul-brain permissions to an existing admin token:

1. Go to **Settings → API Tokens** in the Strapi admin panel
2. Select the token
3. Scroll to **Plugins → Paul Brain**
4. Enable the desired permissions:
   - **Read brain guide**
   - **Read brain (recall, get_entity, list_recent)**
   - **Write notes (remember, update_note, link)**
   - **Write decisions (log_decision)**
   - *(Optionally)* **Delete entities (forget)**
5. Scroll to **Plugins → Content Manager** and enable:
   - **Read** on all paul-brain types (note, person, project, decision, source)
   - **Create** and **Update** on all paul-brain types
6. Save the token

## Configuration

Enable the plugin in `config/plugins.ts`:

```typescript
'paul-brain': {
  enabled: true,
  resolve: './src/plugins/paul-brain',
},
```

Ensure MCP is enabled in `config/server.ts`:

```typescript
mcp: {
  enabled: env.bool('MCP_ENABLED', true),
}
```

## Usage from MCP Client

Connect your MCP client (Cursor, Grok, etc.) to:

- **URL**: `https://<your-strapi-url>/mcp`
- **Transport**: `streamable-http`
- **Auth**: `Authorization: Bearer <admin-token>`

Call tools via the MCP protocol. Example:

```typescript
// Remember a fact
await mcp.callTool('remember', {
  title: 'Paul prefers Anthropic Claude for Strapi work',
  body: 'Mentioned in chat on 2026-10-28. Uses Claude Sonnet for code generation.',
  kind: 'preference',
  tags: ['ai', 'strapi', 'claude'],
  source_bot: 'cursor-agent',
});

// Search for it later
await mcp.callTool('recall', {
  query: 'claude preference',
  tags: ['ai'],
});
```

## Development

Build the plugin:

```bash
cd src/plugins/paul-brain
npm install
npm run build
```

The plugin loads from `dist/`, so rebuild after every change during development.

## Content Type UIDs

- `plugin::paul-brain.note`
- `plugin::paul-brain.person`
- `plugin::paul-brain.project`
- `plugin::paul-brain.decision`
- `plugin::paul-brain.source`

## Features

- **Auto-deduplication**: `remember` merges by slug/alias (configurable mode)
- **Ranked search**: Title > alias/tag > body match, plus recency and pinned boost
- **Auto-linking**: `createMissing: true` creates stub entities on the fly
- **Slug resolution**: All tools accept documentId or slug for convenience
- **Sanitized output**: All entity data is sanitized per admin token permissions

## Notes

- Draft & Publish is **disabled** — all writes are live immediately
- The plugin is separate from `strapi-plugin-tanstack-ai`'s own note/memory types
- Search is keyword-based (v1); semantic/vector search may come later
- `forget` is a hard delete; soft-delete (archived flag) is not yet implemented

## License

MIT
