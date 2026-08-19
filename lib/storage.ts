import AsyncStorage from '@react-native-async-storage/async-storage';

import type {
  AchievementUnlock,
  AppExportData,
  AppSettings,
  CustomQuest,
  DailyQuest,
  DopamineLog,
  HairLogEntry,
  HistoryEntry,
  MilestoneVision,
  MensHealthLog,
  MensHealthState,
  PersonalGoal,
  PlayerProfile,
  PlayerProgress,
  QuestCompletionLogEntry,
  QuestRotationEntry,
  SleepRecoveryEntry,
  WorkoutEntry,
  WeeklyReview,
} from './types';
import { normalizeCompletionLogEntry, normalizeDailyQuest } from './questUtils';
import { normalizeProfileGender } from './utils/profile';

export const storageKeys = {
  profile: 'lifeRPG:profile',
  progress: 'lifeRPG:progress',
  dailyQuests: 'lifeRPG:dailyQuests',
  history: 'lifeRPG:history',
  hairLog: 'lifeRPG:hairLog',
  completionLog: 'lifeRPG:completionLog',
  questRotation: 'lifeRPG:questRotation',
  achievements: 'lifeRPG:achievements',
  customQuests: 'lifeRPG:customQuests',
  goals: 'lifeRPG:goals',
  mensHealthState: 'lifeRPG:mensHealthState',
  mensHealthLogs: 'lifeRPG:mensHealthLogs',
  weeklyReviews: 'lifeRPG:weeklyReviews',
  milestones: 'lifeRPG:milestones',
  dopamineLogs: 'lifeRPG:dopamineLogs',
  sleepEntries: 'lifeRPG:sleepEntries',
  workoutEntries: 'lifeRPG:workoutEntries',
  settings: 'lifeRPG:settings',
  welcomeSeen: 'lifeRPG:welcomeSeen',
} as const;

const defaultSettings: AppSettings = {
  dobPromptDismissedAt: null,
  energyMode: 'standard',
  notifications: {
    dailyQuest: { enabled: false, hour: 20, minute: 0 },
    noFapCheckIn: { enabled: false, hour: 22, minute: 0 },
    focusWorkout: { enabled: false, hour: 18, minute: 30 },
  },
};

async function getItem<T>(key: string): Promise<T | null> {
  const rawValue = await AsyncStorage.getItem(key);

  if (rawValue === null) {
    return null;
  }

  return JSON.parse(rawValue) as T;
}

async function setItem<T>(key: string, value: T): Promise<void> {
  await AsyncStorage.setItem(key, JSON.stringify(value));
}

export async function getProfile(): Promise<PlayerProfile | null> {
  const profile = await getItem<
    Partial<PlayerProfile> & { dob?: string | null; mainGoal?: PlayerProfile['mainGoals'][number] }
  >(storageKeys.profile);
  if (!profile) {
    return null;
  }

  const normalizedMainGoals =
    Array.isArray(profile.mainGoals) && profile.mainGoals.length > 0
      ? profile.mainGoals
      : profile.mainGoal
        ? [profile.mainGoal]
        : ['all-rounder'];

  return {
    ...profile,
    gender: normalizeProfileGender(profile.gender),
    dob: profile.dob ?? '',
    mainGoals: normalizedMainGoals,
  } as PlayerProfile;
}

export async function setProfile(profile: PlayerProfile): Promise<void> {
  await setItem(storageKeys.profile, profile);
}

export async function getProgress(): Promise<PlayerProgress | null> {
  return getItem<PlayerProgress>(storageKeys.progress);
}

export async function setProgress(progress: PlayerProgress): Promise<void> {
  await setItem(storageKeys.progress, progress);
}

export async function getDailyQuests(): Promise<DailyQuest[]> {
  const quests = (await getItem<DailyQuest[]>(storageKeys.dailyQuests)) ?? [];
  return quests.map((quest) => normalizeDailyQuest(quest));
}

export async function setDailyQuests(quests: DailyQuest[]): Promise<void> {
  await setItem(storageKeys.dailyQuests, quests);
}

export async function getHistory(): Promise<HistoryEntry[]> {
  return (await getItem<HistoryEntry[]>(storageKeys.history)) ?? [];
}

