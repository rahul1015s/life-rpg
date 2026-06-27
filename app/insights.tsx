import { useCallback, useMemo, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { type Href, useFocusEffect, useRouter } from 'expo-router';

import { theme } from '../constants/theme';
import {
  buildCategoryInsights,
  buildLifeBalanceRadar,
  buildRecoverySuggestions,
  buildSmartQuestSuggestions,
} from '../lib/growthEngine';
import { getCompletionLog, getHistory, getProfile, getProgress } from '../lib/storage';
import type { CategoryInsight, PlayerProgress } from '../lib/types';

export default function InsightsScreen() {
  const router = useRouter();
  const [progress, setProgress] = useState<PlayerProgress | null>(null);
  const [insights, setInsights] = useState<CategoryInsight[]>([]);
  const [recovery, setRecovery] = useState<ReturnType<typeof buildRecoverySuggestions>>([]);
  const [suggestions, setSuggestions] = useState<ReturnType<typeof buildSmartQuestSuggestions>>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const profile = await getProfile();
    if (!profile) {
      router.replace('/onboarding' as Href);
      return;
    }
    const [savedProgress, completionLog, history] = await Promise.all([getProgress(), getCompletionLog(), getHistory()]);
    if (!savedProgress) {
      router.replace('/onboarding' as Href);
      return;
    }
    setProgress(savedProgress);
    setInsights(buildCategoryInsights(completionLog));
    setRecovery(buildRecoverySuggestions(history));
    setSuggestions(buildSmartQuestSuggestions(savedProgress, completionLog));
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

  const radar = useMemo(() => (progress ? buildLifeBalanceRadar(progress) : []), [progress]);

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}>
      <Pressable onPress={() => router.back()}>
        <Text style={styles.backLink}>Back</Text>
      </Pressable>

      <View style={styles.heroCard}>
        <Text style={styles.kicker}>CATEGORY INSIGHTS</Text>
        <Text style={styles.title}>Patterns, balance, recovery, and next quests</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Body vs Study vs Confidence vs Social</Text>
        {insights.map((item) => (
          <View key={item.label} style={styles.card}>
            <Text style={styles.cardTitle}>{item.label}</Text>
            <Text style={styles.meta}>{item.completed} completed · {item.xp} XP · {item.trend}</Text>
          </View>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Life Balance Radar</Text>
        <View style={styles.row}>
          {radar.map((item) => (
            <View key={item.label} style={styles.radarCard}>
              <Text style={styles.cardTitle}>{item.label}</Text>
              <Text style={styles.radarValue}>{item.value}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recovery System</Text>
        {recovery.length === 0 ? (
          <View style={styles.card}>
            <Text style={styles.meta}>No recovery quests needed right now.</Text>
          </View>
        ) : (
          recovery.map((item) => (
            <View key={item.id} style={styles.card}>
              <Text style={styles.cardTitle}>{item.title}</Text>
              <Text style={styles.meta}>{item.reason}</Text>
              <Text style={styles.body}>{item.description}</Text>
            </View>
          ))
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quest Suggestions</Text>
        {suggestions.map((item) => (
          <View key={item.questId} style={styles.card}>
            <Text style={styles.cardTitle}>{item.title}</Text>
            <Text style={styles.meta}>{item.category} · {item.recommendedTime} · {item.xp} XP</Text>
            <Text style={styles.body}>{item.reason}</Text>
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
  section: { gap: theme.spacing.md },
  sectionTitle: { color: theme.colors.textPrimary, fontSize: theme.font.lg, fontWeight: '800' },
  card: { backgroundColor: theme.colors.surface, borderRadius: theme.radius.md, borderWidth: 1, borderColor: theme.colors.border, padding: theme.spacing.md, gap: theme.spacing.sm },
  cardTitle: { color: theme.colors.textPrimary, fontSize: theme.font.md, fontWeight: '800' },
  meta: { color: theme.colors.textMuted, fontSize: theme.font.sm },
  body: { color: theme.colors.textPrimary, fontSize: theme.font.sm, lineHeight: 18 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.md },
  radarCard: { flex: 1, minWidth: 120, backgroundColor: theme.colors.surfaceAlt, borderRadius: theme.radius.md, borderWidth: 1, borderColor: theme.colors.accent, padding: theme.spacing.md, gap: theme.spacing.xs },
  radarValue: { color: theme.colors.textPrimary, fontSize: theme.font.xl, fontWeight: '900' },
});

