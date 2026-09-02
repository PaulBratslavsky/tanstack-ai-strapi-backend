/**
 * Mints an ADMIN-KIND API token for the official Strapi MCP server.
 *
 * Run with:  node scripts/mint-mcp-token.js
 *
 * NOT `npx strapi console < this-file`. The console is a line-by-line REPL:
 * it chokes on top-level `await` and on statements spanning several lines,
 * and — worse — it ECHOES the source, so a caller grepping the output for the
 * banner below sees it and concludes the mint worked when nothing ran. This
 * boots Strapi programmatically instead, so a failure is a non-zero exit.
 *
 * Why not the admin UI: Settings -> API Tokens mints CONTENT tokens
 * (kind: 'api-token'). The MCP server calls authenticateAdminToken and
 * rejects those with 401. Only `admin::api-token-admin` mints the right kind.
 *
 * The grants below expose Strapi's built-in content-manager CRUD through MCP.
 * Plugin tools add their own actions — pass them as arguments:
 *
 *   node scripts/mint-mcp-token.js plugin::tanstack-ai.tool.list-content-types
 */
const { createStrapi, compileStrapi } = require('@strapi/strapi');

const EXTRA_ACTIONS = process.argv.slice(2);

// Empty by default: the token inherits its owner's reach. Pass action ids as
// arguments to narrow it instead.
const BASE_ACTIONS = [
  'plugin::content-manager.explorer.read',
  'plugin::content-manager.explorer.create',
  'plugin::content-manager.explorer.update',
];

async function main() {
  const appContext = await compileStrapi();
  const app = await createStrapi(appContext).load();

  try {
    const user = (
      await app.db.query('admin::user').findMany({ populate: ['roles'] })
    )[0];
    if (!user) {
      throw new Error('No admin user found. Create one at /admin first.');
    }

    // Reject unknown actions HERE, with a list of what exists, rather than
    // letting Strapi fail with "[0] is not an existing permission action" —
    // which names neither the offending value nor the valid ones.
    const known = new Set(
      app
        .service('admin::permission')
        .actionProvider.values()
        .map((a) => a.actionId),
    );
    const requested = [...BASE_ACTIONS, ...EXTRA_ACTIONS];
    const unknown = requested.filter((a) => !known.has(a));
    if (unknown.length > 0) {
      throw new Error(
        `Unknown permission action(s): ${unknown.join(', ')}\n` +
          'A plugin tool\'s action only exists once the plugin has registered it, ' +
          'so mint AFTER the plugin boots with that tool.',
      );
    }

    // Create the token WITHOUT permissions, then attach them.
    //
    // Passing `adminPermissions` to create() is rejected with "[0] is not an
    // existing permission action" even though every action resolves in the
    // provider (checked above via keys(), values() and get()). The error's
    // `path` is `permissions` — the LEGACY content-API field — so the array is
    // being validated against the wrong schema somewhere on that path, and
    // `kind: 'admin'` does not divert it. Rather than keep guessing at the
    // service's expectations, create the token the way that demonstrably
    // works and write the relation directly. `adminPermissions` is a plain
    // oneToMany to `admin::permission` (mappedBy: 'apiToken'), so this is the
    // same rows the service would have written.
    const token = await app.service('admin::api-token-admin').create(
      {
        kind: 'admin',
        name: 'tanstack-client-' + Date.now(),
        description: 'MCP access for the TanStack Start chat client',
        lifespan: null,
        adminUserOwner: user.id,
      },
      user,
    );

    for (const action of requested) {
      await app.db.query('admin::permission').create({
        data: { action, subject: null, properties: {}, conditions: [], apiToken: token.id },
      });
    }

    // Machine-readable, so a caller can pipe it straight into .env without
    // scraping a banner. The banner is for humans running this by hand.
    process.stdout.write(`ACCESS_KEY=${token.accessKey}\n`);
    console.error(`\n  minted with ${requested.length} action(s):`);
    for (const a of requested) console.error(`    ${a}`);
  } finally {
    await app.destroy();
  }
}

main().catch((err) => {
  console.error('\n  MINT FAILED:', err.message);
  console.error('  name:', err.name);
  console.error('  details:', JSON.stringify(err.details ?? err.errors ?? null));
  console.error('  path:', err.path);
  process.exit(1);
});
