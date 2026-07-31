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
  getSettings,
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
  AppSettings,
  CustomQuest,
  DailyQuest,
  GoalRewardResult,
  HairLogEntry,
  HistoryEntry,
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
const MAX_PUNISHMENT_QUESTS = 2;

function toDailyQuest(
  template: QuestTemplate,
  dateAssigned: string,
  isBonus: boolean,
  options?: { isAnchor?: boolean; whyToday?: string }
): DailyQuest {
  return normalizeDailyQuest({
    ...template,
    xp: template.baseXP,
    statEffects: template.affectedStats,
    dateAssigned,
    completed: false,
    completedAt: null,
    isBonus,
    isPunishment: false,
    locked: false,
    isAnchor: options?.isAnchor ?? false,
    whyToday: options?.whyToday ?? '',
  });
}

function createPunishmentQuest(missedQuest: DailyQuest, dateAssigned: string, index: number, totalMissed: number): DailyQuest {
  const tier = Math.min(totalMissed + index, 4);
  const templates: QuestTemplate[] = [
    {
      id: `punishment-pushups-${dateAssigned}-${index}`,
      title: `Punishment: Do ${20 + tier * 5} pushups`,
      description: 'Make up for yesterday by completing a stricter upper-body bodyweight set with clean form.',
      category: 'fitness',
      difficulty: tier >= 3 ? 'hard' : 'medium',
      baseXP: 18 + tier * 2,
      affectedStats: { strength: 2, discipline: 2, appearance: 1 },
      repeatType: 'daily',
      recommendedTime: '8-12 min',
      whyThisHelps: 'Pushups train the chest, shoulders, and triceps while reinforcing discipline after a missed day.',
      safetyNote: 'Scale to incline pushups if full pushups break form or cause pain.',
    },
    {
      id: `punishment-dips-${dateAssigned}-${index}`,
      title: `Punishment: Do ${2 + tier} x ${8 + tier * 2} chair dips`,
      description: 'Use a stable chair or bench and finish the full dip volume before other quests unlock.',
      category: 'fitness',
      difficulty: 'hard',
      baseXP: 20 + tier * 2,
      affectedStats: { strength: 2, discipline: 2, appearance: 1 },
      repeatType: 'daily',
      recommendedTime: '10-15 min',
      whyThisHelps: 'Chair dips add extra triceps and shoulder work and make the penalty feel real.',
      safetyNote: 'Use a stable surface and stop if you feel shoulder pinching.',
    },
    {
      id: `punishment-pike-${dateAssigned}-${index}`,
      title: `Punishment: Do ${2 + tier} x ${6 + tier * 2} pike pushups`,
      description: 'Complete the pike pushup sets with controlled reps to earn back access to your normal quest board.',
      category: 'fitness',
      difficulty: 'hard',
      baseXP: 20 + tier * 2,
      affectedStats: { strength: 2, confidence: 1, discipline: 2 },
      repeatType: 'daily',
      recommendedTime: '10-15 min',
      whyThisHelps: 'Pike pushups bias the shoulders and upper chest and make missed days cost more.',
      safetyNote: 'Reduce range or elevate the hands if your shoulders or wrists feel strained.',
    },
  ];

  const template = templates[index % templates.length];
  return normalizeDailyQuest({
    ...template,
    id: `${template.id}-${missedQuest.id}`,
    title: template.title,
    dateAssigned,
    xp: template.baseXP,
    statEffects: template.affectedStats,
    isBonus: false,
    isPunishment: true,
    locked: false,
    isAnchor: false,
    whyToday: 'Punishment quest: yesterday was left unfinished, so this must be cleared before today’s normal board unlocks.',
    completed: false,
    completedAt: null,
  });
}

function createLockedQuests(quests: DailyQuest[], locked: boolean): DailyQuest[] {
  return quests.map((quest) => ({
    ...quest,
    locked: locked && !quest.isPunishment && !quest.completed,
  }));
}

function pickRandom<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
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
  const filteredGoals = profile.mainGoals.filter((goal) => goal !== 'all-rounder');
  if (filteredGoals.length === 0) {
    return null;
  }

  return mainGoalCategoryMap[pickRandom(filteredGoals)];
}

function getRecentQuestIds(rotationHistory: QuestRotationEntry[]): Set<string> {
  const recentEntries = rotationHistory
    .slice()
    .sort((first, second) => second.date.localeCompare(first.date))
    .slice(0, ROTATION_MEMORY_DAYS);

  return new Set(recentEntries.flatMap((entry) => entry.questIds));
}