export async function setHistory(history: HistoryEntry[]): Promise<void> {
  await setItem(storageKeys.history, history);
}

export async function getHairLog(): Promise<HairLogEntry[]> {
  return (await getItem<HairLogEntry[]>(storageKeys.hairLog)) ?? [];
}

export async function setHairLog(entries: HairLogEntry[]): Promise<void> {
  await setItem(storageKeys.hairLog, entries);
}

export async function getCompletionLog(): Promise<QuestCompletionLogEntry[]> {
  const entries = (await getItem<QuestCompletionLogEntry[]>(storageKeys.completionLog)) ?? [];
  return entries.map((entry) => normalizeCompletionLogEntry(entry));
}

export async function setCompletionLog(entries: QuestCompletionLogEntry[]): Promise<void> {
  await setItem(storageKeys.completionLog, entries);
}

export async function getQuestRotation(): Promise<QuestRotationEntry[]> {
  return (await getItem<QuestRotationEntry[]>(storageKeys.questRotation)) ?? [];
}

export async function setQuestRotation(entries: QuestRotationEntry[]): Promise<void> {
  await setItem(storageKeys.questRotation, entries);
}

export async function getAchievements(): Promise<AchievementUnlock[]> {
  return (await getItem<AchievementUnlock[]>(storageKeys.achievements)) ?? [];
}

export async function setAchievements(entries: AchievementUnlock[]): Promise<void> {
  await setItem(storageKeys.achievements, entries);
}

export async function getCustomQuests(): Promise<CustomQuest[]> {
  return (await getItem<CustomQuest[]>(storageKeys.customQuests)) ?? [];
}

export async function setCustomQuests(entries: CustomQuest[]): Promise<void> {
  await setItem(storageKeys.customQuests, entries);
}

export async function getGoals(): Promise<PersonalGoal[]> {
  return (await getItem<PersonalGoal[]>(storageKeys.goals)) ?? [];
}

export async function setGoals(entries: PersonalGoal[]): Promise<void> {
  await setItem(storageKeys.goals, entries);
}

export async function getMensHealthState(): Promise<MensHealthState | null> {
  return getItem<MensHealthState>(storageKeys.mensHealthState);
}

export async function setMensHealthState(state: MensHealthState): Promise<void> {
  await setItem(storageKeys.mensHealthState, state);
}

export async function getMensHealthLogs(): Promise<MensHealthLog[]> {
  return (await getItem<MensHealthLog[]>(storageKeys.mensHealthLogs)) ?? [];
}

export async function setMensHealthLogs(entries: MensHealthLog[]): Promise<void> {
  await setItem(storageKeys.mensHealthLogs, entries);
}

export async function getWeeklyReviews(): Promise<WeeklyReview[]> {
  return (await getItem<WeeklyReview[]>(storageKeys.weeklyReviews)) ?? [];
}

export async function setWeeklyReviews(entries: WeeklyReview[]): Promise<void> {
  await setItem(storageKeys.weeklyReviews, entries);
}

export async function getMilestones(): Promise<MilestoneVision[]> {
  return (await getItem<MilestoneVision[]>(storageKeys.milestones)) ?? [];
}

export async function setMilestones(entries: MilestoneVision[]): Promise<void> {
  await setItem(storageKeys.milestones, entries);
}

export async function getDopamineLogs(): Promise<DopamineLog[]> {
  return (await getItem<DopamineLog[]>(storageKeys.dopamineLogs)) ?? [];
}

export async function setDopamineLogs(entries: DopamineLog[]): Promise<void> {
  await setItem(storageKeys.dopamineLogs, entries);
}

export async function getSleepEntries(): Promise<SleepRecoveryEntry[]> {
  return (await getItem<SleepRecoveryEntry[]>(storageKeys.sleepEntries)) ?? [];
}

export async function setSleepEntries(entries: SleepRecoveryEntry[]): Promise<void> {
  await setItem(storageKeys.sleepEntries, entries);
}

export async function getWorkoutEntries(): Promise<WorkoutEntry[]> {
  const entries = (await getItem<(WorkoutEntry & { sessionTime?: WorkoutEntry['sessionTime'] })[]>(
    storageKeys.workoutEntries
  )) ?? [];

  return entries.map((entry) => ({
    ...entry,
    sessionTime: entry.sessionTime ?? 'both',
  }));
}

