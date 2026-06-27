import { achievementCatalog } from '../constants/achievements';
import type {
  AchievementCardView,
  AchievementProgressState,
  AchievementProgressView,
  AchievementTemplate,
  AchievementUnlock,
  AchievementUnlockResult,
  MensHealthState,
  PlayerProgress,
  QuestCategory,
  QuestCompletionLogEntry,
  StatKey,
} from './types';

function hasCompletedCategory(categories: QuestCategory[], target: QuestCategory): boolean {
  return categories.includes(target);
}

function buildProgress(template: AchievementTemplate, state: AchievementProgressState): AchievementProgressView {
  switch (template.id) {
    case 'first-quest':
      return { current: Math.min(state.totalQuestsCompleted, 1), target: 1, label: 'quest completed' };
    case 'streak-7':
      return { current: Math.min(state.currentStreak, 7), target: 7, label: 'streak days' };
    case 'streak-30':
      return { current: Math.min(state.currentStreak, 30), target: 30, label: 'streak days' };
    case 'quests-100':
      return { current: Math.min(state.totalQuestsCompleted, 100), target: 100, label: 'total quests' };
    case 'xp-500':
      return { current: Math.min(state.totalXP, 500), target: 500, label: 'total XP' };
    case 'xp-1000':
      return { current: Math.min(state.totalXP, 1000), target: 1000, label: 'total XP' };
    case 'fitness-first':
      return { current: hasCompletedCategory(state.completedCategories, 'fitness') ? 1 : 0, target: 1, label: 'fitness quest' };
    case 'coding-first':
      return { current: hasCompletedCategory(state.completedCategories, 'coding') ? 1 : 0, target: 1, label: 'coding quest' };
    case 'study-first':
      return { current: hasCompletedCategory(state.completedCategories, 'study') ? 1 : 0, target: 1, label: 'study quest' };
    case 'writing-first':
      return { current: hasCompletedCategory(state.completedCategories, 'writing') ? 1 : 0, target: 1, label: 'writing quest' };
    case 'communication-first':
      return {
        current:
          hasCompletedCategory(state.completedCategories, 'communication') ||
          hasCompletedCategory(state.completedCategories, 'social') ||
          hasCompletedCategory(state.completedCategories, 'confidence')
            ? 1
            : 0,
        target: 1,
        label: 'communication quest',
      };
    case 'haircare-first':
      return {
        current: hasCompletedCategory(state.completedCategories, 'haircare') ? 1 : 0,
        target: 1,
        label: 'hair care quest',
      };
    case 'level-5':
      return { current: Math.min(state.level, 5), target: 5, label: 'level' };
    case 'level-10':
      return { current: Math.min(state.level, 10), target: 10, label: 'level' };
    case 'level-25':
      return { current: Math.min(state.level, 25), target: 25, label: 'level' };
    case 'level-50':
      return { current: Math.min(state.level, 50), target: 50, label: 'level' };
    case 'iron-discipline':
      return { current: Math.min(state.noFapCurrentStreak, 30), target: 30, label: 'NoFap days' };
    case 'discipline-90':
      return { current: Math.min(state.noFapCurrentStreak, 90), target: 90, label: 'NoFap days' };
    case 'kegel-master':
      return { current: Math.min(state.pelvicFloorWeeklyDays, 5), target: 5, label: 'weekly pelvic floor days' };
    case 'healthy-lifestyle':
      return { current: Math.min(state.lifestyleCompletionCount, 50), target: 50, label: 'lifestyle completions' };
    case 'morning-routine':
      return { current: Math.min(state.lifestyleCompletionCount, 20), target: 20, label: 'healthy routine completions' };
    case 'sleep-champion':
      return { current: Math.min(state.sleepHighQualityDays, 7), target: 7, label: 'good sleep days' };
    case 'hydration-hero':
      return { current: Math.min(state.hydrationGoalDays, 7), target: 7, label: 'hydration goal days' };
    default:
      return { current: 0, target: 1, label: 'progress' };
  }
}

