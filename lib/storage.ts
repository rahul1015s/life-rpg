import AsyncStorage from '@react-native-async-storage/async-storage';

import type {
  AchievementUnlock,
  AppExportData,
  CustomQuest,
    DailyQuest,
    DailyCheckIn,
    DopamineLog,
    FocusSession,
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
    RelapseReflection,
    ReflectionJournalEntry,
    SleepRecoveryEntry,
    WorkoutEntry,
    WeeklyReview,
  } from './types';
import { normalizeCompletionLogEntry, normalizeDailyQuest } from './questUtils';

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
  dailyCheckIns: 'lifeRPG:dailyCheckIns',
  journalEntries: 'lifeRPG:journalEntries',
  focusSessions: 'lifeRPG:focusSessions',
  milestones: 'lifeRPG:milestones',
  dopamineLogs: 'lifeRPG:dopamineLogs',
  sleepEntries: 'lifeRPG:sleepEntries',
  workoutEntries: 'lifeRPG:workoutEntries',
  relapseReflections: 'lifeRPG:relapseReflections',
} as const;

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
  return getItem<PlayerProfile>(storageKeys.profile);
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

export async function getDailyCheckIns(): Promise<DailyCheckIn[]> {
  return (await getItem<DailyCheckIn[]>(storageKeys.dailyCheckIns)) ?? [];
}

export async function setDailyCheckIns(entries: DailyCheckIn[]): Promise<void> {
  await setItem(storageKeys.dailyCheckIns, entries);
}

export async function getJournalEntries(): Promise<ReflectionJournalEntry[]> {
  return (await getItem<ReflectionJournalEntry[]>(storageKeys.journalEntries)) ?? [];
}

export async function setJournalEntries(entries: ReflectionJournalEntry[]): Promise<void> {
  await setItem(storageKeys.journalEntries, entries);
}

export async function getFocusSessions(): Promise<FocusSession[]> {
  return (await getItem<FocusSession[]>(storageKeys.focusSessions)) ?? [];
}

export async function setFocusSessions(entries: FocusSession[]): Promise<void> {
  await setItem(storageKeys.focusSessions, entries);
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
  return (await getItem<WorkoutEntry[]>(storageKeys.workoutEntries)) ?? [];
}

export async function setWorkoutEntries(entries: WorkoutEntry[]): Promise<void> {
  await setItem(storageKeys.workoutEntries, entries);
}

export async function getRelapseReflections(): Promise<RelapseReflection[]> {
  return (await getItem<RelapseReflection[]>(storageKeys.relapseReflections)) ?? [];
}

export async function setRelapseReflections(entries: RelapseReflection[]): Promise<void> {
  await setItem(storageKeys.relapseReflections, entries);
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
    dailyCheckIns,
    journalEntries,
    focusSessions,
    milestones,
    dopamineLogs,
    sleepEntries,
    workoutEntries,
    relapseReflections,
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
    getDailyCheckIns(),
    getJournalEntries(),
    getFocusSessions(),
    getMilestones(),
    getDopamineLogs(),
    getSleepEntries(),
    getWorkoutEntries(),
    getRelapseReflections(),
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
      dailyCheckIns,
      journalEntries,
      focusSessions,
      milestones,
      dopamineLogs,
      sleepEntries,
      workoutEntries,
      relapseReflections,
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
    setItem(storageKeys.dailyCheckIns, data.payload.dailyCheckIns),
    setItem(storageKeys.journalEntries, data.payload.journalEntries),
    setItem(storageKeys.focusSessions, data.payload.focusSessions),
    setItem(storageKeys.milestones, data.payload.milestones),
    setItem(storageKeys.dopamineLogs, data.payload.dopamineLogs ?? []),
    setItem(storageKeys.sleepEntries, data.payload.sleepEntries ?? []),
    setItem(storageKeys.workoutEntries, data.payload.workoutEntries ?? []),
    setItem(storageKeys.relapseReflections, data.payload.relapseReflections ?? []),
  ]);
}
