import { mainGoalCategoryMap, questCatalog } from '../constants/questCatalog';
import {
  applyStatBonus,
  buildAchievementState,
  checkForUnlockedAchievements,
} from './achievementEngine';
import {
  getAchievements,
  getCompletionLog,
  getCustomQuests,
  getDailyQuests,
  getGoals,
  getHairLog,
  getHistory,
  getProfile,
  getProgress,
  getQuestRotation,
  setAchievements,
  setCompletionLog,
  setCustomQuests,
  setDailyQuests,
  setGoals,
  setHairLog,
  setHistory,
  setProgress,
  setQuestRotation,
} from './storage';
import { applyLevelProgression, getRankForLevel } from './levelSystem';
import { updateGoalsFromCompletion } from './goalsEngine';
import { getLocalDateString, markDoseComplete } from './haircareEngine';
import { normalizeDailyQuest } from './questUtils';
import type {
  AchievementUnlock,
  AchievementUnlockResult,
  CustomQuest,
  DailyQuest,
  GoalRewardResult,
  HairLogEntry,
  HistoryEntry,
  PersonalGoal,
  PlayerProfile,
  PlayerProgress,
  QuestCategory,
  QuestCompletionLogEntry,
  QuestCompletionResult,
  QuestRotationEntry,
  QuestTemplate,
  StatKey,
} from './types';

const MAIN_QUEST_COUNT = 5;
const BONUS_QUEST_COUNT = 3;
const FORCED_MINOXIDIL_IDS = ['haircare-morning', 'haircare-night'];
const BODY_CATEGORIES: QuestCategory[] = ['fitness', 'health', 'hygiene', 'appearance'];
const FOCUS_CATEGORIES: QuestCategory[] = ['study', 'coding', 'career', 'writing'];
const SOCIAL_CATEGORIES: QuestCategory[] = ['confidence', 'communication', 'social'];
const ROTATION_MEMORY_DAYS = 4;

function toDailyQuest(template: QuestTemplate, dateAssigned: string, isBonus: boolean): DailyQuest {
  return normalizeDailyQuest({
    ...template,
    xp: template.baseXP,
    statEffects: template.affectedStats,
    dateAssigned,
    completed: false,
    completedAt: null,
    isBonus,
  });
}

function pickRandom<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

function shuffle<T>(items: T[]): T[] {
  const next = [...items];
  for (let index = next.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [next[index], next[swapIndex]] = [next[swapIndex], next[index]];
  }
  return next;
}

function mergeHistoryIfMissing(history: HistoryEntry[], quests: DailyQuest[]): HistoryEntry[] {
  if (quests.length === 0) {
    return history;
  }

  const date = quests[0].dateAssigned;
  if (history.some((entry) => entry.date === date)) {
    return history;
  }

  const completedQuests = quests.filter((quest) => quest.completed);
  if (completedQuests.length === 0) {
    return history;
  }

  return [
    ...history,
    {
      date,
      questsCompleted: completedQuests.length,
      xpEarned: completedQuests.reduce((total, quest) => total + quest.xp, 0),
    },
  ].sort((first, second) => first.date.localeCompare(second.date));
}

function toCompletionLogEntry(quest: DailyQuest): QuestCompletionLogEntry {
  return {
    date: quest.dateAssigned,
    completedAt: quest.completedAt ?? new Date(`${quest.dateAssigned}T12:00:00`).toISOString(),
    questId: quest.id,
    title: quest.title,
    category: quest.category,
    difficulty: quest.difficulty,
    xp: quest.xp,
    statEffects: quest.statEffects,
    isBonus: quest.isBonus,
  };
}

function mergeCompletionLog(existingLog: QuestCompletionLogEntry[], quests: DailyQuest[]): QuestCompletionLogEntry[] {
  const completedQuests = quests.filter((quest) => quest.completed);
  if (completedQuests.length === 0) {
    return existingLog;
  }

  const seen = new Set(existingLog.map((entry) => `${entry.date}:${entry.questId}:${entry.isBonus}`));
  const merged = [...existingLog];

  for (const quest of completedQuests) {
    const key = `${quest.dateAssigned}:${quest.id}:${quest.isBonus}`;
    if (!seen.has(key)) {
      merged.push(toCompletionLogEntry(quest));
      seen.add(key);
    }
  }

  return merged.sort((first, second) => second.completedAt.localeCompare(first.completedAt));
}

