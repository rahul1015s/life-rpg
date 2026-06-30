import type { ProfileGender } from '../types';

export function toIsoDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function parseIsoDateString(value: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return null;
  }

  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(year, month - 1, day);

  if (
    Number.isNaN(date.getTime()) ||
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }

  return date;
}

export function getAgeFromDob(dob: string): number {
  const parsedDob = parseIsoDateString(dob);
  if (!parsedDob) {
    return 0;
  }

  const today = new Date();
  let age = today.getFullYear() - parsedDob.getFullYear();
  const monthDelta = today.getMonth() - parsedDob.getMonth();
  const birthdayPassed =
    monthDelta > 0 || (monthDelta === 0 && today.getDate() >= parsedDob.getDate());

  if (!birthdayPassed) {
    age -= 1;
  }

  return Math.max(0, age);
}

export function hasAdultContentAccess(dob?: string | null): boolean {
  if (!dob) {
    return true;
  }

  return getAgeFromDob(dob) >= 18;
}

export function isAdultContent(dob?: string | null): boolean {
  return hasAdultContentAccess(dob);
}

export function normalizeProfileGender(gender?: string | null): ProfileGender {
  return gender === 'female' ? 'female' : 'male';
}

export function getDisciplineCopy(gender?: string | null) {
  const normalizedGender = normalizeProfileGender(gender);

  if (normalizedGender === 'female') {
    return {
      kicker: 'DISCIPLINE / NO PORN',
      title: 'Streak tracker and recovery awareness',
      streakSummaryPrefix: 'Discipline streak',
      primaryHabitLabel: 'Discipline',
      primaryHabitActionLabel: 'DISCIPLINE',
      currentPrimaryLabel: 'CURRENT DISCIPLINE',
      bestPrimaryLabel: 'BEST DISCIPLINE',
      trackerShortcutTitle: 'Discipline / No Porn Tracker',
      trackerShortcutDescription: 'Track clean days, relapses, streaks, and calendar patterns.',
      notePlaceholder: 'Discipline note',
      alreadyLoggedMessage: 'Today is already marked clean in your discipline tracker.',
      savedMessage: 'Today’s discipline and no-porn status has been saved.',
      completeMessage: 'Today has been marked clean for discipline and no porn.',
      updateErrorMessage: 'Unable to update the discipline tracker.',
      reminderMessage: 'Lock in your discipline status and finish one easy quest before the day ends.',
    };
  }

  return {
    kicker: 'NO FAP / NO PORN',
    title: 'Streak tracker and recovery awareness',
    streakSummaryPrefix: 'No-fap streak',
    primaryHabitLabel: 'No Fap',
    primaryHabitActionLabel: 'NOFAP',
    currentPrimaryLabel: 'CURRENT NO FAP',
    bestPrimaryLabel: 'BEST NO FAP',
    trackerShortcutTitle: 'No Fap / No Porn Tracker',
    trackerShortcutDescription: 'Track clean days, relapses, streaks, and calendar patterns.',
    notePlaceholder: 'No-fap note',
    alreadyLoggedMessage: 'Today is already marked clean in your NoFap tracker.',
    savedMessage: 'Today’s no-fap and no-porn status has been saved.',
    completeMessage: 'Today has been marked clean for NoFap and NoPorn.',
    updateErrorMessage: 'Unable to update the NoFap tracker.',
    reminderMessage: 'Lock in your NoFap status and finish one easy quest before the day ends.',
  };
}

export function getDobLimits(): { minimumDate: Date; maximumDate: Date } {
  const today = new Date();
  const maximumDate = new Date(today.getFullYear() - 13, today.getMonth(), today.getDate());
  const minimumDate = new Date(today.getFullYear() - 100, today.getMonth(), today.getDate());

  return { minimumDate, maximumDate };
}