function getRecentCompletionIds(completionLog: QuestCompletionLogEntry[]): Set<string> {
  return new Set(
    [...completionLog]
      .sort((first, second) => second.completedAt.localeCompare(first.completedAt))
      .slice(0, 10)
      .map((entry) => entry.questId)
  );
}

function getQuestTargetCounts(energyMode: AppSettings['energyMode']) {
  switch (energyMode) {
    case 'light':
      return { main: 4, bonus: 2 };
    case 'beast':
      return { main: 6, bonus: 4 };
    default:
      return { main: MAIN_QUEST_COUNT, bonus: BONUS_QUEST_COUNT };
  }
}

function getIntensityTier(
  profile: PlayerProfile,
  progress: PlayerProgress,
  settings: AppSettings
): number {
  let tier = profile.experienceLevel === 'beginner' ? 0 : profile.experienceLevel === 'normal' ? 1 : 2;

  if (progress.level >= 5) {
    tier += 1;
  }
  if (progress.level >= 12) {
    tier += 1;
  }

  if (settings.energyMode === 'light') {
    tier -= 1;
  }
  if (settings.energyMode === 'beast') {
    tier += 1;
  }

  return Math.max(0, Math.min(tier, 4));
}

function getDifficultyRank(difficulty: QuestTemplate['difficulty']) {
  switch (difficulty) {
    case 'easy':
      return 0;
    case 'medium':
      return 1;
    case 'hard':
      return 2;
  }
}

function tuneQuestTemplate(
  template: QuestTemplate,
  profile: PlayerProfile,
  progress: PlayerProgress,
  settings: AppSettings
): QuestTemplate {
  const tier = getIntensityTier(profile, progress, settings);
  const scaled = {
    ...template,
    baseXP: template.baseXP + Math.max(0, tier - 1) * 2,
  };

  switch (template.id) {
    case 'fitness-incline-pushups': {
      const reps = 12 + tier * 3;
      return {
        ...scaled,
        title: `Do ${reps} incline pushups`,
        description: `Use a bench, bed, or sturdy surface and complete ${reps} smooth incline pushups.`,
        difficulty: reps >= 21 ? 'medium' : 'easy',
      };
    }
    case 'fitness-pushups': {
      const reps = 15 + tier * 5;
      return {
        ...scaled,
        title: `Do ${reps} pushups`,
        description: `Complete a clean set of ${reps} pushups with full control.`,
        difficulty: reps >= 30 ? 'hard' : reps >= 20 ? 'medium' : 'easy',
      };
    }
    case 'fitness-chair-dips': {
      const sets = 2 + Math.min(tier, 2);
      const reps = 8 + tier * 2;
      return {
        ...scaled,
        title: `Do ${sets} x ${reps} chair dips`,
        description: `Use a stable chair or bench and complete ${sets} controlled sets of ${reps} chair dips.`,
        difficulty: tier >= 2 ? 'hard' : 'medium',
      };
    }
    case 'fitness-pike-pushups': {
      const sets = 2 + Math.min(tier, 2);
      const reps = 6 + tier * 2;
      return {
        ...scaled,
        title: `Do ${sets} x ${reps} pike pushups`,
        description: `Complete ${sets} controlled sets of ${reps} pike pushups to shift more work into the shoulders.`,
        difficulty: tier >= 1 ? 'hard' : 'medium',
      };
    }
    case 'fitness-shoulder-taps': {
      const reps = 16 + tier * 4;
      return {
        ...scaled,
        title: `Do 3 x ${reps} plank shoulder taps`,
        description: `Hold a strong plank and alternate shoulder taps for three controlled rounds of ${reps} total reps.`,
      };
    }
    case 'fitness-walk': {
      const minutes = 12 + tier * 4;
      return {
        ...scaled,
        title: `Walk for ${minutes} minutes`,
        description: `Take a steady ${minutes}-minute walk with attention on posture and breathing.`,
        recommendedTime: `${minutes} min`,
      };
    }
    case 'fitness-stretch': {
      const minutes = 8 + tier * 2;
      return {
        ...scaled,
        title: `Stretch for ${minutes} minutes`,
        description: `Spend ${minutes} minutes loosening hips, shoulders, hamstrings, and upper back.`,
        recommendedTime: `${minutes} min`,
      };
    }
    case 'study-deep-session': {
      const minutes = settings.energyMode === 'light' ? 20 : settings.energyMode === 'beast' ? 45 : 30;
      return {
        ...scaled,
        title: `Study your main subject for ${minutes} minutes`,
        description: `Do one focused ${minutes}-minute study session without multitasking.`,
        recommendedTime: `${minutes} min`,
      };
    }
    case 'coding-one-hour': {
      const minutes = settings.energyMode === 'light' ? 45 : settings.energyMode === 'beast' ? 75 : 60;
      return {
        ...scaled,
        title: `Code for ${minutes} minutes`,
        description: `Spend ${minutes} intentional minutes building, debugging, or learning by doing.`,
        recommendedTime: `${minutes} min`,
      };
    }
    case 'writing-300-words': {
      const words = settings.energyMode === 'light' ? 200 : settings.energyMode === 'beast' ? 450 : 300;
      return {
        ...scaled,
        title: `Write ${words} words`,
        description: `Write ${words} words on a story, article, reflection, or draft in progress.`,
      };
    }
    default:
      return scaled;
  }
}