function buildQuestPool(
  profile: PlayerProfile,
  customQuests: CustomQuest[],
  completionLog: QuestCompletionLogEntry[]
): QuestTemplate[] {
  const completedQuestIds = new Set(completionLog.map((entry) => entry.questId));
  const builtIn = questCatalog.filter((quest) => {
    if (!profile.usesMinoxidil && quest.category === 'haircare') {
      return false;
    }
    if (quest.repeatType === 'one-time' && completedQuestIds.has(quest.id)) {
      return false;
    }
    return true;
  });

  const custom = customQuests.filter((quest) => {
    if (!quest.active) {
      return false;
    }
    if (!profile.usesMinoxidil && quest.category === 'haircare') {
      return false;
    }
    if (quest.repeatType === 'one-time' && completedQuestIds.has(quest.id)) {
      return false;
    }
    return true;
  });

  return [...builtIn, ...custom];
}

function getGoalCategory(profile: PlayerProfile): QuestCategory | null {
  if (profile.mainGoal === 'all-rounder') {
    return null;
  }
  return mainGoalCategoryMap[profile.mainGoal];
}

function getRecentQuestIds(rotationHistory: QuestRotationEntry[]): Set<string> {
  const recentEntries = rotationHistory
    .slice()
    .sort((first, second) => second.date.localeCompare(first.date))
    .slice(0, ROTATION_MEMORY_DAYS);

  return new Set(recentEntries.flatMap((entry) => entry.questIds));
}

function chooseQuestForCategories(
  pool: QuestTemplate[],
  categories: QuestCategory[],
  selectedIds: Set<string>,
  recentIds: Set<string>,
  preferredCategory?: QuestCategory | null
): QuestTemplate | null {
  const categoryPool = pool.filter(
    (quest) => categories.includes(quest.category) && !selectedIds.has(quest.id)
  );

  const byFreshness = (items: QuestTemplate[]) =>
    items.filter((quest) => !recentIds.has(quest.id)).sort((first, second) => second.baseXP - first.baseXP);

  const preferredFresh = preferredCategory
    ? byFreshness(categoryPool.filter((quest) => quest.category === preferredCategory))
    : [];
  if (preferredFresh.length > 0) {
    return pickRandom(preferredFresh.slice(0, 2));
  }

  const freshCandidates = byFreshness(categoryPool);
  if (freshCandidates.length > 0) {
    return pickRandom(freshCandidates.slice(0, Math.min(3, freshCandidates.length)));
  }

  const preferredAll = preferredCategory
    ? categoryPool.filter((quest) => quest.category === preferredCategory)
    : [];
  if (preferredAll.length > 0) {
    return pickRandom(preferredAll);
  }

  return categoryPool.length > 0 ? pickRandom(categoryPool) : null;
}

function chooseGeneralQuest(
  pool: QuestTemplate[],
  selectedIds: Set<string>,
  recentIds: Set<string>,
  preferredCategory?: QuestCategory | null
): QuestTemplate | null {
  const available = pool.filter((quest) => !selectedIds.has(quest.id));
  if (available.length === 0) {
    return null;
  }

  if (preferredCategory) {
    const preferredFresh = available.filter(
      (quest) => quest.category === preferredCategory && !recentIds.has(quest.id)
    );
    if (preferredFresh.length > 0) {
      return pickRandom(preferredFresh);
    }

    const preferredAll = available.filter((quest) => quest.category === preferredCategory);
    if (preferredAll.length > 0) {
      return pickRandom(preferredAll);
    }
  }

  const fresh = available.filter((quest) => !recentIds.has(quest.id));
  return pickRandom(fresh.length > 0 ? fresh : available);
}

function appendQuest(target: QuestTemplate[], selectedIds: Set<string>, quest: QuestTemplate | null) {
  if (quest && !selectedIds.has(quest.id)) {
    target.push(quest);
    selectedIds.add(quest.id);
  }
}

