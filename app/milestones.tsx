import { nanoid } from 'nanoid/non-secure';
import { useCallback, useMemo, useState } from 'react';
import { Modal, Pressable, RefreshControl, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { type Href, useFocusEffect, useRouter } from 'expo-router';

import { PrimaryButton } from '../components/PrimaryButton';
import { theme } from '../constants/theme';
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
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.backLink}>Back</Text>
        </Pressable>

        <View style={styles.heroCard}>
          <Text style={styles.kicker}>MILESTONES / VISION</Text>
          <Text style={styles.title}>30-day, 90-day, and 1-year direction</Text>
          <Text style={styles.body}>{active.length} active milestones</Text>
        </View>

        <PrimaryButton
          label="Add Milestone"
          onPress={() => {
            setEditing(emptyMilestone());
            setVisible(true);
          }}
        />

        {milestones.map((milestone) => (
          <View key={milestone.id} style={styles.card}>
            <Text style={styles.cardTitle}>{milestone.title}</Text>
            <Text style={styles.meta}>{milestone.timeframeDays} days · target {milestone.targetDate}</Text>
            <Text style={styles.body}>{milestone.vision}</Text>
            <Text style={styles.meta}>{milestone.progressPercent}% · {milestone.status}</Text>
            <View style={styles.actions}>
              <PrimaryButton
                label="Edit"
                onPress={() => {
                  setEditing(milestone);
                  setVisible(true);
                }}
                variant="secondary"
              />
            </View>
          </View>
        ))}
      </ScrollView>

      <Modal visible={visible} transparent animationType="slide" onRequestClose={() => setVisible(false)}>
        <View style={styles.modalBackdrop}>
          <ScrollView contentContainerStyle={styles.modalContent}>
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>{editing?.id ? 'Edit Milestone' : 'Create Milestone'}</Text>
              <TextInput style={styles.input} placeholder="Title" placeholderTextColor={theme.colors.textMuted} value={editing?.title ?? ''} onChangeText={(text) => setEditing((current) => (current ? { ...current, title: text } : current))} />
              <TextInput style={styles.input} placeholder="Target date YYYY-MM-DD" placeholderTextColor={theme.colors.textMuted} value={editing?.targetDate ?? ''} onChangeText={(text) => setEditing((current) => (current ? { ...current, targetDate: text } : current))} />
              <TextInput style={styles.input} placeholder="Progress %" placeholderTextColor={theme.colors.textMuted} keyboardType="numeric" value={String(editing?.progressPercent ?? 0)} onChangeText={(text) => setEditing((current) => (current ? { ...current, progressPercent: Number(text) || 0 } : current))} />
              <TextInput style={[styles.input, styles.multiline]} multiline placeholder="Vision" placeholderTextColor={theme.colors.textMuted} value={editing?.vision ?? ''} onChangeText={(text) => setEditing((current) => (current ? { ...current, vision: text } : current))} />
              <View style={styles.row}>
                {[30, 90, 365].map((days) => (
                  <Pressable key={days} style={[styles.chip, editing?.timeframeDays === days ? styles.chipSelected : null]} onPress={() => setEditing((current) => (current ? { ...current, timeframeDays: days as 30 | 90 | 365 } : current))}>
                    <Text style={styles.chipText}>{days}d</Text>
                  </Pressable>
                ))}
                {(['active', 'completed'] as const).map((status) => (
                  <Pressable key={status} style={[styles.chip, editing?.status === status ? styles.chipSelected : null]} onPress={() => setEditing((current) => (current ? { ...current, status } : current))}>
                    <Text style={styles.chipText}>{status}</Text>
                  </Pressable>
                ))}
              </View>
              <View style={styles.actions}>
                <PrimaryButton label="Cancel" onPress={() => setVisible(false)} variant="secondary" />
                <PrimaryButton label="Save Milestone" onPress={saveMilestone} />
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
  heroCard: { backgroundColor: theme.colors.surface, borderRadius: theme.radius.lg, borderWidth: 1, borderColor: theme.colors.border, padding: theme.spacing.lg, gap: theme.spacing.sm },
  kicker: { color: theme.colors.accentGlow, fontSize: theme.font.sm, fontWeight: '800', letterSpacing: 1 },
  title: { color: theme.colors.textPrimary, fontSize: theme.font.xl, fontWeight: '900' },
  body: { color: theme.colors.textMuted, fontSize: theme.font.md, lineHeight: 20 },
  card: { backgroundColor: theme.colors.surface, borderRadius: theme.radius.md, borderWidth: 1, borderColor: theme.colors.border, padding: theme.spacing.md, gap: theme.spacing.sm },
  cardTitle: { color: theme.colors.textPrimary, fontSize: theme.font.md, fontWeight: '800' },
  meta: { color: theme.colors.textMuted, fontSize: theme.font.sm },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(11, 7, 16, 0.9)' },
  modalContent: { padding: theme.spacing.lg },
  modalCard: { backgroundColor: theme.colors.surface, borderRadius: theme.radius.lg, borderWidth: 1, borderColor: theme.colors.border, padding: theme.spacing.lg, gap: theme.spacing.md },
  modalTitle: { color: theme.colors.textPrimary, fontSize: theme.font.lg, fontWeight: '900' },
  input: { backgroundColor: theme.colors.surfaceAlt, borderRadius: theme.radius.md, borderWidth: 1, borderColor: theme.colors.border, color: theme.colors.textPrimary, paddingHorizontal: theme.spacing.md, paddingVertical: theme.spacing.md, fontSize: theme.font.md },
  multiline: { minHeight: 120, textAlignVertical: 'top' },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm },
  chip: { paddingHorizontal: theme.spacing.md, paddingVertical: theme.spacing.sm, borderRadius: 999, backgroundColor: theme.colors.surfaceAlt, borderWidth: 1, borderColor: theme.colors.border },
  chipSelected: { backgroundColor: theme.colors.primary, borderColor: theme.colors.accent },
  chipText: { color: theme.colors.textPrimary, fontSize: theme.font.sm },
  actions: { flexDirection: 'row', gap: theme.spacing.md },
});

