import { nanoid } from 'nanoid/non-secure';
import { useCallback, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { type Href, useFocusEffect, useRouter } from 'expo-router';

import { PrimaryButton } from '../components/PrimaryButton';
import { theme } from '../constants/theme';
import { getLocalDateString } from '../lib/haircareEngine';
import { getJournalEntries, getProfile, setJournalEntries } from '../lib/storage';
import type { ReflectionJournalEntry } from '../lib/types';

export default function JournalScreen() {
  const router = useRouter();
  const [entries, setEntries] = useState<ReflectionJournalEntry[]>([]);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const profile = await getProfile();
    if (!profile) {
      router.replace('/onboarding' as Href);
      return;
    }
    const stored = await getJournalEntries();
    setEntries(stored.sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
  }, [router]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  async function handleRefresh() {
    setRefreshing(true);
    try {
      await load();
    } finally {
      setRefreshing(false);
    }
  }

  async function saveEntry() {
    if (!content.trim()) return;
    const nextEntry: ReflectionJournalEntry = {
      id: nanoid(),
      date: getLocalDateString(),
      title: title.trim() || 'Daily Reflection',
      content: content.trim(),
      createdAt: new Date().toISOString(),
    };
    const next = [nextEntry, ...entries].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    await setJournalEntries(next);
    setEntries(next);
    setTitle('');
    setContent('');
  }

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}>
      <Pressable onPress={() => router.back()}>
        <Text style={styles.backLink}>Back</Text>
      </Pressable>

      <View style={styles.heroCard}>
        <Text style={styles.kicker}>REFLECTION JOURNAL</Text>
        <Text style={styles.title}>Short notes tied to each day</Text>
      </View>

      <View style={styles.card}>
        <TextInput
          style={styles.input}
          placeholder="Title"
          placeholderTextColor={theme.colors.textMuted}
          value={title}
          onChangeText={setTitle}
        />
        <TextInput
          style={[styles.input, styles.multiline]}
          multiline
          placeholder="What happened today? What did you learn?"
          placeholderTextColor={theme.colors.textMuted}
          value={content}
          onChangeText={setContent}
        />
        <PrimaryButton label="Save Journal Entry" onPress={saveEntry} />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Entries</Text>
        {entries.map((entry) => (
          <View key={entry.id} style={styles.card}>
            <Text style={styles.entryTitle}>{entry.title}</Text>
            <Text style={styles.entryMeta}>{entry.date}</Text>
            <Text style={styles.entryBody}>{entry.content}</Text>
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
  card: { backgroundColor: theme.colors.surface, borderRadius: theme.radius.md, borderWidth: 1, borderColor: theme.colors.border, padding: theme.spacing.md, gap: theme.spacing.sm },
  input: { backgroundColor: theme.colors.surfaceAlt, borderRadius: theme.radius.md, borderWidth: 1, borderColor: theme.colors.border, color: theme.colors.textPrimary, paddingHorizontal: theme.spacing.md, paddingVertical: theme.spacing.md, fontSize: theme.font.md },
  multiline: { minHeight: 120, textAlignVertical: 'top' },
  section: { gap: theme.spacing.md },
  sectionTitle: { color: theme.colors.textPrimary, fontSize: theme.font.lg, fontWeight: '800' },
  entryTitle: { color: theme.colors.textPrimary, fontSize: theme.font.md, fontWeight: '800' },
  entryMeta: { color: theme.colors.textMuted, fontSize: theme.font.sm },
  entryBody: { color: theme.colors.textPrimary, fontSize: theme.font.sm, lineHeight: 18 },
});

