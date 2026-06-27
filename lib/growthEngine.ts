import { questCatalog } from '../constants/questCatalog';
import { getLocalDateString, parseLocalDate, shiftDate } from './haircareEngine';
import type {
  BalanceRadarPoint,
  CategoryInsight,
  DailyCheckIn,
  DopamineLog,
  FocusSession,
  HabitCalendarCell,
  HistoryEntry,
  MilestoneVision,
  MensHealthLog,
  PlayerProgress,
  QuestCategory,
  QuestCompletionLogEntry,
  RecoveryQuestSuggestion,
  RelapseReflection,
  ReflectionJournalEntry,
  SleepRecoveryEntry,
  SmartQuestSuggestion,
  StatKey,
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
      description: 'Do one easy physical quest, one focus quest, and one cleanup habit to restart momentum.',
      category: 'health',
      reason: `${missedDates.length} recent low-output day${missedDates.length > 1 ? 's' : ''} triggered a soft recovery plan.`,
      recommendedXP: 30,
    },
    {
      id: 'recovery-review',
      title: 'Review the Missed Pattern',
      description: 'Write what caused the slip and choose one smaller action for tomorrow.',
      category: 'career',
      reason: 'Reflection lowers the chance of repeating the same pattern.',
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

export function buildCheckInTrend(checkIns: DailyCheckIn[]): { averageMood: number; averageFocus: number; averageEnergy: number } {
  if (checkIns.length === 0) {
    return { averageMood: 0, averageFocus: 0, averageEnergy: 0 };
  }
  const total = checkIns.reduce(
    (acc, entry) => {
      acc.mood += entry.mood;
      acc.focus += entry.focus;
      acc.energy += entry.energy;
      return acc;
    },
    { mood: 0, focus: 0, energy: 0 }
  );
  return {
    averageMood: Math.round((total.mood / checkIns.length) * 10) / 10,
    averageFocus: Math.round((total.focus / checkIns.length) * 10) / 10,
    averageEnergy: Math.round((total.energy / checkIns.length) * 10) / 10,
  };
}

export function summarizeFocusSessions(focusSessions: FocusSession[]): { totalMinutes: number; completedSessions: number } {
  return focusSessions.reduce(
    (acc, session) => {
      acc.totalMinutes += session.completedMinutes;
      if (session.completed) {
        acc.completedSessions += 1;
      }
      return acc;
    },
    { totalMinutes: 0, completedSessions: 0 }
  );
}

export function getActiveMilestones(milestones: MilestoneVision[]): MilestoneVision[] {
  return milestones
    .filter((milestone) => milestone.status === 'active')
    .sort((first, second) => first.targetDate.localeCompare(second.targetDate));
}

export function getRecentJournalStreak(entries: ReflectionJournalEntry[]): number {
  if (entries.length === 0) {
    return 0;
  }

  const dates = new Set(entries.map((entry) => entry.date));
  let streak = 0;
  let cursor = getLocalDateString();
  while (dates.has(cursor)) {
    streak += 1;
    cursor = shiftDate(cursor, -1);
  }
  return streak;
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

export function buildRelapseInsights(
  mensHealthLogs: MensHealthLog[],
  dopamineLogs: DopamineLog[],
  reflections: RelapseReflection[]
): {
  relapseDays: number;
  topTrigger: string;
  highestRiskTime: string;
  recentRiskPattern: string;
} {
  const relapseLogs = mensHealthLogs.filter((log) => log.noFapStatus === 'relapse' || log.noPornStatus === 'relapse');
  const triggerCounts = new Map<string, number>();
  const timeCounts = new Map<string, number>();

  for (const reflection of reflections) {
    if (reflection.trigger.trim()) {
      triggerCounts.set(reflection.trigger, (triggerCounts.get(reflection.trigger) ?? 0) + 1);
    }
    timeCounts.set(reflection.timeOfDay, (timeCounts.get(reflection.timeOfDay) ?? 0) + 1);
  }

  const topTrigger = [...triggerCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'No trigger logged yet';
  const highestRiskTime = [...timeCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'Not enough data';
  const riskyDopamineDays = dopamineLogs.filter((log) => log.urgeLevel >= 7 || log.pornUsed).length;

  return {
    relapseDays: relapseLogs.length,
    topTrigger,
    highestRiskTime,
    recentRiskPattern:
      riskyDopamineDays >= 3
        ? 'High-urge or overstimulated days are stacking up. Use earlier cutoffs and faster recovery actions.'
        : 'Risk looks manageable. Keep logging triggers before urges become automatic.',
  };
}
