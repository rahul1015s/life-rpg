import { useCallback, useMemo, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { nanoid } from 'nanoid/non-secure';
import { type Href, useFocusEffect, useRouter } from 'expo-router';

import { PrimaryButton } from '../components/PrimaryButton';
import { theme } from '../constants/theme';
import { buildRelapseInsights } from '../lib/growthEngine';
import { getLocalDateString } from '../lib/haircareEngine';
import { getDopamineLogs, getMensHealthLogs, getProfile, getRelapseReflections, setRelapseReflections } from '../lib/storage';
import type { RelapseReflection } from '../lib/types';

function emptyReflection(date: string): RelapseReflection {
  return {
    id: nanoid(),
    date,
    trigger: '',
    timeOfDay: 'night',
    urgeLevel: 6,
    actionTaken: '',
    recoveryPlan: '',
    note: '',
    createdAt: new Date().toISOString(),
  };
}

const times: RelapseReflection['timeOfDay'][] = ['morning', 'afternoon', 'evening', 'night'];

export default function RelapseAnalysisScreen() {
  const router = useRouter();
  const [mensLogs, setMensLogs] = useState(awaitableEmptyMensLogs);
  const [dopamineLogs, setDopamineState] = useState(awaitableEmptyDopamineLogs);
  const [reflections, setReflections] = useState<RelapseReflection[]>([]);
  const [draft, setDraft] = useState<RelapseReflection>(emptyReflection(getLocalDateString()));
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const profile = await getProfile();
    if (!profile) {
      router.replace('/onboarding' as Href);
      return;
    }
    const [savedMensLogs, savedDopamine, savedReflections] = await Promise.all([
      getMensHealthLogs(),
      getDopamineLogs(),
      getRelapseReflections(),
    ]);
    setMensLogs(savedMensLogs);
    setDopamineState(savedDopamine);
    setReflections(savedReflections.sort((a, b) => b.date.localeCompare(a.date)));
    setDraft(emptyReflection(getLocalDateString()));
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

  async function saveReflection() {
    const next = [draft, ...reflections].sort((a, b) => b.date.localeCompare(a.date));
    await setRelapseReflections(next);
    setReflections(next);
    setDraft(emptyReflection(getLocalDateString()));
  }

  const insight = useMemo(() => buildRelapseInsights(mensLogs, dopamineLogs, reflections), [mensLogs, dopamineLogs, reflections]);

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}>
      <Pressable onPress={() => router.back()}>
        <Text style={styles.backLink}>Back</Text>
      </Pressable>

      <View style={styles.heroCard}>
        <Text style={styles.kicker}>RELAPSE ANALYSIS</Text>
        <Text style={styles.title}>Understand triggers and recover faster</Text>
        <Text style={styles.body}>{insight.recentRiskPattern}</Text>
      </View>

      <View style={styles.metricsRow}>
        <Metric label="RELAPSE DAYS" value={String(insight.relapseDays)} />
        <Metric label="TOP TRIGGER" value={insight.topTrigger} />
      </View>

      <View style={styles.metricsRow}>
        <Metric label="RISK TIME" value={insight.highestRiskTime} />
        <Metric label="REFLECTIONS" value={String(reflections.length)} />
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Log a reflection</Text>
        <TextInput
          style={styles.input}
          value={draft.trigger}
          onChangeText={(text) => setDraft((current) => ({ ...current, trigger: text }))}
          placeholder="Trigger: boredom, loneliness, phone in bed..."
          placeholderTextColor={theme.colors.textMuted}
        />
        <View style={styles.row}>
          {times.map((time) => (
            <Pressable
              key={time}
              style={[styles.chip, draft.timeOfDay === time ? styles.chipSelected : null]}
              onPress={() => setDraft((current) => ({ ...current, timeOfDay: time }))}>
              <Text style={styles.chipText}>{time}</Text>
            </Pressable>
          ))}
        </View>
        <TextInput
          style={styles.input}
          keyboardType="number-pad"
          value={String(draft.urgeLevel)}
          onChangeText={(text) => setDraft((current) => ({ ...current, urgeLevel: Math.max(1, Math.min(10, Number(text || 1))) }))}
          placeholder="Urge level"
          placeholderTextColor={theme.colors.textMuted}
        />
        <TextInput
          style={styles.input}
          value={draft.actionTaken}
          onChangeText={(text) => setDraft((current) => ({ ...current, actionTaken: text }))}
          placeholder="What did you do in the moment?"
          placeholderTextColor={theme.colors.textMuted}
        />
        <TextInput
          style={styles.input}
          value={draft.recoveryPlan}
          onChangeText={(text) => setDraft((current) => ({ ...current, recoveryPlan: text }))}
          placeholder="Next time recovery plan"
          placeholderTextColor={theme.colors.textMuted}
        />
        <TextInput
          style={[styles.input, styles.multiline]}
          value={draft.note}
          onChangeText={(text) => setDraft((current) => ({ ...current, note: text }))}
          placeholder="Short lesson learned"
          placeholderTextColor={theme.colors.textMuted}
          multiline
        />
        <PrimaryButton label="Save Reflection" onPress={saveReflection} />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent reflections</Text>
        {reflections.slice(0, 8).map((entry) => (
          <View key={entry.id} style={styles.card}>
            <Text style={styles.cardTitle}>{entry.date} · {entry.timeOfDay}</Text>
            <Text style={styles.meta}>Trigger: {entry.trigger || 'Not set'} · urge {entry.urgeLevel}/10</Text>
            <Text style={styles.body}>{entry.recoveryPlan || entry.note || 'No recovery plan saved yet.'}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metricCard}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.metricValue}>{value}</Text>
    </View>
  );
}

