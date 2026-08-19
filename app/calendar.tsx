import { useCallback, useMemo, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { IconBarbell, IconCheck, IconChevronLeft, IconChevronRight, IconFlame } from '@tabler/icons-react-native';
import { type Href, useFocusEffect, useRouter } from 'expo-router';
import { addDays, format, startOfWeek } from 'date-fns';

import { HabitMonthGrid } from '../components/habit/HabitMonthGrid';
import { habitAccents, type HabitDayCell, type HabitIcon } from '../components/habit/habitTheme';
import { getMensHealthLogs, getProfile, getWorkoutEntries } from '../lib/storage';
import type { MensHealthLog, WorkoutEntry } from '../lib/types';
import { chronicleColors, chronicleFontFamily, chronicleSpacing, chronicleType } from '../theme/chronicle';

type TrackedHabit = {
  key: string;
  name: string;
  accent: string;
  Icon: HabitIcon;
  route: string;
};

// Only habits with a real tracked-habit data model. Deep Work / Read / Meditate / Journal
// are intentionally absent -- they exist as quest categories, not tracked habits.
const HABITS: TrackedHabit[] = [
  { key: 'nofap', name: 'NoFap', accent: habitAccents.nofap, Icon: IconFlame, route: '/nofap-calendar' },
  { key: 'workout', name: 'Workout', accent: habitAccents.workout, Icon: IconBarbell, route: '/workout-calendar' },
];

const WEEKDAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

export default function CalendarScreen() {
  const router = useRouter();
  const [logs, setLogs] = useState<MensHealthLog[]>([]);
  const [entries, setEntries] = useState<WorkoutEntry[]>([]);
  const [month, setMonth] = useState(() => new Date());
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const profile = await getProfile();
    if (!profile) {
      router.replace('/onboarding' as Href);
      return;
    }
    const [savedLogs, savedEntries] = await Promise.all([getMensHealthLogs(), getWorkoutEntries()]);
    setLogs(savedLogs);
    setEntries(savedEntries);
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

  const doneByHabit = useCallback(
    (dateKey: string) => [
      logs.find((log) => log.date === dateKey)?.noFapStatus === 'clean',
      entries.some((entry) => entry.date === dateKey),
    ],
    [logs, entries]
  );

  // Date badges stay neutral here; the per-habit dots beneath carry the information.
  const cells = useMemo<HabitDayCell[]>(() => {
    const dates = new Set<string>([...logs.map((log) => log.date), ...entries.map((entry) => entry.date)]);
    return Array.from(dates).map((date) => ({
      date,
      state: 'none' as const,
      subMetrics: doneByHabit(date),
    }));
  }, [logs, entries, doneByHabit]);

  const weekKeys = useMemo(() => {
    const monday = startOfWeek(new Date(), { weekStartsOn: 1 });
    return Array.from({ length: 7 }, (_, index) => format(addDays(monday, index), 'yyyy-MM-dd'));
  }, []);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.header}>
        <Pressable
          style={styles.backSlot}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          onPress={() => router.back()}>
          <IconChevronLeft size={24} strokeWidth={1.5} color={chronicleColors.textPrimary} />
        </Pressable>
        <View style={styles.headerCopy}>
          <Text style={styles.title}>Calendar</Text>
          <Text style={styles.tagline}>All tracked habits in one view</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={chronicleColors.accentGold}
            colors={[chronicleColors.accentGold]}
          />
        }>
        <HabitMonthGrid
          month={month}
          onMonthChange={setMonth}
          cells={cells}
          accent={chronicleColors.accentGold}
          dayIndicator="grid"
          dotColors={HABITS.map((habit) => habit.accent)}
        />

        <View style={styles.legend}>
          {HABITS.map((habit) => (
            <View key={habit.key} style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: habit.accent }]} />
              <Text style={styles.legendLabel}>{habit.name}</Text>
            </View>
          ))}
        </View>

        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <View style={styles.habitCell} />
            {WEEKDAYS.map((day, index) => (
              <Text key={`${day}-${index}`} style={styles.weekday}>
                {day}
              </Text>
            ))}
          </View>

          {HABITS.map((habit) => {
            const HabitIconComponent = habit.Icon;
            return (
              <Pressable
                key={habit.key}
                style={styles.tableRow}
                accessibilityRole="button"
                accessibilityLabel={`Open ${habit.name} tracker`}
                onPress={() => router.push(habit.route as Href)}>
                <View style={styles.habitCell}>
                  <HabitIconComponent size={18} strokeWidth={1.5} color={habit.accent} />
                  <Text style={styles.habitName} numberOfLines={1}>
                    {habit.name}
                  </Text>
                </View>
                {weekKeys.map((key) => {
                  const done = doneByHabit(key)[HABITS.indexOf(habit)];
                  return (
                    <View key={key} style={styles.checkCell}>
                      <View style={[styles.checkCircle, done ? { backgroundColor: habit.accent, borderColor: habit.accent } : null]}>
                        {done ? <IconCheck size={12} strokeWidth={2.5} color={chronicleColors.bgBase} /> : null}
                      </View>
                    </View>
                  );
                })}
                <IconChevronRight size={16} strokeWidth={1.5} color={chronicleColors.textMuted} />
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: chronicleColors.bgBase },
  scroll: { flex: 1 },
  content: { padding: chronicleSpacing.lg, paddingBottom: chronicleSpacing.xxl, gap: chronicleSpacing.lg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: chronicleSpacing.md,
    paddingHorizontal: chronicleSpacing.lg,
    paddingVertical: chronicleSpacing.md,
  },
  backSlot: { width: 24, alignItems: 'center' },
  headerCopy: { flex: 1, gap: 2 },
  title: {
    color: chronicleColors.textPrimary,
    fontFamily: chronicleFontFamily.bodyBold,
    fontSize: chronicleType.xl,
  },
  tagline: {
    color: chronicleColors.textMuted,
    fontFamily: chronicleFontFamily.body,
    fontSize: chronicleType.sm,
  },
  legend: { flexDirection: 'row', gap: chronicleSpacing.lg, paddingHorizontal: chronicleSpacing.xs },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: chronicleSpacing.xs },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendLabel: {
    color: chronicleColors.textMuted,
    fontFamily: chronicleFontFamily.body,
    fontSize: chronicleType.xs,
  },
  table: {
    backgroundColor: chronicleColors.bgSurface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: chronicleColors.borderSubtle,
    padding: chronicleSpacing.md,
    gap: chronicleSpacing.sm,
  },
  tableHeader: { flexDirection: 'row', alignItems: 'center' },
  tableRow: { flexDirection: 'row', alignItems: 'center', gap: chronicleSpacing.xs },
  habitCell: { width: 92, flexDirection: 'row', alignItems: 'center', gap: chronicleSpacing.xs },
  habitName: {
    flex: 1,
    color: chronicleColors.textPrimary,
    fontFamily: chronicleFontFamily.body,
    fontSize: chronicleType.xs,
  },
  weekday: {
    flex: 1,
    textAlign: 'center',
    color: chronicleColors.textMuted,
    fontFamily: chronicleFontFamily.body,
    fontSize: chronicleType.xs,
  },
  checkCell: { flex: 1, alignItems: 'center' },
  checkCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: chronicleColors.borderSubtle,
  },
});
