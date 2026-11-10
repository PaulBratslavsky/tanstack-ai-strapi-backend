import type { Core } from '@strapi/strapi';
import { z } from '@strapi/utils';
import { getActionId } from '../permissions';
import { getUid } from '../types';
import { stripNullish, getTodayPST, diffDays } from '../utils';

interface Finding {
  severity: 'BLOCK' | 'WARN';
  kind: string;
  type: string;
  ids: string[];
  message: string;
  suggestedFix: string;
}

function normalizeTitle(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, ' ');
}

function isSimilar(title1: string, title2: string): boolean {
  const norm1 = normalizeTitle(title1);
  const norm2 = normalizeTitle(title2);
  
  if (norm1 === norm2) return true;
  
  const words1 = norm1.split(' ');
  const words2 = norm2.split(' ');
  const commonWords = words1.filter(w => words2.includes(w) && w.length > 3);
  
  const similarity = (2 * commonWords.length) / (words1.length + words2.length);
  return similarity > 0.7;
}

export const register = (strapi: Core.Strapi) => {
  strapi.ai.mcp.registerTool({
    name: 'health_check',
    title: 'Health Check',
    description: 'Run diagnostic checks on brain data. Returns findings with severity (BLOCK/WARN), kind, type, ids, message, and suggestedFix. Checks for duplicates, missing fields, stale data, orphans, broken relations, old capabilities, and open retros.',
    
    resolveInputSchema: () => z.object({
      checks: z.array(z.enum([
        'duplicates',
        'missing_fields',
        'stale_notes',
        'orphans',
        'broken_relations',
        'old_capabilities',
        'open_retros',
        'sanity'
      ])).optional().describe('Specific checks to run (default: all)'),
    }),
    
    resolveOutputSchema: () => z.object({
      findings: z.array(z.object({
        severity: z.enum(['BLOCK', 'WARN']),
        kind: z.string(),
        type: z.string(),
        ids: z.array(z.string()),
        message: z.string(),
        suggestedFix: z.string(),
      })),
      summary: z.object({
        total: z.number(),
        blocks: z.number(),
        warns: z.number(),
      }),
    }),
    
    auth: {
      policies: [{ action: getActionId('health.read') }],
    },
    
    createHandler: (strapi) => async ({ args }) => {
      const findings: Finding[] = [];
      const checksToRun = args.checks || [
        'duplicates',
        'missing_fields',
        'stale_notes',
        'orphans',
        'broken_relations',
        'old_capabilities',
        'open_retros',
        'sanity'
      ];

      // Check for duplicate todos and notes
      if (checksToRun.includes('duplicates')) {
        const todoUid = getUid('todo');
        const todos = await strapi.documents(todoUid).findMany({
          filters: {
            state: { $notIn: ['done', 'dropped', 'superseded'] }
          },
          limit: 500,
        });

        for (let i = 0; i < todos.length; i++) {
          for (let j = i + 1; j < todos.length; j++) {
            const t1 = todos[i];
            const t2 = todos[j];
            
            if (isSimilar(t1.title, t2.title)) {
              const sameDueDate = t1.dueDate && t2.dueDate && t1.dueDate === t2.dueDate;
              const sameProject = t1.project?.documentId === t2.project?.documentId;
              
              if (sameDueDate || sameProject) {
                findings.push({
                  severity: 'WARN',
                  kind: 'duplicate_todo',
                  type: 'todo',
                  ids: [t1.documentId, t2.documentId],
                  message: `Likely duplicate todos: "${t1.title}" and "${t2.title}"`,
                  suggestedFix: `Review and merge or supersede one: add_todo with onDuplicate: 'supersede'`,
                });
              }
            }
          }
        }

        const noteUid = getUid('note');
        const notes = await strapi.documents(noteUid).findMany({
          limit: 500,
        });

        for (let i = 0; i < notes.length; i++) {
          for (let j = i + 1; j < notes.length; j++) {
            const n1 = notes[i];
            const n2 = notes[j];
            
            if (isSimilar(n1.title, n2.title)) {
              findings.push({
                severity: 'WARN',
                kind: 'duplicate_note',
                type: 'note',
                ids: [n1.documentId, n2.documentId],
                message: `Likely duplicate notes: "${n1.title}" and "${n2.title}"`,
                suggestedFix: `Review and merge or supersede one: remember with onDuplicate: 'supersede'`,
              });
            }
          }
        }
      }

      // Check for todos with missing fields
      if (checksToRun.includes('missing_fields')) {
        const todoUid = getUid('todo');
        const todos = await strapi.documents(todoUid).findMany({
          limit: 500,
        });

        for (const todo of todos) {
          if (!todo.priority) {
            findings.push({
              severity: 'WARN',
              kind: 'missing_priority',
              type: 'todo',
              ids: [todo.documentId],
              message: `Todo "${todo.title}" is missing priority`,
              suggestedFix: `Set priority: update_todo with priority: 'P2'`,
            });
          }

          if (!todo.state) {
            findings.push({
              severity: 'WARN',
              kind: 'missing_status',
              type: 'todo',
              ids: [todo.documentId],
              message: `Todo "${todo.title}" is missing status`,
              suggestedFix: `Set status: update_todo with status: 'inbox'`,
            });
          }

          if (todo.state === 'done' && !todo.completedAt) {
            findings.push({
              severity: 'WARN',
              kind: 'missing_completed_at',
              type: 'todo',
              ids: [todo.documentId],
              message: `Done todo "${todo.title}" is missing completedAt`,
              suggestedFix: `Set completedAt: update_todo or use complete_todo`,
            });
          }

          if (todo.state === 'waiting' && !todo.waitingOn) {
            findings.push({
              severity: 'WARN',
              kind: 'missing_waiting_on',
              type: 'todo',
              ids: [todo.documentId],
              message: `Waiting todo "${todo.title}" is missing waitingOn`,
              suggestedFix: `Set waitingOn: update_todo with waitingOn: '<description>'`,
            });
          }
        }
      }

      // Check for stale temporary notes
      if (checksToRun.includes('stale_notes')) {
        const noteUid = getUid('note');
        const notes = await strapi.documents(noteUid).findMany({
          filters: {
            durability: { $eq: 'temporary' },
          },
          limit: 500,
        });

        const todayPST = getTodayPST();
        for (const note of notes) {
          if (note.verifiedAt) {
            const ageInDays = diffDays(todayPST, note.verifiedAt.slice(0, 10));
            
            if (ageInDays > 90) {
              findings.push({
                severity: 'WARN',
                kind: 'stale_temporary_note',
                type: 'note',
                ids: [note.documentId],
                message: `Temporary note "${note.title}" verified ${Math.floor(ageInDays)} days ago (>90 days)`,
                suggestedFix: `Re-verify using howToRecheck, or change durability to 'durable', or delete`,
              });
            }
          }
        }
      }

      // Check for orphan notes
      if (checksToRun.includes('orphans')) {
        const noteUid = getUid('note');
        const notes = await strapi.documents(noteUid).findMany({
          populate: ['people', 'projects', 'sources', 'decisions', 'relatedTodos'],
          limit: 500,
        });

        for (const note of notes) {
          const hasPeople = Array.isArray(note.people) && note.people.length > 0;
          const hasProjects = Array.isArray(note.projects) && note.projects.length > 0;
          const hasSources = Array.isArray(note.sources) && note.sources.length > 0;
          const hasDecisions = Array.isArray(note.decisions) && note.decisions.length > 0;
          const hasTodos = Array.isArray(note.relatedTodos) && note.relatedTodos.length > 0;
          
          if (!hasPeople && !hasProjects && !hasSources && !hasDecisions && !hasTodos) {
            findings.push({
              severity: 'WARN',
              kind: 'orphan_note',
              type: 'note',
              ids: [note.documentId],
              message: `Note "${note.title}" has no relations or links`,
              suggestedFix: `Link to people/projects/sources using link tool, or delete if obsolete`,
            });
          }
        }
      }

      // Check for broken relations
      if (checksToRun.includes('broken_relations')) {
        const noteUid = getUid('note');
        const notes = await strapi.documents(noteUid).findMany({
          populate: ['people', 'projects', 'sources', 'decisions', 'relatedTodos'],
          limit: 500,
        });

        for (const note of notes) {
          const relations = [
            ...((note.people || []) as any[]),
            ...((note.projects || []) as any[]),
            ...((note.sources || []) as any[]),
            ...((note.decisions || []) as any[]),
            ...((note.relatedTodos || []) as any[])
          ];

          for (const rel of relations) {
            if (!rel || !rel.documentId) {
              findings.push({
                severity: 'WARN',
                kind: 'broken_relation',
                type: 'note',
                ids: [note.documentId],
                message: `Note "${note.title}" has a broken relation`,
                suggestedFix: `Remove broken relation using link tool with operation: 'disconnect'`,
              });
              break;
            }
          }
        }
      }

      // Check for old capabilities
      if (checksToRun.includes('old_capabilities')) {
        const capabilityUid = getUid('capability');
        const capabilities = await strapi.documents(capabilityUid).findMany({
          limit: 500,
        });

        const todayPST = getTodayPST();
        for (const capability of capabilities) {
          if (capability.verifiedAt) {
            const ageInDays = diffDays(todayPST, capability.verifiedAt.slice(0, 10));
            
            if (ageInDays > 90) {
              findings.push({
                severity: 'WARN',
                kind: 'old_capability',
                type: 'capability',
                ids: [capability.documentId],
                message: `Capability "${capability.system}: ${capability.capability}" verified ${Math.floor(ageInDays)} days ago (>90 days)`,
                suggestedFix: `Re-verify using howVerified and update with record_capability`,
              });
            }
          }
        }
      }

      // Check for open retros older than 14 days
      if (checksToRun.includes('open_retros')) {
        const retroUid = getUid('retro');
        const retros = await strapi.documents(retroUid).findMany({
          filters: {
            state: { $eq: 'open' },
          },
          limit: 500,
        });

        const todayPST = getTodayPST();
        for (const retro of retros) {
          if (retro.date) {
            const ageInDays = diffDays(todayPST, retro.date.slice(0, 10));
            
            if (ageInDays > 14) {
              findings.push({
                severity: 'WARN',
                kind: 'old_open_retro',
                type: 'retro',
                ids: [retro.documentId],
                message: `Retro "${retro.title}" has been open for ${Math.floor(ageInDays)} days (>14 days)`,
                suggestedFix: `Review and update status to 'fixed', 'declined', or 'wontfix' using update_retro`,
              });
            }
          }
        }
      }

      // Sanity check: collections returning 0 rows
      if (checksToRun.includes('sanity')) {
        const types = ['note', 'todo', 'person', 'project', 'retro', 'gap', 'capability', 'rule'];
        
        for (const type of types) {
          const uid = getUid(type);
          const results = await strapi.documents(uid).findMany({ limit: 1 });
          
          if (results.length === 0) {
            const rawQuery = await strapi.db.query(uid).count();
            
            if (rawQuery > 0) {
              findings.push({
                severity: 'BLOCK',
                kind: 'sanity_mismatch',
                type,
                ids: [],
                message: `Collection ${type} returns 0 rows but raw count is ${rawQuery}`,
                suggestedFix: `Check database permissions and Strapi document service configuration`,
              });
            }
          }
        }
      }

      const summary = {
        total: findings.length,
        blocks: findings.filter(f => f.severity === 'BLOCK').length,
        warns: findings.filter(f => f.severity === 'WARN').length,
      };

      const output = stripNullish({
        findings,
        summary,
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
