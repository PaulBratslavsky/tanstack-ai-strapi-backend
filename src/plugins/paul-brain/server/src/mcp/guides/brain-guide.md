# Paul's Brain — Usage Guide for AI Assistants

## What is this?

Paul's Brain is a shared long-term memory system accessible via MCP. All of Paul's AI assistants (Cursor agents, Grok bots, chat interfaces) read and write here to maintain continuity across conversations.

**Core Principles for Team Brain**:
- **Drafts only**: Save work-in-progress, not polished outputs
- **Uniform results are suspect**: If all/none/zero results come back, verify by checking one raw record
- **Write negatives down**: Record what systems CANNOT do (capabilities table)
- **Build new skills from gaps and retros**: When we fail or lack something repeatedly, that's the signal to improve

## Content Types

1. **note** — Facts, preferences, ideas, todos, logs, references, lessons
   - Kinds: `fact`, `preference`, `idea`, `todo`, `log`, `reference`, `lesson`
   - Use tags liberally: `#strapi`, `#mcp`, `#cursor`, `#ai`, etc.
   - Confidence: `low`, `medium`, `high`
   - New fields for lessons: `verifiedAt`, `howToRecheck`, `durability` (durable/temporary)

2. **person** — People in Paul's network (colleagues, collaborators, community)
   - Fields: name, role, org, email, handles (GitHub, X, LinkedIn)
   - Always link related notes

3. **project** — Paul's projects and initiatives
   - Status: `idea`, `active`, `paused`, `done`
   - Include repo_url and live URL when available

4. **decision** — Architecture decisions and key choices
   - Status: `proposed`, `accepted`, `superseded`
   - Always link the project and people involved

5. **source** — External sources (videos, articles, transcripts)
   - Types: `video`, `article`, `email`, `transcript`, `chat`, `repo`, `other`
   - Include `external_id` for YouTube videos to enable join with transcripts plugin

6. **retro** — Failure on real work + fix (post-mortem)
   - Fields: title, date, task, failure, fix, fixLocation, status (open/fixed)
   - Link to project when relevant

7. **gap** — Request nothing handled well (capability we lack)
   - Fields: title, date, request, whatWasNeeded, count, status (open/built/wontfix)
   - Auto-increments count if same title exists and is open

8. **capability** — What a system can and CANNOT do (probed and dated)
   - Fields: system, capability, canDo (boolean), verifiedAt, howVerified, notes
   - Upserts by system+capability

9. **rule** — Deterministic routing/handling rules (editable in admin)
   - Fields: name, match, action, priority, enabled
   - Sorted by priority for rule engines

10. **todo** — Task management for Paul's work
   - Status: `inbox` (bot-captured, for Paul to confirm), `next`, `doing`, `waiting`, `done`, `dropped`
   - Priority: `P0` (urgent today), `P1` (this week), `P2` (soon, default), `P3` (someday)
   - Fields: title, dueDate, doDate, goal, acceptanceCriteria, context (markdown)
   - Links: JSON array of {type: email|github|calendar|doc|url|other, label, url, note}
   - Relations: relatedNotes (many-to-many with note), project (many-to-one)
   - Log: JSON array of timestamped entries tracking changes
   - Bot-captured todos default to `inbox` status for Paul to confirm

## When to Use Which Tool

### remember
Create a new note OR merge with an existing one (by slug/alias).
- Default mode: `merge` — appends to existing note if slug matches
- Use `replace` mode to overwrite
- Use `new` mode to force a new note even if slug exists
- Always set meaningful tags
- Set `source_bot` to identify which bot created it
- Use `createMissing: true` to auto-create linked entities by name

### recall
Search across all brain types with ranked results.
- Use specific queries: "strapi mcp tools" not just "strapi"
- Filter by type: `["note", "person"]`
- Filter by tags: `["strapi", "mcp"]`
- Results are ranked: title match > alias/tag match > body match
- Pinned notes rank higher
- Recent items rank higher

### get_entity
Fetch one entity by type + documentId or slug.
- Relations are populated
- Use after recall to get full details

### list_recent
Get newest N items across types.
- Good for "what did we save today?"
- Filter by `kind` for notes (`fact`, `preference`, etc.)
- Filter by `source_bot` to see what a specific bot created

### update_note
Patch a note's fields.
- Use `appendBody` instead of `body` to add without overwriting
- Use `addTags` / `removeTags` for tag operations

### link
Connect or disconnect a note with people/projects/sources/decisions.
- Pass documentIds or slugs
- Use after creating stub entities with `createMissing`

### log_decision
Create a decision record (context/decision/rationale).
- Always link project and people
- Optionally mark a prior decision as superseded

### forget
Delete an entity (requires `confirm: true`).
- This is a separate permission (not granted by default)
- Returns what was deleted for audit

