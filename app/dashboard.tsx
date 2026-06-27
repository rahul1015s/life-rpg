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
import { type Href, useFocusEffect, useRouter } from 'expo-router';

import { QuestCard } from '../components/QuestCard';
import { QuestDetailModal } from '../components/QuestDetailModal';
import { AchievementUnlockModal } from '../components/AchievementUnlockModal';
import { GoalCompletionModal } from '../components/GoalCompletionModal';
import { RankBadge } from '../components/RankBadge';
import { StatCard } from '../components/StatCard';
import { XPBar } from '../components/XPBar';
import { LevelUpModal } from '../components/LevelUpModal';
import { statMeta, statOrder, theme } from '../constants/theme';
import { getTopActiveGoal } from '../lib/goalsEngine';
import { getCurrentFullDoseStreak } from '../lib/haircareEngine';
import { getNextLevelXP, getRankForLevel } from '../lib/levelSystem';
import { completeDailyQuest, ensureDailyQuests } from '../lib/questEngine';
import { getAchievements, getCustomQuests, getGoals, getHairLog, getProfile, getProgress } from '../lib/storage';
import type {
  AchievementUnlockResult,
  DailyQuest,
  GoalRewardResult,
  HairLogEntry,
  LevelUpSummary,
  PersonalGoal,
  PlayerProfile,
  PlayerProgress,
} from '../lib/types';

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
  const [achievementCount, setAchievementCount] = useState(0);
  const [topGoal, setTopGoal] = useState<PersonalGoal | null>(null);
  const [customQuestCount, setCustomQuestCount] = useState(0);
  const [completedGoals, setCompletedGoals] = useState<GoalRewardResult[]>([]);
  const [showGoalModal, setShowGoalModal] = useState(false);

  const loadDashboard = useCallback(async () => {
    const savedProfile = await getProfile();
    if (!savedProfile) {
      router.replace('/onboarding' as Href);
      return;
    }

    const [savedProgress, nextQuests, savedHairLog, achievements, goals, customQuests] = await Promise.all([
      getProgress(),
      ensureDailyQuests(savedProfile),
      getHairLog(),
      getAchievements(),
      getGoals(),
      getCustomQuests(),
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
        <ActivityIndicator size="large" color={theme.colors.accent} />
      </View>
    );
  }

  const mainQuests = quests.filter((quest) => !quest.isBonus);
  const bonusQuests = quests.filter((quest) => quest.isBonus);

  return (
    <>
      <ScrollView
        style={styles.screen}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}>
        <View style={styles.heroCard}>
          <Text style={styles.kicker}>ACTIVE PROFILE</Text>
          <Text style={styles.playerName}>{profile.name}</Text>
          <RankBadge rank={getRankForLevel(progress.level)} />
          <Text style={styles.levelText}>Level {progress.level}</Text>
          <XPBar currentXP={progress.xp} nextLevelXP={getNextLevelXP(progress.level)} />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Current Streak</Text>
          <View style={styles.streakCard}>
            <Text style={styles.streakValue}>{progress.streak} days</Text>
            <Text style={styles.streakMeta}>Longest streak: {progress.longestStreak} days</Text>
          </View>
        </View>

        <Pressable style={styles.historyCard} onPress={() => router.push('/history' as Href)}>
          <Text style={styles.sectionTitle}>History & Analytics</Text>
          <Text style={styles.historyValue}>Review date-wise progress, monthly totals, and long-term streaks</Text>
          <Text style={styles.historyMeta}>Open archive</Text>
        </Pressable>

        <View style={styles.quickGrid}>
          <Pressable style={styles.quickCard} onPress={() => router.push('/achievements' as Href)}>
            <Text style={styles.quickTitle}>Achievements</Text>
            <Text style={styles.quickValue}>{achievementCount} unlocked</Text>
          </Pressable>
          <Pressable style={styles.quickCard} onPress={() => router.push('/profile' as Href)}>
            <Text style={styles.quickTitle}>Profile</Text>
            <Text style={styles.quickValue}>{getRankForLevel(progress.level)}</Text>
          </Pressable>
        </View>

        <View style={styles.quickGrid}>
          <Pressable style={styles.quickCard} onPress={() => router.push('/goals' as Href)}>
            <Text style={styles.quickTitle}>Goals</Text>
            <Text style={styles.quickValue}>{topGoal ? `${topGoal.progressPercent}% active` : 'No active goal'}</Text>
          </Pressable>
          <Pressable style={styles.quickCard} onPress={() => router.push('/custom-quests' as Href)}>
            <Text style={styles.quickTitle}>Custom Quests</Text>
            <Text style={styles.quickValue}>{customQuestCount} created</Text>
          </Pressable>
        </View>

        {topGoal ? (
          <Pressable style={styles.goalCard} onPress={() => router.push('/goals' as Href)}>
            <Text style={styles.sectionTitle}>Top Active Goal</Text>
            <Text style={styles.goalTitle}>{topGoal.title}</Text>
            <Text style={styles.goalMeta}>
              {topGoal.category} • target {topGoal.targetDate}
            </Text>
            <View style={styles.goalTrack}>
              <View style={[styles.goalFill, { width: `${topGoal.progressPercent}%` }]} />
            </View>
            <Text style={styles.goalMeta}>{topGoal.progressPercent}% complete</Text>
          </Pressable>
        ) : null}

        {profile.usesMinoxidil ? (
          <Pressable style={styles.hairCard} onPress={() => router.push('/haircare' as Href)}>
            <Text style={styles.sectionTitle}>Hair Care</Text>
            <Text style={styles.hairValue}>{getCurrentFullDoseStreak(hairLog)} day full-dose streak</Text>
            <Text style={styles.hairMeta}>Open tracker</Text>
          </Pressable>
        ) : null}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Stats</Text>
          <View style={styles.statGrid}>
            {statOrder.map((statKey) => (
              <StatCard
                key={statKey}
                icon={statMeta[statKey].icon}
                label={statMeta[statKey].label}
                value={progress.stats[statKey]}
              />
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Today's Quests</Text>
          <View style={styles.questList}>
            {mainQuests.map((quest) => (
              <QuestCard
                key={`${quest.dateAssigned}-${quest.id}`}
                quest={quest}
                onComplete={handleCompleteQuest}
                onOpenDetails={setSelectedQuest}
                loading={completingQuestId === quest.id}
              />
            ))}
          </View>
        </View>

        {bonusQuests.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Bonus Quests</Text>
            <Text style={styles.sectionBody}>
              Optional extra XP. Helpful if you have energy left, but not required for the core day.
            </Text>
            <View style={styles.questList}>
              {bonusQuests.map((quest) => (
                <QuestCard
                  key={`${quest.dateAssigned}-${quest.id}`}
                  quest={quest}
                  onComplete={handleCompleteQuest}
                  onOpenDetails={setSelectedQuest}
                  loading={completingQuestId === quest.id}
                />
              ))}
            </View>
          </View>
        ) : null}
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
    </>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    padding: theme.spacing.lg,
    gap: theme.spacing.lg,
    paddingBottom: theme.spacing.xl * 2,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
  heroCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.lg,
    gap: theme.spacing.sm,
  },
  kicker: {
    color: theme.colors.accentGlow,
    fontSize: theme.font.sm,
    fontWeight: '800',
    letterSpacing: 1,
  },
  playerName: {
    color: theme.colors.textPrimary,
    fontSize: theme.font.xl,
    fontWeight: '900',
  },
  levelText: {
    color: theme.colors.textMuted,
    fontSize: theme.font.md,
    fontWeight: '700',
  },
  section: {
    gap: theme.spacing.md,
  },
  sectionTitle: {
    color: theme.colors.textPrimary,
    fontSize: theme.font.lg,
    fontWeight: '800',
  },
  sectionBody: {
    color: theme.colors.textMuted,
    fontSize: theme.font.sm,
    lineHeight: 18,
  },
  streakCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.md,
    gap: theme.spacing.xs,
  },
  streakValue: {
    color: theme.colors.accent,
    fontSize: theme.font.xl,
    fontWeight: '900',
  },
  streakMeta: {
    color: theme.colors.textMuted,
    fontSize: theme.font.sm,
    fontWeight: '600',
  },
  hairCard: {
    backgroundColor: theme.colors.surfaceAlt,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.primary,
    padding: theme.spacing.md,
    gap: theme.spacing.xs,
  },
  hairValue: {
    color: theme.colors.textPrimary,
    fontSize: theme.font.md,
    fontWeight: '800',
  },
  hairMeta: {
    color: theme.colors.textMuted,
    fontSize: theme.font.sm,
  },
  historyCard: {
    backgroundColor: theme.colors.surfaceAlt,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.accent,
    padding: theme.spacing.md,
    gap: theme.spacing.xs,
  },
  historyValue: {
    color: theme.colors.textPrimary,
    fontSize: theme.font.md,
    fontWeight: '800',
  },
  historyMeta: {
    color: theme.colors.textMuted,
    fontSize: theme.font.sm,
  },
  quickGrid: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  quickCard: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.md,
    gap: theme.spacing.xs,
  },
  quickTitle: {
    color: theme.colors.textMuted,
    fontSize: theme.font.sm,
  },
  quickValue: {
    color: theme.colors.textPrimary,
    fontSize: theme.font.md,
    fontWeight: '800',
  },
  goalCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.accent,
    padding: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  goalTitle: {
    color: theme.colors.textPrimary,
    fontSize: theme.font.md,
    fontWeight: '800',
  },
  goalMeta: {
    color: theme.colors.textMuted,
    fontSize: theme.font.sm,
  },
  goalTrack: {
    height: 12,
    borderRadius: 999,
    backgroundColor: theme.colors.surfaceAlt,
    overflow: 'hidden',
  },
  goalFill: {
    height: '100%',
    backgroundColor: theme.colors.accent,
  },
  statGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.md,
  },
  questList: {
    gap: theme.spacing.md,
  },
});
