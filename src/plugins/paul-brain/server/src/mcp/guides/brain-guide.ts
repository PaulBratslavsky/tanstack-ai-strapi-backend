/**
 * Brain guide content embedded for bundling.
 * This ensures the guide is available in dist without needing to copy .md files.
 */
export const BRAIN_GUIDE = `# Paul's Brain — Usage Guide for AI Assistants

## What is this?

Paul's Brain is a shared long-term memory system accessible via MCP. All of Paul's AI assistants (Cursor agents, Grok bots, chat interfaces) read and write here to maintain continuity across conversations.

**Note on YouTube Transcripts**: Raw YouTube transcripts now live centrally in a separate Strapi Cloud app (yt-kb plugin at https://deserving-harmony-9f5ca04daf.strapiapp.com). Access them via the \`yt_kb__*\` MCP tools on the \`strapi-prod\` MCP server (e.g., \`yt_kb__get_transcript\`, \`yt_kb__search_transcript\`, \`yt_kb__add_video\`, etc.). Paul-brain stores only notes/sources/people that reference videos by YouTube videoId, enabling joins between notes and transcripts.

**Core Principles for Team Brain**:
- **Drafts only**: Save work-in-progress, not polished outputs
- **Uniform results are suspect**: If all/none/zero results come back, verify by checking one raw record
- **Write negatives down**: Record what systems CANNOT do (capabilities table)
- **Build new skills from gaps and retros**: When we fail or lack something repeatedly, that's the signal to improve
- **Start every session with get_briefing**: Load context about lessons, open issues, and urgent work
- **Log retros after real failures**: Don't let lessons slip away
- **Handle duplicate candidates**: When remember or add_todo returns needsDecision, choose merge/new/supersede

## Content Types

1. **note** — Facts, preferences, ideas, todos, logs, references, lessons
   - Kinds: \`fact\`, \`preference\`, \`idea\`, \`todo\`, \`log\`, \`reference\`, \`lesson\`
   - Use tags liberally: \`#strapi\`, \`#mcp\`, \`#cursor\`, \`#ai\`, etc.
   - Confidence: \`low\`, \`medium\`, \`high\`
   - New fields for lessons: \`verifiedAt\`, \`howToRecheck\`, \`durability\` (durable/temporary)

2. **person** — People in Paul's network (colleagues, collaborators, community)
   - Fields: name, role, org, email, handles (GitHub, X, LinkedIn)
   - Always link related notes

3. **project** — Paul's projects and initiatives
   - Status: \`idea\`, \`active\`, \`paused\`, \`done\`
   - Include repo_url and live URL when available

4. **decision** — Architecture decisions and key choices
   - Status: \`proposed\`, \`accepted\`, \`superseded\`
   - Always link the project and people involved

5. **source** — External sources (videos, articles, transcripts)
   - Types: \`video\`, \`article\`, \`email\`, \`transcript\`, \`chat\`, \`repo\`, \`other\`
   - Include \`videoId\` for YouTube videos to enable join with central yt-kb service transcripts (accessed via yt_kb__* MCP tools on strapi-prod server)

6. **retro** — Failure on real work + fix (post-mortem)
   - Fields: title, date, task, failure, fix, fixLocation, status (open/fixed/declined/wontfix)
   - Link to project when relevant
   - Use update_retro to change status or add fix details

7. **gap** — Request nothing handled well (capability we lack)
   - Fields: title, date, request, whatWasNeeded, count, status (open/built/wontfix), firstSeen, seenDates
   - Appends to seenDates when logged again; proposeCapability: true when seenDates reaches 2
   - Use update_gap to change status or description

8. **capability** — What a system can and CANNOT do (probed and dated)
   - Fields: system, capability, canDo (boolean), verifiedAt, howVerified, notes
   - Upserts by system+capability

9. **rule** — Deterministic routing/handling rules (editable in admin)
   - Fields: name, match, action, priority, enabled
   - Sorted by priority for rule engines

10. **todo** — Task management for Paul's work
   - Status: \`inbox\` (bot-captured, for Paul to confirm), \`next\`, \`doing\`, \`waiting\`, \`done\`, \`dropped\`, \`superseded\`
   - Priority: \`P0\` (urgent today), \`P1\` (this week), \`P2\` (soon, default), \`P3\` (someday)
   - Fields: title, dueDate, doDate, goal, acceptanceCriteria, context (markdown)
   - Links: JSON array of {type: email|github|calendar|doc|url|other, label, url, note}
   - Relations: relatedNotes (many-to-many with note), project (many-to-one), supersededBy (self-relation)
   - Log: JSON array of timestamped entries tracking changes
   - Bot-captured todos default to \`inbox\` status for Paul to confirm
   - Duplicate detection: add_todo checks for similar todos unless onDuplicate is set

11. **goal** — Goals with daily/weekly check-ins and streak tracking
   - Status: \`active\`, \`paused\`, \`done\`, \`dropped\`
   - Category: \`health\`, \`fitness\`, \`work\`, \`learning\`, \`personal\`, \`other\`
   - Cadence: \`daily\` (default), \`weekly\`
   - Fields: title, description, target (e.g. "last meal by 5 PM"), startDate
   - Streaks: currentStreak (consecutive met days ending on latest check-in), bestStreak
   - One-to-many relation with goal-checkin

12. **goal-checkin** — Daily or weekly check-ins for goals
   - Fields: goal (relation), date (required), met (boolean, required), note, loggedBy
   - One check-in per goal per date (updates existing instead of creating duplicate)

## When to Use Which Tool

### get_briefing
Get a compact session briefing to start every session.
- Returns pinned and recent lessons (notes with lesson field)
- Open retros and gaps
- P0/P1 or overdue todos
- Recent 'cannot' capabilities (last 90 days)
- Call this first to load context

### kb_stats
Get knowledge base statistics to understand what's in the brain.
- Returns counts per content type (note, person, project, etc.)
- Notes broken down by kind and tag
- Video notes vs transcripts: shows which YouTube transcripts (from central yt-kb service) lack notes
- Orphan counts: notes without links, people/projects/sources without notes
- Use before major operations to understand KB state
- Check regularly to find transcripts that need notes
- Note: Requires YT_KB_API_TOKEN env var to fetch transcript list; shows 'yt-kb not configured' message if missing

### health_check
Run diagnostic checks on brain data.
- Checks for duplicates, missing fields, stale data, orphans, broken relations
- Returns findings with severity (BLOCK/WARN) and suggested fixes
- Run periodically or when data quality is suspect

### remember
Create a new note with duplicate detection.
- Returns needsDecision: true with candidates if similar notes found and onDuplicate not set
- onDuplicate: 'merge' — append to existing note
- onDuplicate: 'new' — force create new note
- onDuplicate: 'supersede' — create new and mark old as superseded
- Always set meaningful tags
- Set \`source_bot\` to identify which bot created it
- Use \`createMissing: true\` to auto-create linked entities by name

### recall
Search across all brain types with ranked results (searches note body/content and tags).
- Use specific queries: "strapi mcp tools" not just "strapi"
- Filter by type: \`["note", "person"]\`
- Filter by kind: \`"video"\`, \`"lesson"\`, \`"fact"\`, etc.
- Filter by tag: \`"strapi"\` (single tag)
- Filter by videoId: find notes for a specific YouTube video
- Filter by sourceId: find notes linked to a specific source
- Results are ranked: title match > alias/tag match > body match
- Pinned notes rank higher
- Recent items rank higher
- Returns linkedSourceIds and linkedPersonIds for notes (useful for traversing connections)
- Always search before creating notes to avoid duplicates

### get_entity
Fetch one entity by type + documentId or slug.
- Relations are populated
- Use after recall to get full details

### list_recent
Get newest N items across types.
- Good for "what did we save today?"
- Filter by \`kind\` for notes (\`fact\`, \`preference\`, etc.)
- Filter by \`source_bot\` to see what a specific bot created

### update_note
Patch a note's fields.
- Use \`appendBody\` instead of \`body\` to add without overwriting
- Use \`addTags\` / \`removeTags\` for tag operations

### upsert_person
Create or update a person (matches by slug/alias, updates or creates).
- Fields: name, role, org, email, handles (JSON: {github, x, linkedin}), notes_md, last_contact
- Idempotent: safe to call multiple times with same name
- Returns created: true/false and documentId

### upsert_source
Create or update a source (matches by slug, videoId, or url).
- Fields: title, type, url, videoId, external_id, excerpt, captured_on
- Matches by slug (from title), videoId, or url
- Updates matched source or creates new
- Use for YouTube videos: pass videoId and url to join with central yt-kb transcripts

### update_source
Update an existing source by documentId or slug.
- Fields: title, type, url, videoId, external_id, excerpt, captured_on
- All fields optional (only updates provided fields)
- Use when you know the source exists
- For YouTube videos, ensure videoId is set to join with central yt-kb transcripts

### link
Connect or disconnect a note with people/projects/sources/decisions.
- Pass documentIds or slugs
- For sources: can also pass videoId or url to find/update the source
- Automatically adds missing videoId/url to sources when provided
- Use after creating stub entities with \`createMissing\`
- Always link video notes to sources for better organization

### log_decision
Create a decision record (context/decision/rationale).
- Always link project and people
- Optionally mark a prior decision as superseded

### forget
Delete an entity (requires \`confirm: true\`).
- This is a separate permission (not granted by default)
- Returns what was deleted for audit

### log_retro
Create a retro record (failure on real work + fix).
- Link to project when relevant
- Mark status as \`open\` or \`fixed\`
- Log after every real failure to capture lessons

### update_retro
Update an existing retro.
- Change status to \`fixed\`, \`declined\`, or \`wontfix\`
- Add or update fix details

### list_retros
List retro records.
- Filter by status: \`open\`, \`fixed\`, \`declined\`, \`wontfix\`

### log_gap
Create a gap record (request nothing handled well).
- Appends to seenDates if a similar open gap exists
- Returns proposeCapability: true when seenDates reaches 2
- Status: \`open\`, \`built\`, \`wontfix\`

### update_gap
Update an existing gap.
- Change status to \`built\` or \`wontfix\`
- Update request or whatWasNeeded description

### list_gaps
List gap records sorted by count (highest first) then date.
- Filter by status

### record_capability
Create or update a capability record (what a system can and CANNOT do).
- Upserts by system+capability
- Always set \`canDo\` (boolean) to record both what works AND what doesn't

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
Create a new todo item with duplicate detection.
- Returns needsDecision: true with candidates if similar todos found and onDuplicate not set
- onDuplicate: 'merge' — append context to existing todo and add log entry
- onDuplicate: 'new' — force create new todo
- onDuplicate: 'supersede' — create new and mark old as superseded
- Bot-captured todos default to \`inbox\` status for Paul to confirm
- Priority: \`P0\` (urgent today), \`P1\` (this week), \`P2\` (soon, default), \`P3\` (someday)
- Always set \`source\` and \`capturedBy\` to track origin
- Links are JSON objects with type, label, url, optional note

### update_todo
Update a todo's fields.
- Use \`appendContext\` to add without overwriting
- Use \`appendLog\` to add log entries
- Changing status to \`done\` automatically sets \`completedAt\`

### list_todos
List todos with flexible filters.
- Filter by status, priority, project
- Filter by \`dueBefore\` or \`overdue\` for deadline management
- Filter by \`waitingOlderThanDays\` to find stale waiting items
- Results sorted by priority (P0 first) then dueDate

### get_todo
Fetch one todo by documentId with populated relatedNotes and project.
- Use after \`list_todos\` to get full details

### complete_todo
Mark a todo as done with optional closing note.
- Sets status to \`done\` and records \`completedAt\` timestamp
- Adds log entry automatically

### add_goal
Create a new goal with daily or weekly check-ins.
- Categories: \`health\`, \`fitness\`, \`work\`, \`learning\`, \`personal\`, \`other\`
- Cadence: \`daily\` (default) or \`weekly\`
- Refuses duplicate active goals with the same title (returns existing instead)
- Auto-sets startDate to today if not provided

### list_goals
List goals with filters by status and category.
- Includes currentStreak and bestStreak
- Filter by status: \`active\`, \`paused\`, \`done\`, \`dropped\`
- Filter by category

### log_checkin
Log a check-in for a goal (updates existing for same date).
- Date defaults to today in America/Los_Angeles timezone
- Recomputes currentStreak: consecutive met days ending on latest check-in
- Recomputes bestStreak from entire history
- For daily goals, if latest check-in is older than yesterday, currentStreak = 0
- Missed or unlogged days break the streak

### get_goal_progress
Get goal progress with metrics and recent check-ins.
- Returns currentStreak and bestStreak
- Calculates met rate over last 7 and 30 days
- Returns recent check-ins (default: 14, configurable)

### update_goal
Update goal fields.
- Can update: status, description, category, target, cadence
- Identify by documentId or title

## Best Practices

1. **Start with briefing**: Call \`get_briefing\` at session start to load lessons, open issues, and urgent todos
2. **Check KB stats**: Use \`kb_stats\` to understand what's in the brain and find transcripts without notes
3. **Search before writing**: Always \`recall\` before creating notes to avoid duplicates
4. **Handle duplicates**: When \`remember\` or \`add_todo\` returns needsDecision with candidates, review and choose merge/new/supersede
5. **Deduplication**: Let tools check for duplicates automatically — they'll ask when unsure
6. **Tagging**: Tag liberally. Common tags: \`#strapi\`, \`#mcp\`, \`#cursor\`, \`#ai\`, \`#deployment\`, \`#bug\`, \`#feature\`
7. **Linking**: Link notes to people/projects/sources — it enables context traversal
8. **Video notes workflow**: For YouTube content:
   - Check \`kb_stats\` to find transcripts without notes
   - Create note with \`kind: "video"\` and \`videoId\`
   - Link to source with \`link\` (pass videoId/url to find or update source)
   - This enables joining with central yt-kb service data (access transcripts via yt_kb__* MCP tools on strapi-prod server)
9. **Confidence**: Set \`low\` for speculative info, \`high\` for verified facts
10. **Expiry**: Set \`expires_on\` for time-sensitive notes (todos, temporary decisions)
11. **Pinning**: Pin critical notes so they rank higher in search
12. **Source Bot**: Always set \`source_bot\` to identify which bot created a note
13. **Write negatives**: Use \`record_capability\` with \`canDo: false\` to document what doesn't work
14. **Log gaps**: When you can't handle something well, \`log_gap\` so we can build it later
15. **Log retros**: When things fail in real work, \`log_retro\` with the fix for future reference
16. **Close retros**: Use \`update_retro\` to mark status as fixed/declined/wontfix when resolved
17. **Todo status workflow**: Bot-captured todos go to \`inbox\` for Paul to confirm → \`next\` → \`doing\` → \`done\`
18. **Todo priorities**: Use P0 for urgent today, P1 for this week, P2 for soon (default), P3 for someday
19. **Goal tracking**: Use \`add_goal\` for habits and targets, \`log_checkin\` daily, streaks auto-calculate
20. **Goal categories**: Choose from health, fitness, work, learning, personal, other for better organization

## Common Workflows

### Knowledge Base Maintenance
1. \`kb_stats\` to see overview and find gaps
2. Check transcripts without notes (returned in kb_stats)
3. Create video notes for important transcripts
4. Review orphans (notes/sources without connections)

### Processing YouTube Videos
1. \`kb_stats\` to find transcripts without notes
2. For each important video:
   - \`recall\` by videoId to check if note exists
   - \`upsert_source\` with title, type: "video", videoId, and url
   - Create note with \`kind: "video"\`, \`videoId\`, and key insights
   - \`link\` the note to source (pass videoId and url)
   - Tag appropriately (\`#video\`, topic tags)

### Learning about a person
1. \`recall\` with their name
2. \`get_entity\` for full details + related notes/projects
3. Create new notes and link with \`link\`

### Starting a new project
1. \`remember\` a note with \`#project-idea\` tag
2. \`log_decision\` for key architectural choices
3. Link people involved

### Capturing a conversation
1. \`recall\` first to check for existing notes
2. \`remember\` key points as separate notes (kind: \`fact\` or \`preference\`)
3. Link to source if it's a video/article
4. Tag with relevant topics

### Finding prior context
1. \`recall\` with keywords + tags (now searches body/content too)
2. Use filters: kind, tag, videoId, sourceId
3. \`get_entity\` to get full details
4. \`list_recent\` to see what was captured recently

### Capturing a todo from an email/meeting
1. \`add_todo\` with source=email/meeting, capturedBy set to bot name
2. Status defaults to \`inbox\` for Paul to review
3. Link related notes with \`relatedNoteIds\`
4. Set priority based on urgency

### Managing todos
1. \`list_todos\` with status filters to see what's in flight
2. \`update_todo\` to change status, add context, or append log entries
3. \`complete_todo\` when done with optional closing note

### Tracking goals
1. \`add_goal\` to create a new goal with category and target
2. \`log_checkin\` daily (or weekly) to record progress
3. \`get_goal_progress\` to see streaks, met rates, and recent history
4. \`list_goals\` to see all active goals or filter by status/category

## Permissions

Each tool requires specific permissions on your admin token:
- \`plugin::paul-brain.guide.read\` — read this guide
- \`plugin::paul-brain.read\` — recall, get_entity, list_recent, list_retros, list_gaps, list_capabilities, list_rules, list_todos, get_todo
- \`plugin::paul-brain.stats.read\` — kb_stats
- \`plugin::paul-brain.health.read\` — health_check
- \`plugin::paul-brain.brief.read\` — get_briefing
- \`plugin::paul-brain.note.write\` — remember, update_note, link
- \`plugin::paul-brain.entity.write\` — upsert_person, upsert_source, update_source
- \`plugin::paul-brain.decision.write\` — log_decision
- \`plugin::paul-brain.meta.write\` — log_retro, log_gap, record_capability
- \`plugin::paul-brain.retro.update\` — update_retro
- \`plugin::paul-brain.gap.update\` — update_gap
- \`plugin::paul-brain.rule.write\` — add_rule
- \`plugin::paul-brain.todo.write\` — add_todo, update_todo, complete_todo
- \`plugin::paul-brain.goal.read\` — list_goals, get_goal_progress
- \`plugin::paul-brain.goal.write\` — add_goal, update_goal, log_checkin
- \`plugin::paul-brain.forget\` — forget (dangerous, usually not granted)

Plus the standard content-manager permissions for read/create/update on paul-brain types.
`;
