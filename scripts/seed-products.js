/**
 * Seed demo products.
 *
 * Deliberately worded so a cross-type search has something to reconcile: each
 * summary shares vocabulary with the existing articles ("Strapi", "MCP",
 * "plugin"), so a query hits BOTH types and the fan-out has to merge two
 * different schemas rather than repeat one.
 */
const { createStrapi, compileStrapi } = require('@strapi/strapi');

const PRODUCTS = [
  {
    name: 'Strapi Cloud Starter',
    summary: 'Hosted Strapi with automatic upgrades. A good first step off localhost.',
    price: 29,
    inStock: true,
    tier: 'community',
  },
  {
    name: 'MCP Connector Pro',
    summary: 'Connect any MCP client to your Strapi content, with per-tool permissions.',
    price: 99,
    inStock: true,
    tier: 'pro',
  },
  {
    name: 'Enterprise Plugin Support',
    summary: 'Support contract for custom Strapi plugin development and review.',
    price: 2400,
    inStock: false,
    tier: 'enterprise',
  },
];

async function main() {
  const app = await createStrapi(await compileStrapi()).load();
  try {
    let created = 0;
    for (const data of PRODUCTS) {
      const existing = await app.documents('api::product.product').findMany({
        filters: { name: { $eq: data.name } },
        status: 'draft',
      });
      if (existing.length > 0) continue;
      // Published, so a `status: "published"` search finds them too.
      await app.documents('api::product.product').create({ data, status: 'published' });
      created++;
    }
    const total = await app.documents('api::product.product').count({});
    console.error(`  created ${created} product(s); ${total} total`);
  } finally {
    await app.destroy();
  }
}

main().catch((e) => {
  console.error(`\n  SEED FAILED: ${e.message}\n`);
  process.exit(1);
});