const awaitableEmptyMensLogs: Awaited<ReturnType<typeof getMensHealthLogs>> = [];
const awaitableEmptyDopamineLogs: Awaited<ReturnType<typeof getDopamineLogs>> = [];

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.colors.background },
  content: { padding: theme.spacing.lg, gap: theme.spacing.lg, paddingBottom: theme.spacing.xl * 2 },
  backLink: { color: theme.colors.accentGlow, fontSize: theme.font.sm, fontWeight: '700' },
  heroCard: { backgroundColor: theme.colors.surface, borderRadius: theme.radius.lg, borderWidth: 1, borderColor: theme.colors.border, padding: theme.spacing.lg, gap: theme.spacing.sm },
  kicker: { color: theme.colors.accentGlow, fontSize: theme.font.sm, fontWeight: '800', letterSpacing: 1 },
  title: { color: theme.colors.textPrimary, fontSize: theme.font.xl, fontWeight: '900' },
  body: { color: theme.colors.textPrimary, fontSize: theme.font.sm, lineHeight: 20 },
  meta: { color: theme.colors.textMuted, fontSize: theme.font.sm },
  metricsRow: { flexDirection: 'row', gap: theme.spacing.md },
  metricCard: { flex: 1, backgroundColor: theme.colors.surfaceAlt, borderRadius: theme.radius.md, borderWidth: 1, borderColor: theme.colors.accent, padding: theme.spacing.md, gap: theme.spacing.xs },
  metricLabel: { color: theme.colors.textMuted, fontSize: theme.font.sm },
  metricValue: { color: theme.colors.textPrimary, fontSize: theme.font.md, fontWeight: '900' },
  section: { gap: theme.spacing.md },
  sectionTitle: { color: theme.colors.textPrimary, fontSize: theme.font.lg, fontWeight: '800' },
  card: { backgroundColor: theme.colors.surface, borderRadius: theme.radius.md, borderWidth: 1, borderColor: theme.colors.border, padding: theme.spacing.md, gap: theme.spacing.sm },
  cardTitle: { color: theme.colors.textPrimary, fontSize: theme.font.md, fontWeight: '800' },
  input: { backgroundColor: theme.colors.surfaceAlt, borderRadius: theme.radius.md, borderWidth: 1, borderColor: theme.colors.border, paddingHorizontal: theme.spacing.md, paddingVertical: theme.spacing.sm, color: theme.colors.textPrimary },
  multiline: { minHeight: 96, textAlignVertical: 'top' },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm },
  chip: { paddingHorizontal: theme.spacing.md, paddingVertical: theme.spacing.sm, borderRadius: 999, backgroundColor: theme.colors.surfaceAlt, borderWidth: 1, borderColor: theme.colors.border },
  chipSelected: { backgroundColor: theme.colors.primary, borderColor: theme.colors.accent },
  chipText: { color: theme.colors.textPrimary, fontSize: theme.font.sm, textTransform: 'capitalize' },
});
