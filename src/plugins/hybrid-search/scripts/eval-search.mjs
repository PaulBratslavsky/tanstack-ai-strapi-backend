/**
 * Run the search fixture against a live hybrid-search admin route.
 *
 *   HYBRID_SEARCH_URL=https://example.strapiapp.com \
 *   HYBRID_SEARCH_TOKEN=... \
 *   npm run eval:search
 *
 * The token is an admin JWT (Authorization: Bearer). Nothing is written
 * to disk. The script exits 1 when a live case misses its expected phrase.
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const fixturePath = join(dirname(fileURLToPath(import.meta.url)), '../server/src/eval/cases.json');
const fixture = JSON.parse(readFileSync(fixturePath, 'utf8'));

const base = process.env.HYBRID_SEARCH_URL?.replace(/\/$/, '');
const token = process.env.HYBRID_SEARCH_TOKEN;
const path = process.env.HYBRID_SEARCH_PATH || '/admin/hybrid-search/search';

if (!base || !token) {
  console.error('Set HYBRID_SEARCH_URL and HYBRID_SEARCH_TOKEN. No request was sent.');
  process.exit(1);
}

const cases = fixture.cases.filter((item) => item.live !== false);
let failed = 0;

for (const item of cases) {
  const response = await fetch(`${base}${path}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query: item.query, limit: 3 }),
  });
  const text = await response.text();
  if (!response.ok) {
    failed += 1;
    console.error(`FAIL ${item.id} HTTP ${response.status} ${text.slice(0, 240)}`);
    continue;
  }
  const body = JSON.parse(text);
  const top = Array.isArray(body.results) ? body.results.slice(0, 3) : [];
  const haystack = JSON.stringify(top);
  const missing = item.expectInTop.filter((phrase) => !haystack.toLowerCase().includes(phrase.toLowerCase()));
  const mode = body.mode || body.searchMode || '';
  const note = body.statusMessage ? ` ${body.statusMessage}` : '';
  if (missing.length > 0) {
    failed += 1;
    console.error(`FAIL ${item.id} missing ${missing.join(', ')} in top ${top.length} (${mode}).${note}`);
    console.error(haystack.slice(0, 500));
  } else {
    console.log(`ok   ${item.id} top ${top.length} (${mode})`);
  }
}

if (failed > 0) {
  console.error(`${failed} of ${cases.length} live cases failed.`);
  process.exit(1);
}
console.log(`${cases.length} live cases passed.`);