function pruneRotationHistory(history: QuestRotationEntry[], today: string, quests: DailyQuest[]): QuestRotationEntry[] {
  const withoutToday = history.filter((entry) => entry.date !== today);
  return [
    { date: today, questIds: quests.map((quest) => quest.id) },
    ...withoutToday,
  ]
    .sort((first, second) => second.date.localeCompare(first.date))
    .slice(0, 14);
}

export function generateDailyQuests(
  profile: PlayerProfile,
  customQuests: CustomQuest[],
  completionLog: QuestCompletionLogEntry[],
  rotationHistory: QuestRotationEntry[],
  today: string = getLocalDateString()
): DailyQuest[] {
  const pool = buildQuestPool(profile, customQuests, completionLog);
  const recentIds = getRecentQuestIds(rotationHistory);
  const selectedIds = new Set<string>();
  const mainTemplates: QuestTemplate[] = [];
  const bonusTemplates: QuestTemplate[] = [];
  const goalCategory = getGoalCategory(profile);

  // Minoxidil tracking remains guaranteed so existing treatment behavior is preserved.
  if (profile.usesMinoxidil) {
    for (const forcedId of FORCED_MINOXIDIL_IDS) {
      appendQuest(mainTemplates, selectedIds, pool.find((quest) => quest.id === forcedId) ?? null);
    }
  }

  const bodyPreferred = goalCategory && BODY_CATEGORIES.includes(goalCategory) ? goalCategory : null;
  const focusPreferred = goalCategory && FOCUS_CATEGORIES.includes(goalCategory) ? goalCategory : null;
  const socialPreferred = goalCategory && SOCIAL_CATEGORIES.includes(goalCategory) ? goalCategory : null;

  appendQuest(
    mainTemplates,
    selectedIds,
    chooseQuestForCategories(pool, BODY_CATEGORIES, selectedIds, recentIds, bodyPreferred)
  );
  appendQuest(
    mainTemplates,
    selectedIds,
    chooseQuestForCategories(pool, FOCUS_CATEGORIES, selectedIds, recentIds, focusPreferred)
  );
  appendQuest(
    mainTemplates,
    selectedIds,
    chooseQuestForCategories(pool, SOCIAL_CATEGORIES, selectedIds, recentIds, socialPreferred)
  );

  // Main daily rotation enforces a broad mix first, then uses the remaining slots
  // to respect the player's goal and keep repetition low across recent days.
  while (mainTemplates.length < MAIN_QUEST_COUNT) {
    const preferredCategory =
      goalCategory && !mainTemplates.some((quest) => quest.category === goalCategory) ? goalCategory : null;
    appendQuest(mainTemplates, selectedIds, chooseGeneralQuest(pool, selectedIds, recentIds, preferredCategory));
  }

  // Bonus quests are optional extra XP opportunities, so they pull from the remaining pool
  // without replacing the five main quests or affecting the core daily structure.
  while (bonusTemplates.length < BONUS_QUEST_COUNT) {
    appendQuest(bonusTemplates, selectedIds, chooseGeneralQuest(pool, selectedIds, recentIds));
    if (pool.length === selectedIds.size) {
      break;
    }
  }

  return [
    ...mainTemplates.map((template) => toDailyQuest(template, today, false)),
    ...bonusTemplates.map((template) => toDailyQuest(template, today, true)),
  ];
}

export async function ensureDailyQuests(profile: PlayerProfile): Promise<DailyQuest[]> {
  const today = getLocalDateString();
  const existingQuests = await getDailyQuests();

  if (existingQuests.length > 0 && existingQuests[0]?.dateAssigned === today) {
    return existingQuests;
  }

  const [history, completionLog, rotationHistory, customQuests] = await Promise.all([
    getHistory(),
    getCompletionLog(),
    getQuestRotation(),
    getCustomQuests(),
  ]);
  const mergedHistory = mergeHistoryIfMissing(history, existingQuests);
  const mergedCompletionLog = mergeCompletionLog(completionLog, existingQuests);
  if (mergedHistory !== history) {
    await setHistory(mergedHistory);
  }
  if (mergedCompletionLog !== completionLog) {
    await setCompletionLog(mergedCompletionLog);
  }

  const nextQuests = generateDailyQuests(profile, customQuests, completionLog, rotationHistory, today);
  await Promise.all([
    setDailyQuests(nextQuests),
    setQuestRotation(pruneRotationHistory(rotationHistory, today, nextQuests)),
  ]);
  return nextQuests;
}

