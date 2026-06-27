import {
  getLocalDateString,
  parseLocalDate,
  shiftDate,
  sortHairLogDescending,
} from './haircareEngine';
import type {
  ActivityGridCell,
  DailyHistoryGroup,
  HairLogEntry,
  HistoryEntry,
  MonthlySummary,
  PlayerProgress,
  QuestCompletionLogEntry,
  StatKey,
  XPTrackingSummary,
} from './types';

const monthFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'long',
  year: 'numeric',
});

function createMonthPrefix(date: string): string {
  return date.slice(0, 7);
}

function createMonthLabel(date: string): string {
  return monthFormatter.format(parseLocalDate(date));
}

function sumXPByDate(history: HistoryEntry[]): Record<string, number> {
  return history.reduce<Record<string, number>>((accumulator, entry) => {
    accumulator[entry.date] = entry.xpEarned;
    return accumulator;
  }, {});
}

function sumQuestsByDate(history: HistoryEntry[]): Record<string, number> {
  return history.reduce<Record<string, number>>((accumulator, entry) => {
    accumulator[entry.date] = entry.questsCompleted;
    return accumulator;
  }, {});
}

export function buildDailyHistoryGroups(
  history: HistoryEntry[],
  completionLog: QuestCompletionLogEntry[]
): DailyHistoryGroup[] {
  const xpByDate = sumXPByDate(history);
  const questsByDate = sumQuestsByDate(history);
  const grouped = new Map<string, QuestCompletionLogEntry[]>();

  for (const entry of completionLog) {
    const current = grouped.get(entry.date) ?? [];
    current.push(entry);
    grouped.set(entry.date, current);
  }

  const allDates = [...new Set([...history.map((entry) => entry.date), ...completionLog.map((entry) => entry.date)])];

  return allDates
    .map((date) => {
      const quests = (grouped.get(date) ?? []).sort((first, second) =>
        first.completedAt.localeCompare(second.completedAt)
      );
      const statTotals = quests.reduce<Partial<Record<StatKey, number>>>((accumulator, quest) => {
        for (const [key, value] of Object.entries(quest.statEffects) as [StatKey, number][]) {
          accumulator[key] = (accumulator[key] ?? 0) + value;
        }
        return accumulator;
      }, {});

      return {
        date,
        totalXP: xpByDate[date] ?? quests.reduce((total, quest) => total + quest.xp, 0),
        questsCompleted: questsByDate[date] ?? quests.length,
        quests,
        statTotals,
        isLegacySummary: quests.length === 0 && Boolean(xpByDate[date] ?? questsByDate[date]),
      };
    })
    .sort((first, second) => second.date.localeCompare(first.date));
}

export function buildMonthlySummary(
  history: HistoryEntry[],
  today: string = getLocalDateString()
): MonthlySummary {
  const monthPrefix = createMonthPrefix(today);
  const currentMonthEntries = history.filter((entry) => entry.date.startsWith(monthPrefix));
  const activeDays = currentMonthEntries.length;
  const elapsedDays = parseLocalDate(today).getDate();
  const xp = currentMonthEntries.reduce((total, entry) => total + entry.xpEarned, 0);
  const completedQuests = currentMonthEntries.reduce((total, entry) => total + entry.questsCompleted, 0);
  const bestDayEntry = currentMonthEntries.reduce<HistoryEntry | null>(
    (best, entry) => (!best || entry.xpEarned > best.xpEarned ? entry : best),
    null
  );

  return {
    monthLabel: createMonthLabel(today),
    xp,
    completedQuests,
    bestDay: bestDayEntry ? { date: bestDayEntry.date, xp: bestDayEntry.xpEarned } : null,
    activeDays,
    missedDays: Math.max(elapsedDays - activeDays, 0),
    averageXPPerActiveDay: activeDays > 0 ? Math.round(xp / activeDays) : 0,
  };
}

export function buildXPTrackingSummary(
  history: HistoryEntry[],
  progress: PlayerProgress,
  today: string = getLocalDateString()
): XPTrackingSummary {
  const monthPrefix = createMonthPrefix(today);
  const weekDates = new Set<string>();

  for (let offset = 0; offset < 7; offset += 1) {
    weekDates.add(shiftDate(today, -offset));
  }

  return {
    today: history.find((entry) => entry.date === today)?.xpEarned ?? 0,
    week: history
      .filter((entry) => weekDates.has(entry.date))
      .reduce((total, entry) => total + entry.xpEarned, 0),
    month: history
      .filter((entry) => entry.date.startsWith(monthPrefix))
      .reduce((total, entry) => total + entry.xpEarned, 0),
    allTime: progress.totalXP,
  };
}

export function buildRecentActivityGrid(
  history: HistoryEntry[],
  today: string = getLocalDateString(),
  days: number = 35
): ActivityGridCell[] {
  const byDate = new Map(history.map((entry) => [entry.date, entry]));
  const cells: ActivityGridCell[] = [];

  for (let offset = days - 1; offset >= 0; offset -= 1) {
    const date = shiftDate(today, -offset);
    const entry = byDate.get(date);
    const xp = entry?.xpEarned ?? 0;
    const questsCompleted = entry?.questsCompleted ?? 0;

    let intensity: ActivityGridCell['intensity'] = 'none';
    if (xp >= 60 || questsCompleted >= 5) {
      intensity = 'high';
    } else if (xp >= 35 || questsCompleted >= 3) {
      intensity = 'medium';
    } else if (xp > 0 || questsCompleted > 0) {
      intensity = 'low';
    }

    cells.push({
      date,
      xp,
      questsCompleted,
      intensity,
    });
  }

  return cells;
}

export function getActiveDaysThisMonth(
  history: HistoryEntry[],
  today: string = getLocalDateString()
): number {
  return history.filter((entry) => entry.date.startsWith(createMonthPrefix(today))).length;
}

export function getHairLogTimeline(entries: HairLogEntry[]): HairLogEntry[] {
  return sortHairLogDescending(entries);
}
