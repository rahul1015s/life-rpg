import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import type { MarkedDates } from 'react-native-calendars/src/types';
import { SafeAreaView } from 'react-native-safe-area-context';
import { type Href, useFocusEffect, useRouter } from 'expo-router';

import { AchievementUnlockModal } from '../components/AchievementUnlockModal';
import { AppCalendar } from '../components/AppCalendar';
import { GoalCompletionModal } from '../components/GoalCompletionModal';
import { LevelUpModal } from '../components/LevelUpModal';
import { QuestDetailModal } from '../components/QuestDetailModal';
import { BonusCard } from '../components/ui/BonusCard';
import { Panel } from '../components/ui/Panel';
import { QuestRow } from '../components/ui/QuestRow';
import { SectionLabel } from '../components/ui/SectionLabel';
import { StatTile } from '../components/ui/StatTile';
import { StatusHeader } from '../components/ui/StatusHeader';
import { theme } from '../constants/theme';
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
  getAchievements,
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
  getSettings,
  getWorkoutEntries,
  setMensHealthLogs,
  setMensHealthState,
  setSettings,
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
import { getRankForLevel } from '../lib/levelSystem';
import { getDisciplineCopy, hasAdultContentAccess } from '../lib/utils/profile';
import { colors, spacing } from '../theme/tokens';
import { fontFamily, typeScale } from '../theme/typography';

