import { nanoid } from 'nanoid/non-secure';
import { useCallback, useMemo, useState } from 'react';
import { Modal, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { type Href, useFocusEffect, useRouter } from 'expo-router';

import { ChronicleButton } from '../components/chronicle/ChronicleButton';
import { ChronicleCard } from '../components/chronicle/ChronicleCard';
import { ChronicleInput } from '../components/chronicle/ChronicleInput';
import { chronicleColors, chronicleFontFamily, chronicleSpacing, chronicleType } from '../theme/chronicle';
import { getActiveMilestones } from '../lib/growthEngine';
import { getMilestones, getProfile, setMilestones } from '../lib/storage';
import type { MilestoneVision } from '../lib/types';

function emptyMilestone(): MilestoneVision {
  return {
    id: '',
    title: '',
    timeframeDays: 30,
    targetDate: '',
    vision: '',
    progressPercent: 0,
    status: 'active',
    createdAt: '',
    completedAt: null,
  };
}

export default function MilestonesScreen() {
  const router = useRouter();
  const [milestones, setMilestonesState] = useState<MilestoneVision[]>([]);
  const [editing, setEditing] = useState<MilestoneVision | null>(null);
  const [visible, setVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const profile = await getProfile();
    if (!profile) {
      router.replace('/onboarding' as Href);
      return;
    }
    setMilestonesState((await getMilestones()).sort((a, b) => a.targetDate.localeCompare(b.targetDate)));
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

  async function saveMilestone() {
    if (!editing || !editing.title.trim()) return;
    const nextMilestone: MilestoneVision = {
      ...editing,
      id: editing.id || nanoid(),
      createdAt: editing.createdAt || new Date().toISOString(),
      targetDate: editing.targetDate || new Date().toISOString().slice(0, 10),
      completedAt: editing.status === 'completed' ? editing.completedAt ?? new Date().toISOString() : null,
    };
    const next = [...milestones.filter((item) => item.id !== nextMilestone.id), nextMilestone].sort((a, b) =>
      a.targetDate.localeCompare(b.targetDate)
    );
    await setMilestones(next);
    setMilestonesState(next);
    setVisible(false);
  }

  const active = useMemo(() => getActiveMilestones(milestones), [milestones]);

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
          <Text style={styles.kicker}>MILESTONES / VISION</Text>
          <Text style={styles.title}>30-day, 90-day, and 1-year direction</Text>
          <Text style={styles.heroMeta}>{active.length} active milestones</Text>
        </ChronicleCard>

        <ChronicleButton
          label="Add Milestone"
          onPress={() => {
            setEditing(emptyMilestone());
            setVisible(true);
          }}
        />

        {milestones.length === 0 ? (
          <ChronicleCard style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>No milestones yet</Text>
            <Text style={styles.emptyBody}>Set a 30-day, 90-day, or 1-year vision above to track your long-range direction.</Text>
          </ChronicleCard>
        ) : null}

        {milestones.map((milestone) => (
          <ChronicleCard key={milestone.id} style={styles.card}>
            <Text style={styles.cardTitle}>{milestone.title}</Text>
            <Text style={styles.meta}>{milestone.timeframeDays} days · target {milestone.targetDate}</Text>
            <Text style={styles.body}>{milestone.vision}</Text>
            <Text style={styles.meta}>{milestone.progressPercent}% · {milestone.status}</Text>
            <View style={styles.actions}>
              <View style={styles.action}>
                <ChronicleButton
                  label="Edit"
                  onPress={() => {
                    setEditing(milestone);
                    setVisible(true);
                  }}
                  variant="secondary"
                />
              </View>
            </View>
          </ChronicleCard>
        ))}
      </ScrollView>

      <Modal visible={visible} transparent animationType="slide" onRequestClose={() => setVisible(false)}>
        <View style={styles.modalBackdrop}>
          <ScrollView contentContainerStyle={styles.modalContent}>
            <ChronicleCard style={styles.modalCard}>
              <Text style={styles.modalTitle}>{editing?.id ? 'Edit Milestone' : 'Create Milestone'}</Text>
              <ChronicleInput placeholder="Title" value={editing?.title ?? ''} onChangeText={(text) => setEditing((current) => (current ? { ...current, title: text } : current))} />
              <ChronicleInput placeholder="Target date YYYY-MM-DD" value={editing?.targetDate ?? ''} onChangeText={(text) => setEditing((current) => (current ? { ...current, targetDate: text } : current))} />
              <ChronicleInput placeholder="Progress %" keyboardType="numeric" value={String(editing?.progressPercent ?? 0)} onChangeText={(text) => setEditing((current) => (current ? { ...current, progressPercent: Number(text) || 0 } : current))} />
              <ChronicleInput multiline placeholder="Vision" value={editing?.vision ?? ''} onChangeText={(text) => setEditing((current) => (current ? { ...current, vision: text } : current))} />
              <View style={styles.row}>
                {[30, 90, 365].map((days) => (
                  <Pressable key={days} hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }} style={[styles.chip, editing?.timeframeDays === days ? styles.chipSelected : null]} onPress={() => setEditing((current) => (current ? { ...current, timeframeDays: days as 30 | 90 | 365 } : current))}>
                    <Text style={[styles.chipText, editing?.timeframeDays === days ? styles.chipTextSelected : null]}>{days}d</Text>
                  </Pressable>
                ))}
                {(['active', 'completed'] as const).map((status) => (
                  <Pressable key={status} hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }} style={[styles.chip, editing?.status === status ? styles.chipSelected : null]} onPress={() => setEditing((current) => (current ? { ...current, status } : current))}>
                    <Text style={[styles.chipText, editing?.status === status ? styles.chipTextSelected : null]}>{status}</Text>
                  </Pressable>
                ))}
              </View>
              <View style={styles.actions}>
                <View style={styles.action}>
                  <ChronicleButton label="Cancel" onPress={() => setVisible(false)} variant="secondary" />
                </View>
                <View style={styles.action}>
                  <ChronicleButton label="Save Milestone" onPress={saveMilestone} />
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
  heroMeta: {
    color: chronicleColors.textMuted,
    fontFamily: chronicleFontFamily.mono,
    fontSize: chronicleType.sm,
    letterSpacing: 0.5,
  },
  body: {
    color: chronicleColors.textPrimary,
    fontFamily: chronicleFontFamily.body,
    fontSize: chronicleType.sm,
    lineHeight: 20,
  },
  card: { gap: chronicleSpacing.sm },
  emptyCard: { gap: chronicleSpacing.sm },
  emptyTitle: {
    color: chronicleColors.textPrimary,
    fontFamily: chronicleFontFamily.display,
    fontSize: chronicleType.md,
    letterSpacing: 0.5,
  },
  emptyBody: {
    color: chronicleColors.textMuted,
    fontFamily: chronicleFontFamily.body,
    fontSize: chronicleType.sm,
    lineHeight: 20,
  },
  // Milestone titles are user-entered and unbounded, so Manrope bold rather than
  // Cinzel -- DESIGN.md reserves Cinzel for short headline-length strings.
  cardTitle: {
    color: chronicleColors.textPrimary,
    fontFamily: chronicleFontFamily.bodyBold,
    fontSize: chronicleType.md,
  },
  meta: {
    color: chronicleColors.textMuted,
    fontFamily: chronicleFontFamily.mono,
    fontSize: chronicleType.xs,
    letterSpacing: 0.5,
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
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: chronicleSpacing.sm },
  chip: {
    paddingHorizontal: chronicleSpacing.md,
    paddingVertical: chronicleSpacing.sm,
    borderRadius: 999,
    backgroundColor: chronicleColors.bgSurfaceRaised,
    borderWidth: 1,
    borderColor: chronicleColors.textMuted,
  },
  chipSelected: { backgroundColor: chronicleColors.accentGold, borderColor: chronicleColors.accentGold },
  chipText: {
    color: chronicleColors.textMuted,
    fontFamily: chronicleFontFamily.bodySemiBold,
    fontSize: chronicleType.sm,
    textTransform: 'capitalize',
  },
  chipTextSelected: { color: chronicleColors.bgBase },
  actions: { flexDirection: 'row', gap: chronicleSpacing.md },
  action: { flex: 1 },
});
