/**
 * Migration: Rename 'status' column to 'state' across all plugin content types
 * 
 * This migration runs BEFORE schema sync drops the old 'status' column.
 * Order verified in @strapi/database/dist/schema/index.js lines 80-90:
 * user migrations (db.migrations.up()) execute before db.schema.sync()
 */

async function up(knex) {
  const strapi = global.strapi;
  
  // Get the configured schema (for Postgres)
  const schema = strapi?.config?.get('database.connection.schema') || 
                 strapi?.db?.connection?.context?.client?.config?.searchPath?.[0] || 
                 'public';
  
  strapi?.log?.info(`[migration] Using database schema: ${schema}`);

  // Helper to check if table exists in the configured schema
  async function tableExists(tableName) {
    const result = await knex.schema.withSchema(schema).hasTable(tableName);
    return result;
  }

  // Helper to check if column exists
  async function columnExists(tableName, columnName) {
    const hasTable = await tableExists(tableName);
    if (!hasTable) return false;
    
    const hasColumn = await knex.schema.withSchema(schema).hasColumn(tableName, columnName);
    return hasColumn;
  }

  // All tables that need migration
  const tables = [
    // agent-bus tables
    'agent_bus_agents',
    'agent_bus_approvals', 
    'agent_bus_credentials',
    'agent_bus_deliveries',
    'agent_bus_messages',
    'agent_bus_threads',
    // paul-brain tables
    'paul_brain_decisions',
    'paul_brain_gaps',
    'paul_brain_goals',
    'paul_brain_projects',
    'paul_brain_retros',
    'paul_brain_todos',
  ];

  // Check that at least one expected table exists (verify we're in the right schema)
  const existingTables = [];
  for (const table of tables) {
    if (await tableExists(table)) {
      existingTables.push(table);
    }
  }

  // Check if any Strapi core table exists to verify we have the right schema
  const hasCoreTables = await tableExists('strapi_migrations') || 
                        await tableExists('admin_users');

  if (hasCoreTables && existingTables.length === 0) {
    // We found Strapi core tables but none of our plugin tables - this is an error
    throw new Error(
      `[migration] FATAL: Found Strapi core tables but no plugin tables in schema '${schema}'. ` +
      `Expected tables: ${tables.join(', ')}. ` +
      `This suggests a schema configuration problem. Migration aborted to prevent data loss.`
    );
  }

  if (!hasCoreTables && existingTables.length === 0) {
    // No tables at all - probably a fresh database
    strapi?.log?.info(`[migration] No existing tables found - fresh database, skipping migration`);
    return;
  }

  strapi?.log?.info(`[migration] Found ${existingTables.length} tables to migrate in schema '${schema}'`);

  // Default values for each table (matching schema.json defaults)
  const defaults = {
    agent_bus_agents: 'active',
    agent_bus_approvals: 'pending',
    agent_bus_credentials: 'active',
    agent_bus_deliveries: 'pending',
    agent_bus_messages: 'queued',
    agent_bus_threads: 'open',
    paul_brain_decisions: 'open',
    paul_brain_gaps: 'open',
    paul_brain_goals: 'active',
    paul_brain_projects: 'active',
    paul_brain_retros: 'open',
    paul_brain_todos: 'inbox',
  };

  for (const tableName of existingTables) {
    try {
      // Check if state column already exists
      const hasState = await columnExists(tableName, 'state');
      if (hasState) {
        strapi?.log?.info(`[migration] ${tableName}: 'state' column already exists, skipping`);
        continue;
      }

      // Check if status column exists
      const hasStatus = await columnExists(tableName, 'status');
      if (!hasStatus) {
        strapi?.log?.info(`[migration] ${tableName}: 'status' column not found, skipping`);
        continue;
      }

      strapi?.log?.info(`[migration] ${tableName}: Adding 'state' column and migrating data`);

      // Add the new 'state' column with default
      await knex.schema.withSchema(schema).table(tableName, (table) => {
        table.string('state', 255).defaultTo(defaults[tableName] || 'active');
      });

      // Copy values from 'status' to 'state', using default for nulls
      const defaultValue = defaults[tableName] || 'active';
      await knex(tableName)
        .withSchema(schema)
        .update({
          state: knex.raw(`COALESCE(status, '${defaultValue}')`),
        });

      strapi?.log?.info(`[migration] ${tableName}: Migration complete`);
    } catch (error) {
      strapi?.log?.error(`[migration] ${tableName}: Failed - ${error.message}`);
      throw error;
    }
  }

  strapi?.log?.info('[migration] All tables migrated successfully');
}

async function down(knex) {
  // Not implemented - this migration is one-way
  throw new Error('Rollback not supported for status->state migration');
}

module.exports = { up, down };
