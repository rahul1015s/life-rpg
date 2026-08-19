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
import { ChronicleCard } from '../components/chronicle/ChronicleCard';
import { ChronicleSectionHeader } from '../components/chronicle/ChronicleSectionHeader';
import { chronicleColors, chronicleFontFamily, chronicleSpacing, chronicleType } from '../theme/chronicle';
import {
  buildRecentActivityGrid,
  buildDailyHistoryGroups,
  buildMonthlySummary,
  buildXPTrackingSummary,
  getHairLogTimeline,
} from '../lib/analytics';
import { getCompletionLog, getHairLog, getHistory, getProfile, getProgress } from '../lib/storage';
import type {
  ActivityGridCell,
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
  const [activityGrid, setActivityGrid] = useState<ActivityGridCell[]>([]);
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
    setActivityGrid(buildRecentActivityGrid(history));
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
        <ActivityIndicator size="large" color={chronicleColors.accentGold} />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          tintColor={chronicleColors.accentGold}
          colors={[chronicleColors.accentGold]}
        />
      }>
      <Pressable onPress={() => router.back()}>
        <Text style={styles.backLink}>Back to dashboard</Text>
      </Pressable>

      <ChronicleCard style={styles.heroCard}>
        <Text style={styles.kicker}>HISTORY ARCHIVE</Text>
        <Text style={styles.title}>Progress Analytics</Text>
        <Text style={styles.body}>
          Review daily completions, month performance, streak stability, and long-term consistency.
        </Text>
      </ChronicleCard>

      <View style={styles.section}>
        <ChronicleSectionHeader title="XP Tracking" />
        <View style={styles.grid}>
          <MetricCard label="Today" value={`${xpTracking.today} XP`} />
          <MetricCard label="This Week" value={`${xpTracking.week} XP`} />
          <MetricCard label="This Month" value={`${xpTracking.month} XP`} />
          <MetricCard label="All Time" value={`${xpTracking.allTime} XP`} />
        </View>
      </View>

      <View style={styles.section}>
        <ChronicleSectionHeader title="Monthly Summary" />
        {historyGroups.length === 0 ? (
          <ChronicleCard style={styles.emptyState}>
            <Text style={styles.emptyTitle}>No monthly data yet</Text>
            <Text style={styles.emptyBody}>
              Your monthly summary will appear after you complete your first quests.
            </Text>
          </ChronicleCard>
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
        <ChronicleSectionHeader title="Streak History" />
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
        <ChronicleSectionHeader title="Improvement Grid" />
        <Text style={styles.sectionBody}>
          Last 35 days of progress. Empty means no XP, then low, medium, and strong improvement days.
        </Text>
        <View style={styles.gridLegend}>
          <Text style={styles.legendText}>LESS</Text>
          <View style={[styles.gridCell, styles.gridCellNone]} />
          <View style={[styles.gridCell, styles.gridCellLow]} />
          <View style={[styles.gridCell, styles.gridCellMedium]} />
          <View style={[styles.gridCell, styles.gridCellHigh]} />
          <Text style={styles.legendText}>MORE</Text>
        </View>
        <View style={styles.activityGrid}>
          {activityGrid.map((cell) => (
            <View
              key={cell.date}
              style={[
                styles.gridCell,
                cell.intensity === 'none'
                  ? styles.gridCellNone
                  : cell.intensity === 'low'
                    ? styles.gridCellLow
                    : cell.intensity === 'medium'
                      ? styles.gridCellMedium
                      : styles.gridCellHigh,
              ]}
            />
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <ChronicleSectionHeader title="Daily History" />
        {historyGroups.length === 0 ? (
          <ChronicleCard style={styles.emptyState}>
            <Text style={styles.emptyTitle}>No history yet</Text>
            <Text style={styles.emptyBody}>
              Complete quests on the dashboard and your daily archive will appear here.
            </Text>
          </ChronicleCard>
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
          <ChronicleSectionHeader title="Hair Log Timeline" />
          {hairTimeline.length === 0 ? (
            <ChronicleCard style={styles.emptyState}>
              <Text style={styles.emptyTitle}>No hair logs yet</Text>
              <Text style={styles.emptyBody}>Log treatment progress from the hair care screen to see it here.</Text>
            </ChronicleCard>
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
    backgroundColor: chronicleColors.bgBase,
  },
  content: {
    padding: chronicleSpacing.lg,
    gap: chronicleSpacing.lg,
    paddingBottom: chronicleSpacing.xl * 2,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: chronicleColors.bgBase,
  },
  backLink: {
    color: chronicleColors.accentGold,
    fontFamily: chronicleFontFamily.bodySemiBold,
    fontSize: chronicleType.sm,
  },
  heroCard: { gap: chronicleSpacing.sm },
  kicker: {
    color: chronicleColors.textMuted,
    fontFamily: chronicleFontFamily.mono,
    fontSize: chronicleType.xs,
    letterSpacing: 1,
  },
  title: {
    color: chronicleColors.textPrimary,
    fontFamily: chronicleFontFamily.display,
    fontSize: chronicleType.lg,
    letterSpacing: 0.5,
  },
  body: {
    color: chronicleColors.textMuted,
    fontFamily: chronicleFontFamily.body,
    fontSize: chronicleType.md,
    lineHeight: 24,
  },
  section: {
    gap: chronicleSpacing.md,
  },
  sectionBody: {
    color: chronicleColors.textMuted,
    fontFamily: chronicleFontFamily.body,
    fontSize: chronicleType.sm,
    lineHeight: 20,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: chronicleSpacing.md,
  },
  gridLegend: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: chronicleSpacing.sm,
  },
  legendText: {
    color: chronicleColors.textMuted,
    fontFamily: chronicleFontFamily.mono,
    fontSize: chronicleType.xs,
    letterSpacing: 0.5,
  },
  activityGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: chronicleSpacing.sm,
  },
  gridCell: {
    width: 18,
    height: 18,
    borderWidth: 1,
    borderColor: chronicleColors.borderSubtle,
  },
  // Single-hue intensity ramp: dark surface -> muted gold -> gold -> bone highlight.
  // Deliberately no second hue, per DESIGN.md's palette rules.
  gridCellNone: {
    backgroundColor: chronicleColors.bgSurfaceRaised,
  },
  gridCellLow: {
    backgroundColor: chronicleColors.accentGoldMuted,
  },
  gridCellMedium: {
    backgroundColor: chronicleColors.accentGold,
  },
  gridCellHigh: {
    backgroundColor: chronicleColors.textPrimary,
  },
  list: {
    gap: chronicleSpacing.md,
  },
  emptyState: { gap: chronicleSpacing.sm },
  emptyTitle: {
    color: chronicleColors.textPrimary,
    fontFamily: chronicleFontFamily.display,
    fontSize: chronicleType.md,
    letterSpacing: 0.5,
  },
  emptyBody: {
    color: chronicleColors.textMuted,
    fontFamily: chronicleFontFamily.body,
    fontSize: chronicleType.sm,
    lineHeight: 20,
  },
});
