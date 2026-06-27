import { applyStatBonus, buildAchievementState, checkForUnlockedAchievements } from './achievementEngine';
import { applyLevelProgression, getRankForLevel } from './levelSystem';
import type {
  AchievementUnlock,
  AchievementUnlockResult,
  HistoryEntry,
  LevelUpSummary,
  MensHealthLog,
  MensHealthState,
  PlayerProfile,
  PlayerProgress,
  QuestCompletionLogEntry,
  StatKey,
} from './types';
import { getHydrationGoalDays, getSleepHighQualityDays, getWeeklyPelvicFloorDays } from './mensHealthEngine';

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

function mergeAchievementUnlocks(
  existing: AchievementUnlock[],
  unlockedResults: AchievementUnlockResult[]
): AchievementUnlock[] {
  return [...existing, ...unlockedResults.map((item) => ({ id: item.achievement.id, unlockedAt: item.unlockedAt }))];
}

export function applyRewardPipeline(params: {
  progress: PlayerProgress;
  history: HistoryEntry[];
  date: string;
  baseXP: number;
  baseStats: Partial<Record<StatKey, number>>;
  achievements: AchievementUnlock[];
  profile: PlayerProfile;
  completionLog: QuestCompletionLogEntry[];
  mensHealthState: MensHealthState | null;
  mensHealthLogs: MensHealthLog[];
}): {
  progress: PlayerProgress;
  history: HistoryEntry[];
  achievements: AchievementUnlock[];
  unlockedAchievements: AchievementUnlockResult[];
  levelUp: LevelUpSummary | null;
} {
  let nextProgress = {
    ...params.progress,
    xp: params.progress.xp + params.baseXP,
    totalXP: params.progress.totalXP + params.baseXP,
    stats: applyStatBonus(params.progress.stats, params.baseStats),
  };
  let nextHistory = addBonusXPToHistory(params.history, params.date, params.baseXP);
  let nextAchievements = [...params.achievements];
  let rewardStatGains: Partial<Record<StatKey, number>> = { ...params.baseStats };
  const unlockedAchievementResults: AchievementUnlockResult[] = [];

  while (true) {
    const leveled = applyLevelProgression(nextProgress);
    nextProgress = leveled.progress;

    const achievementState = buildAchievementState(
      nextProgress,
      params.completionLog,
      params.profile.usesMinoxidil,
      params.mensHealthState,
      {
        pelvicFloorWeeklyDays: getWeeklyPelvicFloorDays(params.mensHealthLogs, params.date),
        lifestyleCompletionCount: params.mensHealthLogs.reduce(
          (total, log) => total + log.lifestyleTasksCompleted.length,
          0
        ),
        sleepHighQualityDays: getSleepHighQualityDays(params.mensHealthLogs),
        hydrationGoalDays: getHydrationGoalDays(params.mensHealthLogs),
      }
    );
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
    const rewardStats = newUnlocks.reduce<Partial<Record<StatKey, number>>>(
      (accumulator, item) => mergeStatTotals(accumulator, item.achievement.rewardStats),
      {}
    );

    rewardStatGains = mergeStatTotals(rewardStatGains, rewardStats);
    nextProgress = {
      ...nextProgress,
      xp: nextProgress.xp + rewardXP,
      totalXP: nextProgress.totalXP + rewardXP,
      stats: applyStatBonus(nextProgress.stats, rewardStats),
    };
    nextHistory = addBonusXPToHistory(nextHistory, params.date, rewardXP);
  }

  const finalLevelResult = applyLevelProgression(nextProgress);
  nextProgress = finalLevelResult.progress;
  const levelUp =
    nextProgress.level > params.progress.level
      ? {
          didLevelUp: true,
          previousLevel: params.progress.level,
          newLevel: nextProgress.level,
          previousRank: getRankForLevel(params.progress.level),
          currentRank: getRankForLevel(nextProgress.level),
          rankChanged: getRankForLevel(params.progress.level) !== getRankForLevel(nextProgress.level),
          statGains: rewardStatGains,
        }
      : null;

  return {
    progress: nextProgress,
    history: nextHistory,
    achievements: nextAchievements,
    unlockedAchievements: unlockedAchievementResults,
    levelUp,
  };
}
