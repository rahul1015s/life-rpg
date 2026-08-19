import { useCallback, useMemo, useState } from 'react';
import { Alert } from 'react-native';
import { IconFlame, IconNotes } from '@tabler/icons-react-native';
import { type Href, useFocusEffect, useRouter } from 'expo-router';
import { addDays, format, startOfWeek } from 'date-fns';

import { HabitTrackerScreen } from '../components/habit/HabitTrackerScreen';
import { habitAccents, type HabitDayCell, type HabitTrackerConfig } from '../components/habit/habitTheme';
import {
  createInitialMensHealthState,
  formatLocalDate,
  getTodayMensHealthLog,
  updateNoFapAndNoPornState,
  upsertMensHealthLog,
} from '../lib/mensHealthEngine';
import { getMensHealthLogs, getMensHealthState, getProfile, setMensHealthLogs, setMensHealthState } from '../lib/storage';
import type { MensHealthLog, MensHealthState } from '../lib/types';
import { getDisciplineCopy } from '../lib/utils/profile';

export default function NoFapCalendarScreen() {
  const router = useRouter();
  const [state, setState] = useState<MensHealthState | null>(null);
  const [logs, setLogs] = useState<MensHealthLog[]>([]);
  const [copy, setCopy] = useState(() => getDisciplineCopy());
  const [month, setMonth] = useState(() => new Date());
  const [refreshing, setRefreshing] = useState(false);
  const [logging, setLogging] = useState(false);

  const load = useCallback(async () => {
    const profile = await getProfile();
    if (!profile) {
      router.replace('/onboarding' as Href);
      return;
    }
    const [savedState, savedLogs] = await Promise.all([getMensHealthState(), getMensHealthLogs()]);
    setCopy(getDisciplineCopy(profile.gender));
    setState(savedState ?? createInitialMensHealthState());
    setLogs(savedLogs);
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

  // Mirrors the app's existing "marked clean" semantics (see copy.completeMessage): the
  // primary action marks both no-fap and no-porn clean for today. Streak recalculation is
  // delegated to updateNoFapAndNoPornState -- nothing is computed here.
  async function handleLogToday() {
    if (!state) {
      return;
    }
    try {
      setLogging(true);
      const today = formatLocalDate();
      const current = getTodayMensHealthLog(logs, today);
      if (current.noFapStatus === 'clean' && current.noPornStatus === 'clean') {
        Alert.alert('Already logged', copy.alreadyLoggedMessage);
        return;
      }
      const nextLog: MensHealthLog = { ...current, noFapStatus: 'clean', noPornStatus: 'clean' };
      const nextLogs = upsertMensHealthLog(logs, nextLog);
      const nextState = updateNoFapAndNoPornState(state, nextLogs, today);
      await Promise.all([setMensHealthLogs(nextLogs), setMensHealthState(nextState)]);
      setLogs(nextLogs);
      setState(nextState);
      Alert.alert('Logged', copy.completeMessage);
    } catch (error) {
      const message = error instanceof Error ? error.message : copy.updateErrorMessage;
      Alert.alert('Tracker update failed', message);
    } finally {
      setLogging(false);
    }
  }

  const cells = useMemo<HabitDayCell[]>(
    () =>
      logs.map((log) => ({
        date: log.date,
        state: log.noFapStatus === 'clean' ? 'success' : log.noFapStatus === 'relapse' ? 'fail' : 'none',
      })),
    [logs]
  );

  const weekRow = useMemo(() => {
    const monday = startOfWeek(new Date(), { weekStartsOn: 1 });
    return Array.from({ length: 7 }, (_, index) => {
      const key = format(addDays(monday, index), 'yyyy-MM-dd');
      return logs.find((log) => log.date === key)?.noFapStatus === 'clean';
    });
  }, [logs]);

  const config: HabitTrackerConfig = {
    key: 'nofap',
    title: copy.primaryHabitLabel,
    tagline: copy.title,
    accent: habitAccents.nofap,
    Icon: IconFlame,
    ctaLabel: 'I Stayed Strong Today',
    dayIndicator: 'single',
  };

  return (
    <HabitTrackerScreen
      config={config}
      cells={cells}
      month={month}
      onMonthChange={setMonth}
      statTiles={[
        { label: 'Current Streak', value: `${state?.currentNoFapStreak ?? 0}` },
        { label: 'Best Streak', value: `${state?.longestNoFapStreak ?? 0}` },
        { label: 'Total Clean Days', value: `${state?.totalSuccessfulDays ?? 0}` },
      ]}
      weekRow={weekRow}
      quote={copy.reminderMessage}
      onBack={() => router.back()}
      onLogPress={handleLogToday}
      ctaLoading={logging}
      headerAction={{
        Icon: IconNotes,
        label: 'Open full logging form',
        onPress: () => router.push('/no-fap' as Href),
      }}
      refreshing={refreshing}
      onRefresh={handleRefresh}
    />
  );
}
