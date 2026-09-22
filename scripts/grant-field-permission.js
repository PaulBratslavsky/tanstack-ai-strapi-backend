/**
 * Add a field to every field-scoped Content Manager permission of a content type.
 *
 * Run with:  node scripts/grant-field-permission.js <content-type-uid> <field>
 * e.g.       node scripts/grant-field-permission.js api::article.article content
 *
 * Why this exists: Content Manager permissions store an explicit field list,
 * e.g. read { fields: ['title', 'slug', 'body', …] }. Renaming or adding a
 * field does not add it to those lists — Strapi drops a removed field but only
 * re-syncs the Super Admin role — so every other role and every admin API
 * token silently loses the field. For MCP that means `list_<type>` and
 * `get_<type>` omit it and `create_<type>` rejects it as an unrecognized key,
 * which reads like the data or the tool is broken.
 *
 * Only permissions that already carry a field list are touched: a permission
 * with no list (delete, publish) is not field-scoped. Stop the dev server
 * first — SQLite takes one writer.
 */
const { createStrapi, compileStrapi } = require('@strapi/strapi');

const [uid, field] = process.argv.slice(2);

async function main() {
  if (!uid || !field) {
    throw new Error('usage: node scripts/grant-field-permission.js <content-type-uid> <field>');
  }

  const app = await createStrapi(await compileStrapi()).load();
  try {
    if (!app.contentType(uid)?.attributes?.[field]) {
      throw new Error(`${uid} has no attribute "${field}"`);
    }

    const permissions = await app.db.query('admin::permission').findMany({
      where: { subject: uid, action: { $startsWith: 'plugin::content-manager.explorer.' } },
      populate: ['role', 'apiToken'],
    });

    let updated = 0;
    for (const permission of permissions) {
      const fields = permission.properties?.fields;
      if (!Array.isArray(fields) || fields.includes(field)) continue;
      await app.db.query('admin::permission').update({
        where: { id: permission.id },
        data: { properties: { ...permission.properties, fields: [...fields, field] } },
      });
      const owner = permission.role?.name ?? `token ${permission.apiToken?.name ?? '?'}`;
      console.log(`+ ${field} on ${permission.action.replace('plugin::content-manager.', '')} for ${owner}`);
      updated++;
    }
    console.log(`${updated} permission(s) updated`);
  } finally {
    await app.destroy();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
