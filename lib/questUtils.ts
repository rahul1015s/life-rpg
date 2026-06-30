import { questCatalog } from '../constants/questCatalog';
import type {
  DailyQuest,
  QuestCategory,
  QuestCompletionLogEntry,
  QuestDifficulty,
  QuestTemplate,
} from './types';

const fallbackTemplate: QuestTemplate = {
  id: 'legacy-quest',
  title: 'Legacy Quest',
  description: 'Quest details were not saved for this older entry.',
  category: 'career',
  difficulty: 'medium',
  baseXP: 10,
  affectedStats: {},
  repeatType: 'flexible',
  recommendedTime: 'Flexible',
  whyThisHelps: 'Consistent action still contributes to long-term growth.',
  safetyNote: null,
};

const templateMap = new Map(questCatalog.map((template) => [template.id, template]));

export const categoryLabels: Record<QuestCategory, string> = {
  fitness: 'Fitness',
  study: 'Study',
  coding: 'Coding',
  writing: 'Writing',
  hygiene: 'Hygiene',
  appearance: 'Appearance',
  confidence: 'Confidence',
  social: 'Social Skills',
  communication: 'Communication',
  career: 'Career',
  health: 'Health',
  'mens-health': "Men's Health",
  style: 'Appearance',
  haircare: 'Hair Care',
};

export function getQuestTemplateById(id: string): QuestTemplate {
  return templateMap.get(id) ?? { ...fallbackTemplate, id, title: id };
}

export function normalizeDailyQuest(quest: Partial<DailyQuest> & { id: string; title: string }): DailyQuest {
  const template = getQuestTemplateById(quest.id);

  return {
    ...template,
    ...quest,
    description: quest.description ?? template.description,
    category: quest.category ?? template.category,
    difficulty: quest.difficulty ?? template.difficulty,
    baseXP: quest.baseXP ?? quest.xp ?? template.baseXP,
    affectedStats: quest.affectedStats ?? quest.statEffects ?? template.affectedStats,
    repeatType: quest.repeatType ?? template.repeatType,
    recommendedTime: quest.recommendedTime ?? template.recommendedTime,
    whyThisHelps: quest.whyThisHelps ?? template.whyThisHelps,
    safetyNote: quest.safetyNote ?? template.safetyNote,
    xp: quest.xp ?? quest.baseXP ?? template.baseXP,
    statEffects: quest.statEffects ?? quest.affectedStats ?? template.affectedStats,
    completed: quest.completed ?? false,
    completedAt: quest.completedAt ?? null,
    dateAssigned: quest.dateAssigned ?? '',
    isBonus: quest.isBonus ?? false,
    isPunishment: quest.isPunishment ?? false,
    locked: quest.locked ?? false,
    isAnchor: quest.isAnchor ?? false,
    whyToday: quest.whyToday ?? '',
  };
}

export function normalizeCompletionLogEntry(
  entry: Partial<QuestCompletionLogEntry> & {
    date: string;
    completedAt: string;
    questId: string;
    title: string;
  }
): QuestCompletionLogEntry {
  const template = getQuestTemplateById(entry.questId);

  return {
    date: entry.date,
    completedAt: entry.completedAt,
    questId: entry.questId,
    title: entry.title,
    category: entry.category ?? template.category,
    difficulty: entry.difficulty ?? template.difficulty,
    xp: entry.xp ?? template.baseXP,
    statEffects: entry.statEffects ?? template.affectedStats,
    isBonus: entry.isBonus ?? false,
  };
}

export function getDifficultyLabel(difficulty: QuestDifficulty): string {
  return difficulty[0].toUpperCase() + difficulty.slice(1);
}
