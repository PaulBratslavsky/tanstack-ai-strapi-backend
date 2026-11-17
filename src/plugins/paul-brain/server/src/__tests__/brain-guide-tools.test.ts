import { describe, expect, it } from 'vitest';
import { BRAIN_GUIDE } from '../mcp/guides/brain-guide';
import { tools } from '../mcp/tools';

describe('get_brain_guide', () => {
  it('documents exactly the tools that register, and reports 1.10.1', async () => {
    const registered: Array<{ name: string; createHandler: () => () => Promise<any> }> = [];
    const strapi = {
      ai: {
        mcp: {
          registerTool(definition: { name: string; createHandler: () => () => Promise<any> }) {
            registered.push(definition);
          },
        },
      },
      log: { info() {}, debug() {}, warn() {}, error() {} },
    };

    for (const tool of tools) tool.register(strapi as any);

    const names = registered.map((tool) => tool.name);
    expect(new Set(names).size).toBe(names.length);

    const guide = registered.find((tool) => tool.name === 'get_brain_guide');
    expect(guide).toBeDefined();
    const result = await guide!.createHandler()();
    expect(result.structuredContent.version).toBe('1.10.1');
    expect(result.structuredContent.guide).toBe(BRAIN_GUIDE);
    expect(result.content[0].text).toContain('Plugin version: 1.10.1');

    const toolSection = BRAIN_GUIDE.split('## When to Use Which Tool')[1].split('## Best Practices')[0];
    const headings = [...toolSection.matchAll(/^### ([a-z0-9_]+)/gm)].map((match) => match[1]);
    const registeredExceptGuide = names.filter((name) => name !== 'get_brain_guide').sort();

    expect(headings.slice().sort()).toEqual(registeredExceptGuide);

    const permissions = BRAIN_GUIDE.split('## Permissions')[1];
    const mentioned = [...permissions.matchAll(/\b([a-z]+(?:_[a-z0-9]+)+)\b/g)].map((match) => match[1]);
    const unknown = [...new Set(mentioned.filter((name) => !names.includes(name)))];
    expect(unknown).toEqual([]);
  });
});
