# strapi-plugin-paul-brain

Shared long-term memory (brain) for Paul's AI assistants, accessible via Strapi's MCP server.

## What it does

This plugin provides a structured knowledge base that Paul's AI bots (Cursor agents, Grok, chat interfaces) can read and write via MCP. It maintains continuity across conversations by storing:

- **Notes**: Facts, preferences, ideas, todos, logs, references, and lessons
- **People**: Network contacts with roles, organizations, and handles
- **Projects**: Paul's initiatives with status, repos, and goals
- **Decisions**: Architecture decisions and rationales (ADR-style)
- **Sources**: External content (videos, articles, transcripts, chats) with videoId to join with central yt-kb transcripts
- **Retros**: Post-mortem records of failures and fixes
- **Gaps**: Capability requests that nothing handled well
- **Capabilities**: What systems can and CANNOT do (probed and dated)
- **Rules**: Deterministic routing/handling rules (editable in admin)
- **Todos**: Task management with status tracking and priorities
- **Goals**: Goal tracking with daily/weekly check-ins and streak calculation
- **Goal Check-ins**: Daily or weekly progress logs for goals
- **Resources**: Finished deliverables (markdown, Pages, links) with relations back to notes, projects, people, and sources

All content types support slugs, aliases, tags, and rich relations for context traversal.

