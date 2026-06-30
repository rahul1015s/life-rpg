import { useCallback, useMemo, useState } from 'react';
import {
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import type { MarkedDates } from 'react-native-calendars/src/types';
import { type Href, useFocusEffect, useRouter } from 'expo-router';

import { AppCalendar } from '../components/AppCalendar';
import { PrimaryButton } from '../components/PrimaryButton';
import { theme } from '../constants/theme';
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

type TrackerStatus = 'none' | 'clean' | 'relapse';

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

    const nextLogs = upsertMensHealthLog(logs, todayLog);
    const nextState = updateNoFapAndNoPornState(state, nextLogs);
    await Promise.all([setMensHealthLogs(nextLogs), setMensHealthState(nextState)]);
    setLogs(nextLogs);
    setState(nextState);
    Alert.alert('Tracker updated', disciplineCopy.savedMessage);
  }

  function setStatus(type: 'noFapStatus' | 'noPornStatus', value: TrackerStatus) {
    setTodayLog((current) => (current ? { ...current, [type]: value } : current));
  }

  const markedDates = useMemo<MarkedDates>(() => {
    return buildNoFapCalendar(logs).reduce<MarkedDates>((acc, item) => {
      const tone =
        item.noFapStatus === 'relapse' || item.noPornStatus === 'relapse'
          ? theme.colors.sealRed
          : item.noFapStatus === 'clean' && item.noPornStatus === 'clean'
            ? theme.colors.gold
            : undefined;

      if (tone) {
        acc[item.date] = {
          dots: [
            {
              key: tone,
              color: tone,
            },
          ],
        };
      }

      return acc;
    }, {});
  }, [logs]);

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}>
      <Pressable onPress={() => router.back()}>
        <Text style={styles.backLink}>Back</Text>
      </Pressable>

      <View style={styles.heroCard}>
        <Text style={styles.kicker}>{disciplineCopy.kicker}</Text>
        <Text style={styles.title}>{disciplineCopy.title}</Text>
        <Text style={styles.body}>
          {disciplineCopy.streakSummaryPrefix}: {state?.currentNoFapStreak ?? 0} days · No-porn streak: {state?.currentNoPornStreak ?? 0} days
        </Text>
      </View>

      {!adultAccess ? (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Discipline Mode</Text>
          <Text style={styles.body}>
            This screen is simplified for under-18 profiles. Use workouts, daily quests, and recovery habits to build consistency.
          </Text>
          <PrimaryButton label="Open Workout Progress" onPress={() => router.push('/workout-progress' as Href)} />
        </View>
      ) : (
        <>
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>{disciplineCopy.currentPrimaryLabel}</Text>
              <Text style={styles.statValue}>{state?.currentNoFapStreak ?? 0}</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>{disciplineCopy.bestPrimaryLabel}</Text>
              <Text style={styles.statValue}>{state?.longestNoFapStreak ?? 0}</Text>
            </View>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>CURRENT NO PORN</Text>
              <Text style={styles.statValue}>{state?.currentNoPornStreak ?? 0}</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>BEST NO PORN</Text>
              <Text style={styles.statValue}>{state?.longestNoPornStreak ?? 0}</Text>
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Today · {formatLocalDate()}</Text>

            <Text style={styles.groupLabel}>{disciplineCopy.primaryHabitLabel}</Text>
            <View style={styles.row}>
              {(['clean', 'relapse', 'none'] as TrackerStatus[]).map((value) => (
                <Pressable
                  key={`fap-${value}`}
                  style={[styles.chip, todayLog?.noFapStatus === value ? styles.chipSelected : null]}
                  onPress={() => setStatus('noFapStatus', value)}>
                  <Text style={styles.chipText}>{value}</Text>
                </Pressable>
              ))}
            </View>

            <Text style={styles.groupLabel}>No Porn</Text>
            <View style={styles.row}>
              {(['clean', 'relapse', 'none'] as TrackerStatus[]).map((value) => (
                <Pressable
                  key={`porn-${value}`}
                  style={[styles.chip, todayLog?.noPornStatus === value ? styles.chipSelected : null]}
                  onPress={() => setStatus('noPornStatus', value)}>
                  <Text style={styles.chipText}>{value}</Text>
                </Pressable>
              ))}
            </View>

            <TextInput
              style={[styles.input, styles.multiline]}
              multiline
              placeholder={disciplineCopy.notePlaceholder}
              placeholderTextColor={theme.colors.textMuted}
              value={todayLog?.noFapNote ?? ''}
              onChangeText={(text) => setTodayLog((current) => (current ? { ...current, noFapNote: text } : current))}
            />
            <TextInput
              style={[styles.input, styles.multiline]}
              multiline
              placeholder="No-porn note"
              placeholderTextColor={theme.colors.textMuted}
              value={todayLog?.noPornNote ?? ''}
              onChangeText={(text) => setTodayLog((current) => (current ? { ...current, noPornNote: text } : current))}
            />

            <PrimaryButton label="Save Tracker" onPress={saveTodayLog} />
          </View>
        </>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Calendar</Text>
        <Text style={styles.body}>Gold marks clean days, red marks relapse days.</Text>
        <AppCalendar markedDates={markedDates} current={formatLocalDate()} />
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
  statsRow: { flexDirection: 'row', gap: theme.spacing.md },
  statCard: {
    flex: 1,
    backgroundColor: theme.colors.surfaceAlt,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.accent,
    padding: theme.spacing.md,
    gap: theme.spacing.xs,
  },
  statLabel: { color: theme.colors.textMuted, fontSize: theme.font.sm },
  statValue: { color: theme.colors.textPrimary, fontSize: theme.font.xl, fontWeight: '900' },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  cardTitle: { color: theme.colors.textPrimary, fontSize: theme.font.md, fontWeight: '800' },
  groupLabel: { color: theme.colors.accentGlow, fontSize: theme.font.sm, fontWeight: '700' },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm },
  chip: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: 999,
    backgroundColor: theme.colors.surfaceAlt,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  chipSelected: { backgroundColor: theme.colors.primary, borderColor: theme.colors.accent },
  chipText: { color: theme.colors.textPrimary, fontSize: theme.font.sm, textTransform: 'capitalize' },
  input: {
    backgroundColor: theme.colors.surfaceAlt,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    color: theme.colors.textPrimary,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    fontSize: theme.font.md,
  },
  multiline: { minHeight: 90, textAlignVertical: 'top' },
  section: { gap: theme.spacing.md },
  sectionTitle: { color: theme.colors.textPrimary, fontSize: theme.font.lg, fontWeight: '800' },
});