function isUnlocked(template: AchievementTemplate, state: AchievementProgressState): boolean {
  switch (template.id) {
    case 'first-quest':
      return state.totalQuestsCompleted >= 1;
    case 'streak-7':
      return state.currentStreak >= 7;
    case 'streak-30':
      return state.currentStreak >= 30;
    case 'quests-100':
      return state.totalQuestsCompleted >= 100;
    case 'xp-500':
      return state.totalXP >= 500;
    case 'xp-1000':
      return state.totalXP >= 1000;
    case 'fitness-first':
      return hasCompletedCategory(state.completedCategories, 'fitness');
    case 'coding-first':
      return hasCompletedCategory(state.completedCategories, 'coding');
    case 'study-first':
      return hasCompletedCategory(state.completedCategories, 'study');
    case 'writing-first':
      return hasCompletedCategory(state.completedCategories, 'writing');
    case 'communication-first':
      return (
        hasCompletedCategory(state.completedCategories, 'communication') ||
        hasCompletedCategory(state.completedCategories, 'social') ||
        hasCompletedCategory(state.completedCategories, 'confidence')
      );
    case 'haircare-first':
      return state.haircareEnabled && hasCompletedCategory(state.completedCategories, 'haircare');
    case 'level-5':
      return state.level >= 5;
    case 'level-10':
      return state.level >= 10;
    case 'level-25':
      return state.level >= 25;
    case 'level-50':
      return state.level >= 50;
    case 'iron-discipline':
      return state.noFapCurrentStreak >= 30;
    case 'discipline-90':
      return state.noFapCurrentStreak >= 90;
    case 'kegel-master':
      return state.pelvicFloorWeeklyDays >= 5;
    case 'healthy-lifestyle':
      return state.lifestyleCompletionCount >= 50;
    case 'morning-routine':
      return state.lifestyleCompletionCount >= 20;
    case 'sleep-champion':
      return state.sleepHighQualityDays >= 7;
    case 'hydration-hero':
      return state.hydrationGoalDays >= 7;
    default:
      return false;
  }
}

export function buildAchievementState(
  progress: PlayerProgress,
  completionLog: QuestCompletionLogEntry[],
  haircareEnabled: boolean,
  mensHealthState: MensHealthState | null = null,
  mensHealthMetrics?: {
    pelvicFloorWeeklyDays: number;
    lifestyleCompletionCount: number;
    sleepHighQualityDays: number;
    hydrationGoalDays: number;
  }
): AchievementProgressState {
  const completedCategories = [...new Set(completionLog.map((entry) => entry.category))];

  return {
    totalQuestsCompleted: completionLog.length,
    totalXP: progress.totalXP,
    currentStreak: progress.streak,
    longestStreak: progress.longestStreak,
    level: progress.level,
    completedCategories,
    haircareEnabled,
    noFapCurrentStreak: mensHealthState?.currentNoFapStreak ?? 0,
    noFapLongestStreak: mensHealthState?.longestNoFapStreak ?? 0,
    pelvicFloorWeeklyDays: mensHealthMetrics?.pelvicFloorWeeklyDays ?? 0,
    lifestyleCompletionCount: mensHealthMetrics?.lifestyleCompletionCount ?? 0,
    sleepHighQualityDays: mensHealthMetrics?.sleepHighQualityDays ?? 0,
    hydrationGoalDays: mensHealthMetrics?.hydrationGoalDays ?? 0,
  };
}

export function applyStatBonus(
  stats: Record<StatKey, number>,
  bonus: Partial<Record<StatKey, number>>
): Record<StatKey, number> {
  const next = { ...stats };
  for (const [key, value] of Object.entries(bonus) as [StatKey, number][]) {
    next[key] += value;
  }
  return next;
}

export function checkForUnlockedAchievements(
  state: AchievementProgressState,
  unlocked: AchievementUnlock[],
  unlockedAt: string
): AchievementUnlockResult[] {
  const unlockedIds = new Set(unlocked.map((entry) => entry.id));

  return achievementCatalog
    .filter((achievement) => !unlockedIds.has(achievement.id) && isUnlocked(achievement, state))
    .map((achievement) => ({
      achievement,
      unlockedAt,
    }));
}

export function buildAchievementCards(
  state: AchievementProgressState,
  unlocked: AchievementUnlock[]
): AchievementCardView[] {
  const unlockedMap = new Map(unlocked.map((entry) => [entry.id, entry.unlockedAt]));

  return achievementCatalog.map((achievement) => ({
    ...achievement,
    unlocked: unlockedMap.has(achievement.id),
    unlockedAt: unlockedMap.get(achievement.id) ?? null,
    progress: buildProgress(achievement, state),
  }));
}

export function getRecentUnlockedAchievements(unlocked: AchievementUnlock[], limit: number): AchievementUnlock[] {
  return [...unlocked]
    .sort((first, second) => second.unlockedAt.localeCompare(first.unlockedAt))
    .slice(0, limit);
}