**Note on YouTube Transcripts**: Raw YouTube transcripts now live centrally in a separate Strapi Cloud app (yt-kb plugin at https://deserving-harmony-9f5ca04daf.strapiapp.com). Access them via the `yt_kb__*` MCP tools on the `strapi-prod` MCP server. Paul-brain stores only notes/sources/people that reference videos by YouTube videoId.

## MCP Tools

The plugin exposes 43 MCP tools organized by function:

### Core Read Operations
| Tool | Description | Permission |
|------|-------------|------------|
| `get_brain_guide` | Returns usage guide, conventions, and best practices | `plugin::paul-brain.guide.read` |
| `get_briefing` | Session briefing plus a waiting list (approvals, exhausted webhooks, stale credentials, missing token permissions) | `plugin::paul-brain.brief.read` |
| `kb_stats` | Get KB statistics including transcript coverage from central yt-kb | `plugin::paul-brain.stats.read` |
| `health_check` | Run diagnostic checks on brain data | `plugin::paul-brain.health.read` |
| `recall` | Ranked keyword search across all types | `plugin::paul-brain.read` |
| `verify_note` | Read-only duplicate check with a recommended action (create, update, or skip) | `plugin::paul-brain.read` |
| `get_entity` | Fetch one entity by type + documentId/slug | `plugin::paul-brain.read` |
| `list_recent` | Newest N items by updatedAt | `plugin::paul-brain.read` |

### Notes
| Tool | Description | Permission |
|------|-------------|------------|
| `remember` | Create note with duplicate detection | `plugin::paul-brain.note.write` |
| `update_note` | Patch note fields (append body, add/remove tags) | `plugin::paul-brain.note.write` |
| `link` | Connect/disconnect note relations | `plugin::paul-brain.note.write` |

### Resources
| Tool | Description | Permission |
|------|-------------|------------|
| `save_resource` | Create a deliverable, or update the row with the same slug. Same URL or content hash returns the existing row (`deduped: true`) | `plugin::paul-brain.resource.write` |
| `get_resource` | Fetch one resource by documentId or slug, with relations and private file metadata | `plugin::paul-brain.resource.read` |
| `list_resources` | Newest-first list (format, status, tag, project, since), paginated | `plugin::paul-brain.resource.read` |
| `update_resource` | Patch a resource, or create a new version (`newVersion`). Accepts a Page snapshot | `plugin::paul-brain.resource.write` |
| `link_resource` | Attach or detach notes, projects, people, sources | `plugin::paul-brain.resource.write` |
| `attach_resource_file` | Attach a private file (base64 or URL, max 25 MB) and extract text or caption it | `plugin::paul-brain.resource.write` |
| `get_resource_file` | Read file bytes (base64) or a short-lived signed URL. Never the public upload URL | `plugin::paul-brain.resource.read` |

Finished guides, reports, and Pages are resources (`format: md` with markdown in `body`, or `format: page` with `externalUrl` plus `snapshotMarkdown`). Notes stay drafts. The content type stores lifecycle as `state` (default `final`) and the bot name as `author`; the tools call those `status` and `createdBy`. Files are stored with Strapi's upload plugin. Tool output never includes the provider's public URL. `ANTHROPIC_API_KEY` captions images; without it, upload still succeeds. `PUBLIC_URL` makes large-file `accessUrl` values absolute.

### Entities (People, Sources)
| Tool | Description | Permission |
|------|-------------|------------|
| `upsert_person` | Create or update a person (matches by slug/alias) | `plugin::paul-brain.entity.write` |
| `upsert_source` | Create or update a source (matches by slug, videoId, or url) | `plugin::paul-brain.entity.write` |
| `update_source` | Update existing source by documentId or slug | `plugin::paul-brain.entity.write` |

### Decisions, Retros, Gaps, Capabilities
| Tool | Description | Permission |
|------|-------------|------------|
| `log_decision` | Create decision record, optionally supersede prior | `plugin::paul-brain.decision.write` |
| `log_retro` | Create retro record (failure + fix) | `plugin::paul-brain.meta.write` |
| `update_retro` | Update existing retro (status, fix details) | `plugin::paul-brain.retro.update` |
| `list_retros` | List retro records with status filter | `plugin::paul-brain.read` |
| `log_gap` | Create gap record (capability request) | `plugin::paul-brain.meta.write` |
| `update_gap` | Update existing gap (status, description) | `plugin::paul-brain.gap.update` |
| `list_gaps` | List gap records sorted by count | `plugin::paul-brain.read` |
| `record_capability` | Create/update capability record (what systems can/cannot do) | `plugin::paul-brain.meta.write` |
| `list_capabilities` | List capability records with system filter | `plugin::paul-brain.read` |

### Rules
| Tool | Description | Permission |
|------|-------------|------------|
| `add_rule` | Create deterministic routing/handling rule | `plugin::paul-brain.rule.write` |
| `list_rules` | List routing rules sorted by priority | `plugin::paul-brain.read` |

### Todos
| Tool | Description | Permission |
|------|-------------|------------|
| `add_todo` | Create todo with duplicate detection | `plugin::paul-brain.todo.write` |
| `update_todo` | Update todo fields (status, context, log) | `plugin::paul-brain.todo.write` |
| `complete_todo` | Mark todo as done with optional closing note | `plugin::paul-brain.todo.write` |
| `list_todos` | List todos with flexible filters | `plugin::paul-brain.read` |
| `get_todo` | Fetch one todo by documentId | `plugin::paul-brain.read` |

### Goals
| Tool | Description | Permission |
|------|-------------|------------|
| `add_goal` | Create new goal with daily/weekly cadence | `plugin::paul-brain.goal.write` |
| `update_goal` | Update goal fields (status, description, target) | `plugin::paul-brain.goal.write` |
| `log_checkin` | Log check-in for a goal (updates existing for same date) | `plugin::paul-brain.goal.write` |
| `list_goals` | List goals with status/category filters | `plugin::paul-brain.goal.read` |
| `get_goal_progress` | Get goal progress with metrics and recent check-ins | `plugin::paul-brain.goal.read` |

### Dangerous Operations
| Tool | Description | Permission |
|------|-------------|------------|
| `forget` | Archive by default (`force: true` hard-deletes). Requires confirm | `plugin::paul-brain.forget` |

## Permissions

Each tool requires specific admin token permissions:

- `plugin::paul-brain.guide.read` — Read the brain guide
- `plugin::paul-brain.brief.read` — Get session briefings
- `plugin::paul-brain.stats.read` — Get KB statistics
- `plugin::paul-brain.health.read` — Run health checks
- `plugin::paul-brain.read` — Search and read entities (recall, verify_note, get_entity, list_recent, list_retros, list_gaps, list_capabilities, list_rules, list_todos, get_todo, list_goals)
- `plugin::paul-brain.note.write` — Create and update notes (remember, update_note, link)
- `plugin::paul-brain.resource.read` — Read resources and their files (get_resource, list_resources, get_resource_file)
- `plugin::paul-brain.resource.write` — Create and update resources and attach files (save_resource, update_resource, link_resource, attach_resource_file)
- `plugin::paul-brain.entity.write` — Create and update people/sources (upsert_person, upsert_source, update_source)
- `plugin::paul-brain.decision.write` — Log decisions
- `plugin::paul-brain.meta.write` — Log retros, gaps, capabilities (log_retro, log_gap, record_capability)
- `plugin::paul-brain.retro.update` — Update retro records
- `plugin::paul-brain.gap.update` — Update gap records
- `plugin::paul-brain.rule.write` — Create routing rules
- `plugin::paul-brain.todo.write` — Create and update todos (add_todo, update_todo, complete_todo)
- `plugin::paul-brain.goal.read` — Read goals and progress (list_goals, get_goal_progress)
- `plugin::paul-brain.goal.write` — Create and update goals (add_goal, update_goal, log_checkin)
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
   - **Read resources (get_resource, list_resources, get_resource_file)**
   - **Write resources (save_resource, update_resource, link_resource, attach_resource_file)**
   - **Write decisions (log_decision)**
   - *(Optionally)* **Delete entities (forget)**
5. Scroll to **Plugins → Content Manager** and enable:
   - **Read** on all paul-brain types (note, person, project, decision, source, resource)
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
- `plugin::paul-brain.retro`
- `plugin::paul-brain.gap`
- `plugin::paul-brain.capability`
- `plugin::paul-brain.rule`
- `plugin::paul-brain.todo`
- `plugin::paul-brain.goal`
- `plugin::paul-brain.goal-checkin`
- `plugin::paul-brain.resource`

## Features

- **Duplicate detection**: `remember` and `add_todo` check for similar entries and return needsDecision with candidates
- **Ranked search**: Title > alias/tag > body match, plus recency and pinned boost
- **Auto-linking**: `createMissing: true` creates stub entities on the fly
- **Slug resolution**: All tools accept documentId or slug for convenience
- **Sanitized output**: All entity data is sanitized per admin token permissions
- **Goal streaks**: Automatic streak tracking (currentStreak, bestStreak) on daily/weekly check-ins
- **Central transcripts**: YouTube transcripts now accessed via yt_kb__* MCP tools on strapi-prod server

## Notes

- Draft & Publish is **disabled** — all writes are live immediately
- The plugin is separate from `strapi-plugin-tanstack-ai`'s own note/memory types
- Search is keyword-based (v1); semantic/vector search may come later
- `forget` archives by default (`archived` + `archivedAt`, or resource `state: archived`). `force: true` hard-deletes. Writes are audited by field name only

## License

MIT
