import type { Core } from '@strapi/strapi';
import { z } from '@strapi/utils';
import { getActionId, PLUGIN_NAME } from '../permissions';
import { getUid } from '../types';
import { stripNullish } from '../utils';
import type { BrainService } from '../../services/brain';

export const register = (strapi: Core.Strapi) => {
  strapi.ai.mcp.registerTool({
    name: 'add_todo',
    title: 'Add Todo',
    description: 'Create a new todo item with duplicate detection. Bot-captured todos default to inbox status. Priority: P0 (urgent today), P1 (this week), P2 (soon, default), P3 (someday). onDuplicate: merge (append to existing), new (force new), supersede (mark old as superseded).',
    
    resolveInputSchema: () => z.object({
      title: z.string().describe('Todo title'),
      status: z.enum(['inbox', 'next', 'doing', 'waiting', 'done', 'dropped']).optional().describe('Status (default: inbox)'),
      priority: z.enum(['P0', 'P1', 'P2', 'P3']).optional().describe('Priority: P0 urgent today, P1 this week, P2 soon (default), P3 someday'),
      dueDate: z.string().optional().describe('Due date (ISO format)'),
      doDate: z.string().optional().describe('Do date (ISO format)'),
      goal: z.string().optional().describe('Goal or objective'),
      acceptanceCriteria: z.string().optional().describe('Acceptance criteria'),
      context: z.string().optional().describe('Context (markdown)'),
      links: z.array(z.object({
        type: z.enum(['email', 'github', 'calendar', 'doc', 'url', 'other']),
        label: z.string(),
        url: z.string(),
        note: z.string().optional(),
      })).optional().describe('Related links'),
      relatedNoteIds: z.array(z.string()).optional().describe('documentIds of related notes'),
      projectId: z.string().optional().describe('documentId or slug of the project'),
      waitingOn: z.string().optional().describe('What/who this is waiting on'),
      source: z.enum(['paul', 'email', 'meeting', 'bot', 'other']).optional().describe('Source (default: other)'),
      capturedBy: z.string().optional().describe('Bot or system that captured this'),
      logEntry: z.string().optional().describe('Initial log entry'),
      onDuplicate: z.enum(['merge', 'new', 'supersede']).optional().describe('How to handle duplicates: merge (append), new (force new), supersede (mark old superseded)'),
    }),
    
    resolveOutputSchema: () => z.union([
      z.object({
        needsDecision: z.literal(true),
        candidates: z.array(z.object({
          documentId: z.string(),
          title: z.string(),
          status: z.string(),
          priority: z.string(),
          dueDate: z.string().optional(),
          project: z.any().optional(),
        })),
      }),
      z.object({
        documentId: z.string(),
        title: z.string(),
        state: z.string(),
        priority: z.string(),
        merged: z.boolean().optional(),
        superseded: z.string().optional(),
      }),
    ]),
    
    auth: {
      policies: [{ action: getActionId('todo.write') }],
    },
    
    createHandler: (strapi) => async ({ args, context }) => {
      const brainService = strapi.plugin(PLUGIN_NAME).service('brain') as BrainService;
      const uid = getUid('todo');
      
      // Check for duplicates if onDuplicate is not set
      if (!args.onDuplicate) {
        const candidates = await brainService.findDuplicateTodos(args.title, args.dueDate, args.projectId);
        
        if (candidates.length > 0) {
          const output = stripNullish({
            needsDecision: true,
            candidates: candidates.map(c => ({
              documentId: c.documentId,
              title: c.title,
              status: c.state, // Map state to status for external API
              priority: c.priority,
              dueDate: c.dueDate,
              project: c.project,
            })),
          });

          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(output, null, 2),
              },
            ],
            structuredContent: output,
          };
        }
      }

      // Handle onDuplicate modes
      if (args.onDuplicate && args.onDuplicate !== 'new') {
        const candidates = await brainService.findDuplicateTodos(args.title, args.dueDate, args.projectId);
        
        if (candidates.length > 0) {
          const existing = candidates[0];
          
          if (args.onDuplicate === 'merge') {
            // Append context and add log entry
            const updates: any = {};
            
            if (args.context) {
              updates.context = existing.context 
                ? `${existing.context}\n\n---\n\n${args.context}`
                : args.context;
            }
            
            const logEntries = Array.isArray(existing.log) ? [...existing.log] : [];
            logEntries.push({
              date: new Date().toISOString(),
              entry: `Merged with new todo: ${args.title}${args.logEntry ? ` - ${args.logEntry}` : ''}`,
              by: args.capturedBy || 'system',
            });
            updates.log = logEntries;

            const result = await strapi.documents(uid).update({
              documentId: existing.documentId,
              data: updates,
            });

            const output = stripNullish({
              documentId: result.documentId,
              title: result.title,
              status: result.state, // Map state to status for external API
              priority: result.priority,
              merged: true,
            });

            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(output, null, 2),
                },
              ],
              structuredContent: output,
            };
          } else if (args.onDuplicate === 'supersede') {
            // Create new todo, mark old as superseded
            const newTodo = await createNewTodo(strapi, uid, args);
            
            await strapi.documents(uid).update({
              documentId: existing.documentId,
              data: {
                state: 'superseded',
                supersededBy: { connect: [{ documentId: newTodo.documentId }] },
              },
            });

            const output = stripNullish({
              documentId: newTodo.documentId,
              title: newTodo.title,
              status: newTodo.state, // Map state to status for external API
              priority: newTodo.priority,
              superseded: existing.documentId,
            });

            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(output, null, 2),
                },
              ],
              structuredContent: output,
            };
          }
        }
      }

      // Create new todo
      const result = await createNewTodo(strapi, uid, args);

      const output = stripNullish({
        documentId: result.documentId,
        title: result.title,
        status: result.state, // Map state to status for external API
        priority: result.priority,
      });

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(output, null, 2),
          },
        ],
        structuredContent: output,
      };
    },
  });
};

async function createNewTodo(strapi: Core.Strapi, uid: string, args: any) {
      const data: any = {
        title: args.title,
        state: args.status || 'inbox', // Map external status to internal state,
        priority: args.priority || 'P2',
        dueDate: args.dueDate,
        doDate: args.doDate,
        goal: args.goal,
        acceptanceCriteria: args.acceptanceCriteria,
        context: args.context,
        links: args.links || [],
        waitingOn: args.waitingOn,
        source: args.source || 'other',
        capturedBy: args.capturedBy,
        log: [],
      };

      if (args.logEntry) {
        data.log = [{
          date: new Date().toISOString(),
          entry: args.logEntry,
          by: args.capturedBy || 'system',
        }];
      }

      if (args.relatedNoteIds && args.relatedNoteIds.length > 0) {
        data.relatedNotes = {
          connect: args.relatedNoteIds.map(id => ({ documentId: id })),
        };
      }

      if (args.projectId) {
        const projectUid = getUid('project');
        const projects = await strapi.documents(projectUid).findMany({
          filters: {
            $or: [
              { documentId: { $eq: args.projectId } },
              { slug: { $eq: args.projectId } },
            ],
          },
          limit: 1,
        });

        if (projects.length > 0) {
          data.project = { connect: [{ documentId: projects[0].documentId }] };
        }
      }

      return strapi.documents(uid).create({ data });
}
