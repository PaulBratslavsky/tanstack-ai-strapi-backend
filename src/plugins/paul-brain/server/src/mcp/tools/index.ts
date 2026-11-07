import * as getBrainGuide from './get-brain-guide';
import * as recall from './recall';
import * as getEntity from './get-entity';
import * as listRecent from './list-recent';
import * as remember from './remember';
import * as updateNote from './update-note';
import * as link from './link';
import * as logDecision from './log-decision';
import * as forget from './forget';
import * as logRetro from './log-retro';
import * as listRetros from './list-retros';
import * as logGap from './log-gap';
import * as listGaps from './list-gaps';
import * as recordCapability from './record-capability';
import * as listCapabilities from './list-capabilities';
import * as addRule from './add-rule';
import * as listRules from './list-rules';
import * as addTodo from './add-todo';
import * as updateTodo from './update-todo';
import * as listTodos from './list-todos';
import * as getTodo from './get-todo';
import * as completeTodo from './complete-todo';
import * as addGoal from './add-goal';
import * as listGoals from './list-goals';
import * as logCheckin from './log-checkin';
import * as getGoalProgress from './get-goal-progress';
import * as updateGoal from './update-goal';
import * as healthCheck from './health-check';
import * as updateRetro from './update-retro';
import * as updateGap from './update-gap';
import * as getBriefing from './get-briefing';
import * as kbStats from './kb-stats';
import * as upsertSource from './upsert-source';
import * as updateSource from './update-source';
import * as upsertPerson from './upsert-person';

export const tools = [
  getBrainGuide,
  kbStats,
  recall,
  getEntity,
  listRecent,
  remember,
  updateNote,
  upsertPerson,
  upsertSource,
  updateSource,
  link,
  logDecision,
  forget,
  logRetro,
  listRetros,
  updateRetro,
  logGap,
  listGaps,
  updateGap,
  recordCapability,
  listCapabilities,
  addRule,
  listRules,
  addTodo,
  updateTodo,
  listTodos,
  getTodo,
  completeTodo,
  addGoal,
  listGoals,
  logCheckin,
  getGoalProgress,
  updateGoal,
  healthCheck,
  getBriefing,
];
