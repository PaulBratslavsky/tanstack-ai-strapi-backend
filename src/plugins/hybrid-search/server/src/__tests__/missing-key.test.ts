import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import { getRuntime } from '../runtime';
import { PERMISSIONS } from '../permissions';
import adminRoutes from '../routes/admin';
import { missingKeyMessage } from '../services/text';

const fakeStrapi = () => ({
  config: {
    get(key: string) {
      if (key === 'plugin::hybrid-search.types') return {};
      return undefined;
    },
  },
  log: { info() {}, warn() {}, error() {}, debug() {} },
  db: null,
});

describe('missing OPENAI_API_KEY', () => {
  it('returns keyword-only search and a status message without throwing', async () => {
    const previous = process.env.OPENAI_API_KEY;
    delete process.env.OPENAI_API_KEY;
    try {
      const runtime = getRuntime(fakeStrapi());
      const searched = await runtime.search({ query: 'habitat' });
      expect(searched.mode).toBe('keyword-only');
      expect(searched.statusMessage).toBe(missingKeyMessage());
      expect(searched.statusMessage).toMatch(/OPENAI_API_KEY/);
      expect(searched.results).toEqual([]);

      const similar = await runtime.similar({ text: 'habitat' });
      expect(similar.enabled).toBe(false);
      expect(similar.statusMessage).toMatch(/OPENAI_API_KEY/);
      expect(similar.results).toEqual([]);

      const status = await runtime.status();
      expect(status.embeddings).toBe('disabled');
      expect(status.apiKeyConfigured).toBe(false);
      expect(status.statusMessage).toMatch(/OPENAI_API_KEY/);
      expect(status.vectorStore).toBe('memory');
    } finally {
      if (previous === undefined) delete process.env.OPENAI_API_KEY;
      else process.env.OPENAI_API_KEY = previous;
    }
  });
});

describe('permissions and routes', () => {
  it('declares read and reindex with no dependency on the API key', () => {
    expect(PERMISSIONS.map((permission) => permission.uid).sort()).toEqual(['read', 'reindex']);
    const register = readFileSync(join(__dirname, '../register.ts'), 'utf8');
    const bootstrap = readFileSync(join(__dirname, '../bootstrap.ts'), 'utf8');
    expect(register).not.toMatch(/OPENAI_API_KEY/);
    expect(bootstrap).not.toMatch(/OPENAI_API_KEY/);
    const paths = adminRoutes.map((route) => `${route.method} ${route.path}`);
    expect(paths).toEqual(expect.arrayContaining(['GET /status', 'POST /search', 'POST /reindex']));
    expect(adminRoutes.every((route) => route.config.policies.length === 2)).toBe(true);
  });
});