### log_retro
Create a retro record (failure on real work + fix).
- Link to project when relevant
- Mark status as `open` or `fixed`

### list_retros
List retro records.
- Filter by status: `open`, `fixed`

### log_gap
Create a gap record (request nothing handled well).
- Automatically increments count if a similar open gap title exists
- Status: `open`, `built`, `wontfix`

### list_gaps
List gap records sorted by count (highest first) then date.
- Filter by status

### record_capability
Create or update a capability record (what a system can and CANNOT do).
- Upserts by system+capability
- Always set `canDo` (boolean) to record both what works AND what doesn't

### list_capabilities
List capability records.
- Filter by system (e.g., "strapi", "mcp", "cursor-agent")

### add_rule
Create a deterministic routing/handling rule.
- Priority: higher runs first
- Enabled: toggle rules on/off

### list_rules
List routing/handling rules sorted by priority.
- Filter by enabled status

### add_todo
Create a new todo item.
- Bot-captured todos default to `inbox` status for Paul to confirm
- Priority: `P0` (urgent today), `P1` (this week), `P2` (soon, default), `P3` (someday)
- Always set `source` and `capturedBy` to track origin
- Links are JSON objects with type, label, url, optional note

### update_todo
Update a todo's fields.
- Use `appendContext` to add without overwriting
- Use `appendLog` to add log entries
- Changing status to `done` automatically sets `completedAt`

### list_todos
List todos with flexible filters.
- Filter by status, priority, project
- Filter by `dueBefore` or `overdue` for deadline management
- Filter by `waitingOlderThanDays` to find stale waiting items
- Results sorted by priority (P0 first) then dueDate

### get_todo
Fetch one todo by documentId with populated relatedNotes and project.
- Use after `list_todos` to get full details

### complete_todo
Mark a todo as done with optional closing note.
- Sets status to `done` and records `completedAt` timestamp
- Adds log entry automatically

## Best Practices

1. **Deduplication**: Always let `remember` dedupe by slug — it's automatic
2. **Tagging**: Tag liberally. Common tags: `#strapi`, `#mcp`, `#cursor`, `#ai`, `#deployment`, `#bug`, `#feature`
3. **Linking**: Link notes to people/projects/sources — it enables context traversal
4. **Confidence**: Set `low` for speculative info, `high` for verified facts
5. **Expiry**: Set `expires_on` for time-sensitive notes (todos, temporary decisions)
6. **Pinning**: Pin critical notes so they rank higher in search
7. **Source Bot**: Always set `source_bot` to identify which bot created a note
8. **Write negatives**: Use `record_capability` with `canDo: false` to document what doesn't work
9. **Log gaps**: When you can't handle something well, `log_gap` so we can build it later
10. **Log retros**: When things fail in real work, `log_retro` with the fix for future reference
11. **Todo status workflow**: Bot-captured todos go to `inbox` for Paul to confirm → `next` → `doing` → `done`
12. **Todo priorities**: Use P0 for urgent today, P1 for this week, P2 for soon (default), P3 for someday

## Common Workflows

### Learning about a person
1. `recall` with their name
2. `get_entity` for full details + related notes/projects
3. Create new notes and link with `link`

### Starting a new project
1. `remember` a note with `#project-idea` tag
2. `log_decision` for key architectural choices
3. Link people involved

### Capturing a conversation
1. `remember` key points as separate notes (kind: `fact` or `preference`)
2. Link to source if it's a video/article
3. Tag with relevant topics

### Finding prior context
1. `recall` with keywords + tags
2. `get_entity` to get full details
3. `list_recent` to see what was captured recently

### Capturing a todo from an email/meeting
1. `add_todo` with source=email/meeting, capturedBy set to bot name
2. Status defaults to `inbox` for Paul to review
3. Link related notes with `relatedNoteIds`
4. Set priority based on urgency

### Managing todos
1. `list_todos` with status filters to see what's in flight
2. `update_todo` to change status, add context, or append log entries
3. `complete_todo` when done with optional closing note

## Permissions

Each tool requires specific permissions on your admin token:
- `plugin::paul-brain.guide.read` — read this guide
- `plugin::paul-brain.read` — recall, get_entity, list_recent, list_retros, list_gaps, list_capabilities, list_rules, list_todos, get_todo
- `plugin::paul-brain.note.write` — remember, update_note, link
- `plugin::paul-brain.decision.write` — log_decision
- `plugin::paul-brain.meta.write` — log_retro, log_gap, record_capability
- `plugin::paul-brain.rule.write` — add_rule
- `plugin::paul-brain.todo.write` — add_todo, update_todo, complete_todo
- `plugin::paul-brain.forget` — forget (dangerous, usually not granted)

Plus the standard content-manager permissions for read/create/update on paul-brain types.
