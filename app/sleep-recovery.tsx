import { useCallback, useMemo, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { type Href, useFocusEffect, useRouter } from 'expo-router';

import { PrimaryButton } from '../components/PrimaryButton';
import { theme } from '../constants/theme';
import { summarizeSleepRecovery } from '../lib/growthEngine';
import { getLocalDateString } from '../lib/haircareEngine';
import { getProfile, getSleepEntries, setSleepEntries } from '../lib/storage';
import type { SleepRecoveryEntry } from '../lib/types';

function emptyEntry(date: string): SleepRecoveryEntry {
  return {
    date,
    bedTime: '23:30',
    wakeTime: '07:30',
    hoursSlept: 8,
    sleepQuality: 7,
    screenCutoffTime: '22:30',
    lateCaffeine: false,
    note: '',
  };
}

export default function SleepRecoveryScreen() {
  const router = useRouter();
  const [entries, setEntries] = useState<SleepRecoveryEntry[]>([]);
  const [draft, setDraft] = useState<SleepRecoveryEntry>(emptyEntry(getLocalDateString()));
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const profile = await getProfile();
    if (!profile) {
      router.replace('/onboarding' as Href);
      return;
    }

    const stored = (await getSleepEntries()).sort((a, b) => b.date.localeCompare(a.date));
    const today = getLocalDateString();
    setEntries(stored);
    setDraft(stored.find((entry) => entry.date === today) ?? emptyEntry(today));
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
    const next = [draft, ...entries.filter((entry) => entry.date !== draft.date)].sort((a, b) => b.date.localeCompare(a.date));
    await setSleepEntries(next);
    setEntries(next);
  }

  const summary = useMemo(() => summarizeSleepRecovery(entries.slice(0, 14)), [entries]);

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}>
      <Pressable onPress={() => router.back()}>
        <Text style={styles.backLink}>Back</Text>
      </Pressable>

      <View style={styles.heroCard}>
        <Text style={styles.kicker}>SLEEP RECOVERY</Text>
        <Text style={styles.title}>Repair sleep debt and recover energy</Text>
        <Text style={styles.body}>
          14-day average {summary.averageHours}h sleep · quality {summary.averageQuality}/10 · debt {summary.sleepDebtHours}h
        </Text>
      </View>

      <View style={styles.metricsRow}>
        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>LATE CAFFEINE</Text>
          <Text style={styles.metricValue}>{summary.lateCaffeineDays}</Text>
        </View>
        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>TARGET HOURS</Text>
          <Text style={styles.metricValue}>{summary.averageHours >= 7.5 ? 'ON' : 'LOW'}</Text>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Today · {draft.date}</Text>
        <TimeField label="Bed time" value={draft.bedTime} onChange={(value) => setDraft((current) => ({ ...current, bedTime: value }))} />
        <TimeField label="Wake time" value={draft.wakeTime} onChange={(value) => setDraft((current) => ({ ...current, wakeTime: value }))} />
        <NumberField
          label="Hours slept"
          value={draft.hoursSlept}
          onChange={(value) => setDraft((current) => ({ ...current, hoursSlept: value }))}
        />
        <NumberField
          label="Sleep quality (1-10)"
          value={draft.sleepQuality}
          onChange={(value) => setDraft((current) => ({ ...current, sleepQuality: Math.max(1, Math.min(10, value)) }))}
        />
        <TimeField
          label="Screen cutoff time"
          value={draft.screenCutoffTime}
          onChange={(value) => setDraft((current) => ({ ...current, screenCutoffTime: value }))}
        />
        <View style={styles.toggleRow}>
          <Text style={styles.fieldLabel}>Late caffeine after 4 PM</Text>
          <Switch
            value={draft.lateCaffeine}
            onValueChange={(value) => setDraft((current) => ({ ...current, lateCaffeine: value }))}
            trackColor={{ true: theme.colors.accent }}
          />
        </View>
        <TextInput
          style={[styles.input, styles.multiline]}
          value={draft.note}
          onChangeText={(text) => setDraft((current) => ({ ...current, note: text }))}
          placeholder="What helped or hurt sleep today?"
          placeholderTextColor={theme.colors.textMuted}
          multiline
        />
        <PrimaryButton label="Save Sleep Log" onPress={saveEntry} />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Nights</Text>
        {entries.slice(0, 7).map((entry) => (
          <View key={entry.date} style={styles.card}>
            <Text style={styles.cardTitle}>{entry.date}</Text>
            <Text style={styles.body}>
              {entry.bedTime} to {entry.wakeTime} · {entry.hoursSlept}h · quality {entry.sleepQuality}/10
            </Text>
            <Text style={styles.meta}>{entry.note || 'No note.'}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

function NumberField({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) {
  return (
    <View style={styles.fieldWrap}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput style={styles.input} keyboardType="decimal-pad" value={String(value)} onChangeText={(text) => onChange(Number(text || 0))} />
    </View>
  );
}

function TimeField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <View style={styles.fieldWrap}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput style={styles.input} value={value} onChangeText={onChange} placeholder="23:00" placeholderTextColor={theme.colors.textMuted} />
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
  body: { color: theme.colors.textPrimary, fontSize: theme.font.sm, lineHeight: 20 },
  meta: { color: theme.colors.textMuted, fontSize: theme.font.sm },
  metricsRow: { flexDirection: 'row', gap: theme.spacing.md },
  metricCard: { flex: 1, backgroundColor: theme.colors.surfaceAlt, borderRadius: theme.radius.md, borderWidth: 1, borderColor: theme.colors.accent, padding: theme.spacing.md, gap: theme.spacing.xs },
  metricLabel: { color: theme.colors.textMuted, fontSize: theme.font.sm },
  metricValue: { color: theme.colors.textPrimary, fontSize: theme.font.lg, fontWeight: '900' },
  section: { gap: theme.spacing.md },
  sectionTitle: { color: theme.colors.textPrimary, fontSize: theme.font.lg, fontWeight: '800' },
  card: { backgroundColor: theme.colors.surface, borderRadius: theme.radius.md, borderWidth: 1, borderColor: theme.colors.border, padding: theme.spacing.md, gap: theme.spacing.sm },
  cardTitle: { color: theme.colors.textPrimary, fontSize: theme.font.md, fontWeight: '800' },
  fieldWrap: { gap: theme.spacing.xs },
  fieldLabel: { color: theme.colors.textPrimary, fontSize: theme.font.sm, fontWeight: '700' },
  input: { backgroundColor: theme.colors.surfaceAlt, borderRadius: theme.radius.md, borderWidth: 1, borderColor: theme.colors.border, paddingHorizontal: theme.spacing.md, paddingVertical: theme.spacing.sm, color: theme.colors.textPrimary },
  multiline: { minHeight: 96, textAlignVertical: 'top' },
  toggleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: theme.spacing.md },
});
