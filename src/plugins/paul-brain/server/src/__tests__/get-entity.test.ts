import { readdirSync, readFileSync } from 'fs';
import { join } from 'path';
import { describe, expect, it } from 'vitest';
import { CONTENT_TYPES, getUid } from '../mcp/types';
import { register } from '../mcp/tools/get-entity';

const HELPERS = [
  'getUid',
  'stripNullish',
  'getTodayPST',
  'getDaysAgoPST',
  'diffDays',
  'toDateOnly',
  'pacificMidnightIso',
  'sinceToUpdatedAt',
  'publicFileView',
  'createResourceService',
  'calculateStreaks',
  'CONTENT_TYPES',
  'RESOURCE_FORMATS',
  'RESOURCE_STATUSES',
  'PLUGIN_NAME',
  'getActionId',
];

function stripComments(src: string): string {
  return src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
}

function importedValues(src: string): Set<string> {
  const names = new Set<string>();
  const code = stripComments(src);
  for (const match of code.matchAll(/import\s+(type\s+)?([\s\S]*?)\s+from\s+['"][^'"]+['"]/g)) {
    if (match[1]) continue;
    const clause = match[2];
    const named = clause.match(/\{([\s\S]*)\}/);
    if (named) {
      for (const part of named[1].split(',')) {
        const bit = part.trim();
        if (!bit || bit.startsWith('type ')) continue;
        const local = bit.includes(' as ') ? bit.split(/\s+as\s+/).pop() : bit;
        if (local) names.add(local.trim());
      }
    }
  }
  return names;
}

function locallyDeclared(src: string): Set<string> {
  const names = new Set<string>();
  const code = stripComments(src);
  for (const match of code.matchAll(/(?:function|class|const|let|var)\s+([A-Za-z_][A-Za-z0-9_]*)/g)) {
    names.add(match[1]);
  }
  return names;
}

function captureTool() {
  let tool: any;
  const lookedUp: string[] = [];
  const strapi = {
    ai: {
      mcp: {
        registerTool(definition: any) {
          tool = definition;
        },
      },
    },
    log: { warn() {} },
    contentAPI: {
      sanitize: {
        output: async (entity: any) => ({ ...entity, sanitized: true }),
      },
    },
    documents(uid: string) {
      return {
        async findMany(params: any) {
          lookedUp.push(uid);
          const identifier = params.filters.$or[0].documentId.$eq;
          if (identifier === 'missing') return [];
          const entity: Record<string, unknown> = {
            documentId: `${uid}-id`,
            slug: identifier,
          };
          if (uid.endsWith('.resource')) {
            entity.state = 'final';
            entity.author = 'cursor-agent';
            entity.file = {
              id: 7,
              name: 'brief.pdf',
              mime: 'application/pdf',
              ext: '.pdf',
              size: 12,
              url: 'https://cdn.example/public/brief.pdf',
              hash: 'secret-hash',
              provider: 'local',
            };
          }
          return [entity];
        },
      };
    },
  };

  register(strapi as any);
  return {
    tool,
    lookedUp,
    handler: tool.createHandler(strapi),
  };
}

describe('get_entity', () => {
  it('loads every entity kind, including resource, by documentId or slug', async () => {
    const { tool, handler, lookedUp } = captureTool();
    const schema = tool.resolveInputSchema();

    expect(CONTENT_TYPES).toContain('resource');

    for (const type of CONTENT_TYPES) {
      expect(schema.safeParse({ type, identifier: `${type}-slug` }).success).toBe(true);
      lookedUp.length = 0;

      const result = await handler({
        args: { type, identifier: `${type}-slug` },
        context: { userAbility: {} },
      });

      expect(lookedUp).toEqual([getUid(type)]);
      expect(result.structuredContent.entity).toMatchObject({
        documentId: `${getUid(type)}-id`,
        slug: `${type}-slug`,
        sanitized: true,
      });
      expect(result.content[0].text).toContain(`${type}-slug`);

      if (type === 'resource') {
        expect(result.structuredContent.entity.file).toEqual({
          id: 7,
          name: 'brief.pdf',
          mime: 'application/pdf',
          ext: '.pdf',
          size: 12,
        });
        const serialized = JSON.stringify(result);
        expect(serialized).not.toContain('cdn.example');
        expect(serialized).not.toContain('secret-hash');
        expect(serialized).not.toContain('"url"');
      }
    }

    expect(schema.safeParse({ type: 'not-a-kind', identifier: 'x' }).success).toBe(false);
  });

  it('returns a null entity when the identifier does not match', async () => {
    const { handler, lookedUp } = captureTool();
    lookedUp.length = 0;

    const result = await handler({
      args: { type: 'note', identifier: 'missing' },
      context: { userAbility: {} },
    });

    expect(lookedUp).toEqual([getUid('note')]);
    expect(result.structuredContent).toEqual({ entity: null });
    expect(result.content[0].text).toBe('Entity not found');
  });
});

describe('MCP tool helper bindings', () => {
  it('does not call a helper that the tool file neither imports nor declares', () => {
    const dir = join(__dirname, '../mcp/tools');
    const problems: string[] = [];

    for (const file of readdirSync(dir).filter((name) => name.endsWith('.ts'))) {
      const src = readFileSync(join(dir, file), 'utf8');
      const code = stripComments(src);
      const defined = new Set([...importedValues(src), ...locallyDeclared(src)]);

      for (const helper of HELPERS) {
        const used = new RegExp(`\\b${helper}\\s*\\(`).test(code) || new RegExp(`\\b${helper}\\b`).test(code);
        if (!used || defined.has(helper)) continue;
        // A name can appear in a description string. Only flag value usage outside strings.
        const withoutStrings = code
          .replace(/`(?:\\[\s\S]|[^`\\])*`/g, '``')
          .replace(/'(?:\\.|[^'\n\\])*'/g, "''")
          .replace(/"(?:\\.|[^"\n\\])*"/g, '""');
        const valueUse = new RegExp(`\\b${helper}\\b`).test(withoutStrings);
        if (valueUse) problems.push(`${file} uses ${helper} without importing or declaring it`);
      }
    }

    expect(problems).toEqual([]);
  });
});
