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
import { SafeAreaView } from 'react-native-safe-area-context';
import { type Href, useFocusEffect, useRouter } from 'expo-router';

import { AchievementUnlockModal } from '../components/AchievementUnlockModal';
import { GoalCompletionModal } from '../components/GoalCompletionModal';
import { LevelUpModal } from '../components/LevelUpModal';
import { QuestDetailModal } from '../components/QuestDetailModal';
import { BonusCard } from '../components/ui/BonusCard';
import { BottomNav } from '../components/ui/BottomNav';
import { Panel } from '../components/ui/Panel';
import { QuestRow } from '../components/ui/QuestRow';
import { SectionLabel } from '../components/ui/SectionLabel';
import { StatTile } from '../components/ui/StatTile';
import { StatusHeader } from '../components/ui/StatusHeader';
import { theme } from '../constants/theme';
import { buildRecoverySuggestions, buildSmartQuestSuggestions } from '../lib/growthEngine';
import { getTopActiveGoal } from '../lib/goalsEngine';
import { getCurrentFullDoseStreak } from '../lib/haircareEngine';
import { getRankForLevel } from '../lib/levelSystem';
import { completeDailyQuest, ensureDailyQuests } from '../lib/questEngine';
import { getAchievements, getCompletionLog, getCustomQuests, getGoals, getHairLog, getHistory, getProfile, getProgress } from '../lib/storage';
import type {
  AchievementUnlockResult,
  DailyQuest,
  GoalRewardResult,
  HairLogEntry,
  LevelUpSummary,
  PersonalGoal,
  PlayerProfile,
  PlayerProgress,
  RecoveryQuestSuggestion,
  SmartQuestSuggestion,
} from '../lib/types';
import { colors, spacing } from '../theme/tokens';
import { fontFamily, typeScale } from '../theme/typography';

