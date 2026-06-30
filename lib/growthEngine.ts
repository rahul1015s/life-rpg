import { questCatalog } from '../constants/questCatalog';
import { getLocalDateString, parseLocalDate, shiftDate } from './haircareEngine';
import { getDisciplineCopy } from './utils/profile';
import type {
  BalanceRadarPoint,
  CategoryInsight,
  DopamineLog,
  HabitCalendarCell,
  HistoryEntry,
  MilestoneVision,
  PlayerProgress,
  QuestCategory,
  QuestCompletionLogEntry,
  RecoveryQuestSuggestion,
  SleepRecoveryEntry,
  SmartQuestSuggestion,
  StatKey,
  ProfileGender,
  WeeklyReview,
  WorkoutEntry,
} from './types';

const statCategoryMap: Record<StatKey, QuestCategory[]> = {
  strength: ['fitness', 'health'],
  stamina: ['fitness', 'health', 'haircare'],
  focus: ['study', 'coding', 'writing'],
  discipline: ['study', 'career', 'health'],
  charisma: ['social', 'communication', 'confidence'],
  confidence: ['confidence', 'social', 'appearance'],
  creativity: ['writing', 'coding'],
  appearance: ['appearance', 'style', 'hygiene'],
  communication: ['communication', 'social', 'confidence'],
  style: ['style', 'appearance'],
};

function startOfWeek(dateString: string): string {
  const date = parseLocalDate(dateString);
  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  date.setDate(date.getDate() + diff);
  return getLocalDateString(date);
}

