import { nanoid } from 'nanoid/non-secure';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, RefreshControl, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { type Href, useFocusEffect, useRouter } from 'expo-router';

import { PrimaryButton } from '../components/PrimaryButton';
import { theme } from '../constants/theme';
import { summarizeFocusSessions } from '../lib/growthEngine';
import { applyLevelProgression } from '../lib/levelSystem';
import { getLocalDateString } from '../lib/haircareEngine';
import { getFocusSessions, getHistory, getProfile, getProgress, setFocusSessions, setHistory, setProgress } from '../lib/storage';
import type { FocusSession, HistoryEntry, QuestCategory } from '../lib/types';

const categories: (QuestCategory | 'deep-work')[] = ['study', 'coding', 'writing', 'career', 'deep-work'];

export default function FocusModeScreen() {
  const router = useRouter();
  const [sessions, setSessions] = useState<FocusSession[]>([]);
  const [category, setCategory] = useState<QuestCategory | 'deep-work'>('deep-work');
  const [label, setLabel] = useState('Deep work');
  const [targetMinutes, setTargetMinutes] = useState('25');
  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null);
  const [activeSession, setActiveSession] = useState<{ label: string; category: QuestCategory | 'deep-work'; targetMinutes: number } | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const profile = await getProfile();
    if (!profile) {
      router.replace('/onboarding' as Href);
      return;
    }
    setSessions((await getFocusSessions()).sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
  }, [router]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  useEffect(() => {
    if (remainingSeconds === null || remainingSeconds <= 0) {
      return;
    }
    const timer = setInterval(() => {
      setRemainingSeconds((current) => {
        if (current === null) return null;
        if (current <= 1) {
          clearInterval(timer);
          return 0;
        }
        return current - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [remainingSeconds]);

  async function handleRefresh() {
    setRefreshing(true);
    try {
      await load();
    } finally {
      setRefreshing(false);
    }
  }

  function startSession() {
    const minutes = Number(targetMinutes);
    if (!minutes || minutes <= 0) {
      Alert.alert('Invalid duration', 'Enter a valid focus duration in minutes.');
      return;
    }
    setActiveSession({ label: label.trim() || 'Focus Session', category, targetMinutes: minutes });
    setRemainingSeconds(minutes * 60);
  }

  async function completeSession() {
    if (!activeSession) return;
    const rewardXP = Math.max(15, activeSession.targetMinutes);
    const nextSession: FocusSession = {
      id: nanoid(),
      date: getLocalDateString(),
      category: activeSession.category,
      label: activeSession.label,
      targetMinutes: activeSession.targetMinutes,
      completedMinutes: activeSession.targetMinutes,
      completed: true,
      rewardXP,
      createdAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
    };

    const [progress, history] = await Promise.all([getProgress(), getHistory()]);
    if (progress) {
      const updatedProgress = {
        ...progress,
        xp: progress.xp + rewardXP,
        totalXP: progress.totalXP + rewardXP,
        stats: {
          ...progress.stats,
          focus: progress.stats.focus + 2,
          discipline: progress.stats.discipline + 1,
        },
      };
      const leveled = applyLevelProgression(updatedProgress);
      await setProgress(leveled.progress);
    }

    const today = getLocalDateString();
    const existing = history.find((entry) => entry.date === today);
    const nextHistory: HistoryEntry[] = existing
      ? history.map((entry) =>
          entry.date === today
            ? { ...entry, xpEarned: entry.xpEarned + rewardXP, questsCompleted: entry.questsCompleted + 1 }
            : entry
        )
      : [...history, { date: today, xpEarned: rewardXP, questsCompleted: 1 }];

    const nextSessions = [nextSession, ...sessions].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    await Promise.all([setHistory(nextHistory), setFocusSessions(nextSessions)]);
    setSessions(nextSessions);
    setActiveSession(null);
    setRemainingSeconds(null);
    Alert.alert('Focus session complete', `You earned ${rewardXP} XP.`);
  }

  const summary = useMemo(() => summarizeFocusSessions(sessions), [sessions]);
  const displayTime =
    remainingSeconds === null
      ? null
      : `${String(Math.floor(remainingSeconds / 60)).padStart(2, '0')}:${String(remainingSeconds % 60).padStart(2, '0')}`;

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}>
      <Pressable onPress={() => router.back()}>
        <Text style={styles.backLink}>Back</Text>
      </Pressable>

      <View style={styles.heroCard}>
        <Text style={styles.kicker}>FOCUS MODE</Text>
        <Text style={styles.title}>Timed work sessions with rewards</Text>
        <Text style={styles.body}>{summary.completedSessions} completed sessions · {summary.totalMinutes} total minutes</Text>
      </View>

      <View style={styles.card}>
        <TextInput
          style={styles.input}
          placeholder="Session label"
          placeholderTextColor={theme.colors.textMuted}
          value={label}
          onChangeText={setLabel}
        />
        <TextInput
          style={styles.input}
          placeholder="Minutes"
          placeholderTextColor={theme.colors.textMuted}
          keyboardType="numeric"
          value={targetMinutes}
          onChangeText={setTargetMinutes}
        />
        <View style={styles.row}>
          {categories.map((item) => (
            <Pressable
              key={item}
              style={[styles.chip, category === item ? styles.chipSelected : null]}
              onPress={() => setCategory(item)}>
              <Text style={styles.chipText}>{item}</Text>
            </Pressable>
          ))}
        </View>
        {activeSession && displayTime ? (
          <View style={styles.timerCard}>
            <Text style={styles.timerLabel}>{activeSession.label}</Text>
            <Text style={styles.timerValue}>{displayTime}</Text>
            <View style={styles.actions}>
              <PrimaryButton label="Complete" onPress={completeSession} />
              <PrimaryButton
                label="Cancel"
                onPress={() => {
                  setActiveSession(null);
                  setRemainingSeconds(null);
                }}
                variant="secondary"
              />
            </View>
          </View>
        ) : (
          <PrimaryButton label="Start Focus Session" onPress={startSession} />
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Sessions</Text>
        {sessions.slice(0, 10).map((session) => (
          <View key={session.id} style={styles.card}>
            <Text style={styles.sessionTitle}>{session.label}</Text>
            <Text style={styles.body}>{session.category} · {session.completedMinutes} min · +{session.rewardXP} XP</Text>
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
  heroCard: { backgroundColor: theme.colors.surface, borderRadius: theme.radius.lg, borderWidth: 1, borderColor: theme.colors.border, padding: theme.spacing.lg, gap: theme.spacing.sm },
  kicker: { color: theme.colors.accentGlow, fontSize: theme.font.sm, fontWeight: '800', letterSpacing: 1 },
  title: { color: theme.colors.textPrimary, fontSize: theme.font.xl, fontWeight: '900' },
  body: { color: theme.colors.textMuted, fontSize: theme.font.md },
  card: { backgroundColor: theme.colors.surface, borderRadius: theme.radius.md, borderWidth: 1, borderColor: theme.colors.border, padding: theme.spacing.md, gap: theme.spacing.sm },
  input: { backgroundColor: theme.colors.surfaceAlt, borderRadius: theme.radius.md, borderWidth: 1, borderColor: theme.colors.border, color: theme.colors.textPrimary, paddingHorizontal: theme.spacing.md, paddingVertical: theme.spacing.md, fontSize: theme.font.md },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm },
  chip: { paddingHorizontal: theme.spacing.md, paddingVertical: theme.spacing.sm, borderRadius: 999, backgroundColor: theme.colors.surfaceAlt, borderWidth: 1, borderColor: theme.colors.border },
  chipSelected: { backgroundColor: theme.colors.primary, borderColor: theme.colors.accent },
  chipText: { color: theme.colors.textPrimary, fontSize: theme.font.sm, textTransform: 'capitalize' },
  timerCard: { gap: theme.spacing.md, alignItems: 'center', paddingVertical: theme.spacing.md },
  timerLabel: { color: theme.colors.textPrimary, fontSize: theme.font.md, fontWeight: '700' },
  timerValue: { color: theme.colors.accent, fontSize: 42, fontWeight: '900' },
  actions: { flexDirection: 'row', gap: theme.spacing.md },
  section: { gap: theme.spacing.md },
  sectionTitle: { color: theme.colors.textPrimary, fontSize: theme.font.lg, fontWeight: '800' },
  sessionTitle: { color: theme.colors.textPrimary, fontSize: theme.font.md, fontWeight: '800' },
});