function explainWhyToday(
  template: QuestTemplate,
  goalCategory: QuestCategory | null,
  energyMode: AppSettings['energyMode'],
  isAnchor: boolean,
  wasRecentlyRepeated: boolean
): string {
  if (isAnchor) {
    return `Anchor quest: this is your must-win task for today so you always have one clear momentum builder.`;
  }
  if (goalCategory && template.category === goalCategory) {
    return `Picked because it directly supports your current ${goalCategory.replace(/-/g, ' ')} growth path.`;
  }
  if (!wasRecentlyRepeated) {
    return `Picked to keep your board fresh and prevent the same exact quest from repeating too often.`;
  }
  if (energyMode === 'light') {
    return `Picked to keep today useful but more manageable on light mode.`;
  }
  if (energyMode === 'beast') {
    return `Picked because beast mode is asking the system for a harder push today.`;
  }
  return `Picked to balance your body, discipline, and growth categories across the week.`;
}

function chooseAnchorTemplate(mainTemplates: QuestTemplate[], goalCategory: QuestCategory | null): QuestTemplate | null {
  const candidates = mainTemplates.filter((quest) => quest.category !== 'haircare');
  if (candidates.length === 0) {
    return mainTemplates[0] ?? null;
  }

  return candidates
    .slice()
    .sort((first, second) => {
      const goalBias = Number(second.category === goalCategory) - Number(first.category === goalCategory);
      if (goalBias !== 0) {
        return goalBias;
      }

      const difficultyBias = getDifficultyRank(first.difficulty) - getDifficultyRank(second.difficulty);
      if (difficultyBias !== 0) {
        return difficultyBias;
      }

      return first.baseXP - second.baseXP;
    })[0];
}

