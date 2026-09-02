/**
 * Grant an admin permission action to an existing admin-kind API token.
 *
 * Run with:  node scripts/grant-mcp-permission.js <token-name> <action> [action...]
 *
 * Why this exists: a plugin's MCP tool is gated behind an action, and a tool
 * whose action nobody holds is invisible in `tools/list` with no error on
 * either side. Granting is therefore a routine step after adding a tool, not
 * an exceptional one.
 *
 * Writes the permission row directly. `admin::api-token-admin.create` rejects
 * an `adminPermissions` array with "[0] is not an existing permission action"
 * even when every action resolves in the provider — the error's yup path is
 * `permissions`, the legacy content-API field, so the array is validated
 * against the wrong schema on that path. `adminPermissions` is a plain
 * oneToMany to `admin::permission` (mappedBy: 'apiToken'), so this writes the
 * same rows the service would have.
 */
const { createStrapi, compileStrapi } = require('@strapi/strapi');

const [tokenName, ...actions] = process.argv.slice(2);

async function main() {
  if (!tokenName || actions.length === 0) {
    throw new Error('usage: node scripts/grant-mcp-permission.js <token-name> <action> [action...]');
  }

  const app = await createStrapi(await compileStrapi()).load();
  try {
    const token = await app.db.query('admin::api-token').findOne({
      where: { name: tokenName },
      populate: ['adminPermissions'],
    });
    if (!token) throw new Error(`No API token named "${tokenName}"`);
    if (token.kind !== 'admin') {
      throw new Error(`Token "${tokenName}" is kind="${token.kind}". MCP requires an admin-kind token.`);
    }

    const known = new Set(
      app.service('admin::permission').actionProvider.values().map((a) => a.actionId),
    );
    const unknown = actions.filter((a) => !known.has(a));
    if (unknown.length > 0) {
      throw new Error(
        `Unknown action(s): ${unknown.join(', ')}\n` +
          "A plugin tool's action only exists once the plugin has booted with that tool registered.",
      );
    }

    const already = new Set((token.adminPermissions || []).map((p) => p.action));
    let added = 0;
    for (const action of actions) {
      if (already.has(action)) continue;
      await app.db.query('admin::permission').create({
        data: { action, subject: null, properties: {}, conditions: [], apiToken: token.id },
      });
      added++;
    }

    console.error(`  granted ${added} new action(s) to "${tokenName}" (${actions.length - added} already held)`);
  } finally {
    await app.destroy();
  }
}

main().catch((err) => {
  console.error(`\n  GRANT FAILED: ${err.message}\n`);
  process.exit(1);
});
