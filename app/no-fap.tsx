import { useCallback, useMemo, useState } from 'react';
import { Alert, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { MarkedDates } from 'react-native-calendars/src/types';
import { type Href, useFocusEffect, useRouter } from 'expo-router';

import { AppCalendar } from '../components/AppCalendar';
import { ChronicleButton } from '../components/chronicle/ChronicleButton';
import { ChronicleCard } from '../components/chronicle/ChronicleCard';
import { ChronicleInput } from '../components/chronicle/ChronicleInput';
import { ChronicleSectionHeader } from '../components/chronicle/ChronicleSectionHeader';
import { ChronicleSegmentedControl } from '../components/chronicle/ChronicleSegmentedControl';
import { ChronicleStatPanel } from '../components/chronicle/ChronicleStatPanel';
import {
  buildNoFapCalendar,
  createInitialMensHealthState,
  formatLocalDate,
  getTodayMensHealthLog,
  updateNoFapAndNoPornState,
  upsertMensHealthLog,
} from '../lib/mensHealthEngine';
import { getMensHealthLogs, getMensHealthState, getProfile, setMensHealthLogs, setMensHealthState } from '../lib/storage';
import type { MensHealthLog, MensHealthState } from '../lib/types';
import { getDisciplineCopy, hasAdultContentAccess } from '../lib/utils/profile';
import { chronicleColors, chronicleFontFamily, chronicleSpacing, chronicleType } from '../theme/chronicle';
import { chronicleCalendarTheme } from '../theme/chronicleCalendarTheme';

type TrackerStatus = 'none' | 'clean' | 'relapse';

const statusOptions: { value: TrackerStatus; label: string; activeColor?: string; activeTextColor?: string }[] = [
  { value: 'clean', label: 'Clean', activeColor: chronicleColors.accentJade },
  { value: 'relapse', label: 'Relapse', activeColor: chronicleColors.accentEmber },
  { value: 'none', label: 'None', activeColor: chronicleColors.textMuted, activeTextColor: chronicleColors.bgBase },
];

export default function NoFapScreen() {
  const router = useRouter();
  const [state, setState] = useState<MensHealthState | null>(null);
  const [logs, setLogs] = useState<MensHealthLog[]>([]);
  const [todayLog, setTodayLog] = useState<MensHealthLog | null>(null);
  const [adultAccess, setAdultAccess] = useState(true);
  const [disciplineCopy, setDisciplineCopy] = useState(() => getDisciplineCopy());
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const profile = await getProfile();
    if (!profile) {
      router.replace('/onboarding' as Href);
      return;
    }

    setAdultAccess(hasAdultContentAccess(profile.dob));
    setDisciplineCopy(getDisciplineCopy(profile.gender));

    const [savedState, savedLogs] = await Promise.all([getMensHealthState(), getMensHealthLogs()]);
    const nextState = savedState ?? createInitialMensHealthState();
    const nextTodayLog = getTodayMensHealthLog(savedLogs);
    setState(nextState);
    setLogs(savedLogs);
    setTodayLog(nextTodayLog);
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

  async function saveTodayLog() {
    if (!state || !todayLog) {
      return;
    }

    try {
      const nextLogs = upsertMensHealthLog(logs, todayLog);
      const nextState = updateNoFapAndNoPornState(state, nextLogs);
      await Promise.all([setMensHealthLogs(nextLogs), setMensHealthState(nextState)]);
      setLogs(nextLogs);
      setState(nextState);
      Alert.alert('Tracker updated', disciplineCopy.savedMessage);
    } catch (error) {
      const message = error instanceof Error ? error.message : disciplineCopy.updateErrorMessage;
      Alert.alert('Save failed', message);
    }
  }

  function setStatus(type: 'noFapStatus' | 'noPornStatus', value: TrackerStatus) {
    setTodayLog((current) => (current ? { ...current, [type]: value } : current));
  }

  const markedDates = useMemo<MarkedDates>(() => {
    return buildNoFapCalendar(logs).reduce<MarkedDates>((acc, item) => {
      const tone =
        item.noFapStatus === 'relapse' || item.noPornStatus === 'relapse'
          ? chronicleColors.accentEmber
          : item.noFapStatus === 'clean' && item.noPornStatus === 'clean'
            ? chronicleColors.accentGold
            : undefined;

      if (tone) {
        acc[item.date] = {
          dots: [{ key: tone, color: tone }],
        };
      }

      return acc;
    }, {});
  }, [logs]);

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={chronicleColors.accentGold} />}>
      <View style={styles.topLinks}>
        <Pressable onPress={() => router.back()} style={({ pressed }) => (pressed ? styles.pressed : null)}>
          <Text style={styles.backLink}>‹ Back</Text>
        </Pressable>
        <Pressable
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          accessibilityRole="button"
          onPress={() => router.push('/nofap-calendar' as Href)}
          style={({ pressed }) => (pressed ? styles.pressed : null)}>
          <Text style={styles.backLink}>Month View ›</Text>
        </Pressable>
      </View>

      <View style={styles.hero}>
        <Text style={styles.kicker}>{disciplineCopy.kicker}</Text>
        <Text style={styles.title}>{disciplineCopy.title}</Text>
        <Text style={styles.body}>
          {disciplineCopy.streakSummaryPrefix}: {state?.currentNoFapStreak ?? 0} days · No-porn streak: {state?.currentNoPornStreak ?? 0} days
        </Text>
      </View>

      {!adultAccess ? (
        <ChronicleCard style={styles.formCard}>
          <Text style={styles.cardTitle}>Discipline Mode</Text>
          <Text style={styles.body}>
            This screen is simplified for under-18 profiles. Use workouts, daily quests, and recovery habits to build consistency.
          </Text>
          <ChronicleButton label="Open Workout Progress" onPress={() => router.push('/workout-progress' as Href)} />
        </ChronicleCard>
      ) : (
        <>
          <View style={styles.statsRow}>
            <ChronicleStatPanel value={String(state?.currentNoFapStreak ?? 0)} label={disciplineCopy.currentPrimaryLabel.toUpperCase()} />
            <ChronicleStatPanel value={String(state?.longestNoFapStreak ?? 0)} label={disciplineCopy.bestPrimaryLabel.toUpperCase()} />
          </View>

          <View style={styles.statsRow}>
            <ChronicleStatPanel value={String(state?.currentNoPornStreak ?? 0)} label="CURRENT NO PORN" />
            <ChronicleStatPanel value={String(state?.longestNoPornStreak ?? 0)} label="BEST NO PORN" />
          </View>

          <ChronicleCard style={styles.formCard}>
            <Text style={styles.cardTitle}>Today · {formatLocalDate()}</Text>

            <View style={styles.fieldWrap}>
              <Text style={styles.groupLabel}>{disciplineCopy.primaryHabitLabel}</Text>
              <ChronicleSegmentedControl
                options={statusOptions}
                value={todayLog?.noFapStatus ?? 'none'}
                onChange={(value) => setStatus('noFapStatus', value)}
              />
            </View>

            <View style={styles.fieldWrap}>
              <Text style={styles.groupLabel}>No Porn</Text>
              <ChronicleSegmentedControl
                options={statusOptions}
                value={todayLog?.noPornStatus ?? 'none'}
                onChange={(value) => setStatus('noPornStatus', value)}
              />
            </View>

            <ChronicleInput
              label={disciplineCopy.primaryHabitLabel + ' note'}
              multiline
              placeholder={disciplineCopy.notePlaceholder}
              value={todayLog?.noFapNote ?? ''}
              onChangeText={(text) => setTodayLog((current) => (current ? { ...current, noFapNote: text } : current))}
            />
            <ChronicleInput
              label="No-porn note"
              multiline
              placeholder="No-porn note"
              value={todayLog?.noPornNote ?? ''}
              onChangeText={(text) => setTodayLog((current) => (current ? { ...current, noPornNote: text } : current))}
            />

            <ChronicleButton label="Save Tracker" onPress={saveTodayLog} />
          </ChronicleCard>
        </>
      )}

      <View style={styles.section}>
        <ChronicleSectionHeader title="Calendar" />
        <ChronicleCard>
          <Text style={styles.meta}>Gold marks clean days, ember marks relapse days.</Text>
          <AppCalendar markedDates={markedDates} current={formatLocalDate()} calendarTheme={chronicleCalendarTheme} />
        </ChronicleCard>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  topLinks: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  screen: {
    flex: 1,
    backgroundColor: chronicleColors.bgBase,
  },
  content: {
    padding: chronicleSpacing.lg,
    gap: chronicleSpacing.lg,
    paddingBottom: chronicleSpacing.xxl,
  },
  backLink: {
    color: chronicleColors.accentGold,
    fontFamily: chronicleFontFamily.mono,
    fontSize: chronicleType.sm,
  },
  pressed: {
    opacity: 0.7,
  },
  hero: {
    backgroundColor: chronicleColors.bgSurface,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: chronicleColors.borderSubtle,
    padding: chronicleSpacing.lg,
    gap: chronicleSpacing.sm,
  },
  kicker: {
    color: chronicleColors.accentGold,
    fontFamily: chronicleFontFamily.mono,
    fontSize: chronicleType.xs,
    letterSpacing: 1,
  },
  title: {
    color: chronicleColors.textPrimary,
    fontFamily: chronicleFontFamily.display,
    fontSize: chronicleType.lg,
  },
  body: {
    color: chronicleColors.textMuted,
    fontFamily: chronicleFontFamily.body,
    fontSize: chronicleType.sm,
    lineHeight: 20,
  },
  meta: {
    color: chronicleColors.textMuted,
    fontFamily: chronicleFontFamily.mono,
    fontSize: chronicleType.sm,
  },
  statsRow: {
    flexDirection: 'row',
    gap: chronicleSpacing.md,
  },
  formCard: {
    gap: chronicleSpacing.md,
  },
  cardTitle: {
    color: chronicleColors.textPrimary,
    fontFamily: chronicleFontFamily.display,
    fontSize: chronicleType.md,
  },
  groupLabel: {
    color: chronicleColors.accentGold,
    fontFamily: chronicleFontFamily.bodySemiBold,
    fontSize: chronicleType.sm,
  },
  fieldWrap: {
    gap: chronicleSpacing.sm,
  },
  section: {
    gap: chronicleSpacing.sm,
  },
});
