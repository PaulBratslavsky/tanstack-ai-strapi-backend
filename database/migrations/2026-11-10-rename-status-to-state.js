/**
 * Migration: Rename `status` column to `state` across paul-brain and agent-bus content types
 * 
 * Context:
 * - Strapi 5.60 admin panel treats `status` as a reserved field for draft/publish workflow
 * - This conflicts with our custom `status` attributes in content types with draftAndPublish:false
 * - Bug: @strapi/content-manager/dist/server/services/document-metadata.js line 79 overwrites our field
 * - Bug: @strapi/content-manager/dist/server/controllers/validation/dimensions.js validates against draft/published enum
 * 
 * Migration Strategy (validated against @strapi/database 5.60 source):
 * - Per @strapi/database/dist/schema/index.js lines 80-90, migrations run BEFORE schema sync
 * - Per @strapi/database/dist/schema/diff.js lines 169-172, schema sync drops untracked columns
 * - Safe approach: Add `state` column, copy data, let schema sync remove old `status` column
 * 
 * Affected Tables:
 * - paul_brain_projects (status → state)
 * - paul_brain_gaps (status → state)
 * - paul_brain_retros (status → state)
 * - paul_brain_goals (status → state)
 * - paul_brain_decisions (status → state)
 * - paul_brain_todos (status → state)
 * - agent_bus_agents (status → state)
 * - agent_bus_credentials (status → state)
 * - agent_bus_approvals (status → state)
 * - agent_bus_deliveries (status → state)
 * - agent_bus_messages (status → state)
 * - agent_bus_threads (status → state)
 */

'use strict';

async function up(knex) {
  const tables = [
    { name: 'paul_brain_projects', defaultValue: 'idea' },
    { name: 'paul_brain_gaps', defaultValue: 'open' },
    { name: 'paul_brain_retros', defaultValue: 'open' },
    { name: 'paul_brain_goals', defaultValue: 'active' },
    { name: 'paul_brain_decisions', defaultValue: 'proposed' },
    { name: 'paul_brain_todos', defaultValue: 'inbox' },
    { name: 'agent_bus_agents', defaultValue: 'active' },
    { name: 'agent_bus_credentials', defaultValue: 'active' },
    { name: 'agent_bus_approvals', defaultValue: 'pending' },
    { name: 'agent_bus_deliveries', defaultValue: 'pending' },
    { name: 'agent_bus_messages', defaultValue: 'queued' },
    { name: 'agent_bus_threads', defaultValue: 'open' },
  ];

  for (const table of tables) {
    const hasTable = await knex.schema.hasTable(table.name);
    if (!hasTable) {
      console.log(`[Migration] Skipping ${table.name}: table does not exist`);
      continue;
    }

    const hasStatusColumn = await knex.schema.hasColumn(table.name, 'status');
    const hasStateColumn = await knex.schema.hasColumn(table.name, 'state');

    if (!hasStatusColumn && !hasStateColumn) {
      console.log(`[Migration] Skipping ${table.name}: neither status nor state column exists`);
      continue;
    }

    if (hasStateColumn) {
      console.log(`[Migration] Skipping ${table.name}: state column already exists (migration already ran)`);
      continue;
    }

    // Add state column (same type as status: string/varchar)
    console.log(`[Migration] Adding state column to ${table.name}`);
    await knex.schema.alterTable(table.name, (t) => {
      t.string('state').defaultTo(table.defaultValue);
    });

    // Copy data from status to state
    console.log(`[Migration] Copying status → state for ${table.name}`);
    const rows = await knex(table.name).select('id', 'status').whereNotNull('status');
    
    for (const row of rows) {
      await knex(table.name)
        .where('id', row.id)
        .update({ state: row.status });
    }

    // Handle rows with null status (use default)
    const nullRows = await knex(table.name).select('id').whereNull('status');
    if (nullRows.length > 0) {
      console.log(`[Migration] Found ${nullRows.length} rows with null status in ${table.name}, setting to default: ${table.defaultValue}`);
      for (const row of nullRows) {
        await knex(table.name)
          .where('id', row.id)
          .update({ state: table.defaultValue });
      }
    }

    console.log(`[Migration] Successfully migrated ${table.name}`);
  }

  console.log('[Migration] status → state migration complete. Schema sync will remove old status columns.');
}

async function down(knex) {
  // Down migration: rename state back to status
  // This would run if rolling back, but should be unnecessary in production
  const tables = [
    'paul_brain_projects',
    'paul_brain_gaps',
    'paul_brain_retros',
    'paul_brain_goals',
    'paul_brain_decisions',
    'paul_brain_todos',
    'agent_bus_agents',
    'agent_bus_credentials',
    'agent_bus_approvals',
    'agent_bus_deliveries',
    'agent_bus_messages',
    'agent_bus_threads',
  ];

  for (const tableName of tables) {
    const hasTable = await knex.schema.hasTable(tableName);
    if (!hasTable) continue;

    const hasStateColumn = await knex.schema.hasColumn(tableName, 'state');
    if (!hasStateColumn) continue;

    // Copy state back to status
    await knex.schema.alterTable(tableName, (t) => {
      t.string('status');
    });

    await knex(tableName).update({ status: knex.ref('state') });
    
    console.log(`[Migration Down] Restored status column for ${tableName}`);
  }
}

module.exports = { up, down };
