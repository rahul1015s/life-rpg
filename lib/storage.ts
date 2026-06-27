import AsyncStorage from '@react-native-async-storage/async-storage';

import type {
  AchievementUnlock,
  CustomQuest,
  DailyQuest,
  PersonalGoal,
  HairLogEntry,
  HistoryEntry,
  MensHealthLog,
  MensHealthState,
  PlayerProfile,
  PlayerProgress,
  QuestCompletionLogEntry,
  QuestRotationEntry,
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
