# Paul's Brain — Usage Guide for AI Assistants

## What is this?

Paul's Brain is a shared long-term memory system accessible via MCP. All of Paul's AI assistants (Cursor agents, Grok bots, chat interfaces) read and write here to maintain continuity across conversations.

## Content Types

1. **note** — Facts, preferences, ideas, todos, logs, references
   - Kinds: `fact`, `preference`, `idea`, `todo`, `log`, `reference`
   - Use tags liberally: `#strapi`, `#mcp`, `#cursor`, `#ai`, etc.
   - Confidence: `low`, `medium`, `high`

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

## Best Practices

1. **Deduplication**: Always let `remember` dedupe by slug — it's automatic
2. **Tagging**: Tag liberally. Common tags: `#strapi`, `#mcp`, `#cursor`, `#ai`, `#deployment`, `#bug`, `#feature`
3. **Linking**: Link notes to people/projects/sources — it enables context traversal
4. **Confidence**: Set `low` for speculative info, `high` for verified facts
5. **Expiry**: Set `expires_on` for time-sensitive notes (todos, temporary decisions)
6. **Pinning**: Pin critical notes so they rank higher in search
7. **Source Bot**: Always set `source_bot` to identify which bot created a note

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

## Permissions

Each tool requires specific permissions on your admin token:
- `plugin::paul-brain.guide.read` — read this guide
- `plugin::paul-brain.read` — recall, get_entity, list_recent
- `plugin::paul-brain.note.write` — remember, update_note, link
- `plugin::paul-brain.decision.write` — log_decision
- `plugin::paul-brain.forget` — forget (dangerous, usually not granted)

Plus the standard content-manager permissions for read/create/update on paul-brain types.