function chooseQuestForCategories(
  pool: QuestTemplate[],
  categories: QuestCategory[],
  selectedIds: Set<string>,
  recentIds: Set<string>,
  recentCompletionIds: Set<string>,
  preferredCategory?: QuestCategory | null
): QuestTemplate | null {
  const categoryPool = pool.filter(
    (quest) => categories.includes(quest.category) && !selectedIds.has(quest.id)
  );

  const byFreshness = (items: QuestTemplate[]) =>
    items
      .filter((quest) => !recentIds.has(quest.id) && !recentCompletionIds.has(quest.id))
      .sort((first, second) => second.baseXP - first.baseXP);

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
  recentCompletionIds: Set<string>,
  preferredCategory?: QuestCategory | null
): QuestTemplate | null {
  const available = pool.filter((quest) => !selectedIds.has(quest.id));
  if (available.length === 0) {
    return null;
  }

  if (preferredCategory) {
    const preferredFresh = available.filter(
      (quest) =>
        quest.category === preferredCategory &&
        !recentIds.has(quest.id) &&
        !recentCompletionIds.has(quest.id)
    );
    if (preferredFresh.length > 0) {
      return pickRandom(preferredFresh);
    }

    const preferredAll = available.filter((quest) => quest.category === preferredCategory);
    if (preferredAll.length > 0) {
      return pickRandom(preferredAll);
    }
  }

  const fresh = available.filter((quest) => !recentIds.has(quest.id) && !recentCompletionIds.has(quest.id));
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
  progress: PlayerProgress,
  settings: AppSettings,
  customQuests: CustomQuest[],
  completionLog: QuestCompletionLogEntry[],
  rotationHistory: QuestRotationEntry[],
  today: string = getLocalDateString()
): DailyQuest[] {
  const pool = buildQuestPool(profile, customQuests, completionLog);
  const recentIds = getRecentQuestIds(rotationHistory);
  const recentCompletionIds = getRecentCompletionIds(completionLog);
  const selectedIds = new Set<string>();
  const mainTemplates: QuestTemplate[] = [];
  const bonusTemplates: QuestTemplate[] = [];
  const goalCategory = getGoalCategory(profile);
  const questTargets = getQuestTargetCounts(settings.energyMode);

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
    chooseQuestForCategories(pool, BODY_CATEGORIES, selectedIds, recentIds, recentCompletionIds, bodyPreferred)
  );
  appendQuest(
    mainTemplates,
    selectedIds,
    chooseQuestForCategories(pool, FOCUS_CATEGORIES, selectedIds, recentIds, recentCompletionIds, focusPreferred)
  );
  appendQuest(
    mainTemplates,
    selectedIds,
    chooseQuestForCategories(pool, SOCIAL_CATEGORIES, selectedIds, recentIds, recentCompletionIds, socialPreferred)
  );

  // Main daily rotation enforces a broad mix first, then uses the remaining slots
  // to respect the player's goal and keep repetition low across recent days.
  while (mainTemplates.length < questTargets.main) {
    const preferredCategory =
      goalCategory && !mainTemplates.some((quest) => quest.category === goalCategory) ? goalCategory : null;
    appendQuest(
      mainTemplates,
      selectedIds,
      chooseGeneralQuest(pool, selectedIds, recentIds, recentCompletionIds, preferredCategory)
    );
  }

  // Bonus quests are optional extra XP opportunities, so they pull from the remaining pool
  // without replacing the five main quests or affecting the core daily structure.
  while (bonusTemplates.length < questTargets.bonus) {
    appendQuest(
      bonusTemplates,
      selectedIds,
      chooseGeneralQuest(pool, selectedIds, recentIds, recentCompletionIds)
    );
    if (pool.length === selectedIds.size) {
      break;
    }
  }

  const anchorTemplate = chooseAnchorTemplate(mainTemplates, goalCategory);
  const anchorId = anchorTemplate?.id ?? null;

  return [
    ...mainTemplates.map((template) => {
      const tuned = tuneQuestTemplate(template, profile, progress, settings);
      return toDailyQuest(tuned, today, false, {
        isAnchor: tuned.id === anchorId,
        whyToday: explainWhyToday(
          tuned,
          goalCategory,
          settings.energyMode,
          tuned.id === anchorId,
          recentCompletionIds.has(tuned.id)
        ),
      });
    }),
    ...bonusTemplates.map((template) => {
      const tuned = tuneQuestTemplate(template, profile, progress, settings);
      return toDailyQuest(tuned, today, true, {
        whyToday: explainWhyToday(tuned, goalCategory, settings.energyMode, false, recentCompletionIds.has(tuned.id)),
      });
    }),
  ];
}

export async function ensureDailyQuests(profile: PlayerProfile): Promise<DailyQuest[]> {
  const today = getLocalDateString();
  const existingQuests = await getDailyQuests();

  if (existingQuests.length > 0 && existingQuests[0]?.dateAssigned === today) {
    return existingQuests;
  }

  const [history, completionLog, rotationHistory, customQuests, progress, settings] = await Promise.all([
    getHistory(),
    getCompletionLog(),
    getQuestRotation(),
    getCustomQuests(),
    getProgress(),
    getSettings(),
  ]);
  const mergedHistory = mergeHistoryIfMissing(history, existingQuests);
  const mergedCompletionLog = mergeCompletionLog(completionLog, existingQuests);
  if (mergedHistory !== history) {
    await setHistory(mergedHistory);
  }
  if (mergedCompletionLog !== completionLog) {
    await setCompletionLog(mergedCompletionLog);
  }

  const missedMainQuests = existingQuests.filter(
    (quest) => !quest.isBonus && !quest.isPunishment && !quest.completed
  );
  const punishmentQuests = missedMainQuests
    .slice(0, MAX_PUNISHMENT_QUESTS)
    .map((quest, index) => createPunishmentQuest(quest, today, index, missedMainQuests.length));
  if (!progress) {
    throw new Error('Player progress not found.');
  }

  const generatedQuests = generateDailyQuests(
    profile,
    progress,
    settings,
    customQuests,
    mergedCompletionLog,
    rotationHistory,
    today
  );
  const nextQuests = punishmentQuests.length > 0
    ? [...punishmentQuests, ...createLockedQuests(generatedQuests, true)]
    : generatedQuests;
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
  if (targetQuest.locked) {
    throw new Error('Complete the punishment quest first to unlock the rest of today’s board.');
  }

  const completionTimestamp = new Date().toISOString();
  let nextQuests = quests.map((quest) =>
    quest.id === questId ? { ...quest, completed: true, completedAt: completionTimestamp } : quest
  );
  const remainingPunishments = nextQuests.filter((quest) => quest.isPunishment && !quest.completed);
  if (remainingPunishments.length === 0) {
    nextQuests = nextQuests.map((quest) => ({ ...quest, locked: false }));
  }

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
