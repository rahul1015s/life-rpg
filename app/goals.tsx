import { nanoid } from 'nanoid/non-secure';
import { useCallback, useMemo, useState } from 'react';
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
import { getGoalProgressPercent } from '../lib/goalsEngine';
import { getCompletionLog, getCustomQuests, getGoals, getProfile, setGoals } from '../lib/storage';
import type { GoalCategory, PersonalGoal, QuestTemplate } from '../lib/types';
import { questCatalog } from '../constants/questCatalog';

const goalCategories: GoalCategory[] = ['fitness', 'study', 'coding', 'writing', 'confidence', 'career', 'haircare'];

function emptyGoal(): PersonalGoal {
  return {
    id: '',
    title: '',
    category: 'fitness',
    targetDate: '',
    progressPercent: 0,
    linkedQuestIds: [],
    status: 'active',
    createdAt: '',
    completedAt: null,
    bonusXP: 75,
  };
}

export default function GoalsScreen() {
  const router = useRouter();
  const [goals, setGoalsState] = useState<PersonalGoal[]>([]);
  const [availableQuests, setAvailableQuests] = useState<QuestTemplate[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [visible, setVisible] = useState(false);
  const [editingGoal, setEditingGoal] = useState<PersonalGoal | null>(null);

  const load = useCallback(async () => {
    const profile = await getProfile();
    if (!profile) {
      router.replace('/onboarding' as Href);
      return;
    }
    const [savedGoals, customQuests, completionLog] = await Promise.all([
      getGoals(),
      getCustomQuests(),
      getCompletionLog(),
    ]);
    const mergedQuests = [...questCatalog, ...customQuests].filter(
      (quest) => profile.usesMinoxidil || quest.category !== 'haircare'
    );
    const hydratedGoals = savedGoals.map((goal) => ({
      ...goal,
      progressPercent: goal.status === 'completed' ? 100 : getGoalProgressPercent(goal, completionLog),
    }));
    setGoalsState(hydratedGoals);
    setAvailableQuests(mergedQuests);
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

  async function saveGoal() {
    if (!editingGoal || !editingGoal.title.trim()) {
      return;
    }

    const nextGoal: PersonalGoal = {
      ...editingGoal,
      id: editingGoal.id || nanoid(),
      createdAt: editingGoal.createdAt || new Date().toISOString(),
      targetDate: editingGoal.targetDate || new Date().toISOString().slice(0, 10),
      completedAt: editingGoal.status === 'completed' ? editingGoal.completedAt ?? new Date().toISOString() : null,
      progressPercent: editingGoal.status === 'completed' ? 100 : editingGoal.progressPercent,
    };
    const next = [...goals.filter((goal) => goal.id !== nextGoal.id), nextGoal].sort((a, b) =>
      b.createdAt.localeCompare(a.createdAt)
    );
    await setGoals(next);
    setGoalsState(next);
    setVisible(false);
  }

  async function deleteGoal(id: string) {
    const next = goals.filter((goal) => goal.id !== id);
    await setGoals(next);
    setGoalsState(next);
  }

  const completedCount = useMemo(() => goals.filter((goal) => goal.status === 'completed').length, [goals]);

  return (
    <>
      <ScrollView
        style={styles.screen}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.backLink}>Back to dashboard</Text>
        </Pressable>

        <View style={styles.heroCard}>
          <Text style={styles.kicker}>PERSONAL GOALS</Text>
          <Text style={styles.title}>Linked Goal System</Text>
          <Text style={styles.body}>{goals.length - completedCount} active • {completedCount} completed</Text>
        </View>

        <PrimaryButton
          label="Create Goal"
          onPress={() => {
            setEditingGoal(emptyGoal());
            setVisible(true);
          }}
        />

        <View style={styles.list}>
          {goals.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>No goals yet</Text>
              <Text style={styles.emptyBody}>Create a personal goal and link quests to move it forward.</Text>
            </View>
          ) : (
            goals.map((goal) => (
              <View key={goal.id} style={styles.goalCard}>
                <Text style={styles.goalTitle}>{goal.title}</Text>
                <Text style={styles.goalMeta}>
                  {goal.category} • {goal.progressPercent}% • target {goal.targetDate}
                </Text>
                <View style={styles.track}>
                  <View style={[styles.fill, { width: `${goal.progressPercent}%` }]} />
                </View>
                <Text style={styles.goalMeta}>
                  {goal.linkedQuestIds.length} linked quests • {goal.bonusXP} XP reward • {goal.status}
                </Text>
                <View style={styles.actions}>
                  <PrimaryButton
                    label="Edit"
                    onPress={() => {
                      setEditingGoal(goal);
                      setVisible(true);
                    }}
                    variant="secondary"
                  />
                  <PrimaryButton label="Delete" onPress={() => deleteGoal(goal.id)} />
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      <Modal visible={visible} transparent animationType="slide" onRequestClose={() => setVisible(false)}>
        <View style={styles.modalBackdrop}>
          <ScrollView contentContainerStyle={styles.modalContent}>
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>{editingGoal?.id ? 'Edit Goal' : 'Create Goal'}</Text>
              <TextInput
                style={styles.input}
                placeholder="Goal title"
                placeholderTextColor={theme.colors.textMuted}
                value={editingGoal?.title ?? ''}
                onChangeText={(text) => setEditingGoal((current) => (current ? { ...current, title: text } : current))}
              />
              <TextInput
                style={styles.input}
                placeholder="Target date YYYY-MM-DD"
                placeholderTextColor={theme.colors.textMuted}
                value={editingGoal?.targetDate ?? ''}
                onChangeText={(text) =>
                  setEditingGoal((current) => (current ? { ...current, targetDate: text } : current))
                }
              />
              <TextInput
                style={styles.input}
                placeholder="Bonus XP"
                placeholderTextColor={theme.colors.textMuted}
                keyboardType="numeric"
                value={String(editingGoal?.bonusXP ?? 75)}
                onChangeText={(text) =>
                  setEditingGoal((current) => (current ? { ...current, bonusXP: Number(text) || 0 } : current))
                }
              />
              <View style={styles.optionGroup}>
                <Text style={styles.optionTitle}>Category</Text>
                <View style={styles.chipWrap}>
                  {goalCategories.map((category) => (
                    <Pressable
                      key={category}
                      style={[styles.chip, editingGoal?.category === category ? styles.chipSelected : null]}
                      onPress={() =>
                        setEditingGoal((current) => (current ? { ...current, category } : current))
                      }>
                      <Text style={styles.chipText}>{category}</Text>
                    </Pressable>
                  ))}
                </View>
              </View>
              <View style={styles.optionGroup}>
                <Text style={styles.optionTitle}>Status</Text>
                <View style={styles.chipWrap}>
                  {(['active', 'completed'] as const).map((status) => (
                    <Pressable
                      key={status}
                      style={[styles.chip, editingGoal?.status === status ? styles.chipSelected : null]}
                      onPress={() =>
                        setEditingGoal((current) => (current ? { ...current, status } : current))
                      }>
                      <Text style={styles.chipText}>{status}</Text>
                    </Pressable>
                  ))}
                </View>
              </View>
              <View style={styles.optionGroup}>
                <Text style={styles.optionTitle}>Linked Quests</Text>
                <View style={styles.chipWrap}>
                  {availableQuests
                    .filter((quest) => {
                      if (!editingGoal) return true;
                      return (
                        quest.category === editingGoal.category ||
                        (editingGoal.category === 'confidence' &&
                          ['confidence', 'social', 'communication'].includes(quest.category))
                      );
                    })
                    .map((quest) => {
                      const selected = Boolean(editingGoal?.linkedQuestIds.includes(quest.id));
                      return (
                        <Pressable
                          key={quest.id}
                          style={[styles.chip, selected ? styles.chipSelected : null]}
                          onPress={() =>
                            setEditingGoal((current) => {
                              if (!current) return current;
                              const linked = current.linkedQuestIds.includes(quest.id)
                                ? current.linkedQuestIds.filter((id) => id !== quest.id)
                                : [...current.linkedQuestIds, quest.id];
                              return { ...current, linkedQuestIds: linked };
                            })
                          }>
                          <Text style={styles.chipText}>{quest.title}</Text>
                        </Pressable>
                      );
                    })}
                </View>
              </View>
              <View style={styles.actions}>
                <PrimaryButton label="Cancel" onPress={() => setVisible(false)} variant="secondary" />
                <PrimaryButton label="Save Goal" onPress={saveGoal} />
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
  body: { color: theme.colors.textMuted, fontSize: theme.font.md },
  list: { gap: theme.spacing.md },
  emptyCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  emptyTitle: { color: theme.colors.textPrimary, fontSize: theme.font.md, fontWeight: '800' },
  emptyBody: { color: theme.colors.textMuted, fontSize: theme.font.sm },
  goalCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  goalTitle: { color: theme.colors.textPrimary, fontSize: theme.font.md, fontWeight: '800' },
  goalMeta: { color: theme.colors.textMuted, fontSize: theme.font.sm },
  track: {
    height: 12,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.surfaceAlt,
    overflow: 'hidden',
  },
  fill: { height: '100%', backgroundColor: theme.colors.accent },
  actions: { flexDirection: 'row', gap: theme.spacing.md },
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
  optionGroup: { gap: theme.spacing.sm },
  optionTitle: { color: theme.colors.textPrimary, fontSize: theme.font.md, fontWeight: '700' },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm },
  chip: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.surfaceAlt,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  chipSelected: { borderColor: theme.colors.accent, backgroundColor: theme.colors.primary },
  chipText: { color: theme.colors.textPrimary, fontSize: theme.font.sm, textTransform: 'capitalize' },
});
