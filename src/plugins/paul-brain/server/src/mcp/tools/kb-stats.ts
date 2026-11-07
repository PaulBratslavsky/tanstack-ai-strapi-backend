import type { Core } from '@strapi/strapi';
import { z } from '@strapi/utils';
import { getActionId, PLUGIN_NAME } from '../permissions';
import { getUid } from '../types';
import { stripNullish } from '../utils';

export const register = (strapi: Core.Strapi) => {
  strapi.ai.mcp.registerTool({
    name: 'kb_stats',
    title: 'Knowledge Base Statistics',
    description: 'Get counts per paul-brain content type, notes by kind/tag, video notes vs transcripts in youtube-transcripts plugin, orphan count. See get_brain_guide for usage.',
    
    resolveInputSchema: () => z.object({}),
    
    resolveOutputSchema: () => z.object({
      contentTypeCounts: z.object({
        note: z.number(),
        person: z.number(),
        project: z.number(),
        decision: z.number(),
        source: z.number(),
        retro: z.number(),
        gap: z.number(),
        capability: z.number(),
        rule: z.number(),
        todo: z.number(),
        goal: z.number(),
        goalCheckin: z.number(),
      }),
      notesByKind: z.record(z.number()),
      notesByTag: z.record(z.number()),
      videoNotes: z.object({
        notesWithVideoId: z.number(),
        notesLinkedToSources: z.number(),
        videoSourcesWithNotes: z.number(),
        totalVideoSources: z.number(),
      }),
      transcripts: z.object({
        total: z.number(),
        withoutNotes: z.array(z.object({
          videoId: z.string(),
          title: z.string().nullish(),
        })).optional(),
      }),
      orphans: z.object({
        notesWithoutLinks: z.number(),
        peopleWithoutNotes: z.number(),
        projectsWithoutNotes: z.number(),
        sourcesWithoutNotes: z.number(),
      }),
    }),
    
    auth: {
      policies: [{ action: getActionId('stats.read') }],
    },
    
    createHandler: (strapi) => async ({ args, context }) => {
      const contentTypeCounts = {
        note: 0,
        person: 0,
        project: 0,
        decision: 0,
        source: 0,
        retro: 0,
        gap: 0,
        capability: 0,
        rule: 0,
        todo: 0,
        goal: 0,
        goalCheckin: 0,
      };

      const contentTypes = [
        'note', 'person', 'project', 'decision', 'source',
        'retro', 'gap', 'capability', 'rule', 'todo', 'goal', 'goal-checkin'
      ];

      for (const type of contentTypes) {
        try {
          const uid = getUid(type);
          const items = await strapi.documents(uid).findMany({
            limit: -1,
          });
          const key = type === 'goal-checkin' ? 'goalCheckin' : type;
          contentTypeCounts[key] = items.length;
        } catch (err) {
          strapi.log.warn(`Failed to count ${type}:`, err);
        }
      }

      const notesByKind: Record<string, number> = {};
      const notesByTag: Record<string, number> = {};
      let notesWithVideoId = 0;
      let notesWithoutLinks = 0;

      try {
        const notes = await strapi.documents(getUid('note')).findMany({
          limit: -1,
          populate: ['people', 'projects', 'sources', 'decisions'],
        });

        for (const note of notes) {
          if (note.kind) {
            notesByKind[note.kind] = (notesByKind[note.kind] || 0) + 1;
          }

          if (Array.isArray(note.tags)) {
            for (const tag of note.tags) {
              notesByTag[tag] = (notesByTag[tag] || 0) + 1;
            }
          }

          if (note.videoId) {
            notesWithVideoId++;
          }

          const hasLinks = 
            (Array.isArray(note.people) && note.people.length > 0) ||
            (Array.isArray(note.projects) && note.projects.length > 0) ||
            (Array.isArray(note.sources) && note.sources.length > 0) ||
            (Array.isArray(note.decisions) && note.decisions.length > 0);

          if (!hasLinks) {
            notesWithoutLinks++;
          }
        }
      } catch (err) {
        strapi.log.warn('Failed to analyze notes:', err);
      }

      let notesLinkedToSources = 0;
      let videoSourcesWithNotes = 0;
      let totalVideoSources = 0;

      try {
        const sources = await strapi.documents(getUid('source')).findMany({
          limit: -1,
          populate: ['notes'],
        });

        for (const source of sources) {
          if (source.type === 'video') {
            totalVideoSources++;
            if (Array.isArray(source.notes) && source.notes.length > 0) {
              videoSourcesWithNotes++;
            }
          }

          if (Array.isArray(source.notes) && source.notes.length > 0) {
            notesLinkedToSources += source.notes.length;
          }
        }
      } catch (err) {
        strapi.log.warn('Failed to analyze sources:', err);
      }

      let peopleWithoutNotes = 0;
      try {
        const people = await strapi.documents(getUid('person')).findMany({
          limit: -1,
          populate: ['notes'],
        });
        peopleWithoutNotes = people.filter(p => 
          !Array.isArray(p.notes) || p.notes.length === 0
        ).length;
      } catch (err) {
        strapi.log.warn('Failed to analyze people:', err);
      }

      let projectsWithoutNotes = 0;
      try {
        const projects = await strapi.documents(getUid('project')).findMany({
          limit: -1,
          populate: ['notes'],
        });
        projectsWithoutNotes = projects.filter(p => 
          !Array.isArray(p.notes) || p.notes.length === 0
        ).length;
      } catch (err) {
        strapi.log.warn('Failed to analyze projects:', err);
      }

      let sourcesWithoutNotes = 0;
      try {
        const sources = await strapi.documents(getUid('source')).findMany({
          limit: -1,
          populate: ['notes'],
        });
        sourcesWithoutNotes = sources.filter(s => 
          !Array.isArray(s.notes) || s.notes.length === 0
        ).length;
      } catch (err) {
        strapi.log.warn('Failed to analyze sources:', err);
      }

      let transcriptsTotal = 0;
      const transcriptsWithoutNotes: { videoId: string; title?: string }[] = [];

      try {
        const transcriptPlugin = strapi.plugin('youtube-transcripts');
        if (transcriptPlugin) {
          const transcripts = await strapi.documents('plugin::youtube-transcripts.transcript').findMany({
            limit: -1,
          });
          transcriptsTotal = transcripts.length;

          const notes = await strapi.documents(getUid('note')).findMany({
            limit: -1,
            filters: {
              videoId: { $notNull: true },
            },
          });

          const notedVideoIds = new Set(notes.map(n => n.videoId));

          for (const transcript of transcripts) {
            if (!notedVideoIds.has(transcript.videoId)) {
              transcriptsWithoutNotes.push({
                videoId: transcript.videoId,
                title: transcript.title,
              });
            }
          }
        }
      } catch (err) {
        strapi.log.debug('youtube-transcripts plugin not available or error:', err);
      }

      const output = stripNullish({
        contentTypeCounts,
        notesByKind,
        notesByTag,
        videoNotes: {
          notesWithVideoId,
          notesLinkedToSources,
          videoSourcesWithNotes,
          totalVideoSources,
        },
        transcripts: {
          total: transcriptsTotal,
          withoutNotes: transcriptsWithoutNotes.length > 0 ? transcriptsWithoutNotes : undefined,
        },
        orphans: {
          notesWithoutLinks,
          peopleWithoutNotes,
          projectsWithoutNotes,
          sourcesWithoutNotes,
        },
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
