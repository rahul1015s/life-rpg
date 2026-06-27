import type { LevelUpSummary, PlayerProgress, RankName, StatKey } from './types';

const statKeys: StatKey[] = [
  'strength',
  'stamina',
  'focus',
  'discipline',
  'charisma',
  'confidence',
  'creativity',
  'appearance',
  'communication',
  'style',
];

export function createInitialProgress(): PlayerProgress {
  return {
    level: 1,
    xp: 0,
    totalXP: 0,
    stats: statKeys.reduce<Record<StatKey, number>>((accumulator, key) => {
      accumulator[key] = 0;
      return accumulator;
    }, {} as Record<StatKey, number>),
    streak: 0,
    longestStreak: 0,
    lastCompletionDate: null,
  };
}

export function getNextLevelXP(level: number): number {
  return level * 100;
}

export function getRankForLevel(level: number): RankName {
  if (level <= 5) {
    return 'Beginner';
  }
  if (level <= 10) {
    return 'Trainee';
  }
  if (level <= 20) {
    return 'Hunter';
  }
  if (level <= 35) {
    return 'Elite';
  }
  if (level <= 50) {
    return 'Hero';
  }
  return 'King';
}

export function applyLevelProgression(progress: PlayerProgress): {
  progress: PlayerProgress;
  levelUp: LevelUpSummary | null;
} {
  const previousLevel = progress.level;
  const previousRank = getRankForLevel(progress.level);
  let nextProgress = { ...progress };
  let didLevelUp = false;

  while (nextProgress.xp >= getNextLevelXP(nextProgress.level)) {
    didLevelUp = true;
    nextProgress = {
      ...nextProgress,
      xp: nextProgress.xp - getNextLevelXP(nextProgress.level),
      level: nextProgress.level + 1,
    };
  }

  if (!didLevelUp) {
    return { progress: nextProgress, levelUp: null };
  }

  const currentRank = getRankForLevel(nextProgress.level);

  return {
    progress: nextProgress,
    levelUp: {
      didLevelUp: true,
      previousLevel,
      newLevel: nextProgress.level,
      previousRank,
      currentRank,
      rankChanged: previousRank !== currentRank,
      statGains: {},
    },
  };
}
