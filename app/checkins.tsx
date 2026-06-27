import { nanoid } from 'nanoid/non-secure';
import { useCallback, useMemo, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { type Href, useFocusEffect, useRouter } from 'expo-router';

import { PrimaryButton } from '../components/PrimaryButton';
import { theme } from '../constants/theme';
import { buildCheckInTrend } from '../lib/growthEngine';
import { getLocalDateString } from '../lib/haircareEngine';
import { getDailyCheckIns, getProfile, setDailyCheckIns } from '../lib/storage';
import type { DailyCheckIn } from '../lib/types';

type CheckInForm = Omit<DailyCheckIn, 'id' | 'createdAt'>;

function emptyForm(period: 'morning' | 'night'): CheckInForm {
  return {
    date: getLocalDateString(),
    period,
    mood: 3,
    energy: 3,
    sleep: 3,
    confidence: 3,
    focus: 3,
    note: '',
  };
}

export default function CheckInsScreen() {
  const router = useRouter();
  const [entries, setEntries] = useState<DailyCheckIn[]>([]);
  const [form, setForm] = useState<CheckInForm>(emptyForm('morning'));
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const profile = await getProfile();
    if (!profile) {
      router.replace('/onboarding' as Href);
      return;
    }
    const stored = await getDailyCheckIns();
    setEntries(stored.sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
  }, [router]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  async function saveEntry() {
    const nextEntry: DailyCheckIn = { ...form, id: nanoid(), createdAt: new Date().toISOString() };
    const next = [nextEntry, ...entries].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    await setDailyCheckIns(next);
    setEntries(next);
    setForm(emptyForm(form.period));
  }

  async function handleRefresh() {
    setRefreshing(true);
    try {
      await load();
    } finally {
      setRefreshing(false);
    }
  }

  const trend = useMemo(() => buildCheckInTrend(entries.slice(0, 14)), [entries]);

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}>
      <Pressable onPress={() => router.back()}>
        <Text style={styles.backLink}>Back</Text>
      </Pressable>

      <View style={styles.heroCard}>
        <Text style={styles.kicker}>CHECK-INS</Text>
        <Text style={styles.title}>Morning and night state tracking</Text>
        <Text style={styles.body}>Mood {trend.averageMood} · Focus {trend.averageFocus} · Energy {trend.averageEnergy}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Today’s Check-In</Text>
        <View style={styles.row}>
          {(['morning', 'night'] as const).map((period) => (
            <Pressable
              key={period}
              style={[styles.chip, form.period === period ? styles.chipSelected : null]}
              onPress={() => setForm((current) => ({ ...current, period }))}>
              <Text style={styles.chipText}>{period}</Text>
            </Pressable>
          ))}
        </View>
        {(['mood', 'energy', 'sleep', 'confidence', 'focus'] as const).map((field) => (
          <View key={field} style={styles.scaleRow}>
            <Text style={styles.scaleLabel}>{field}</Text>
            <View style={styles.row}>
              {[1, 2, 3, 4, 5].map((value) => (
                <Pressable
                  key={value}
                  style={[styles.scaleChip, form[field] === value ? styles.chipSelected : null]}
                  onPress={() => setForm((current) => ({ ...current, [field]: value }))}>
                  <Text style={styles.chipText}>{value}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        ))}
        <TextInput
          style={[styles.input, styles.multiline]}
          multiline
          placeholder="Short reflection"
          placeholderTextColor={theme.colors.textMuted}
          value={form.note}
          onChangeText={(text) => setForm((current) => ({ ...current, note: text }))}
        />
        <PrimaryButton label="Save Check-In" onPress={saveEntry} />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Entries</Text>
        {entries.slice(0, 10).map((entry) => (
          <View key={entry.id} style={styles.card}>
            <Text style={styles.cardTitle}>{entry.date} · {entry.period}</Text>
            <Text style={styles.body}>Mood {entry.mood} · Energy {entry.energy} · Sleep {entry.sleep} · Confidence {entry.confidence} · Focus {entry.focus}</Text>
            {entry.note ? <Text style={styles.note}>{entry.note}</Text> : null}
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
  cardTitle: { color: theme.colors.textPrimary, fontSize: theme.font.md, fontWeight: '800' },
  section: { gap: theme.spacing.md },
  sectionTitle: { color: theme.colors.textPrimary, fontSize: theme.font.lg, fontWeight: '800' },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm },
  chip: { paddingHorizontal: theme.spacing.md, paddingVertical: theme.spacing.sm, borderRadius: 999, backgroundColor: theme.colors.surfaceAlt, borderWidth: 1, borderColor: theme.colors.border },
  scaleChip: { minWidth: 44, alignItems: 'center', paddingHorizontal: theme.spacing.sm, paddingVertical: theme.spacing.sm, borderRadius: 999, backgroundColor: theme.colors.surfaceAlt, borderWidth: 1, borderColor: theme.colors.border },
  chipSelected: { backgroundColor: theme.colors.primary, borderColor: theme.colors.accent },
  chipText: { color: theme.colors.textPrimary, fontSize: theme.font.sm, textTransform: 'capitalize' },
  scaleRow: { gap: theme.spacing.sm },
  scaleLabel: { color: theme.colors.accentGlow, fontSize: theme.font.sm, fontWeight: '700', textTransform: 'capitalize' },
  input: { backgroundColor: theme.colors.surfaceAlt, borderRadius: theme.radius.md, borderWidth: 1, borderColor: theme.colors.border, color: theme.colors.textPrimary, paddingHorizontal: theme.spacing.md, paddingVertical: theme.spacing.md, fontSize: theme.font.md },
  multiline: { minHeight: 90, textAlignVertical: 'top' },
  note: { color: theme.colors.textPrimary, fontSize: theme.font.sm, lineHeight: 18 },
});

