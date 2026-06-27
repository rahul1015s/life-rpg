import { useCallback, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { type Href, useFocusEffect, useRouter } from 'expo-router';

import { theme } from '../constants/theme';
import { buildHabitCalendar } from '../lib/growthEngine';
import { getProfile, getHistory } from '../lib/storage';
import type { HabitCalendarCell } from '../lib/types';

export default function HabitCalendarScreen() {
  const router = useRouter();
  const [cells, setCells] = useState<HabitCalendarCell[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const profile = await getProfile();
    if (!profile) {
      router.replace('/onboarding' as Href);
      return;
    }
    setCells(buildHabitCalendar(await getHistory()));
  }, [router]);

  useFocusEffect(
    useCallback(() => {
      load();
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

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}>
      <Pressable onPress={() => router.back()}>
        <Text style={styles.backLink}>Back</Text>
      </Pressable>
      <View style={styles.heroCard}>
        <Text style={styles.kicker}>HABIT CALENDAR</Text>
        <Text style={styles.title}>Month view of your consistency</Text>
      </View>

      <View style={styles.legend}>
        <View style={[styles.legendDot, styles.none]} />
        <Text style={styles.legendText}>none</Text>
        <View style={[styles.legendDot, styles.light]} />
        <Text style={styles.legendText}>light</Text>
        <View style={[styles.legendDot, styles.strong]} />
        <Text style={styles.legendText}>strong</Text>
      </View>

      <View style={styles.grid}>
        {cells.map((cell) => (
          <View key={cell.date} style={styles.cellWrap}>
            <View
              style={[
                styles.cell,
                cell.intensity === 'none' ? styles.none : cell.intensity === 'light' ? styles.light : styles.strong,
              ]}
            />
            <Text style={styles.day}>{cell.date.slice(-2)}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.colors.background },
  content: { padding: theme.spacing.lg, gap: theme.spacing.lg, paddingBottom: theme.spacing.xl * 2 },
  backLink: { color: theme.colors.accentGlow, fontSize: theme.font.sm, fontWeight: '700' },
  heroCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.lg,
    gap: theme.spacing.sm,
  },
  kicker: { color: theme.colors.accentGlow, fontSize: theme.font.sm, fontWeight: '800', letterSpacing: 1 },
  title: { color: theme.colors.textPrimary, fontSize: theme.font.xl, fontWeight: '900' },
  legend: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm, flexWrap: 'wrap' },
  legendDot: { width: 14, height: 14, borderRadius: 4, borderWidth: 1, borderColor: theme.colors.border },
  legendText: { color: theme.colors.textMuted, fontSize: theme.font.sm },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm },
  cellWrap: { width: '12%', minWidth: 34, alignItems: 'center', gap: 4 },
  cell: { width: 28, height: 28, borderRadius: 6, borderWidth: 1, borderColor: theme.colors.border },
  none: { backgroundColor: theme.colors.surfaceAlt },
  light: { backgroundColor: theme.colors.primary },
  strong: { backgroundColor: theme.colors.accent },
  day: { color: theme.colors.textMuted, fontSize: theme.font.sm },
});

