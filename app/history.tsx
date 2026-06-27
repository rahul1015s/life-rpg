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

import { HairLogEntry } from '../components/HairLogEntry';
import { HistoryDayCard } from '../components/HistoryDayCard';
import { MetricCard } from '../components/MetricCard';
import { theme } from '../constants/theme';
import {
  buildDailyHistoryGroups,
  buildMonthlySummary,
  buildXPTrackingSummary,
  getHairLogTimeline,
} from '../lib/analytics';
import { getCompletionLog, getHairLog, getHistory, getProfile, getProgress } from '../lib/storage';
import type {
  DailyHistoryGroup,
  HairLogEntry as HairLogEntryType,
  MonthlySummary,
  PlayerProfile,
  PlayerProgress,
  XPTrackingSummary,
} from '../lib/types';

export default function HistoryScreen() {
  const router = useRouter();
  const [profile, setProfile] = useState<PlayerProfile | null>(null);
  const [progress, setProgress] = useState<PlayerProgress | null>(null);
  const [historyGroups, setHistoryGroups] = useState<DailyHistoryGroup[]>([]);
  const [monthlySummary, setMonthlySummary] = useState<MonthlySummary | null>(null);
  const [xpTracking, setXPTracking] = useState<XPTrackingSummary | null>(null);
  const [hairTimeline, setHairTimeline] = useState<HairLogEntryType[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadHistory = useCallback(async () => {
    const savedProfile = await getProfile();
    if (!savedProfile) {
      router.replace('/onboarding' as Href);
      return;
    }

    const [savedProgress, history, completionLog, hairLog] = await Promise.all([
      getProgress(),
      getHistory(),
      getCompletionLog(),
      getHairLog(),
    ]);

    if (!savedProgress) {
      router.replace('/onboarding' as Href);
      return;
    }

    setProfile(savedProfile);
    setProgress(savedProgress);
    setHistoryGroups(buildDailyHistoryGroups(history, completionLog));
    setMonthlySummary(buildMonthlySummary(history));
    setXPTracking(buildXPTrackingSummary(history, savedProgress));
    setHairTimeline(getHairLogTimeline(hairLog));
  }, [router]);

  useFocusEffect(
    useCallback(() => {
      let active = true;

      async function run() {
        setLoading(true);
        try {
          await loadHistory();
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
    }, [loadHistory])
  );

  async function handleRefresh() {
    setRefreshing(true);
    try {
      await loadHistory();
    } finally {
      setRefreshing(false);
    }
  }

  if (loading || !progress || !profile || !monthlySummary || !xpTracking) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={theme.colors.accent} />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}>
      <Pressable onPress={() => router.back()}>
        <Text style={styles.backLink}>Back to dashboard</Text>
      </Pressable>

      <View style={styles.heroCard}>
        <Text style={styles.kicker}>HISTORY ARCHIVE</Text>
        <Text style={styles.title}>Progress Analytics</Text>
        <Text style={styles.body}>
          Review daily completions, month performance, streak stability, and long-term consistency.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>XP Tracking</Text>
        <View style={styles.grid}>
          <MetricCard label="Today" value={`${xpTracking.today} XP`} />
          <MetricCard label="This Week" value={`${xpTracking.week} XP`} />
          <MetricCard label="This Month" value={`${xpTracking.month} XP`} />
          <MetricCard label="All Time" value={`${xpTracking.allTime} XP`} />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Monthly Summary</Text>
        {historyGroups.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>No monthly data yet</Text>
            <Text style={styles.emptyBody}>
              Your monthly summary will appear after you complete your first quests.
            </Text>
          </View>
        ) : (
          <View style={styles.grid}>
            <MetricCard label={monthlySummary.monthLabel} value={`${monthlySummary.xp} XP`} />
            <MetricCard
              label="Completed Quests"
              value={`${monthlySummary.completedQuests}`}
              subtitle={`${monthlySummary.activeDays} active days`}
            />
            <MetricCard
              label="Best Day"
              value={monthlySummary.bestDay ? `${monthlySummary.bestDay.xp} XP` : 'No data'}
              subtitle={monthlySummary.bestDay?.date}
            />
            <MetricCard
              label="Average XP"
              value={`${monthlySummary.averageXPPerActiveDay}`}
              subtitle={`${monthlySummary.missedDays} missed days`}
            />
          </View>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Streak History</Text>
        <View style={styles.grid}>
          <MetricCard label="Current Streak" value={`${progress.streak} days`} />
          <MetricCard label="Longest Streak" value={`${progress.longestStreak} days`} />
          <MetricCard
            label="Last Completed"
            value={progress.lastCompletionDate ?? 'No completions'}
          />
          <MetricCard
            label="Active Days This Month"
            value={`${monthlySummary.activeDays} days`}
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Daily History</Text>
        {historyGroups.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>No history yet</Text>
            <Text style={styles.emptyBody}>
              Complete quests on the dashboard and your daily archive will appear here.
            </Text>
          </View>
        ) : (
          <View style={styles.list}>
            {historyGroups.map((group) => (
              <HistoryDayCard key={group.date} group={group} />
            ))}
          </View>
        )}
      </View>

      {profile.usesMinoxidil ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Hair Log Timeline</Text>
          {hairTimeline.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>No hair logs yet</Text>
              <Text style={styles.emptyBody}>Log treatment progress from the hair care screen to see it here.</Text>
            </View>
          ) : (
            <View style={styles.list}>
              {hairTimeline.map((entry) => (
                <HairLogEntry key={`${entry.date}-${entry.photoUri ?? 'entry'}`} entry={entry} />
              ))}
            </View>
          )}
        </View>
      ) : null}
    </ScrollView>
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
    alignItems: 'center',
    justifyContent: 'center',
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
    lineHeight: 22,
  },
  section: {
    gap: theme.spacing.md,
  },
  sectionTitle: {
    color: theme.colors.textPrimary,
    fontSize: theme.font.lg,
    fontWeight: '800',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.md,
  },
  list: {
    gap: theme.spacing.md,
  },
  emptyState: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  emptyTitle: {
    color: theme.colors.textPrimary,
    fontSize: theme.font.md,
    fontWeight: '800',
  },
  emptyBody: {
    color: theme.colors.textMuted,
    fontSize: theme.font.sm,
    lineHeight: 18,
  },
});