export default function DashboardScreen() {
  const router = useRouter();
  const [profile, setProfile] = useState<PlayerProfile | null>(null);
  const [progress, setProgress] = useState<PlayerProgress | null>(null);
  const [quests, setQuests] = useState<DailyQuest[]>([]);
  const [hairLog, setHairLogState] = useState<HairLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [completingQuestId, setCompletingQuestId] = useState<string | null>(null);
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
  const [recoverySuggestions, setRecoverySuggestions] = useState<RecoveryQuestSuggestion[]>([]);
  const [smartSuggestions, setSmartSuggestions] = useState<SmartQuestSuggestion[]>([]);

  const loadDashboard = useCallback(async () => {
    const savedProfile = await getProfile();
    if (!savedProfile) {
      router.replace('/onboarding' as Href);
      return;
    }

    const [savedProgress, nextQuests, savedHairLog, achievements, goals, customQuests, history, completionLog] = await Promise.all([
      getProgress(),
      ensureDailyQuests(savedProfile),
      getHairLog(),
      getAchievements(),
      getGoals(),
      getCustomQuests(),
      getHistory(),
      getCompletionLog(),
    ]);

    if (!savedProgress) {
      router.replace('/onboarding' as Href);
      return;
    }

    setProfile(savedProfile);
    setProgress(savedProgress);
    setQuests(nextQuests);
    setHairLogState(savedHairLog);
    setAchievementCount(achievements.length);
    setTopGoal(getTopActiveGoal(goals));
    setCustomQuestCount(customQuests.length);
    setRecoverySuggestions(buildRecoverySuggestions(history));
    setSmartSuggestions(buildSmartQuestSuggestions(savedProgress, completionLog));
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
      setTopGoal(getTopActiveGoal(refreshedGoals));
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
      const [history, completionLog] = await Promise.all([getHistory(), getCompletionLog()]);
      setRecoverySuggestions(buildRecoverySuggestions(history));
      setSmartSuggestions(buildSmartQuestSuggestions(result.progress, completionLog));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to complete quest.';
      Alert.alert('Quest update failed', message);
    } finally {
      setCompletingQuestId(null);
    }
  }

  if (loading || !profile || !progress) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.gold} />
      </View>
    );
  }

  const mainQuests = quests.filter((quest) => !quest.isBonus);
  const bonusQuests = quests.filter((quest) => quest.isBonus);
  const mainCompleted = mainQuests.filter((quest) => quest.completed).length;
  const nextQuestId = mainQuests.find((quest) => !quest.completed)?.id ?? null;
  const currentStreak = `${progress.streak}`;
  const bestStreak = `${progress.longestStreak}`;
  const totalActiveBonus = topGoal?.bonusXP ?? bonusQuests.reduce((sum, quest) => sum + quest.xp, 0);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <View style={styles.phone}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.gold} />}>
          <StatusHeader profile={profile} progress={progress} rank={getRankForLevel(progress.level)} />

          <SectionLabel title="STREAK STATUS" counter={topGoal ? `${topGoal.progressPercent}% GOAL` : 'SYSTEM READY'} />
          <View style={styles.tiles}>
            <StatTile value={currentStreak} label="CURRENT STREAK" accent="red" />
            <StatTile value={bestStreak} label="BEST STREAK" accent="gold" />
          </View>

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

          <SectionLabel title="DAILY QUESTS" counter={`${mainCompleted}/${mainQuests.length} DONE`} />
          <View style={styles.questList}>
            {mainQuests.map((quest) => (
              <QuestRow
                key={`${quest.dateAssigned}-${quest.id}`}
                quest={quest}
                onPress={setSelectedQuest}
                onComplete={handleCompleteQuest}
                loading={completingQuestId === quest.id}
                isNext={quest.id === nextQuestId}
              />
            ))}
          </View>

          <SectionLabel title="BONUS QUESTS" counter={customQuestCount > 0 ? `${customQuestCount} CUSTOM` : undefined} />
          <View style={styles.bonusStrip}>
            {bonusQuests.slice(0, 2).map((quest) => (
              <Pressable key={`${quest.dateAssigned}-${quest.id}`} style={styles.bonusItem} onPress={() => setSelectedQuest(quest)}>
                <BonusCard title={quest.title} xp={quest.xp} />
              </Pressable>
            ))}
            {bonusQuests.length === 1 ? (
              <Pressable style={styles.bonusItem} onPress={() => router.push('/goals' as Href)}>
                <BonusCard title={topGoal ? topGoal.title : 'Active Goal Bonus'} xp={totalActiveBonus} />
              </Pressable>
            ) : null}
          </View>

          {recoverySuggestions.length > 0 ? (
            <Panel style={styles.noticePanel}>
              <Text style={styles.noticeTitle}>RECOVERY SYSTEM</Text>
              {recoverySuggestions.slice(0, 2).map((item) => (
                <View key={item.id} style={styles.recoveryItem}>
                  <Text style={styles.noticeBody}>{item.title}</Text>
                  <Text style={styles.noticeSub}>{item.reason}</Text>
                </View>
              ))}
              <Pressable onPress={() => router.push('/insights' as Href)}>
                <Text style={styles.noticeLink}>OPEN INSIGHTS</Text>
              </Pressable>
            </Panel>
          ) : null}

          {smartSuggestions.length > 0 ? (
            <Panel style={styles.noticePanel}>
              <Text style={styles.noticeTitle}>SMART QUEST SUGGESTIONS</Text>
              {smartSuggestions.slice(0, 3).map((item) => (
                <View key={item.questId} style={styles.recoveryItem}>
                  <Text style={styles.noticeBody}>
                    {item.title} · {item.xp} XP
                  </Text>
                  <Text style={styles.noticeSub}>{item.reason}</Text>
                </View>
              ))}
            </Panel>
          ) : null}

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
            <Pressable style={styles.linkRow} onPress={() => router.push('/weekly-review' as Href)}>
              <Text style={styles.linkLabel}>REVIEW</Text>
              <Text style={styles.linkValue}>Weekly reviews and lessons</Text>
            </Pressable>
            <Pressable style={styles.linkRow} onPress={() => router.push('/focus-mode' as Href)}>
              <Text style={styles.linkLabel}>FOCUS</Text>
              <Text style={styles.linkValue}>Timed deep-work sessions</Text>
            </Pressable>
            <Pressable style={styles.linkRow} onPress={() => router.push('/insights' as Href)}>
              <Text style={styles.linkLabel}>INSIGHTS</Text>
              <Text style={styles.linkValue}>Recovery, balance, and suggestions</Text>
            </Pressable>
          </Panel>
        </ScrollView>

        <BottomNav />
      </View>

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

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#1c1a17',
  },
  phone: {
    flex: 1,
    backgroundColor: colors.ink,
  },
  scroll: {
    flex: 1,
    backgroundColor: colors.ink,
  },
  content: {
    paddingBottom: spacing.sm,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
  tiles: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 6,
  },
  noticePanel: {
    marginBottom: 6,
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
  recoveryItem: {
    gap: 2,
  },
  questList: {
    gap: 6,
    marginBottom: 6,
  },
  bonusStrip: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 6,
  },
  bonusItem: {
    flex: 1,
  },
  linksPanel: {
    gap: spacing.md,
    marginBottom: 6,
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
