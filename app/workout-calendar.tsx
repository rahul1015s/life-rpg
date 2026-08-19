import { useCallback, useMemo, useState } from 'react';
import { IconBarbell } from '@tabler/icons-react-native';
import { type Href, useFocusEffect, useRouter } from 'expo-router';
import { addDays, format, startOfWeek } from 'date-fns';

import { HabitTrackerScreen } from '../components/habit/HabitTrackerScreen';
import { habitAccents, type HabitDayCell, type HabitTrackerConfig } from '../components/habit/habitTheme';
import { getProfile, getWorkoutEntries } from '../lib/storage';
import type { WorkoutEntry } from '../lib/types';

// Sub-metric dots map to the workoutType values that already exist on WorkoutEntry.
const WORKOUT_TYPES: WorkoutEntry['workoutType'][] = ['strength', 'cardio', 'mobility', 'sports'];

export default function WorkoutCalendarScreen() {
  const router = useRouter();
  const [entries, setEntries] = useState<WorkoutEntry[]>([]);
  const [month, setMonth] = useState(() => new Date());
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const profile = await getProfile();
    if (!profile) {
      router.replace('/onboarding' as Href);
      return;
    }
    setEntries(await getWorkoutEntries());
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

  const cells = useMemo<HabitDayCell[]>(() => {
    const byDate = new Map<string, WorkoutEntry[]>();
    entries.forEach((entry) => {
      byDate.set(entry.date, [...(byDate.get(entry.date) ?? []), entry]);
    });

    return Array.from(byDate.entries()).map(([date, dayEntries]) => ({
      date,
      state: 'success' as const,
      subMetrics: WORKOUT_TYPES.map((type) => dayEntries.some((entry) => entry.workoutType === type)),
    }));
  }, [entries]);

  const weekRow = useMemo(() => {
    const monday = startOfWeek(new Date(), { weekStartsOn: 1 });
    return Array.from({ length: 7 }, (_, index) => {
      const key = format(addDays(monday, index), 'yyyy-MM-dd');
      return entries.some((entry) => entry.date === key);
    });
  }, [entries]);

  // Session-log stats only. WorkoutEntry has no daily-boolean or streak field, so no streak
  // is derived here -- that would invent semantics the data model does not define.
  const statTiles = useMemo(() => {
    const monday = startOfWeek(new Date(), { weekStartsOn: 1 });
    const weekKeys = new Set(Array.from({ length: 7 }, (_, index) => format(addDays(monday, index), 'yyyy-MM-dd')));
    const thisWeek = entries.filter((entry) => weekKeys.has(entry.date)).length;
    const totalMinutes = entries.reduce((sum, entry) => sum + (entry.durationMinutes || 0), 0);
    const avg = entries.length > 0 ? Math.round(totalMinutes / entries.length) : 0;

    return [
      { label: 'Total Sessions', value: `${entries.length}` },
      { label: 'This Week', value: `${thisWeek}` },
      { label: 'Avg Duration', value: `${avg}m` },
    ];
  }, [entries]);

  const config: HabitTrackerConfig = {
    key: 'workout',
    title: 'Workout',
    tagline: 'Session log and training consistency',
    accent: habitAccents.workout,
    Icon: IconBarbell,
    ctaLabel: 'Log Workout',
    dayIndicator: 'grid',
  };

  return (
    <HabitTrackerScreen
      config={config}
      cells={cells}
      month={month}
      onMonthChange={setMonth}
      statTiles={statTiles}
      weekRow={weekRow}
      onBack={() => router.back()}
      // Logging a workout needs title/duration/sets, so the CTA opens the existing logging
      // form rather than inventing a one-tap entry with fabricated defaults.
      onLogPress={() => router.push('/workout-progress' as Href)}
      refreshing={refreshing}
      onRefresh={handleRefresh}
    />
  );
}
