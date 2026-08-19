import { useCallback, useState } from 'react';
import {
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { type Href, useFocusEffect, useRouter } from 'expo-router';

import { ChronicleButton } from '../components/chronicle/ChronicleButton';
import { ChronicleCard } from '../components/chronicle/ChronicleCard';
import { ChronicleInput } from '../components/chronicle/ChronicleInput';
import { ChronicleSectionHeader } from '../components/chronicle/ChronicleSectionHeader';
import { chronicleColors, chronicleFontFamily, chronicleSpacing, chronicleType } from '../theme/chronicle';
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
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={chronicleColors.accentGold}
            colors={[chronicleColors.accentGold]}
          />
        }>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.backLink}>Back</Text>
        </Pressable>

        <ChronicleCard style={styles.heroCard}>
          <Text style={styles.kicker}>WEEKLY REVIEW</Text>
          <Text style={styles.title}>Wins, misses, lessons, next move</Text>
          <Text style={styles.body}>Use a weekly review to keep growth intentional instead of reactive.</Text>
        </ChronicleCard>

        {draft ? (
          <ChronicleCard style={styles.card}>
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
            <ChronicleButton label="Edit This Review" onPress={() => setVisible(true)} />
          </ChronicleCard>
        ) : null}

        <View style={styles.section}>
          <ChronicleSectionHeader title="Past Reviews" />
          {reviews.length === 0 ? (
            <ChronicleCard>
              <Text style={styles.emptyText}>No saved weekly reviews yet.</Text>
            </ChronicleCard>
          ) : (
            reviews.map((review) => (
              <ChronicleCard key={review.weekStartDate} style={styles.card}>
                <Text style={styles.weekTitle}>Week of {review.weekStartDate}</Text>
                <Text style={styles.blockLabel}>Wins</Text>
                <Text style={styles.blockBody}>{review.wins}</Text>
                <Text style={styles.blockLabel}>Next Focus</Text>
                <Text style={styles.blockBody}>{review.nextWeekFocus}</Text>
              </ChronicleCard>
            ))
          )}
        </View>
      </ScrollView>

      <Modal visible={visible} transparent animationType="slide" onRequestClose={() => setVisible(false)}>
        <View style={styles.modalBackdrop}>
          <ScrollView contentContainerStyle={styles.modalContent}>
            <ChronicleCard style={styles.modalCard}>
              <Text style={styles.modalTitle}>Edit Weekly Review</Text>
              <ChronicleInput
                multiline
                value={draft?.wins ?? ''}
                onChangeText={(text) => setDraft((current) => (current ? { ...current, wins: text } : current))}
                placeholder="Wins"
              />
              <ChronicleInput
                multiline
                value={draft?.misses ?? ''}
                onChangeText={(text) => setDraft((current) => (current ? { ...current, misses: text } : current))}
                placeholder="Misses"
              />
              <ChronicleInput
                multiline
                value={draft?.lessonsLearned ?? ''}
                onChangeText={(text) =>
                  setDraft((current) => (current ? { ...current, lessonsLearned: text } : current))
                }
                placeholder="Lessons learned"
              />
              <ChronicleInput
                multiline
                value={draft?.nextWeekFocus ?? ''}
                onChangeText={(text) => setDraft((current) => (current ? { ...current, nextWeekFocus: text } : current))}
                placeholder="Next week focus"
              />
              <View style={styles.actions}>
                <View style={styles.action}>
                  <ChronicleButton label="Cancel" onPress={() => setVisible(false)} variant="secondary" />
                </View>
                <View style={styles.action}>
                  <ChronicleButton label="Save Review" onPress={saveReview} />
                </View>
              </View>
            </ChronicleCard>
          </ScrollView>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: chronicleColors.bgBase },
  content: { padding: chronicleSpacing.lg, gap: chronicleSpacing.lg, paddingBottom: chronicleSpacing.xl * 2 },
  backLink: {
    color: chronicleColors.accentGold,
    fontFamily: chronicleFontFamily.bodySemiBold,
    fontSize: chronicleType.sm,
  },
  heroCard: { gap: chronicleSpacing.sm },
  kicker: {
    color: chronicleColors.textMuted,
    fontFamily: chronicleFontFamily.mono,
    fontSize: chronicleType.xs,
    letterSpacing: 1,
  },
  title: {
    color: chronicleColors.textPrimary,
    fontFamily: chronicleFontFamily.display,
    fontSize: chronicleType.lg,
    letterSpacing: 0.5,
  },
  body: {
    color: chronicleColors.textMuted,
    fontFamily: chronicleFontFamily.body,
    fontSize: chronicleType.md,
    lineHeight: 24,
  },
  section: { gap: chronicleSpacing.md },
  card: { gap: chronicleSpacing.sm },
  cardTitle: {
    color: chronicleColors.textPrimary,
    fontFamily: chronicleFontFamily.display,
    fontSize: chronicleType.md,
    letterSpacing: 0.5,
  },
  weekTitle: {
    color: chronicleColors.textPrimary,
    fontFamily: chronicleFontFamily.mono,
    fontSize: chronicleType.md,
    letterSpacing: 0.5,
  },
  meta: {
    color: chronicleColors.textMuted,
    fontFamily: chronicleFontFamily.mono,
    fontSize: chronicleType.xs,
    letterSpacing: 0.5,
  },
  blockLabel: {
    color: chronicleColors.accentGold,
    fontFamily: chronicleFontFamily.bodySemiBold,
    fontSize: chronicleType.sm,
  },
  blockBody: {
    color: chronicleColors.textPrimary,
    fontFamily: chronicleFontFamily.body,
    fontSize: chronicleType.sm,
    lineHeight: 20,
  },
  emptyText: {
    color: chronicleColors.textMuted,
    fontFamily: chronicleFontFamily.body,
    fontSize: chronicleType.sm,
  },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(18, 20, 28, 0.92)' },
  modalContent: { padding: chronicleSpacing.lg },
  modalCard: { gap: chronicleSpacing.md },
  modalTitle: {
    color: chronicleColors.textPrimary,
    fontFamily: chronicleFontFamily.display,
    fontSize: chronicleType.lg,
    letterSpacing: 0.5,
  },
  actions: { flexDirection: 'row', gap: chronicleSpacing.md },
  action: { flex: 1 },
});
