import { mensHealthLifestyleQuests } from '../constants/mensHealth';
import type {
  LifestyleQuestTemplate,
  MensHealthLog,
  MensHealthState,
  MensHealthSummary,
} from './types';

function pad(value: number): string {
  return value.toString().padStart(2, '0');
}

export function formatLocalDate(date: Date = new Date()): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function parseLocalDate(dateString: string): Date {
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(year, month - 1, day);
}

export function shiftLocalDate(dateString: string, days: number): string {
  const date = parseLocalDate(dateString);
  date.setDate(date.getDate() + days);
  return formatLocalDate(date);
}

export function createInitialMensHealthState(): MensHealthState {
  return {
    challengeStartedAt: null,
    currentNoFapStreak: 0,
    longestNoFapStreak: 0,
    totalSuccessfulDays: 0,
    pelvicFloorCurrentStreak: 0,
    pelvicFloorLongestStreak: 0,
    lastNoFapCheckDate: null,
    lastPelvicFloorDate: null,
  };
}

export function getTodayMensHealthLog(logs: MensHealthLog[], today: string = formatLocalDate()): MensHealthLog {
  return (
    logs.find((entry) => entry.date === today) ?? {
      date: today,
      noFapStatus: 'none',
      noFapNote: null,
      sleepQuality: null,
      waterLiters: null,
      exerciseDone: false,
      weightKg: null,
      mood: null,
      energy: null,
      pelvicFloor: { slow: 0, fast: 0, hold: 0 },
      lifestyleTasksCompleted: [],
    }
  );
}

export function upsertMensHealthLog(logs: MensHealthLog[], entry: MensHealthLog): MensHealthLog[] {
  return [...logs.filter((item) => item.date !== entry.date), entry].sort((a, b) => b.date.localeCompare(a.date));
}

export function getLifestyleQuestsForToday(today: string = formatLocalDate()): LifestyleQuestTemplate[] {
  const offset = parseLocalDate(today).getDate() % mensHealthLifestyleQuests.length;
  const doubled = [...mensHealthLifestyleQuests, ...mensHealthLifestyleQuests];
  return doubled.slice(offset, offset + 5);
}

export function getWeeklyPelvicFloorDays(logs: MensHealthLog[], today: string = formatLocalDate()): number {
  const dates = new Set(Array.from({ length: 7 }, (_, index) => shiftLocalDate(today, -index)));
  return logs.filter((log) => {
    const totalSets = log.pelvicFloor.slow + log.pelvicFloor.fast + log.pelvicFloor.hold;
    return dates.has(log.date) && totalSets > 0;
  }).length;
}

export function buildMensHealthSummary(logs: MensHealthLog[], today: string = formatLocalDate()): MensHealthSummary {
  const weekDates = new Set(Array.from({ length: 7 }, (_, index) => shiftLocalDate(today, -index)));
  const monthPrefix = today.slice(0, 7);
  const relevantWeekLogs = logs.filter((log) => weekDates.has(log.date));
  const relevantMonthLogs = logs.filter((log) => log.date.startsWith(monthPrefix));
  const daily = getTodayMensHealthLog(logs, today);
  const dailyChecks = [
    daily.sleepQuality !== null,
    daily.waterLiters !== null,
    daily.exerciseDone,
    daily.mood !== null,
    daily.energy !== null,
  ];
  const weekChecks = relevantWeekLogs.flatMap((log) => [
    log.sleepQuality !== null,
    log.waterLiters !== null,
    log.exerciseDone,
    log.noFapStatus !== 'none',
  ]);
  const monthChecks = relevantMonthLogs.flatMap((log) => [
    log.sleepQuality !== null,
    log.waterLiters !== null,
    log.exerciseDone,
    log.noFapStatus !== 'none',
  ]);

  return {
    dailyCompletionRate: Math.round((dailyChecks.filter(Boolean).length / dailyChecks.length) * 100),
    weeklyConsistency: weekChecks.length > 0 ? Math.round((weekChecks.filter(Boolean).length / weekChecks.length) * 100) : 0,
    monthlyConsistency:
      monthChecks.length > 0 ? Math.round((monthChecks.filter(Boolean).length / monthChecks.length) * 100) : 0,
    weeklyPelvicFloorDays: getWeeklyPelvicFloorDays(logs, today),
    monthlyLifestyleCompletions: relevantMonthLogs.reduce(
      (total, log) => total + log.lifestyleTasksCompleted.length,
      0
    ),
  };
}

export function getSleepHighQualityDays(logs: MensHealthLog[]): number {
  return logs.filter((log) => (log.sleepQuality ?? 0) >= 4).length;
}

export function getHydrationGoalDays(logs: MensHealthLog[]): number {
  return logs.filter((log) => (log.waterLiters ?? 0) >= 3).length;
}
