import { useCallback, useState } from 'react';
import {
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { type Href, useFocusEffect, useRouter } from 'expo-router';

import { PrimaryButton } from '../components/PrimaryButton';
import { theme } from '../constants/theme';
import { buildWeeklyReviewDraft } from '../lib/growthEngine';
import { getCompletionLog, getHistory, getProfile, getWeeklyReviews, setWeeklyReviews } from '../lib/storage';
import type { WeeklyReview } from '../lib/types';

export default function WeeklyReviewScreen() {
  const router = useRouter();
  const [reviews, setReviews] = useState<WeeklyReview[]>([]);
  const [draft, setDraft] = useState<WeeklyReview | null>(null);
  const [visible, setVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const profile = await getProfile();
    if (!profile) {
      router.replace('/onboarding' as Href);
      return;
    }
    const [history, completionLog, stored] = await Promise.all([
      getHistory(),
      getCompletionLog(),
      getWeeklyReviews(),
    ]);
    const autoDraft = buildWeeklyReviewDraft(history, completionLog);
    setDraft(autoDraft);
    setReviews(stored.sort((a, b) => b.weekStartDate.localeCompare(a.weekStartDate)));
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

  async function saveReview() {
    if (!draft) return;
    const nextReview = {
      ...draft,
      updatedAt: new Date().toISOString(),
      createdAt: draft.createdAt || new Date().toISOString(),
    };
    const next = [...reviews.filter((item) => item.weekStartDate !== nextReview.weekStartDate), nextReview].sort((a, b) =>
      b.weekStartDate.localeCompare(a.weekStartDate)
    );
    await setWeeklyReviews(next);
    setReviews(next);
    setVisible(false);
  }

  return (
    <>
      <ScrollView
        style={styles.screen}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.backLink}>Back</Text>
        </Pressable>

        <View style={styles.heroCard}>
          <Text style={styles.kicker}>WEEKLY REVIEW</Text>
          <Text style={styles.title}>Wins, misses, lessons, next move</Text>
          <Text style={styles.body}>Use a weekly review to keep growth intentional instead of reactive.</Text>
        </View>

        {draft ? (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Current Week Draft</Text>
            <Text style={styles.meta}>Week starting {draft.weekStartDate}</Text>
            <Text style={styles.blockLabel}>Wins</Text>
            <Text style={styles.blockBody}>{draft.wins}</Text>
            <Text style={styles.blockLabel}>Misses</Text>
            <Text style={styles.blockBody}>{draft.misses}</Text>
            <Text style={styles.blockLabel}>Lessons</Text>
            <Text style={styles.blockBody}>{draft.lessonsLearned}</Text>
            <Text style={styles.blockLabel}>Next Week Focus</Text>
            <Text style={styles.blockBody}>{draft.nextWeekFocus}</Text>
            <PrimaryButton label="Edit This Review" onPress={() => setVisible(true)} />
          </View>
        ) : null}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Past Reviews</Text>
          {reviews.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>No saved weekly reviews yet.</Text>
            </View>
          ) : (
            reviews.map((review) => (
              <View key={review.weekStartDate} style={styles.card}>
                <Text style={styles.cardTitle}>Week of {review.weekStartDate}</Text>
                <Text style={styles.blockLabel}>Wins</Text>
                <Text style={styles.blockBody}>{review.wins}</Text>
                <Text style={styles.blockLabel}>Next Focus</Text>
                <Text style={styles.blockBody}>{review.nextWeekFocus}</Text>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      <Modal visible={visible} transparent animationType="slide" onRequestClose={() => setVisible(false)}>
        <View style={styles.modalBackdrop}>
          <ScrollView contentContainerStyle={styles.modalContent}>
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>Edit Weekly Review</Text>
              <TextInput
                style={[styles.input, styles.multiline]}
                multiline
                value={draft?.wins ?? ''}
                onChangeText={(text) => setDraft((current) => (current ? { ...current, wins: text } : current))}
                placeholder="Wins"
                placeholderTextColor={theme.colors.textMuted}
              />
              <TextInput
                style={[styles.input, styles.multiline]}
                multiline
                value={draft?.misses ?? ''}
                onChangeText={(text) => setDraft((current) => (current ? { ...current, misses: text } : current))}
                placeholder="Misses"
                placeholderTextColor={theme.colors.textMuted}
              />
              <TextInput
                style={[styles.input, styles.multiline]}
                multiline
                value={draft?.lessonsLearned ?? ''}
                onChangeText={(text) =>
                  setDraft((current) => (current ? { ...current, lessonsLearned: text } : current))
                }
                placeholder="Lessons learned"
                placeholderTextColor={theme.colors.textMuted}
              />
              <TextInput
                style={[styles.input, styles.multiline]}
                multiline
                value={draft?.nextWeekFocus ?? ''}
                onChangeText={(text) => setDraft((current) => (current ? { ...current, nextWeekFocus: text } : current))}
                placeholder="Next week focus"
                placeholderTextColor={theme.colors.textMuted}
              />
              <View style={styles.actions}>
                <PrimaryButton label="Cancel" onPress={() => setVisible(false)} variant="secondary" />
                <PrimaryButton label="Save Review" onPress={saveReview} />
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </>
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
  body: { color: theme.colors.textMuted, fontSize: theme.font.md, lineHeight: 22 },
  section: { gap: theme.spacing.md },
  sectionTitle: { color: theme.colors.textPrimary, fontSize: theme.font.lg, fontWeight: '800' },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  cardTitle: { color: theme.colors.textPrimary, fontSize: theme.font.md, fontWeight: '800' },
  meta: { color: theme.colors.textMuted, fontSize: theme.font.sm },
  blockLabel: { color: theme.colors.accentGlow, fontSize: theme.font.sm, fontWeight: '700' },
  blockBody: { color: theme.colors.textPrimary, fontSize: theme.font.sm, lineHeight: 18 },
  emptyCard: {
    backgroundColor: theme.colors.surfaceAlt,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
  },
  emptyText: { color: theme.colors.textMuted, fontSize: theme.font.sm },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(11, 7, 16, 0.9)' },
  modalContent: { padding: theme.spacing.lg },
  modalCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  modalTitle: { color: theme.colors.textPrimary, fontSize: theme.font.lg, fontWeight: '900' },
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
  multiline: { minHeight: 100, textAlignVertical: 'top' },
  actions: { flexDirection: 'row', gap: theme.spacing.md },
});
