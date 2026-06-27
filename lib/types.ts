export type StatKey =
  | 'strength'
  | 'stamina'
  | 'focus'
  | 'discipline'
  | 'charisma'
  | 'confidence'
  | 'creativity'
  | 'appearance'
  | 'communication'
  | 'style';

export type MainGoal =
  | 'body'
  | 'confidence'
  | 'coding'
  | 'study'
  | 'career'
  | 'writing'
  | 'personality'
  | 'all-rounder';

export type ExperienceLevel = 'beginner' | 'normal' | 'serious';

export type QuestCategory =
  | 'fitness'
  | 'study'
  | 'coding'
  | 'writing'
  | 'hygiene'
  | 'appearance'
  | 'confidence'
  | 'social'
  | 'communication'
  | 'career'
  | 'health'
  | 'mens-health'
  | 'style'
  | 'haircare';

export type QuestDifficulty = 'easy' | 'medium' | 'hard';

export type QuestRepeatType = 'daily' | 'weekly' | 'flexible' | 'one-time';

export type RankName = 'Beginner' | 'Trainee' | 'Hunter' | 'Elite' | 'Hero' | 'King';
export type AchievementCategory =
  | 'quests'
  | 'streak'
  | 'xp'
  | 'category'
  | 'level'
  | 'haircare'
  | 'mens-health';
export type GoalCategory =
  | 'fitness'
  | 'study'
  | 'coding'
  | 'writing'
  | 'confidence'
  | 'career'
  | 'haircare';

export interface PlayerProfile {
  name: string;
  mainGoal: MainGoal;
  experienceLevel: ExperienceLevel;
  wakeTime: string;
  sleepTarget: string;
  createdAt: string;
  usesMinoxidil: boolean;
  minoxidilStartDate: string | null;
}

export interface PlayerProgress {
  level: number;
  xp: number;
  totalXP: number;
  stats: Record<StatKey, number>;
  streak: number;
  longestStreak: number;
  lastCompletionDate: string | null;
}

export interface QuestTemplate {
  id: string;
  title: string;
  description: string;
  category: QuestCategory;
  difficulty: QuestDifficulty;
  baseXP: number;
  affectedStats: Partial<Record<StatKey, number>>;
  repeatType: QuestRepeatType;
  recommendedTime: string;
  whyThisHelps: string;
  safetyNote: string | null;
}

export interface CustomQuest extends QuestTemplate {
  createdAt: string;
  active: boolean;
  completedCount: number;
}

export interface DailyQuest extends QuestTemplate {
  xp: number;
  statEffects: Partial<Record<StatKey, number>>;
  dateAssigned: string;
  completed: boolean;
  completedAt: string | null;
  isBonus: boolean;
}

export interface HistoryEntry {
  date: string;
  questsCompleted: number;
  xpEarned: number;
}

export interface QuestCompletionLogEntry {
  date: string;
  completedAt: string;
  questId: string;
  title: string;
  category: QuestCategory;
  difficulty: QuestDifficulty;
  xp: number;
  statEffects: Partial<Record<StatKey, number>>;
  isBonus: boolean;
}

export interface QuestRotationEntry {
  date: string;
  questIds: string[];
}

export interface HairLogEntry {
  date: string;
  appliedMorning: boolean;
  appliedNight: boolean;
  photoUri: string | null;
  note: string | null;
}

export interface LevelUpSummary {
  didLevelUp: boolean;
  previousLevel: number;
  newLevel: number;
  previousRank: RankName;
  currentRank: RankName;
  rankChanged: boolean;
  statGains: Partial<Record<StatKey, number>>;
}

export interface AchievementTemplate {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: AchievementCategory;
  rewardXP: number;
  rewardStats: Partial<Record<StatKey, number>>;
}

export interface AchievementUnlock {
  id: string;
  unlockedAt: string;
}

export interface AchievementProgressState {
  totalQuestsCompleted: number;
  totalXP: number;
  currentStreak: number;
  longestStreak: number;
  level: number;
  completedCategories: QuestCategory[];
  haircareEnabled: boolean;
  noFapCurrentStreak: number;
  noFapLongestStreak: number;
  pelvicFloorWeeklyDays: number;
  lifestyleCompletionCount: number;
  sleepHighQualityDays: number;
  hydrationGoalDays: number;
}

export interface AchievementProgressView {
  current: number;
  target: number;
  label: string;
}

export interface AchievementCardView extends AchievementTemplate {
  unlocked: boolean;
  unlockedAt: string | null;
  progress: AchievementProgressView;
}

export interface QuestCompletionResult {
  progress: PlayerProgress;
  quests: DailyQuest[];
  history: HistoryEntry[];
  hairLog: HairLogEntry[];
  completionLog: QuestCompletionLogEntry[];
  levelUp: LevelUpSummary | null;
  unlockedAchievements: AchievementUnlockResult[];
  completedGoals: GoalRewardResult[];
}

export interface HairCalendarDay {
  date: string;
  status: 'both' | 'one' | 'none';
}

export interface DailyHistoryGroup {
  date: string;
  totalXP: number;
  questsCompleted: number;
  quests: QuestCompletionLogEntry[];
  statTotals: Partial<Record<StatKey, number>>;
  isLegacySummary: boolean;
}

export interface MonthlySummary {
  monthLabel: string;
  xp: number;
  completedQuests: number;
  bestDay: { date: string; xp: number } | null;
  activeDays: number;
  missedDays: number;
  averageXPPerActiveDay: number;
}

export interface XPTrackingSummary {
  today: number;
  week: number;
  month: number;
  allTime: number;
}

export interface ActivityGridCell {
  date: string;
  xp: number;
  questsCompleted: number;
  intensity: 'none' | 'low' | 'medium' | 'high';
}