export async function setWorkoutEntries(entries: WorkoutEntry[]): Promise<void> {
  await setItem(storageKeys.workoutEntries, entries);
}

export async function getSettings(): Promise<AppSettings> {
  const stored = await getItem<Partial<AppSettings>>(storageKeys.settings);

  return {
    dobPromptDismissedAt: stored?.dobPromptDismissedAt ?? defaultSettings.dobPromptDismissedAt,
    energyMode: stored?.energyMode ?? defaultSettings.energyMode,
    notifications: {
      dailyQuest: {
        ...defaultSettings.notifications.dailyQuest,
        ...stored?.notifications?.dailyQuest,
      },
      noFapCheckIn: {
        ...defaultSettings.notifications.noFapCheckIn,
        ...stored?.notifications?.noFapCheckIn,
      },
      focusWorkout: {
        ...defaultSettings.notifications.focusWorkout,
        ...stored?.notifications?.focusWorkout,
      },
    },
  };
}

export async function setSettings(settings: AppSettings): Promise<void> {
  await setItem(storageKeys.settings, settings);
}

export async function getWelcomeSeen(): Promise<boolean> {
  return (await getItem<boolean>(storageKeys.welcomeSeen)) ?? false;
}

export async function setWelcomeSeen(seen: boolean): Promise<void> {
  await setItem(storageKeys.welcomeSeen, seen);
}

export async function exportAppData(): Promise<AppExportData> {
  const [
    profile,
    progress,
    dailyQuests,
    history,
    hairLog,
    completionLog,
    questRotation,
    achievements,
    customQuests,
    goals,
    mensHealthState,
    mensHealthLogs,
    weeklyReviews,
    milestones,
    dopamineLogs,
    sleepEntries,
    workoutEntries,
    settings,
  ] = await Promise.all([
    getProfile(),
    getProgress(),
    getDailyQuests(),
    getHistory(),
    getHairLog(),
    getCompletionLog(),
    getQuestRotation(),
    getAchievements(),
    getCustomQuests(),
    getGoals(),
    getMensHealthState(),
    getMensHealthLogs(),
    getWeeklyReviews(),
    getMilestones(),
    getDopamineLogs(),
    getSleepEntries(),
    getWorkoutEntries(),
    getSettings(),
  ]);

  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    payload: {
      profile,
      progress,
      dailyQuests,
      history,
      hairLog,
      completionLog,
      questRotation,
      achievements,
      customQuests,
      goals,
      mensHealthState,
      mensHealthLogs,
      weeklyReviews,
      milestones,
      dopamineLogs,
      sleepEntries,
      workoutEntries,
      settings,
    },
  };
}

export async function importAppData(data: AppExportData): Promise<void> {
  await Promise.all([
    setItem(storageKeys.profile, data.payload.profile),
    setItem(storageKeys.progress, data.payload.progress),
    setItem(storageKeys.dailyQuests, data.payload.dailyQuests),
    setItem(storageKeys.history, data.payload.history),
    setItem(storageKeys.hairLog, data.payload.hairLog),
    setItem(storageKeys.completionLog, data.payload.completionLog),
    setItem(storageKeys.questRotation, data.payload.questRotation),
    setItem(storageKeys.achievements, data.payload.achievements),
    setItem(storageKeys.customQuests, data.payload.customQuests),
    setItem(storageKeys.goals, data.payload.goals),
    setItem(storageKeys.mensHealthState, data.payload.mensHealthState),
    setItem(storageKeys.mensHealthLogs, data.payload.mensHealthLogs),
    setItem(storageKeys.weeklyReviews, data.payload.weeklyReviews),
    setItem(storageKeys.milestones, data.payload.milestones),
    setItem(storageKeys.dopamineLogs, data.payload.dopamineLogs ?? []),
    setItem(storageKeys.sleepEntries, data.payload.sleepEntries ?? []),
    setItem(storageKeys.workoutEntries, data.payload.workoutEntries ?? []),
    setItem(storageKeys.settings, data.payload.settings ?? defaultSettings),
  ]);
}
