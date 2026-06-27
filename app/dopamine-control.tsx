import { useCallback, useMemo, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { type Href, useFocusEffect, useRouter } from 'expo-router';

import { PrimaryButton } from '../components/PrimaryButton';
import { theme } from '../constants/theme';
import { summarizeDopamineControl } from '../lib/growthEngine';
import { getLocalDateString } from '../lib/haircareEngine';
import { getDopamineLogs, getProfile, setDopamineLogs } from '../lib/storage';
import type { DopamineLog } from '../lib/types';

function emptyLog(date: string): DopamineLog {
  return {
    date,
    socialMediaMinutes: 0,
    gamingMinutes: 0,
    shortVideoMinutes: 0,
    junkFood: false,
    pornUsed: false,
    urgeLevel: 3,
    note: '',
  };
}

export default function DopamineControlScreen() {
  const router = useRouter();
  const [logs, setLogs] = useState<DopamineLog[]>([]);
  const [draft, setDraft] = useState<DopamineLog>(emptyLog(getLocalDateString()));
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const profile = await getProfile();
    if (!profile) {
      router.replace('/onboarding' as Href);
      return;
    }

    const stored = (await getDopamineLogs()).sort((a, b) => b.date.localeCompare(a.date));
    const today = getLocalDateString();
    setLogs(stored);
    setDraft(stored.find((entry) => entry.date === today) ?? emptyLog(today));
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

  async function saveEntry() {
    const next = [draft, ...logs.filter((entry) => entry.date !== draft.date)].sort((a, b) => b.date.localeCompare(a.date));
    await setDopamineLogs(next);
    setLogs(next);
  }

  const summary = useMemo(() => summarizeDopamineControl(logs.slice(0, 14)), [logs]);

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}>
      <Pressable onPress={() => router.back()}>
        <Text style={styles.backLink}>Back</Text>
      </Pressable>

      <View style={styles.heroCard}>
        <Text style={styles.kicker}>DOPAMINE CONTROL</Text>
        <Text style={styles.title}>Reduce overstimulation and protect discipline</Text>
        <Text style={styles.body}>
          14-day average urge {summary.averageUrge}/10 · average screen load {summary.averageScreenMinutes} min
        </Text>
      </View>

      <View style={styles.metricsRow}>
        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>HIGH RISK DAYS</Text>
          <Text style={styles.metricValue}>{summary.highRiskDays}</Text>
        </View>
        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>CLEAN DAYS</Text>
          <Text style={styles.metricValue}>{summary.cleanDays}</Text>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Today · {draft.date}</Text>
        <Field
          label="Social media minutes"
          value={draft.socialMediaMinutes}
          onChange={(value) => setDraft((current) => ({ ...current, socialMediaMinutes: value }))}
        />
        <Field
          label="Short video minutes"
          value={draft.shortVideoMinutes}
          onChange={(value) => setDraft((current) => ({ ...current, shortVideoMinutes: value }))}
        />
        <Field
          label="Gaming minutes"
          value={draft.gamingMinutes}
          onChange={(value) => setDraft((current) => ({ ...current, gamingMinutes: value }))}
        />
        <Field
          label="Urge level (1-10)"
          value={draft.urgeLevel}
          onChange={(value) => setDraft((current) => ({ ...current, urgeLevel: Math.max(1, Math.min(10, value)) }))}
        />
        <ToggleRow
          label="Junk food used as dopamine escape"
          value={draft.junkFood}
          onValueChange={(value) => setDraft((current) => ({ ...current, junkFood: value }))}
        />
        <ToggleRow
          label="Porn relapse today"
          value={draft.pornUsed}
          onValueChange={(value) => setDraft((current) => ({ ...current, pornUsed: value }))}
        />
        <TextInput
          style={[styles.input, styles.multiline]}
          placeholder="What triggered your urges today?"
          placeholderTextColor={theme.colors.textMuted}
          value={draft.note}
          onChangeText={(text) => setDraft((current) => ({ ...current, note: text }))}
          multiline
        />
        <PrimaryButton label="Save Dopamine Log" onPress={saveEntry} />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Pattern</Text>
        {logs.slice(0, 7).map((entry) => (
          <View key={entry.date} style={styles.card}>
            <Text style={styles.cardTitle}>{entry.date}</Text>
            <Text style={styles.meta}>
              urge {entry.urgeLevel}/10 · screen {entry.socialMediaMinutes + entry.shortVideoMinutes + entry.gamingMinutes} min
            </Text>
            <Text style={styles.body}>
              {entry.pornUsed ? 'Porn relapse logged.' : 'No porn relapse logged.'} {entry.note || 'No note.'}
            </Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

function Field({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) {
  return (
    <View style={styles.fieldWrap}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        style={styles.input}
        keyboardType="number-pad"
        value={String(value)}
        onChangeText={(text) => onChange(Number(text || 0))}
      />
    </View>
  );
}

function ToggleRow({
  label,
  value,
  onValueChange,
}: {
  label: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
}) {
  return (
    <View style={styles.toggleRow}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <Switch value={value} onValueChange={onValueChange} trackColor={{ true: theme.colors.accent }} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.colors.background },
  content: { padding: theme.spacing.lg, gap: theme.spacing.lg, paddingBottom: theme.spacing.xl * 2 },
  backLink: { color: theme.colors.accentGlow, fontSize: theme.font.sm, fontWeight: '700' },
  heroCard: { backgroundColor: theme.colors.surface, borderRadius: theme.radius.lg, borderWidth: 1, borderColor: theme.colors.border, padding: theme.spacing.lg, gap: theme.spacing.sm },
  kicker: { color: theme.colors.accentGlow, fontSize: theme.font.sm, fontWeight: '800', letterSpacing: 1 },
  title: { color: theme.colors.textPrimary, fontSize: theme.font.xl, fontWeight: '900' },
  body: { color: theme.colors.textMuted, fontSize: theme.font.md, lineHeight: 20 },
  metricsRow: { flexDirection: 'row', gap: theme.spacing.md },
  metricCard: { flex: 1, backgroundColor: theme.colors.surfaceAlt, borderRadius: theme.radius.md, borderWidth: 1, borderColor: theme.colors.accent, padding: theme.spacing.md, gap: theme.spacing.xs },
  metricLabel: { color: theme.colors.textMuted, fontSize: theme.font.sm },
  metricValue: { color: theme.colors.textPrimary, fontSize: theme.font.xl, fontWeight: '900' },
  section: { gap: theme.spacing.md },
  sectionTitle: { color: theme.colors.textPrimary, fontSize: theme.font.lg, fontWeight: '800' },
  card: { backgroundColor: theme.colors.surface, borderRadius: theme.radius.md, borderWidth: 1, borderColor: theme.colors.border, padding: theme.spacing.md, gap: theme.spacing.sm },
  cardTitle: { color: theme.colors.textPrimary, fontSize: theme.font.md, fontWeight: '800' },
  meta: { color: theme.colors.textMuted, fontSize: theme.font.sm },
  fieldWrap: { gap: theme.spacing.xs },
  fieldLabel: { color: theme.colors.textPrimary, fontSize: theme.font.sm, fontWeight: '700' },
  input: { backgroundColor: theme.colors.surfaceAlt, borderRadius: theme.radius.md, borderWidth: 1, borderColor: theme.colors.border, paddingHorizontal: theme.spacing.md, paddingVertical: theme.spacing.sm, color: theme.colors.textPrimary },
  multiline: { minHeight: 96, textAlignVertical: 'top' },
  toggleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: theme.spacing.md },
});