export default function DashboardScreen() {
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
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [completingQuestId, setCompletingQuestId] = useState<string | null>(null);
  const [completingNoFap, setCompletingNoFap] = useState(false);
  const [levelUpSummary, setLevelUpSummary] = useState<LevelUpSummary | null>(null);
  const [showLevelUpModal, setShowLevelUpModal] = useState(false);
  const [selectedQuest, setSelectedQuest] = useState<DailyQuest | null>(null);
  const [achievementUnlocks, setAchievementUnlocks] = useState<AchievementUnlockResult[]>([]);
  const [showAchievementModal, setShowAchievementModal] = useState(false);
  const [, setAchievementCount] = useState(0);
  const [topGoal, setTopGoal] = useState<PersonalGoal | null>(null);
  const [customQuestCount, setCustomQuestCount] = useState(0);
  const [completedGoals, setCompletedGoals] = useState<GoalRewardResult[]>([]);
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [adultContentAccess, setAdultContentAccess] = useState(true);
  const [disciplineCopy, setDisciplineCopy] = useState(() => getDisciplineCopy());

  const loadDashboard = useCallback(async () => {
    const savedProfile = await getProfile();
    if (!savedProfile) {
      router.replace('/onboarding' as Href);
      return;
    }

    const [
      savedProgress,
      nextQuests,
      savedHairLog,
      achievements,
      goals,
      customQuests,
      savedHistory,
      savedCompletionLog,
      savedMensHealthState,
      savedMensHealthLogs,
      savedWorkoutEntries,
      savedMilestones,
      settings,
    ] = await Promise.all([
      getProgress(),
      ensureDailyQuests(savedProfile),
      getHairLog(),
      getAchievements(),
      getGoals(),
      getCustomQuests(),
      getHistory(),
      getCompletionLog(),
      getMensHealthState(),
      getMensHealthLogs(),
      getWorkoutEntries(),
      getMilestones(),
      getSettings(),
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
    setAchievementCount(achievements.length);
    setTopGoal(getTopActiveGoal(goals));
    setCustomQuestCount(customQuests.length);
    setHistoryLocal(savedHistory);
    setCompletionLogLocal(savedCompletionLog);
    setMensHealthStateLocal(nextMensHealthState);
    setMensHealthLogsLocal(savedMensHealthLogs);
    setWorkoutEntriesLocal(savedWorkoutEntries);
    setMilestones(savedMilestones);

    if (!savedProfile.dob && !settings.dobPromptDismissedAt) {
      Alert.alert('Complete your profile', 'Add your date of birth once so age-based features stay accurate over time.', [
        {
          text: 'Later',
          onPress: () => {
            void setSettings({
              ...settings,
              dobPromptDismissedAt: new Date().toISOString(),
            });
          },
        },
        {
          text: 'Open Settings',
          onPress: () => {
            void setSettings({
              ...settings,
              dobPromptDismissedAt: new Date().toISOString(),
            });
            router.push('/settings' as Href);
          },
        },
      ]);
    }
  }, [router]);

  useFocusEffect(
    useCallback(() => {
      let active = true;

      async function run() {
        setLoading(true);
        try {
          await loadDashboard();
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
    }, [loadDashboard])
  );

  async function handleRefresh() {
    setRefreshing(true);
    try {
      await loadDashboard();
    } finally {
      setRefreshing(false);
    }
  }

  async function handleCompleteQuest(questId: string) {
    try {
      setCompletingQuestId(questId);
      const result = await completeDailyQuest(questId);
      setQuests(result.quests);
      setProgress(result.progress);
      setHairLogState(result.hairLog);
      setAchievementCount((current) => current + result.unlockedAchievements.length);
      const refreshedGoals = await getGoals();
      const [refreshedHistory, refreshedCompletionLog] = await Promise.all([getHistory(), getCompletionLog()]);
      setTopGoal(getTopActiveGoal(refreshedGoals));
      setHistoryLocal(refreshedHistory);
      setCompletionLogLocal(refreshedCompletionLog);
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

  const today = formatLocalDate();

  if (loading || !profile || !progress) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.gold} />
      </View>
    );
  }

  const punishmentQuests = quests.filter((quest) => quest.isPunishment);
  const mainQuests = quests.filter((quest) => !quest.isBonus && !quest.isPunishment);
  const bonusQuests = quests.filter((quest) => quest.isBonus);
  const noFapCalendar = buildNoFapCalendar(mensHealthLogs, today, 14);
  const noFapMarkedDates = noFapCalendar.reduce<MarkedDates>((acc, entry) => {
    const dotColor =
      entry.noFapStatus === 'relapse' || entry.noPornStatus === 'relapse'
        ? colors.sealRed
        : entry.noFapStatus === 'clean' && entry.noPornStatus === 'clean'
          ? colors.gold
          : undefined;

    if (dotColor) {
      acc[entry.date] = {
        dots: [{ key: dotColor, color: dotColor }],
      };
    }

    return acc;
  }, {});
  const workoutSummary = summarizeWorkoutProgress(workoutEntries);
  const rewardInventory = buildRewardInventory(
    progress.totalXP,
    mensHealthState?.currentNoFapStreak ?? 0
  );
  const avatarEvolution = buildAvatarEvolution(progress);
  const pendingMainQuests = mainQuests.filter((quest) => !quest.completed).length;
  const completedToday = mainQuests.length - pendingMainQuests;
  const noFapDoneToday =
    adultContentAccess &&
    mensHealthState?.lastNoFapCheckDate === today &&
    getTodayMensHealthLog(mensHealthLogs, today).noFapStatus === 'clean';
  const workoutDoneToday = workoutEntries.some((entry) => entry.date === today);
  const weekDates = new Set<string>();
  for (let offset = 0; offset < 7; offset += 1) {
    weekDates.add(shiftDate(today, -offset));
  }
  const weeklyHistory = history.filter((entry) => weekDates.has(entry.date));
  const weeklyCompletions = completionLog.filter((entry) => weekDates.has(entry.date));
  const weeklyQuestTotal = weeklyHistory.reduce((sum, entry) => sum + entry.questsCompleted, 0);
  const weeklyXP = weeklyHistory.reduce((sum, entry) => sum + entry.xpEarned, 0);
  const weeklyActiveDays = weeklyHistory.length;
  const weeklyCompletionRate = Math.round((weeklyActiveDays / 7) * 100);
  const categoryCounts = weeklyCompletions.reduce<Partial<Record<QuestCompletionLogEntry['category'], number>>>(
    (acc, entry) => {
      acc[entry.category] = (acc[entry.category] ?? 0) + 1;
      return acc;
    },
    {}
  );
  const bestCategory =
    (Object.entries(categoryCounts).sort((first, second) => second[1] - first[1])[0]?.[0] as QuestCompletionLogEntry['category'] | undefined) ?? null;
  const derived = {
    punishmentQuests,
    mainQuests,
    bonusQuests,
    anchorQuestTitle: mainQuests.find((quest) => quest.isAnchor)?.title ?? null,
    pendingMainQuests,
    completedToday,
    noFapDoneToday,
    workoutDoneToday,
    todayFocus: derivedFocusLabel(profile.mainGoals),
    weeklyQuestTotal,
    weeklyXP,
    weeklyActiveDays,
    weeklyCompletionRate,
    bestCategory,
    mainCompleted: mainQuests.filter((quest) => quest.completed).length,
    nextQuestId: quests.find((quest) => !quest.completed && !quest.locked)?.id ?? null,
    noFapMarkedDates,
    workoutSummary,
    bossBattles: buildBossBattles(mensHealthState?.currentNoFapStreak ?? 0),
    rewardInventory,
    avatarEvolution,
    activeMilestones: getActiveMilestones(milestones),
    totalActiveBonus: topGoal?.bonusXP ?? bonusQuests.reduce((sum, quest) => sum + quest.xp, 0),
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.gold} />}>
        <StatusHeader profile={profile} progress={progress} rank={getRankForLevel(progress.level)} />

        <SectionLabel
          title="STREAK STATUS"
          counter={topGoal ? `${topGoal.progressPercent}% GOAL` : 'SYSTEM READY'}
        />
        <View style={styles.tiles}>
          <StatTile value={String(progress.streak)} label="QUEST STREAK" accent="red" />
          <StatTile
            value={String(mensHealthState?.currentNoFapStreak ?? 0)}
            label={`${disciplineCopy.primaryHabitActionLabel} STREAK`}
            accent="gold"
          />
        </View>

        <SectionLabel title="TODAY MODE" counter={derived.todayFocus} />
        <Panel style={styles.noticePanel}>
          <Text style={styles.noticeTitle}>
            {derived.pendingMainQuests === 0 ? 'TODAY CLEARED' : `${derived.pendingMainQuests} CORE QUEST${derived.pendingMainQuests > 1 ? 'S' : ''} LEFT`}
          </Text>
          <Text style={styles.noticeBody}>
            {derived.completedToday}/{derived.mainQuests.length} main quests done
            {' · '}
            {disciplineCopy.primaryHabitLabel} {derived.noFapDoneToday ? 'logged' : 'open'}
            {' · '}
            Workout {derived.workoutDoneToday ? 'logged' : 'pending'}
          </Text>
          <View style={styles.todayRow}>
            <MiniStatus label="QUESTS" value={`${derived.completedToday}/${derived.mainQuests.length}`} accent={derived.pendingMainQuests === 0} />
            <MiniStatus
              label={disciplineCopy.primaryHabitActionLabel}
              value={derived.noFapDoneToday ? 'DONE' : 'OPEN'}
              accent={derived.noFapDoneToday}
            />
            <MiniStatus label="WORKOUT" value={derived.workoutDoneToday ? 'DONE' : 'OPEN'} accent={derived.workoutDoneToday} />
          </View>
          <Text style={styles.noticeSub}>
            {derived.anchorQuestTitle
              ? `Anchor quest: ${derived.anchorQuestTitle}`
              : 'Daily quests are generated from your selected growth targets so the app keeps giving you a fresh board each day.'}
          </Text>
        </Panel>

        {derived.punishmentQuests.length > 0 ? (
          <>
            <SectionLabel title="PUNISHMENT QUESTS" counter="CLEAR THESE FIRST" />
            <View style={styles.questList}>
              {derived.punishmentQuests.map((quest) => (
                <QuestRow
                  key={`${quest.dateAssigned}-${quest.id}`}
                  quest={quest}
                  onPress={setSelectedQuest}
                  onComplete={handleCompleteQuest}
                  loading={completingQuestId === quest.id}
                  isNext={quest.id === derived.nextQuestId}
                />
              ))}
            </View>
          </>
        ) : null}

        <SectionLabel title="DAILY QUESTS" counter={`${derived.mainCompleted}/${derived.mainQuests.length} DONE`} />
        <View style={styles.questList}>
          {derived.mainQuests.map((quest) => (
            <QuestRow
              key={`${quest.dateAssigned}-${quest.id}`}
              quest={quest}
              onPress={setSelectedQuest}
              onComplete={handleCompleteQuest}
              loading={completingQuestId === quest.id}
              isNext={quest.id === derived.nextQuestId}
            />
          ))}
        </View>

        <SectionLabel title="COMMAND CENTER" counter="FAST ACTIONS" />
        <View style={styles.actionGrid}>
          <ActionCard
            label={adultContentAccess ? `🔥 ${disciplineCopy.primaryHabitActionLabel}` : '🛡 DISCIPLINE'}
            value={
              adultContentAccess &&
              mensHealthState?.lastNoFapCheckDate === today &&
              getTodayMensHealthLog(mensHealthLogs, today).noFapStatus === 'clean'
                ? 'DONE'
                : adultContentAccess
                  ? 'MARK CLEAN'
                  : 'OPEN'
            }
            detail={
              adultContentAccess
                ? `${mensHealthState?.currentNoFapStreak ?? 0} day streak`
                : 'Uses the simplified under-18 view'
            }
            onPress={adultContentAccess ? handleCompleteNoFap : () => router.push('/no-fap' as Href)}
            loading={completingNoFap}
          />
          <ActionCard
            label="🏋 WORKOUT"
            value={`${derived.workoutSummary.totalSessions}`}
            detail="Log or review sessions"
            onPress={() => router.push('/workout-progress' as Href)}
          />
          <ActionCard
            label="🎯 GOALS"
            value={topGoal ? `${topGoal.progressPercent}%` : 'SET'}
            detail={topGoal ? topGoal.title : 'Create a long-term target'}
            onPress={() => router.push('/goals' as Href)}
          />
          <ActionCard
            label="🏆 LOOT"
            value={`${progress.level}`}
            detail="Achievements and unlocks"
            onPress={() => router.push('/achievements' as Href)}
          />
        </View>

        <SectionLabel title="DISCIPLINE CALENDAR" counter="WIDGET VIEW" />
        <Panel style={styles.noticePanel}>
          <Text style={styles.noticeTitle}>UNIFIED CALENDAR</Text>
          <Text style={styles.noticeBody}>
            Your {disciplineCopy.primaryHabitLabel.toLowerCase()} streak stays visible in one shared calendar view.
          </Text>
          <AppCalendar markedDates={derived.noFapMarkedDates} current={today} hideArrows />
          <View style={styles.inlineActions}>
            <Pressable onPress={() => router.push('/habit-calendar' as Href)}>
              <Text style={styles.noticeLink}>OPEN CALENDAR</Text>
            </Pressable>
            <Pressable onPress={() => router.push('/settings' as Href)}>
              <Text style={styles.noticeLink}>REMINDER SETTINGS</Text>
            </Pressable>
          </View>
        </Panel>

        <SectionLabel title="WEEKLY REPORT" counter={`${derived.weeklyCompletionRate}% ACTIVE`} />
        <Panel style={styles.noticePanel}>
          <View style={styles.todayRow}>
            <MiniStatus label="ACTIVE DAYS" value={`${derived.weeklyActiveDays}/7`} accent={derived.weeklyActiveDays >= 4} />
            <MiniStatus label="QUESTS" value={String(derived.weeklyQuestTotal)} accent={derived.weeklyQuestTotal >= 12} />
            <MiniStatus label="XP" value={String(derived.weeklyXP)} accent={derived.weeklyXP >= 120} />
          </View>
          <Text style={styles.noticeBody}>
            Strongest category this week: {derived.bestCategory ? categoryLabels[derived.bestCategory] : 'Not enough data yet'}
          </Text>
          <Text style={styles.noticeSub}>
            Use this report to see whether your growth system is actually moving, not just collecting checkmarks.
          </Text>
        </Panel>

        <SectionLabel title="BOSS BATTLES" counter={`${mensHealthState?.currentNoFapStreak ?? 0} DAY RUN`} />
        <Panel style={styles.noticePanel}>
          {derived.bossBattles.map((battle) => (
            <View key={battle.id} style={styles.rewardRow}>
              <View style={styles.rewardCopy}>
                <Text style={styles.noticeBody}>
                  {battle.label} · {battle.progress}/{battle.target}
                </Text>
                <Text style={styles.noticeSub}>{battle.defeated ? battle.reward : `Reward: ${battle.reward}`}</Text>
              </View>
              <Text style={[styles.badgeText, battle.defeated ? styles.badgeUnlocked : null]}>
                {battle.defeated ? 'DEFEATED' : 'ACTIVE'}
              </Text>
            </View>
          ))}
        </Panel>

        <SectionLabel title="INVENTORY + AVATAR" counter="UNLOCKS" />
        <Panel style={styles.noticePanel}>
          <Text style={styles.noticeTitle}>{derived.avatarEvolution.title}</Text>
          <Text style={styles.noticeBody}>{derived.avatarEvolution.summary}</Text>
          {derived.rewardInventory.map((item) => (
            <View key={item.id} style={styles.rewardRow}>
              <View style={styles.rewardCopy}>
                <Text style={styles.noticeBody}>{item.label}</Text>
                <Text style={styles.noticeSub}>{item.requirement}</Text>
              </View>
              <Text style={[styles.badgeText, item.unlocked ? styles.badgeUnlocked : null]}>
                {item.unlocked ? 'UNLOCKED' : 'LOCKED'}
              </Text>
            </View>
          ))}
        </Panel>

        {profile.usesMinoxidil ? (
          <Panel style={styles.noticePanel}>
            <Text style={styles.noticeTitle}>HAIR CARE TRACKER</Text>
            <Text style={styles.noticeBody}>
              {getCurrentFullDoseStreak(hairLog)} day full-dose streak · open the tracker to log morning and night doses.
            </Text>
            <Pressable onPress={() => router.push('/haircare' as Href)}>
              <Text style={styles.noticeLink}>OPEN TRACKER</Text>
            </Pressable>
          </Panel>
        ) : null}

        <SectionLabel title="BONUS QUESTS" counter={customQuestCount > 0 ? `${customQuestCount} CUSTOM` : undefined} />
        <View style={styles.bonusStrip}>
          {derived.bonusQuests.slice(0, 2).map((quest) => (
            <Pressable
              key={`${quest.dateAssigned}-${quest.id}`}
              style={styles.bonusItem}
              onPress={() => setSelectedQuest(quest)}>
              <BonusCard title={quest.title} xp={quest.xp} />
            </Pressable>
          ))}
          {derived.bonusQuests.length === 1 ? (
            <Pressable style={styles.bonusItem} onPress={() => router.push('/goals' as Href)}>
              <BonusCard title={topGoal ? topGoal.title : 'Active Goal Bonus'} xp={derived.totalActiveBonus} />
            </Pressable>
          ) : null}
        </View>

        <Panel style={styles.linksPanel}>
          <Pressable style={styles.linkRow} onPress={() => router.push('/history' as Href)}>
            <Text style={styles.linkLabel}>ARCHIVE</Text>
            <Text style={styles.linkValue}>History and analytics</Text>
          </Pressable>
          <Pressable style={styles.linkRow} onPress={() => router.push('/achievements' as Href)}>
            <Text style={styles.linkLabel}>REWARDS</Text>
            <Text style={styles.linkValue}>Achievements and unlocks</Text>
          </Pressable>
          <Pressable style={styles.linkRow} onPress={() => router.push('/goals' as Href)}>
            <Text style={styles.linkLabel}>MISSION</Text>
            <Text style={styles.linkValue}>{topGoal ? topGoal.title : 'Set your next long-term goal'}</Text>
          </Pressable>
          <Pressable style={styles.linkRow} onPress={() => router.push('/milestones' as Href)}>
            <Text style={styles.linkLabel}>MILESTONES</Text>
            <Text style={styles.linkValue}>
              {derived.activeMilestones[0]?.title ?? 'Build your weekly and monthly boss battles'}
            </Text>
          </Pressable>
          <Pressable style={styles.linkRow} onPress={() => router.push('/weekly-review' as Href)}>
            <Text style={styles.linkLabel}>REVIEW</Text>
            <Text style={styles.linkValue}>Weekly reviews and lessons</Text>
          </Pressable>
        </Panel>
      </ScrollView>

      <LevelUpModal
        visible={showLevelUpModal}
        summary={levelUpSummary}
        onDismiss={() => setShowLevelUpModal(false)}
      />
      <QuestDetailModal
        visible={selectedQuest !== null}
        quest={selectedQuest}
        onClose={() => setSelectedQuest(null)}
      />
      <AchievementUnlockModal
        visible={showAchievementModal}
        achievements={achievementUnlocks}
        onClose={() => setShowAchievementModal(false)}
      />
      <GoalCompletionModal
        visible={showGoalModal}
        completedGoals={completedGoals}
        onClose={() => setShowGoalModal(false)}
      />
    </SafeAreaView>
  );
}

function derivedFocusLabel(mainGoals: PlayerProfile['mainGoals']) {
  const goals = mainGoals.filter((goal) => goal !== 'all-rounder');
  if (goals.length === 0) {
    return 'BALANCED SYSTEM';
  }

  return goals
    .slice(0, 2)
    .map((goal) => goal.replace(/-/g, ' ').toUpperCase())
    .join(' + ');
}

function MiniStatus({
  label,
  value,
  accent = false,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <View style={[styles.miniStatus, accent ? styles.miniStatusAccent : null]}>
      <Text style={styles.miniStatusLabel}>{label}</Text>
      <Text style={styles.miniStatusValue}>{value}</Text>
    </View>
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
    <Pressable style={styles.actionCard} onPress={onPress}>
      <Text style={styles.actionLabel}>{label}</Text>
      <Text style={styles.actionValue}>{loading ? '...' : value}</Text>
      <Text style={styles.actionDetail}>{detail}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.ink,
  },
  scroll: {
    flex: 1,
    backgroundColor: colors.ink,
  },
  content: {
    paddingBottom: spacing.xxl,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
  tiles: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
    backgroundColor: colors.ink,
  },
  actionCard: {
    width: '48.5%',
    backgroundColor: colors.screentone,
    borderWidth: 3,
    borderColor: colors.inkSoft,
    padding: spacing.md,
    gap: spacing.xs,
  },
  actionLabel: {
    color: colors.gold,
    fontFamily: fontFamily.mono,
    fontSize: typeScale.xs,
    letterSpacing: 1,
  },
  actionValue: {
    color: colors.parchment,
    fontFamily: fontFamily.display,
    fontSize: typeScale.lg,
  },
  actionDetail: {
    color: colors.parchmentDim,
    fontFamily: fontFamily.serif,
    fontSize: typeScale.sm,
    lineHeight: 16,
  },
  noticePanel: {
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  noticeTitle: {
    color: colors.parchment,
    fontFamily: fontFamily.display,
    fontSize: typeScale.md,
    letterSpacing: 1.2,
  },
  noticeBody: {
    color: colors.parchmentDim,
    fontFamily: fontFamily.serif,
    fontSize: typeScale.sm,
    lineHeight: 18,
  },
  noticeLink: {
    color: colors.gold,
    fontFamily: fontFamily.mono,
    fontSize: typeScale.sm,
  },
  noticeSub: {
    color: colors.parchmentDim,
    fontFamily: fontFamily.mono,
    fontSize: typeScale.xs,
    lineHeight: 16,
  },
  inlineActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  rewardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.md,
    alignItems: 'center',
  },
  todayRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  miniStatus: {
    flex: 1,
    backgroundColor: colors.screentone,
    borderWidth: 2,
    borderColor: colors.inkSoft,
    padding: spacing.sm,
    gap: 2,
  },
  miniStatusAccent: {
    borderColor: colors.gold,
  },
  miniStatusLabel: {
    color: colors.parchmentDim,
    fontFamily: fontFamily.mono,
    fontSize: typeScale.xs,
    letterSpacing: 0.8,
  },
  miniStatusValue: {
    color: colors.parchment,
    fontFamily: fontFamily.display,
    fontSize: typeScale.md,
  },
  rewardCopy: {
    flex: 1,
    gap: 2,
  },
  badgeText: {
    color: colors.parchmentDim,
    fontFamily: fontFamily.monoBold,
    fontSize: typeScale.xs,
  },
  badgeUnlocked: {
    color: colors.gold,
  },
  questList: {
    gap: 6,
    marginBottom: spacing.sm,
  },
  bonusStrip: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: spacing.sm,
  },
  bonusItem: {
    flex: 1,
  },
  linksPanel: {
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  linkRow: {
    gap: 2,
  },
  linkLabel: {
    color: colors.parchmentDim,
    fontFamily: fontFamily.mono,
    fontSize: typeScale.xs,
    letterSpacing: 1,
  },
  linkValue: {
    color: colors.parchment,
    fontFamily: fontFamily.serifSemiBold,
    fontSize: typeScale.md,
  },
});
