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
import { getDisciplineCopy } from '../lib/utils/profile';

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
  const profileInitial = profile.name.trim().charAt(0).toUpperCase() || 'P';
  const disciplineCopy = getDisciplineCopy(profile.gender);

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
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarLetter}>{profileInitial}</Text>
        </View>
        <Text style={styles.title}>{profile.name}</Text>
        <RankBadge rank={getRankForLevel(progress.level)} />
        <Text style={styles.body}>Level {progress.level} • {progress.totalXP} total XP</Text>
        <Text style={styles.body}>Gender: {profile.gender[0].toUpperCase() + profile.gender.slice(1)}</Text>
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

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Growth Tools</Text>
        <View style={styles.list}>
          <Pressable style={styles.recentCard} onPress={() => router.push('/weekly-review' as Href)}>
            <Text style={styles.recentTitle}>Weekly Review</Text>
            <Text style={styles.recentDate}>Wins, misses, lessons, and next-week focus.</Text>
          </Pressable>
          <Pressable style={styles.recentCard} onPress={() => router.push('/habit-calendar' as Href)}>
            <Text style={styles.recentTitle}>Habit Calendar</Text>
            <Text style={styles.recentDate}>Month view for consistency and streak patterns.</Text>
          </Pressable>
          <Pressable style={styles.recentCard} onPress={() => router.push('/milestones' as Href)}>
            <Text style={styles.recentTitle}>Milestones / Vision</Text>
            <Text style={styles.recentDate}>30-day, 90-day, and 1-year direction.</Text>
          </Pressable>
          <Pressable style={styles.recentCard} onPress={() => router.push('/insights' as Href)}>
            <Text style={styles.recentTitle}>Category Insights</Text>
            <Text style={styles.recentDate}>Balance radar, recovery system, and smart quest suggestions.</Text>
          </Pressable>
          <Pressable style={styles.recentCard} onPress={() => router.push('/settings' as Href)}>
            <Text style={styles.recentTitle}>Settings / Backup</Text>
            <Text style={styles.recentDate}>Export and import your app data.</Text>
          </Pressable>
          <Pressable style={styles.recentCard} onPress={() => router.push('/no-fap' as Href)}>
            <Text style={styles.recentTitle}>{disciplineCopy.trackerShortcutTitle}</Text>
            <Text style={styles.recentDate}>{disciplineCopy.trackerShortcutDescription}</Text>
          </Pressable>
          <Pressable style={styles.recentCard} onPress={() => router.push('/dopamine-control' as Href)}>
            <Text style={styles.recentTitle}>Dopamine Control</Text>
            <Text style={styles.recentDate}>Track social media, short videos, gaming, junk food, and urges.</Text>
          </Pressable>
          <Pressable style={styles.recentCard} onPress={() => router.push('/sleep-recovery' as Href)}>
            <Text style={styles.recentTitle}>Sleep Recovery</Text>
            <Text style={styles.recentDate}>Monitor sleep hours, quality, caffeine timing, and recovery debt.</Text>
          </Pressable>
          <Pressable style={styles.recentCard} onPress={() => router.push('/workout-progress' as Href)}>
            <Text style={styles.recentTitle}>Workout Progress</Text>
            <Text style={styles.recentDate}>Track sessions, strength stats, and body or gym images.</Text>
          </Pressable>
        </View>
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
  avatarCircle: {
    width: 64,
    height: 64,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.surfaceAlt,
    borderWidth: 1,
    borderColor: theme.colors.accent,
  },
  avatarLetter: {
    color: theme.colors.accent,
    fontSize: 28,
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