export interface AchievementUnlockResult {
  achievement: AchievementTemplate;
  unlockedAt: string;
}

export interface PersonalGoal {
  id: string;
  title: string;
  category: GoalCategory;
  targetDate: string;
  progressPercent: number;
  linkedQuestIds: string[];
  status: 'active' | 'completed';
  createdAt: string;
  completedAt: string | null;
  bonusXP: number;
}

export interface GoalRewardResult {
  goal: PersonalGoal;
  rewardedAt: string;
}

export interface MensHealthState {
  challengeStartedAt: string | null;
  currentNoFapStreak: number;
  longestNoFapStreak: number;
  currentNoPornStreak: number;
  longestNoPornStreak: number;
  totalSuccessfulDays: number;
  pelvicFloorCurrentStreak: number;
  pelvicFloorLongestStreak: number;
  lastNoFapCheckDate: string | null;
  lastNoPornCheckDate: string | null;
  lastPelvicFloorDate: string | null;
}

export interface MensHealthLog {
  date: string;
  noFapStatus: 'none' | 'clean' | 'relapse';
  noPornStatus: 'none' | 'clean' | 'relapse';
  noFapNote: string | null;
  noPornNote: string | null;
  sleepQuality: number | null;
  waterLiters: number | null;
  exerciseDone: boolean;
  weightKg: number | null;
  mood: number | null;
  energy: number | null;
  pelvicFloor: {
    slow: number;
    fast: number;
    hold: number;
  };
  lifestyleTasksCompleted: string[];
}

export interface LifestyleQuestTemplate {
  id: string;
  title: string;
  description: string;
  xp: number;
  statEffects: Partial<Record<StatKey, number>>;
}

export interface MensHealthSummary {
  dailyCompletionRate: number;
  weeklyConsistency: number;
  monthlyConsistency: number;
  weeklyPelvicFloorDays: number;
  monthlyLifestyleCompletions: number;
}

export interface WeeklyReview {
  weekStartDate: string;
  wins: string;
  misses: string;
  lessonsLearned: string;
  nextWeekFocus: string;
  createdAt: string;
  updatedAt: string;
}

export interface HabitCalendarCell {
  date: string;
  completed: boolean;
  intensity: 'none' | 'light' | 'strong';
  questsCompleted: number;
  xp: number;
}

export interface DailyCheckIn {
  id: string;
  date: string;
  period: 'morning' | 'night';
  mood: number;
  energy: number;
  sleep: number;
  confidence: number;
  focus: number;
  note: string;
  createdAt: string;
}

export interface ReflectionJournalEntry {
  id: string;
  date: string;
  title: string;
  content: string;
  createdAt: string;
}

export interface FocusSession {
  id: string;
  date: string;
  category: QuestCategory | 'deep-work';
  label: string;
  targetMinutes: number;
  completedMinutes: number;
  completed: boolean;
  rewardXP: number;
  createdAt: string;
  completedAt: string | null;
}

export interface MilestoneVision {
  id: string;
  title: string;
  timeframeDays: 30 | 90 | 365;
  targetDate: string;
  vision: string;
  progressPercent: number;
  status: 'active' | 'completed';
  createdAt: string;
  completedAt: string | null;
}

export interface DopamineLog {
  date: string;
  socialMediaMinutes: number;
  gamingMinutes: number;
  shortVideoMinutes: number;
  junkFood: boolean;
  pornUsed: boolean;
  urgeLevel: number;
  note: string;
}

export interface SleepRecoveryEntry {
  date: string;
  bedTime: string;
  wakeTime: string;
  hoursSlept: number;
  sleepQuality: number;
  screenCutoffTime: string;
  lateCaffeine: boolean;
  note: string;
}

export interface WorkoutEntry {
  id: string;
  date: string;
  workoutType: 'strength' | 'cardio' | 'mobility' | 'sports';
  title: string;
  durationMinutes: number;
  sets: number;
  reps: number;
  weightKg: number;
  effort: number;
  note: string;
  imageUri: string | null;
  createdAt: string;
}

export interface RelapseReflection {
  id: string;
  date: string;
  trigger: string;
  timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
  urgeLevel: number;
  actionTaken: string;
  recoveryPlan: string;
  note: string;
  createdAt: string;
}

export interface RecoveryQuestSuggestion {
  id: string;
  title: string;
  description: string;
  category: QuestCategory;
  reason: string;
  recommendedXP: number;
}

export interface SmartQuestSuggestion {
  questId: string;
  title: string;
  category: QuestCategory;
  reason: string;
  recommendedTime: string;
  xp: number;
}

export interface CategoryInsight {
  label: string;
  completed: number;
  xp: number;
  trend: 'low' | 'medium' | 'high';
}

export interface BalanceRadarPoint {
  label: string;
  value: number;
}

export interface AppExportData {
  version: 1;
  exportedAt: string;
  payload: {
    profile: PlayerProfile | null;
    progress: PlayerProgress | null;
    dailyQuests: DailyQuest[];
    history: HistoryEntry[];
    hairLog: HairLogEntry[];
    completionLog: QuestCompletionLogEntry[];
    questRotation: QuestRotationEntry[];
    achievements: AchievementUnlock[];
    customQuests: CustomQuest[];
    goals: PersonalGoal[];
    mensHealthState: MensHealthState | null;
    mensHealthLogs: MensHealthLog[];
    weeklyReviews: WeeklyReview[];
    dailyCheckIns: DailyCheckIn[];
    journalEntries: ReflectionJournalEntry[];
    focusSessions: FocusSession[];
    milestones: MilestoneVision[];
    dopamineLogs: DopamineLog[];
    sleepEntries: SleepRecoveryEntry[];
    workoutEntries: WorkoutEntry[];
    relapseReflections: RelapseReflection[];
  };
}
