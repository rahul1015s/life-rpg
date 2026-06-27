import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { type Href, useFocusEffect, useRouter } from 'expo-router';

import { RankBadge } from '../components/RankBadge';
import { achievementCatalog } from '../constants/achievements';
import { theme } from '../constants/theme';
import { getRankForLevel } from '../lib/levelSystem';
import { getRecentUnlockedAchievements } from '../lib/achievementEngine';
import { getTopActiveGoal } from '../lib/goalsEngine';
import { getAchievements, getCustomQuests, getGoals, getProfile, getProgress } from '../lib/storage';
import type { AchievementUnlock, CustomQuest, PersonalGoal, PlayerProfile, PlayerProgress } from '../lib/types';

export default function ProfileScreen() {
  const router = useRouter();
  const [profile, setProfile] = useState<PlayerProfile | null>(null);
  const [progress, setProgress] = useState<PlayerProgress | null>(null);
  const [unlocked, setUnlocked] = useState<AchievementUnlock[]>([]);
  const [goals, setGoals] = useState<PersonalGoal[]>([]);
  const [customQuests, setCustomQuests] = useState<CustomQuest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const savedProfile = await getProfile();
    if (!savedProfile) {
      router.replace('/onboarding' as Href);
      return;
    }

    const [savedProgress, achievements, savedGoals, savedCustomQuests] = await Promise.all([
      getProgress(),
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
    setUnlocked(achievements);
    setGoals(savedGoals);
    setCustomQuests(savedCustomQuests);
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

  if (loading || !profile || !progress) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={theme.colors.accent} />
      </View>
    );
  }

  const recent = getRecentUnlockedAchievements(unlocked, 4);
  const achievementMap = new Map(achievementCatalog.map((item) => [item.id, item]));
  const topGoal = getTopActiveGoal(goals);
  const completedGoalsCount = goals.filter((goal) => goal.status === 'completed').length;

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}>
      <Pressable onPress={() => router.back()}>
        <Text style={styles.backLink}>Back to dashboard</Text>
      </Pressable>

      <View style={styles.heroCard}>
        <Text style={styles.kicker}>PROFILE</Text>
        <Text style={styles.title}>{profile.name}</Text>
        <RankBadge rank={getRankForLevel(progress.level)} />
        <Text style={styles.body}>Level {progress.level} • {progress.totalXP} total XP</Text>
      </View>

      <View style={styles.metricCard}>
        <Text style={styles.metricTitle}>Total Unlocked Achievements</Text>
        <Text style={styles.metricValue}>{unlocked.length}</Text>
      </View>

      <View style={styles.metricsGrid}>
        <View style={styles.metricCard}>
          <Text style={styles.metricTitle}>Active Goals</Text>
          <Text style={styles.metricValue}>{goals.filter((goal) => goal.status === 'active').length}</Text>
        </View>
        <View style={styles.metricCard}>
          <Text style={styles.metricTitle}>Completed Goals</Text>
          <Text style={styles.metricValue}>{completedGoalsCount}</Text>
        </View>
      </View>

      <View style={styles.metricCard}>
        <Text style={styles.metricTitle}>Custom Quests</Text>
        <Text style={styles.metricValue}>{customQuests.length}</Text>
      </View>

      {topGoal ? (
        <View style={styles.metricCard}>
          <Text style={styles.metricTitle}>Top Active Goal</Text>
          <Text style={styles.recentTitle}>{topGoal.title}</Text>
          <Text style={styles.recentDate}>{topGoal.progressPercent}% complete • {topGoal.targetDate}</Text>
        </View>
      ) : null}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Unlocks</Text>
        {recent.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No achievements unlocked yet.</Text>
          </View>
        ) : (
          <View style={styles.list}>
            {recent.map((entry) => (
              <View key={`${entry.id}-${entry.unlockedAt}`} style={styles.recentCard}>
                <Text style={styles.recentTitle}>
                  {achievementMap.get(entry.id)?.icon} {achievementMap.get(entry.id)?.title ?? entry.id}
                </Text>
                <Text style={styles.recentDate}>{entry.unlockedAt.slice(0, 10)}</Text>
              </View>
            ))}
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.colors.background },
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
  backLink: {
    color: theme.colors.accentGlow,
    fontSize: theme.font.sm,
    fontWeight: '700',
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
  title: {
    color: theme.colors.textPrimary,
    fontSize: theme.font.xl,
    fontWeight: '900',
  },
  body: {
    color: theme.colors.textMuted,
    fontSize: theme.font.md,
  },
  metricCard: {
    backgroundColor: theme.colors.surfaceAlt,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.accent,
    padding: theme.spacing.md,
    gap: theme.spacing.xs,
  },
  metricsGrid: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  metricTitle: {
    color: theme.colors.textMuted,
    fontSize: theme.font.sm,
  },
  metricValue: {
    color: theme.colors.textPrimary,
    fontSize: theme.font.xl,
    fontWeight: '900',
  },
  section: {
    gap: theme.spacing.md,
  },
  sectionTitle: {
    color: theme.colors.textPrimary,
    fontSize: theme.font.lg,
    fontWeight: '800',
  },
  list: {
    gap: theme.spacing.md,
  },
  recentCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.md,
    gap: theme.spacing.xs,
  },
  recentTitle: {
    color: theme.colors.textPrimary,
    fontSize: theme.font.md,
    fontWeight: '700',
  },
  recentDate: {
    color: theme.colors.textMuted,
    fontSize: theme.font.sm,
  },
  emptyState: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.md,
  },
  emptyText: {
    color: theme.colors.textMuted,
    fontSize: theme.font.sm,
  },
});
