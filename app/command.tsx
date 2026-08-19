import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { MarkedDates } from 'react-native-calendars/src/types';
import { SafeAreaView } from 'react-native-safe-area-context';
import { type Href, useFocusEffect, useRouter } from 'expo-router';

import { AchievementUnlockModal } from '../components/AchievementUnlockModal';
import { AppCalendar } from '../components/AppCalendar';
import { GoalCompletionModal } from '../components/GoalCompletionModal';
import { LevelUpModal } from '../components/LevelUpModal';
import { QuestDetailModal } from '../components/QuestDetailModal';
import { ChronicleCard } from '../components/chronicle/ChronicleCard';
import { ChronicleProgressBar } from '../components/chronicle/ChronicleProgressBar';
import { ChronicleQuestCard } from '../components/chronicle/ChronicleQuestCard';
import { ChronicleSectionHeader } from '../components/chronicle/ChronicleSectionHeader';
import { ChronicleStatPanel } from '../components/chronicle/ChronicleStatPanel';
import { WaxSeal } from '../components/chronicle/WaxSeal';
import {
  buildAvatarEvolution,
  buildBossBattles,
  buildRewardInventory,
  getActiveMilestones,
  summarizeWorkoutProgress,
} from '../lib/growthEngine';
import { getTopActiveGoal } from '../lib/goalsEngine';
import { getCurrentFullDoseStreak, shiftDate } from '../lib/haircareEngine';
import { completeDailyQuest, ensureDailyQuests } from '../lib/questEngine';
import { categoryLabels } from '../lib/questUtils';
import {
  buildNoFapCalendar,
  createInitialMensHealthState,
  formatLocalDate,
  getTodayMensHealthLog,
  updateNoFapAndNoPornState,
  upsertMensHealthLog,
} from '../lib/mensHealthEngine';
import {
  getCompletionLog,
  getCustomQuests,
  getGoals,
  getHairLog,
  getHistory,
  getMensHealthLogs,
  getMensHealthState,
  getMilestones,
  getProfile,
  getProgress,
  getWorkoutEntries,
  setMensHealthLogs,
  setMensHealthState,
} from '../lib/storage';
import type {
  AchievementUnlockResult,
  DailyQuest,
  GoalRewardResult,
  HairLogEntry,
  HistoryEntry,
  LevelUpSummary,
  MensHealthLog,
  MensHealthState,
  MilestoneVision,
  PersonalGoal,
  PlayerProfile,
  PlayerProgress,
  QuestCompletionLogEntry,
  WorkoutEntry,
} from '../lib/types';
import { getDisciplineCopy, hasAdultContentAccess } from '../lib/utils/profile';
import { chronicleColors, chronicleFontFamily, chronicleSpacing, chronicleType } from '../theme/chronicle';
import { chronicleCalendarTheme } from '../theme/chronicleCalendarTheme';

