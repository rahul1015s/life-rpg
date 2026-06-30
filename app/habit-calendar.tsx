import { useCallback, useMemo, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { MarkedDates } from 'react-native-calendars/src/types';
import { type Href, useFocusEffect, useRouter } from 'expo-router';

import { AppCalendar } from '../components/AppCalendar';
import { theme } from '../constants/theme';
import { buildHabitCalendar } from '../lib/growthEngine';
import { getHistory, getProfile } from '../lib/storage';
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

  const markedDates = useMemo<MarkedDates>(() => {
    return cells.reduce<MarkedDates>((acc, cell) => {
      if (!cell.completed) {
        return acc;
      }

      acc[cell.date] = {
        dots: [
          {
            key: cell.intensity,
            color: cell.questsCompleted >= 3 ? theme.colors.gold : theme.colors.indigo,
          },
        ],
      };
      return acc;
    }, {});
  }, [cells]);

  const activeDays = cells.filter((cell) => cell.completed).length;
  const strongDays = cells.filter((cell) => cell.questsCompleted >= 3).length;

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
        <Text style={styles.title}>Unified monthly quest consistency view</Text>
        <Text style={styles.body}>{activeDays} active days · {strongDays} strong days this month</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Quest Intensity</Text>
        <Text style={styles.body}>Indigo marks 1-2 completed quests. Gold marks 3 or more completed quests.</Text>
        <AppCalendar markedDates={markedDates} />
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
  body: { color: theme.colors.textMuted, fontSize: theme.font.md, lineHeight: 20 },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  cardTitle: { color: theme.colors.textPrimary, fontSize: theme.font.md, fontWeight: '800' },
});