function applyStatEffects(
  progress: PlayerProgress,
  statEffects: Partial<Record<StatKey, number>>
): PlayerProgress {
  const nextStats = { ...progress.stats };

  for (const [key, value] of Object.entries(statEffects) as [StatKey, number][]) {
    nextStats[key] += value;
  }

  return { ...progress, stats: nextStats };
}

function updateStreak(progress: PlayerProgress, today: string): PlayerProgress {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayString = getLocalDateString(yesterday);

  // Streaks only change when a completion is recorded.
  // A missed day is detected the next time the user completes something:
  // same day keeps the streak, yesterday increments it, anything older resets to 1.
  let nextStreak = progress.streak;
  if (progress.lastCompletionDate === today) {
    nextStreak = progress.streak;
  } else if (progress.lastCompletionDate === yesterdayString) {
    nextStreak = progress.streak + 1;
  } else {
    nextStreak = 1;
  }

  return {
    ...progress,
    streak: nextStreak,
    longestStreak: Math.max(progress.longestStreak, nextStreak),
    lastCompletionDate: today,
  };
}

function updateHistory(history: HistoryEntry[], today: string, xp: number): HistoryEntry[] {
  const existingEntry = history.find((entry) => entry.date === today);

  if (!existingEntry) {
    return [...history, { date: today, questsCompleted: 1, xpEarned: xp }].sort((first, second) =>
      first.date.localeCompare(second.date)
    );
  }

  return history.map((entry) =>
    entry.date === today
      ? {
          ...entry,
          questsCompleted: entry.questsCompleted + 1,
          xpEarned: entry.xpEarned + xp,
        }
      : entry
  );
}

function addBonusXPToHistory(history: HistoryEntry[], today: string, bonusXP: number): HistoryEntry[] {
  if (bonusXP <= 0) {
    return history;
  }

  return history.map((entry) =>
    entry.date === today
      ? {
          ...entry,
          xpEarned: entry.xpEarned + bonusXP,
        }
      : entry
  );
}

function updateHairLogForQuest(hairLog: HairLogEntry[], quest: DailyQuest, today: string): HairLogEntry[] {
  if (quest.id === 'haircare-morning') {
    return markDoseComplete(hairLog, today, 'morning');
  }

  if (quest.id === 'haircare-night') {
    return markDoseComplete(hairLog, today, 'night');
  }

  return hairLog;
}

function mergeAchievementUnlocks(
  existing: AchievementUnlock[],
  unlockedResults: AchievementUnlockResult[]
): AchievementUnlock[] {
  return [...existing, ...unlockedResults.map((item) => ({ id: item.achievement.id, unlockedAt: item.unlockedAt }))];
}

function mergeStatTotals(
  base: Partial<Record<StatKey, number>>,
  incoming: Partial<Record<StatKey, number>>
): Partial<Record<StatKey, number>> {
  const next = { ...base };
  for (const [key, value] of Object.entries(incoming) as [StatKey, number][]) {
    next[key] = (next[key] ?? 0) + value;
  }
  return next;
}