export function buildWeeklyReviewDraft(
  history: HistoryEntry[],
  completionLog: QuestCompletionLogEntry[],
  today: string = getLocalDateString()
): WeeklyReview {
  const weekStartDate = startOfWeek(today);
  const weekDates = new Set<string>();
  for (let index = 0; index < 7; index += 1) {
    weekDates.add(shiftDate(weekStartDate, index));
  }

  const weekHistory = history.filter((entry) => weekDates.has(entry.date));
  const weekCompletions = completionLog.filter((entry) => weekDates.has(entry.date));
  const xp = weekHistory.reduce((sum, entry) => sum + entry.xpEarned, 0);
  const completed = weekCompletions.length;
  const categories = [...new Set(weekCompletions.map((entry) => entry.category))];
  const missedDays = 7 - weekHistory.length;

  return {
    weekStartDate,
    wins: `Completed ${completed} quests and earned ${xp} XP${categories.length ? ` across ${categories.length} categories` : ''}.`,
    misses: missedDays > 0 ? `${missedDays} days were underused or missed.` : 'No full missed days this week.',
    lessonsLearned: categories.length > 0 ? `Strongest momentum came from ${categories.slice(0, 3).join(', ')}.` : 'You need one stable anchor habit to build momentum.',
    nextWeekFocus: categories.includes('coding') || categories.includes('study') ? 'Protect deep work blocks early in the day.' : 'Start with one easy win each morning to keep consistency alive.',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export function buildHabitCalendar(
  history: HistoryEntry[],
  month: Date = new Date()
): HabitCalendarCell[] {
  const year = month.getFullYear();
  const monthIndex = month.getMonth();
  const lastDay = new Date(year, monthIndex + 1, 0).getDate();
  const byDate = new Map(history.map((entry) => [entry.date, entry]));
  const cells: HabitCalendarCell[] = [];

  for (let day = 1; day <= lastDay; day += 1) {
    const date = getLocalDateString(new Date(year, monthIndex, day));
    const entry = byDate.get(date);
    const xp = entry?.xpEarned ?? 0;
    const questsCompleted = entry?.questsCompleted ?? 0;
    cells.push({
      date,
      completed: questsCompleted > 0,
      intensity: xp >= 40 || questsCompleted >= 4 ? 'strong' : questsCompleted > 0 ? 'light' : 'none',
      questsCompleted,
      xp,
    });
  }

  return cells;
}

export function buildCategoryInsights(completionLog: QuestCompletionLogEntry[]): CategoryInsight[] {
  const groups: Array<{ label: string; categories: QuestCategory[] }> = [
    { label: 'Body', categories: ['fitness', 'health', 'hygiene', 'appearance', 'haircare', 'style'] },
    { label: 'Study', categories: ['study', 'coding', 'writing', 'career'] },
    { label: 'Confidence', categories: ['confidence', 'appearance', 'style'] },
    { label: 'Social', categories: ['social', 'communication', 'confidence'] },
  ];

  return groups.map((group) => {
    const matches = completionLog.filter((entry) => group.categories.includes(entry.category));
    const completed = matches.length;
    const xp = matches.reduce((sum, entry) => sum + entry.xp, 0);
    const trend: CategoryInsight['trend'] = xp >= 180 ? 'high' : xp >= 80 ? 'medium' : 'low';
    return { label: group.label, completed, xp, trend };
  });
}

export function buildLifeBalanceRadar(progress: PlayerProgress): BalanceRadarPoint[] {
  const body = Math.round((progress.stats.strength + progress.stats.stamina + progress.stats.appearance + progress.stats.style) / 4);
  const mind = Math.round((progress.stats.focus + progress.stats.creativity + progress.stats.discipline) / 3);
  const social = Math.round((progress.stats.charisma + progress.stats.communication + progress.stats.confidence) / 3);
  const selfRespect = Math.round((progress.stats.discipline + progress.stats.confidence + progress.stats.appearance) / 3);

  return [
    { label: 'Body', value: body },
    { label: 'Mind', value: mind },
    { label: 'Social', value: social },
    { label: 'Self', value: selfRespect },
  ];
}

export function buildRecoverySuggestions(
  history: HistoryEntry[],
  today: string = getLocalDateString()
): RecoveryQuestSuggestion[] {
  const byDate = new Map(history.map((entry) => [entry.date, entry]));
  const missedDates: string[] = [];
  for (let offset = 1; offset <= 7; offset += 1) {
    const date = shiftDate(today, -offset);
    const entry = byDate.get(date);
    if (!entry || entry.questsCompleted === 0) {
      missedDates.push(date);
    }
  }

  if (missedDates.length === 0) {
    return [];
  }

  return [
    {
      id: 'recovery-reset',
      title: 'Recovery Reset Day',
      description: 'Do one easy physical quest, one progress quest, and one cleanup habit to restart momentum.',
      category: 'health',
      reason: `${missedDates.length} recent low-output day${missedDates.length > 1 ? 's' : ''} triggered a soft recovery plan.`,
      recommendedXP: 30,
    },
    {
      id: 'recovery-review',
      title: 'Review the Missed Pattern',
      description: 'Write what caused the slip and choose one smaller action for tomorrow.',
      category: 'career',
      reason: 'A quick review lowers the chance of repeating the same pattern.',
      recommendedXP: 20,
    },
  ];
}

export function buildSmartQuestSuggestions(
  progress: PlayerProgress,
  completionLog: QuestCompletionLogEntry[]
): SmartQuestSuggestion[] {
  const weakestStats = Object.entries(progress.stats)
    .sort((first, second) => first[1] - second[1])
    .slice(0, 3) as [StatKey, number][];
  const recentCategories = new Set(completionLog.slice(0, 20).map((entry) => entry.category));
  const suggestions: SmartQuestSuggestion[] = [];
  const usedIds = new Set<string>();

  for (const [stat] of weakestStats) {
    const candidateCategories = statCategoryMap[stat];
    const quest = questCatalog.find(
      (item) => !usedIds.has(item.id) && candidateCategories.includes(item.category) && !recentCategories.has(item.category)
    ) ?? questCatalog.find((item) => !usedIds.has(item.id) && candidateCategories.includes(item.category));

    if (quest) {
      usedIds.add(quest.id);
      suggestions.push({
        questId: quest.id,
        title: quest.title,
        category: quest.category,
        reason: `${stat.toUpperCase()} is one of your weakest growth stats right now.`,
        recommendedTime: quest.recommendedTime,
        xp: quest.baseXP,
      });
    }
  }

  return suggestions;
}

export function getActiveMilestones(milestones: MilestoneVision[]): MilestoneVision[] {
  return milestones
    .filter((milestone) => milestone.status === 'active')
    .sort((first, second) => first.targetDate.localeCompare(second.targetDate));
}

export function summarizeSleepRecovery(entries: SleepRecoveryEntry[]): {
  averageHours: number;
  averageQuality: number;
  lateCaffeineDays: number;
  sleepDebtHours: number;
} {
  if (entries.length === 0) {
    return { averageHours: 0, averageQuality: 0, lateCaffeineDays: 0, sleepDebtHours: 0 };
  }

  const totals = entries.reduce(
    (acc, entry) => {
      acc.hours += entry.hoursSlept;
      acc.quality += entry.sleepQuality;
      acc.lateCaffeineDays += entry.lateCaffeine ? 1 : 0;
      acc.sleepDebtHours += Math.max(0, 8 - entry.hoursSlept);
      return acc;
    },
    { hours: 0, quality: 0, lateCaffeineDays: 0, sleepDebtHours: 0 }
  );

  return {
    averageHours: Math.round((totals.hours / entries.length) * 10) / 10,
    averageQuality: Math.round((totals.quality / entries.length) * 10) / 10,
    lateCaffeineDays: totals.lateCaffeineDays,
    sleepDebtHours: Math.round(totals.sleepDebtHours * 10) / 10,
  };
}

export function summarizeDopamineControl(logs: DopamineLog[]): {
  averageUrge: number;
  highRiskDays: number;
  cleanDays: number;
  averageScreenMinutes: number;
} {
  if (logs.length === 0) {
    return { averageUrge: 0, highRiskDays: 0, cleanDays: 0, averageScreenMinutes: 0 };
  }

  const totals = logs.reduce(
    (acc, log) => {
      const screenMinutes = log.socialMediaMinutes + log.shortVideoMinutes + log.gamingMinutes;
      acc.urge += log.urgeLevel;
      acc.screen += screenMinutes;
      acc.highRiskDays += log.urgeLevel >= 7 || log.pornUsed || screenMinutes >= 180 ? 1 : 0;
      acc.cleanDays += !log.pornUsed && !log.junkFood && screenMinutes <= 120 ? 1 : 0;
      return acc;
    },
    { urge: 0, screen: 0, highRiskDays: 0, cleanDays: 0 }
  );

  return {
    averageUrge: Math.round((totals.urge / logs.length) * 10) / 10,
    highRiskDays: totals.highRiskDays,
    cleanDays: totals.cleanDays,
    averageScreenMinutes: Math.round(totals.screen / logs.length),
  };
}

export function summarizeWorkoutProgress(entries: WorkoutEntry[]): {
  totalSessions: number;
  totalMinutes: number;
  strengthSessions: number;
  bestWeightKg: number;
} {
  return entries.reduce(
    (acc, entry) => {
      acc.totalSessions += 1;
      acc.totalMinutes += entry.durationMinutes;
      acc.bestWeightKg = Math.max(acc.bestWeightKg, entry.weightKg);
      if (entry.workoutType === 'strength') {
        acc.strengthSessions += 1;
      }
      return acc;
    },
    { totalSessions: 0, totalMinutes: 0, strengthSessions: 0, bestWeightKg: 0 }
  );
}

export function buildQuestPunishmentPreview(
  pendingQuestCount: number,
  hasWorkoutLog: boolean,
  hasDisciplineLog: boolean,
  gender: ProfileGender = 'male'
): { title: string; consequence: string; atonement: string } | null {
  if (pendingQuestCount <= 0) {
    return null;
  }

  const consequence =
    pendingQuestCount >= 3
      ? 'You finish the day with a discipline debt. Tomorrow starts with a reduced comfort budget.'
      : 'A missed quest weakens momentum. Close the day with one recovery action instead of drifting.';
  const disciplineCopy = getDisciplineCopy(gender);
  const atonement = !hasDisciplineLog
    ? disciplineCopy.reminderMessage
    : !hasWorkoutLog
      ? 'Do a short walk, stretch, or mobility reset so the day still gets a physical win.'
      : 'Do a 10-minute walk, drink water, and clear one easy task first thing tomorrow.';

  return {
    title: pendingQuestCount >= 3 ? 'BOSS PENALTY WARNING' : 'DISCIPLINE TAX',
    consequence,
    atonement,
  };
}

export function buildBossBattles(currentStreak: number): Array<{
  id: string;
  label: string;
  target: number;
  progress: number;
  defeated: boolean;
  reward: string;
}> {
  return [
    { id: 'weekly-gate', label: 'Weekly Gatekeeper', target: 7, reward: 'Scroll badge + discipline surge' },
    { id: 'month-beast', label: '30-Day Shadow Beast', target: 30, reward: 'Boss defeated badge + cutscene moment' },
    { id: 'legend-warden', label: '90-Day Warden', target: 90, reward: 'Legend title + elite theme unlock' },
  ].map((battle) => ({
    ...battle,
    progress: Math.min(currentStreak, battle.target),
    defeated: currentStreak >= battle.target,
  }));
}

export function buildRewardInventory(totalXP: number, currentStreak: number): Array<{
  id: string;
  label: string;
  type: 'title' | 'theme';
  unlocked: boolean;
  requirement: string;
}> {
  return [
    {
      id: 'title-initiate',
      label: 'Title: Quest Initiate',
      type: 'title',
      unlocked: totalXP >= 250,
      requirement: '250 XP',
    },
    {
      id: 'theme-ember',
      label: 'Theme: Ember Discipline',
      type: 'theme',
      unlocked: totalXP >= 500,
      requirement: '500 XP',
    },
    {
      id: 'title-iron-will',
      label: 'Title: Iron Will',
      type: 'title',
      unlocked: totalXP >= 750 && currentStreak >= 14,
      requirement: '750 XP + 14-day streak',
    },
    {
      id: 'theme-warden',
      label: 'Theme: Warden Midnight',
      type: 'theme',
      unlocked: totalXP >= 1200 && currentStreak >= 30,
      requirement: '1200 XP + 30-day streak',
    },
  ];
}

export function buildAvatarEvolution(progress: PlayerProgress): {
  title: string;
  summary: string;
} {
  const dominantStat = Object.entries(progress.stats).sort((first, second) => second[1] - first[1])[0]?.[0] as
    | StatKey
    | undefined;

  if (dominantStat === 'discipline' || dominantStat === 'focus') {
    return {
      title: progress.level >= 10 ? 'TACTICIAN FORM' : 'DISCIPLINE ADEPT',
      summary: 'Your avatar is evolving around controlled habits, focus, and steady execution.',
    };
  }

  if (dominantStat === 'strength' || dominantStat === 'stamina') {
    return {
      title: progress.level >= 10 ? 'VANGUARD FORM' : 'IRON TRAINEE',
      summary: 'Your build is leaning into body stats and physical consistency.',
    };
  }

  return {
    title: progress.level >= 10 ? 'ASCENDANT FORM' : 'RISING HUNTER',
    summary: 'Balanced growth is shaping your character into a well-rounded build.',
  };
}
