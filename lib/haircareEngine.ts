import { Directory, File, Paths } from 'expo-file-system';

import type { HairCalendarDay, HairLogEntry } from './types';

function pad(value: number): string {
  return value.toString().padStart(2, '0');
}

export function getLocalDateString(date: Date = new Date()): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function parseLocalDate(dateString: string): Date {
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(year, month - 1, day);
}

export function shiftDate(dateString: string, days: number): string {
  const date = parseLocalDate(dateString);
  date.setDate(date.getDate() + days);
  return getLocalDateString(date);
}

export function sortHairLogDescending(entries: HairLogEntry[]): HairLogEntry[] {
  return [...entries].sort((first, second) => second.date.localeCompare(first.date));
}

export function upsertHairLogEntry(
  entries: HairLogEntry[],
  updatedEntry: HairLogEntry
): HairLogEntry[] {
  const nextEntries = entries.filter((entry) => entry.date !== updatedEntry.date);
  nextEntries.push(updatedEntry);
  return sortHairLogDescending(nextEntries);
}

export function getEntryForDate(entries: HairLogEntry[], date: string): HairLogEntry {
  return (
    entries.find((entry) => entry.date === date) ?? {
      date,
      appliedMorning: false,
      appliedNight: false,
      photoUri: null,
      note: null,
    }
  );
}

export function markDoseComplete(
  entries: HairLogEntry[],
  date: string,
  period: 'morning' | 'night'
): HairLogEntry[] {
  const current = getEntryForDate(entries, date);
  return upsertHairLogEntry(entries, {
    ...current,
    appliedMorning: period === 'morning' ? true : current.appliedMorning,
    appliedNight: period === 'night' ? true : current.appliedNight,
  });
}

export function getDaysSinceStart(startDate: string | null, today: string = getLocalDateString()): number {
  if (!startDate) {
    return 0;
  }

  const diffMs = parseLocalDate(today).getTime() - parseLocalDate(startDate).getTime();
  const diffDays = Math.floor(diffMs / 86_400_000);
  return diffDays >= 0 ? diffDays + 1 : 0;
}

export function getCurrentFullDoseStreak(
  entries: HairLogEntry[],
  today: string = getLocalDateString()
): number {
  let streak = 0;
  let cursor = today;

  while (true) {
    const entry = entries.find((item) => item.date === cursor);
    if (!entry || !entry.appliedMorning || !entry.appliedNight) {
      break;
    }
    streak += 1;
    cursor = shiftDate(cursor, -1);
  }

  return streak;
}

export function getThirtyDayGrid(
  entries: HairLogEntry[],
  today: string = getLocalDateString()
): HairCalendarDay[] {
  const days: HairCalendarDay[] = [];

  for (let offset = 29; offset >= 0; offset -= 1) {
    const date = shiftDate(today, -offset);
    const entry = entries.find((item) => item.date === date);
    let status: HairCalendarDay['status'] = 'none';

    if (entry?.appliedMorning && entry.appliedNight) {
      status = 'both';
    } else if (entry?.appliedMorning || entry?.appliedNight) {
      status = 'one';
    }

    days.push({ date, status });
  }

  return days;
}

export async function saveImageToLocalDirectory(
  sourceUri: string,
  directoryName: string,
  fileNamePrefix: string
): Promise<string> {
  const imageDirectory = new Directory(Paths.document, directoryName);
  if (!imageDirectory.exists) {
    imageDirectory.create({ idempotent: true, intermediates: true });
  }

  const extension = sourceUri.split('.').pop()?.split('?')[0] ?? 'jpg';
  const destination = new File(imageDirectory, `${fileNamePrefix}-${Date.now()}.${extension}`);
  const source = new File(sourceUri);
  await source.copy(destination, { overwrite: true });
  return destination.uri;
}

export async function saveHairPhotoToLocalDirectory(
  sourceUri: string,
  date: string
): Promise<string> {
  return saveImageToLocalDirectory(sourceUri, 'hairlog', date);
}