export default function CommandScreen() {
  const router = useRouter();
  const [profile, setProfile] = useState<PlayerProfile | null>(null);
  const [progress, setProgress] = useState<PlayerProgress | null>(null);
  const [quests, setQuests] = useState<DailyQuest[]>([]);
  const [hairLog, setHairLogState] = useState<HairLogEntry[]>([]);
  const [mensHealthState, setMensHealthStateLocal] = useState<MensHealthState | null>(null);
  const [mensHealthLogs, setMensHealthLogsLocal] = useState<MensHealthLog[]>([]);
  const [workoutEntries, setWorkoutEntriesLocal] = useState<WorkoutEntry[]>([]);
  const [milestones, setMilestones] = useState<MilestoneVision[]>([]);
  const [history, setHistoryLocal] = useState<HistoryEntry[]>([]);
  const [completionLog, setCompletionLogLocal] = useState<QuestCompletionLogEntry[]>([]);
  const [topGoal, setTopGoal] = useState<PersonalGoal | null>(null);
  const [customQuestCount, setCustomQuestCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [completingNoFap, setCompletingNoFap] = useState(false);
  const [completingQuestId, setCompletingQuestId] = useState<string | null>(null);
  const [selectedQuest, setSelectedQuest] = useState<DailyQuest | null>(null);
  const [adultContentAccess, setAdultContentAccess] = useState(true);
  const [disciplineCopy, setDisciplineCopy] = useState(() => getDisciplineCopy());
  const [levelUpSummary, setLevelUpSummary] = useState<LevelUpSummary | null>(null);
  const [showLevelUpModal, setShowLevelUpModal] = useState(false);
  const [achievementUnlocks, setAchievementUnlocks] = useState<AchievementUnlockResult[]>([]);
  const [showAchievementModal, setShowAchievementModal] = useState(false);
  const [completedGoals, setCompletedGoals] = useState<GoalRewardResult[]>([]);
  const [showGoalModal, setShowGoalModal] = useState(false);

  const load = useCallback(async () => {
    const savedProfile = await getProfile();
    if (!savedProfile) {
      router.replace('/onboarding' as Href);
      return;
    }

    const [
      savedProgress,
      nextQuests,
      savedHairLog,
      goals,
      customQuests,
      savedHistory,
      savedCompletionLog,
      savedMensHealthState,
      savedMensHealthLogs,
      savedWorkoutEntries,
      savedMilestones,
    ] = await Promise.all([
      getProgress(),
      ensureDailyQuests(savedProfile),
      getHairLog(),
      getGoals(),
      getCustomQuests(),
      getHistory(),
      getCompletionLog(),
      getMensHealthState(),
      getMensHealthLogs(),
      getWorkoutEntries(),
      getMilestones(),
    ]);

    if (!savedProgress) {
      router.replace('/onboarding' as Href);
      return;
    }

    const nextMensHealthState = savedMensHealthState ?? createInitialMensHealthState();

    setProfile(savedProfile);
    setAdultContentAccess(hasAdultContentAccess(savedProfile.dob));
    setDisciplineCopy(getDisciplineCopy(savedProfile.gender));
    setProgress(savedProgress);
    setQuests(nextQuests);
    setHairLogState(savedHairLog);
    setTopGoal(getTopActiveGoal(goals));
    setCustomQuestCount(customQuests.length);
    setHistoryLocal(savedHistory);
    setCompletionLogLocal(savedCompletionLog);
    setMensHealthStateLocal(nextMensHealthState);
    setMensHealthLogsLocal(savedMensHealthLogs);
    setWorkoutEntriesLocal(savedWorkoutEntries);
    setMilestones(savedMilestones);
  }, [router]);

  useFocusEffect(
    useCallback(() => {
      let active = true;

      async function run() {
        setLoading(true);
        try {
          await load();
        } finally {
          if (active) {
            setLoading(false);
          }
        }
      }

      run();

      return () => {
        active = false;
      };
    }, [load])
  );

  async function handleRefresh() {
    setRefreshing(true);
    try {
      await load();
    } finally {
      setRefreshing(false);
    }
  }

  async function handleCompleteNoFap() {
    if (!mensHealthState) {
      return;
    }

    try {
      setCompletingNoFap(true);
      const today = formatLocalDate();
      const current = getTodayMensHealthLog(mensHealthLogs, today);
      if (current.noFapStatus === 'clean' && current.noPornStatus === 'clean') {
        Alert.alert('Already logged', disciplineCopy.alreadyLoggedMessage);
        return;
      }

      const nextLog = {
        ...current,
        noFapStatus: 'clean' as const,
        noPornStatus: 'clean' as const,
      };
      const nextLogs = upsertMensHealthLog(mensHealthLogs, nextLog);
      const nextState = updateNoFapAndNoPornState(mensHealthState, nextLogs, today);
      await Promise.all([setMensHealthLogs(nextLogs), setMensHealthState(nextState)]);
      setMensHealthLogsLocal(nextLogs);
      setMensHealthStateLocal(nextState);
      Alert.alert('Discipline locked in', disciplineCopy.completeMessage);
    } catch (error) {
      const message = error instanceof Error ? error.message : disciplineCopy.updateErrorMessage;
      Alert.alert('Tracker update failed', message);
    } finally {
      setCompletingNoFap(false);
    }
  }

  async function handleCompleteQuest(questId: string) {
    try {
      setCompletingQuestId(questId);
      const result = await completeDailyQuest(questId);
      setQuests(result.quests);
      setProgress(result.progress);
      if (result.levelUp) {
        setLevelUpSummary(result.levelUp);
        setShowLevelUpModal(true);
      }
      if (result.unlockedAchievements.length > 0) {
        setAchievementUnlocks(result.unlockedAchievements);
        setShowAchievementModal(true);
      }
      if (result.completedGoals.length > 0) {
        setCompletedGoals(result.completedGoals);
        setShowGoalModal(true);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to complete quest.';
      Alert.alert('Quest update failed', message);
    } finally {
      setCompletingQuestId(null);
    }
  }

  const today = formatLocalDate();

  if (loading || !profile || !progress) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={chronicleColors.accentGold} />
      </View>
    );
  }

  const bonusQuests = quests.filter((quest) => quest.isBonus);
  const noFapCalendar = buildNoFapCalendar(mensHealthLogs, today, 14);
  const noFapMarkedDates = noFapCalendar.reduce<MarkedDates>((acc, entry) => {
    const dotColor =
      entry.noFapStatus === 'relapse' || entry.noPornStatus === 'relapse'
        ? chronicleColors.accentEmber
        : entry.noFapStatus === 'clean' && entry.noPornStatus === 'clean'
          ? chronicleColors.accentGold
          : undefined;

    if (dotColor) {
      acc[entry.date] = {
        dots: [{ key: dotColor, color: dotColor }],
      };
    }

    return acc;
  }, {});
  const workoutSummary = summarizeWorkoutProgress(workoutEntries);
  const rewardInventory = buildRewardInventory(progress.totalXP, mensHealthState?.currentNoFapStreak ?? 0);
  const avatarEvolution = buildAvatarEvolution(progress);
  const weekDates = new Set<string>();
  for (let offset = 0; offset < 7; offset += 1) {
    weekDates.add(shiftDate(today, -offset));
  }
  const weeklyHistory = history.filter((entry) => weekDates.has(entry.date));
  const weeklyCompletions = completionLog.filter((entry) => weekDates.has(entry.date));
  const weeklyQuestTotal = weeklyHistory.reduce((sum, entry) => sum + entry.questsCompleted, 0);
  const weeklyXP = weeklyHistory.reduce((sum, entry) => sum + entry.xpEarned, 0);
  const weeklyActiveDays = weeklyHistory.length;
  const categoryCounts = weeklyCompletions.reduce<Partial<Record<QuestCompletionLogEntry['category'], number>>>(
    (acc, entry) => {
      acc[entry.category] = (acc[entry.category] ?? 0) + 1;
      return acc;
    },
    {}
  );
  const bestCategory =
    (Object.entries(categoryCounts).sort((first, second) => second[1] - first[1])[0]?.[0] as QuestCompletionLogEntry['category'] | undefined) ?? null;
  const bossBattles = buildBossBattles(mensHealthState?.currentNoFapStreak ?? 0);
  const activeMilestones = getActiveMilestones(milestones);
  const noFapDoneToday =
    adultContentAccess &&
    mensHealthState?.lastNoFapCheckDate === today &&
    getTodayMensHealthLog(mensHealthLogs, today).noFapStatus === 'clean';
  const nextBonusQuestId = bonusQuests.find((quest) => !quest.completed)?.id ?? null;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={chronicleColors.accentGold} />}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={({ pressed }) => (pressed ? styles.pressed : null)}>
            <Text style={styles.backLink}>‹ HOME</Text>
          </Pressable>
          <Text style={styles.headerTitle}>The Chronicle</Text>
          <Text style={styles.headerSub}>Everything beyond today&apos;s board, in one place.</Text>
        </View>

        <View style={styles.section}>
          <ChronicleSectionHeader title="Command Center" counter="Fast actions" />
          <View style={styles.actionGrid}>
            <ActionCard
              label={adultContentAccess ? disciplineCopy.primaryHabitActionLabel : 'DISCIPLINE'}
              value={noFapDoneToday ? 'DONE' : adultContentAccess ? 'MARK CLEAN' : 'OPEN'}
              detail={
                adultContentAccess
                  ? `${mensHealthState?.currentNoFapStreak ?? 0} day streak`
                  : 'Uses the simplified under-18 view'
              }
              onPress={adultContentAccess ? handleCompleteNoFap : () => router.push('/no-fap' as Href)}
              loading={completingNoFap}
            />
            <ActionCard
              label="WORKOUT"
              value={`${workoutSummary.totalSessions}`}
              detail="Log or review sessions"
              onPress={() => router.push('/workout-progress' as Href)}
            />
            <ActionCard
              label="GOALS"
              value={topGoal ? `${topGoal.progressPercent}%` : 'SET'}
              detail={topGoal ? topGoal.title : 'Create a long-term target'}
              onPress={() => router.push('/goals' as Href)}
            />
            <ActionCard
              label="LOOT"
              value={`${progress.level}`}
              detail="Achievements and unlocks"
              onPress={() => router.push('/achievements' as Href)}
            />
          </View>
        </View>

        <View style={styles.section}>
          <ChronicleSectionHeader title="Discipline Calendar" />
          <ChronicleCard style={styles.panelGap}>
            <Text style={styles.noticeTitle}>Unified Calendar</Text>
            <Text style={styles.noticeBody}>
              Your {disciplineCopy.primaryHabitLabel.toLowerCase()} streak stays visible in one shared calendar view.
            </Text>
            <AppCalendar markedDates={noFapMarkedDates} current={today} hideArrows calendarTheme={chronicleCalendarTheme} />
            <View style={styles.inlineActions}>
              <Pressable onPress={() => router.push('/habit-calendar' as Href)} style={({ pressed }) => (pressed ? styles.pressed : null)}>
                <Text style={styles.noticeLink}>OPEN CALENDAR</Text>
              </Pressable>
              <Pressable onPress={() => router.push('/settings' as Href)} style={({ pressed }) => (pressed ? styles.pressed : null)}>
                <Text style={styles.noticeLink}>REMINDER SETTINGS</Text>
              </Pressable>
            </View>
          </ChronicleCard>
        </View>

        <View style={styles.section}>
          <ChronicleSectionHeader title="Weekly Report" counter={bestCategory ? categoryLabels[bestCategory] : undefined} />
          <View style={styles.statsRow}>
            <ChronicleStatPanel value={`${weeklyActiveDays}/7`} label="ACTIVE DAYS" accent={weeklyActiveDays >= 4 ? 'gold' : undefined} />
            <ChronicleStatPanel value={String(weeklyQuestTotal)} label="QUESTS" />
            <ChronicleStatPanel value={String(weeklyXP)} label="XP" />
          </View>
        </View>

        <View style={styles.section}>
          <ChronicleSectionHeader title="Boss Battles" counter={`${mensHealthState?.currentNoFapStreak ?? 0} day run`} />
          <View style={styles.rowList}>
            {bossBattles.map((battle) => (
              <ChronicleCard key={battle.id}>
                <View style={styles.rewardRow}>
                  <WaxSeal completed={battle.defeated} size={28} />
                  <View style={styles.rewardCopy}>
                    <Text style={styles.noticeBody}>{battle.label}</Text>
                    <Text style={styles.noticeSub}>{battle.defeated ? battle.reward : `Reward: ${battle.reward}`}</Text>
                  </View>
                  <Text style={styles.progressCount}>
                    {battle.progress}/{battle.target}
                  </Text>
                </View>
                <ChronicleProgressBar progress={battle.target > 0 ? battle.progress / battle.target : 0} height={8} />
              </ChronicleCard>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <ChronicleSectionHeader title="Inventory + Avatar" counter="Unlocks" />
          <ChronicleCard style={styles.panelGap}>
            <Text style={styles.noticeTitle}>{avatarEvolution.title}</Text>
            <Text style={styles.noticeBody}>{avatarEvolution.summary}</Text>
            {rewardInventory.map((item) => (
              <View key={item.id} style={styles.rewardRow}>
                <WaxSeal completed={item.unlocked} size={26} />
                <View style={styles.rewardCopy}>
                  <Text style={styles.noticeBody}>{item.label}</Text>
                  <Text style={styles.noticeSub}>{item.requirement}</Text>
                </View>
              </View>
            ))}
          </ChronicleCard>
        </View>

        {profile.usesMinoxidil ? (
          <View style={styles.section}>
            <ChronicleCard style={styles.panelGap}>
              <Text style={styles.noticeTitle}>Hair Care Tracker</Text>
              <Text style={styles.noticeBody}>
                {getCurrentFullDoseStreak(hairLog)} day full-dose streak · open the tracker to log morning and night doses.
              </Text>
              <Pressable onPress={() => router.push('/haircare' as Href)} style={({ pressed }) => (pressed ? styles.pressed : null)}>
                <Text style={styles.noticeLink}>OPEN TRACKER</Text>
              </Pressable>
            </ChronicleCard>
          </View>
        ) : null}

        <View style={styles.section}>
          <ChronicleSectionHeader title="Bonus Quests" counter={customQuestCount > 0 ? `${customQuestCount} custom` : undefined} />
          <View style={styles.rowList}>
            {bonusQuests.map((quest) => (
              <ChronicleQuestCard
                key={`${quest.dateAssigned}-${quest.id}`}
                quest={quest}
                onPress={setSelectedQuest}
                onComplete={handleCompleteQuest}
                loading={completingQuestId === quest.id}
                isNext={quest.id === nextBonusQuestId}
              />
            ))}
            {bonusQuests.length === 0 ? (
              <Pressable onPress={() => router.push('/goals' as Href)} style={({ pressed }) => (pressed ? styles.pressed : null)}>
                <ChronicleCard style={styles.panelGap}>
                  <Text style={styles.noticeTitle}>No bonus quests today</Text>
                  <Text style={styles.noticeBody}>
                    {topGoal
                      ? `Check back tomorrow, or open "${topGoal.title}" to keep earning bonus XP from your active goal.`
                      : 'Set a long-term goal to start unlocking bonus XP quests.'}
                  </Text>
                  <Text style={styles.noticeLink}>{topGoal ? 'VIEW GOAL ›' : 'SET A GOAL ›'}</Text>
                </ChronicleCard>
              </Pressable>
            ) : null}
          </View>
        </View>

        <View style={styles.section}>
          <ChronicleCard style={styles.linksPanel}>
            <Pressable style={({ pressed }) => [styles.linkRow, pressed && styles.pressed]} onPress={() => router.push('/history' as Href)}>
              <Text style={styles.linkLabel}>ARCHIVE</Text>
              <Text style={styles.linkValue}>History and analytics</Text>
            </Pressable>
            <Pressable style={({ pressed }) => [styles.linkRow, pressed && styles.pressed]} onPress={() => router.push('/achievements' as Href)}>
              <Text style={styles.linkLabel}>REWARDS</Text>
              <Text style={styles.linkValue}>Achievements and unlocks</Text>
            </Pressable>
            <Pressable style={({ pressed }) => [styles.linkRow, pressed && styles.pressed]} onPress={() => router.push('/goals' as Href)}>
              <Text style={styles.linkLabel}>MISSION</Text>
              <Text style={styles.linkValue}>{topGoal ? topGoal.title : 'Set your next long-term goal'}</Text>
            </Pressable>
            <Pressable style={({ pressed }) => [styles.linkRow, pressed && styles.pressed]} onPress={() => router.push('/milestones' as Href)}>
              <Text style={styles.linkLabel}>MILESTONES</Text>
              <Text style={styles.linkValue}>{activeMilestones[0]?.title ?? 'Build your weekly and monthly boss battles'}</Text>
            </Pressable>
            <Pressable style={({ pressed }) => [styles.linkRow, pressed && styles.pressed]} onPress={() => router.push('/weekly-review' as Href)}>
              <Text style={styles.linkLabel}>REVIEW</Text>
              <Text style={styles.linkValue}>Weekly reviews and lessons</Text>
            </Pressable>
          </ChronicleCard>
        </View>
      </ScrollView>

      <QuestDetailModal visible={selectedQuest !== null} quest={selectedQuest} onClose={() => setSelectedQuest(null)} />
      <LevelUpModal visible={showLevelUpModal} summary={levelUpSummary} onDismiss={() => setShowLevelUpModal(false)} />
      <AchievementUnlockModal
        visible={showAchievementModal}
        achievements={achievementUnlocks}
        onClose={() => setShowAchievementModal(false)}
      />
      <GoalCompletionModal visible={showGoalModal} completedGoals={completedGoals} onClose={() => setShowGoalModal(false)} />
    </SafeAreaView>
  );
}

function ActionCard({
  label,
  value,
  detail,
  onPress,
  loading = false,
}: {
  label: string;
  value: string;
  detail: string;
  onPress: () => void;
  loading?: boolean;
}) {
  return (
    <Pressable style={({ pressed }) => [styles.actionCardWrap, pressed && styles.pressed]} onPress={onPress}>
      <ChronicleCard style={styles.actionCard}>
        <Text style={styles.actionLabel}>{label}</Text>
        <Text style={styles.actionValue}>{loading ? '...' : value}</Text>
        <Text style={styles.actionDetail}>{detail}</Text>
      </ChronicleCard>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: chronicleColors.bgBase,
  },
  scroll: {
    flex: 1,
    backgroundColor: chronicleColors.bgBase,
  },
  content: {
    padding: chronicleSpacing.lg,
    paddingBottom: chronicleSpacing.xxl,
    gap: chronicleSpacing.lg,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: chronicleColors.bgBase,
  },
  header: {
    gap: 4,
  },
  backLink: {
    color: chronicleColors.accentGold,
    fontFamily: chronicleFontFamily.mono,
    fontSize: chronicleType.sm,
  },
  headerTitle: {
    marginTop: chronicleSpacing.sm,
    color: chronicleColors.textPrimary,
    fontFamily: chronicleFontFamily.display,
    fontSize: chronicleType.xxl,
  },
  headerSub: {
    color: chronicleColors.textMuted,
    fontFamily: chronicleFontFamily.body,
    fontSize: chronicleType.sm,
  },
  section: {
    gap: chronicleSpacing.sm,
  },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: chronicleSpacing.sm,
  },
  actionCardWrap: {
    width: '48.5%',
  },
  pressed: {
    opacity: 0.7,
  },
  actionCard: {
    gap: 2,
  },
  actionLabel: {
    color: chronicleColors.accentGold,
    fontFamily: chronicleFontFamily.mono,
    fontSize: chronicleType.xs,
    letterSpacing: 1,
  },
  actionValue: {
    color: chronicleColors.textPrimary,
    fontFamily: chronicleFontFamily.display,
    fontSize: chronicleType.lg,
  },
  actionDetail: {
    color: chronicleColors.textMuted,
    fontFamily: chronicleFontFamily.body,
    fontSize: chronicleType.sm,
    lineHeight: 18,
  },
  panelGap: {
    gap: chronicleSpacing.sm,
  },
  noticeTitle: {
    color: chronicleColors.textPrimary,
    fontFamily: chronicleFontFamily.display,
    fontSize: chronicleType.md,
  },
  noticeBody: {
    color: chronicleColors.textMuted,
    fontFamily: chronicleFontFamily.body,
    fontSize: chronicleType.sm,
    lineHeight: 20,
  },
  noticeLink: {
    color: chronicleColors.accentGold,
    fontFamily: chronicleFontFamily.mono,
    fontSize: chronicleType.sm,
  },
  noticeSub: {
    color: chronicleColors.textMuted,
    fontFamily: chronicleFontFamily.mono,
    fontSize: chronicleType.xs,
  },
  inlineActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: chronicleSpacing.md,
  },
  statsRow: {
    flexDirection: 'row',
    gap: chronicleSpacing.md,
  },
  rowList: {
    gap: chronicleSpacing.md,
  },
  rewardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: chronicleSpacing.md,
    marginBottom: chronicleSpacing.sm,
  },
  rewardCopy: {
    flex: 1,
    gap: 2,
  },
  progressCount: {
    color: chronicleColors.accentGold,
    fontFamily: chronicleFontFamily.mono,
    fontSize: chronicleType.xs,
  },
  linksPanel: {
    gap: chronicleSpacing.md,
  },
  linkRow: {
    gap: 2,
  },
  linkLabel: {
    color: chronicleColors.textMuted,
    fontFamily: chronicleFontFamily.mono,
    fontSize: chronicleType.xs,
    letterSpacing: 1,
  },
  linkValue: {
    color: chronicleColors.textPrimary,
    fontFamily: chronicleFontFamily.bodySemiBold,
    fontSize: chronicleType.md,
  },
});
