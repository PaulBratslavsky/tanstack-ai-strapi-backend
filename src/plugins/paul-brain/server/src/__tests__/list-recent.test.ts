import { describe, expect, it } from 'vitest';
import { register } from '../mcp/tools/list-recent';

describe('list_recent', () => {
  it('returns items from healthy types and an errors entry for a type that throws', async () => {
    let handler: (input: { args: any; context: any }) => Promise<any> = async () => ({});
    const strapi = {
      log: { warn() {}, info() {}, error() {} },
      contentAPI: {
        sanitize: {
          async output(item: any) {
            return item;
          },
        },
      },
      documents(uid: string) {
        return {
          async findMany() {
            if (uid.endsWith('.person')) throw new Error('Invalid key name');
            if (uid.endsWith('.note')) {
              return [{
                documentId: 'note-1',
                title: 'Fresh note',
                slug: 'fresh-note',
                updatedAt: '2026-04-02T00:00:00.000Z',
              }];
            }
            return [];
          },
        };
      },
      ai: {
        mcp: {
          registerTool(def: any) {
            handler = def.createHandler(strapi);
          },
        },
      },
    };

    register(strapi as any);
    const result = await handler({
      args: { types: ['note', 'person'], limit: 5 },
      context: { userAbility: {} },
    });
    expect(result.structuredContent.items.map((item: any) => item.documentId)).toEqual(['note-1']);
    expect(result.structuredContent.count).toBe(1);
    expect(result.structuredContent.errors).toEqual([{ type: 'person', message: 'Invalid key name' }]);
  });
});