export async function completeDailyQuest(questId: string): Promise<QuestCompletionResult> {
  const today = getLocalDateString();
  const [progress, quests, history, hairLog, completionLog, achievements, profile, customQuests, goals] =
    await Promise.all([
    getProgress(),
    getDailyQuests(),
    getHistory(),
    getHairLog(),
    getCompletionLog(),
    getAchievements(),
    getProfile(),
    getCustomQuests(),
    getGoals(),
  ]);

  if (!progress) {
    throw new Error('Player progress not found.');
  }
  if (!profile) {
    throw new Error('Player profile not found.');
  }

  const targetQuest = quests.find((quest) => quest.id === questId);
  if (!targetQuest) {
    throw new Error('Quest not found.');
  }
  if (targetQuest.completed) {
    throw new Error('Quest already completed.');
  }

  const completionTimestamp = new Date().toISOString();
  const nextQuests = quests.map((quest) =>
    quest.id === questId ? { ...quest, completed: true, completedAt: completionTimestamp } : quest
  );

  let nextProgress = applyStatEffects(
    {
      ...progress,
      xp: progress.xp + targetQuest.xp,
      totalXP: progress.totalXP + targetQuest.xp,
    },
    targetQuest.statEffects
  );

  nextProgress = updateStreak(nextProgress, today);
  let nextHistory = updateHistory(history, today, targetQuest.xp);
  const nextHairLog = updateHairLogForQuest(hairLog, targetQuest, today);
  const nextCompletionLog = mergeCompletionLog(completionLog, nextQuests);
  const nextCustomQuests = customQuests.map((quest) =>
    quest.id === targetQuest.id ? { ...quest, completedCount: quest.completedCount + 1 } : quest
  );
  const goalUpdate = updateGoalsFromCompletion(goals, nextCompletionLog, completionTimestamp);
  let nextGoals = goalUpdate.goals;
  const completedGoals: GoalRewardResult[] = goalUpdate.completedGoals;
  const goalBonusXP = completedGoals.reduce((total, item) => total + item.goal.bonusXP, 0);
  if (goalBonusXP > 0) {
    nextProgress = {
      ...nextProgress,
      xp: nextProgress.xp + goalBonusXP,
      totalXP: nextProgress.totalXP + goalBonusXP,
    };
    nextHistory = addBonusXPToHistory(nextHistory, today, goalBonusXP);
  }
  const unlockedAchievementResults: AchievementUnlockResult[] = [];
  let nextAchievements = [...achievements];
  let rewardStatGains: Partial<Record<StatKey, number>> = {};

  // Achievements are checked after the quest state is applied, and any reward XP/stat bonuses
  // are folded back into progress exactly once before the final persisted state is saved.
  while (true) {
    const leveled = applyLevelProgression(nextProgress);
    nextProgress = leveled.progress;

    const achievementState = buildAchievementState(nextProgress, nextCompletionLog, profile.usesMinoxidil);
    const newUnlocks = checkForUnlockedAchievements(
      achievementState,
      nextAchievements,
      new Date().toISOString()
    );

    if (newUnlocks.length === 0) {
      break;
    }

    unlockedAchievementResults.push(...newUnlocks);
    nextAchievements = mergeAchievementUnlocks(nextAchievements, newUnlocks);

    const rewardXP = newUnlocks.reduce((total, item) => total + item.achievement.rewardXP, 0);
    const rewardStats = newUnlocks.reduce<Partial<Record<StatKey, number>>>((accumulator, item) => {
      return mergeStatTotals(accumulator, item.achievement.rewardStats);
    }, {});

    rewardStatGains = mergeStatTotals(rewardStatGains, rewardStats);
    nextProgress = {
      ...nextProgress,
      xp: nextProgress.xp + rewardXP,
      totalXP: nextProgress.totalXP + rewardXP,
      stats: applyStatBonus(nextProgress.stats, rewardStats),
    };
    nextHistory = addBonusXPToHistory(nextHistory, today, rewardXP);
  }

  const finalLevelResult = applyLevelProgression(nextProgress);
  nextProgress = finalLevelResult.progress;
  const totalStatGains = mergeStatTotals(targetQuest.statEffects, rewardStatGains);
  const normalizedLevelUp =
    nextProgress.level > progress.level
      ? {
          didLevelUp: true,
          previousLevel: progress.level,
          newLevel: nextProgress.level,
          previousRank: getRankForLevel(progress.level),
          currentRank: getRankForLevel(nextProgress.level),
          rankChanged: getRankForLevel(progress.level) !== getRankForLevel(nextProgress.level),
          statGains: totalStatGains,
        }
      : null;

  await Promise.all([
    setDailyQuests(nextQuests),
    setProgress(nextProgress),
    setHistory(nextHistory),
    setHairLog(nextHairLog),
    setCompletionLog(nextCompletionLog),
    setAchievements(nextAchievements),
    setCustomQuests(nextCustomQuests),
    setGoals(nextGoals),
  ]);

  return {
    progress: nextProgress,
    quests: nextQuests,
    history: nextHistory,
    hairLog: nextHairLog,
    completionLog: nextCompletionLog,
    levelUp: normalizedLevelUp,
    unlockedAchievements: unlockedAchievementResults,
    completedGoals,
  };
}
