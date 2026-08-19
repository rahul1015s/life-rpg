import { nanoid } from 'nanoid/non-secure';
import { useCallback, useMemo, useState } from 'react';
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
import { ChronicleProgressBar } from '../components/chronicle/ChronicleProgressBar';
import { chronicleColors, chronicleFontFamily, chronicleSpacing, chronicleType } from '../theme/chronicle';
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
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={chronicleColors.accentGold}
            colors={[chronicleColors.accentGold]}
          />
        }>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.backLink}>Back to dashboard</Text>
        </Pressable>

        <ChronicleCard style={styles.heroCard}>
          <Text style={styles.kicker}>PERSONAL GOALS</Text>
          <Text style={styles.title}>Linked Goal System</Text>
          <Text style={styles.heroMeta}>{goals.length - completedCount} active • {completedCount} completed</Text>
        </ChronicleCard>

        <ChronicleButton
          label="Create Goal"
          onPress={() => {
            setEditingGoal(emptyGoal());
            setVisible(true);
          }}
        />

        <View style={styles.list}>
          {goals.length === 0 ? (
            <ChronicleCard style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>No goals yet</Text>
              <Text style={styles.emptyBody}>Create a personal goal and link quests to move it forward.</Text>
            </ChronicleCard>
          ) : (
            goals.map((goal) => (
              <ChronicleCard key={goal.id} style={styles.goalCard}>
                <Text style={styles.goalTitle}>{goal.title}</Text>
                <Text style={styles.goalMeta}>
                  {goal.category} • {goal.progressPercent}% • target {goal.targetDate}
                </Text>
                <ChronicleProgressBar progress={goal.progressPercent / 100} />
                <Text style={styles.goalMeta}>
                  {goal.linkedQuestIds.length} linked quests • {goal.bonusXP} XP reward • {goal.status}
                </Text>
                <View style={styles.actions}>
                  <View style={styles.action}>
                    <ChronicleButton
                      label="Edit"
                      onPress={() => {
                        setEditingGoal(goal);
                        setVisible(true);
                      }}
                      variant="secondary"
                    />
                  </View>
                  <View style={styles.action}>
                    <ChronicleButton label="Delete" onPress={() => deleteGoal(goal.id)} variant="danger" />
                  </View>
                </View>
              </ChronicleCard>
            ))
          )}
        </View>
      </ScrollView>

      <Modal visible={visible} transparent animationType="slide" onRequestClose={() => setVisible(false)}>
        <View style={styles.modalBackdrop}>
          <ScrollView contentContainerStyle={styles.modalContent}>
            <ChronicleCard style={styles.modalCard}>
              <Text style={styles.modalTitle}>{editingGoal?.id ? 'Edit Goal' : 'Create Goal'}</Text>
              <ChronicleInput
                placeholder="Goal title"
                value={editingGoal?.title ?? ''}
                onChangeText={(text) => setEditingGoal((current) => (current ? { ...current, title: text } : current))}
              />
              <ChronicleInput
                placeholder="Target date YYYY-MM-DD"
                value={editingGoal?.targetDate ?? ''}
                onChangeText={(text) =>
                  setEditingGoal((current) => (current ? { ...current, targetDate: text } : current))
                }
              />
              <ChronicleInput
                placeholder="Bonus XP"
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
                      hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
                      style={[styles.chip, editingGoal?.category === category ? styles.chipSelected : null]}
                      onPress={() =>
                        setEditingGoal((current) => (current ? { ...current, category } : current))
                      }>
                      <Text
                        style={[styles.chipText, editingGoal?.category === category ? styles.chipTextSelected : null]}>
                        {category}
                      </Text>
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
                      hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
                      style={[styles.chip, editingGoal?.status === status ? styles.chipSelected : null]}
                      onPress={() =>
                        setEditingGoal((current) => (current ? { ...current, status } : current))
                      }>
                      <Text style={[styles.chipText, editingGoal?.status === status ? styles.chipTextSelected : null]}>
                        {status}
                      </Text>
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
                          hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
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
                          <Text style={[styles.chipText, selected ? styles.chipTextSelected : null]}>{quest.title}</Text>
                        </Pressable>
                      );
                    })}
                </View>
              </View>
              <View style={styles.actions}>
                <View style={styles.action}>
                  <ChronicleButton label="Cancel" onPress={() => setVisible(false)} variant="secondary" />
                </View>
                <View style={styles.action}>
                  <ChronicleButton label="Save Goal" onPress={saveGoal} />
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
  list: { gap: chronicleSpacing.md },
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
  goalCard: { gap: chronicleSpacing.sm },
  // Goal titles are user-entered and unbounded -> Manrope, not Cinzel (DESIGN.md section 2).
  goalTitle: {
    color: chronicleColors.textPrimary,
    fontFamily: chronicleFontFamily.bodyBold,
    fontSize: chronicleType.md,
  },
  goalMeta: {
    color: chronicleColors.textMuted,
    fontFamily: chronicleFontFamily.mono,
    fontSize: chronicleType.xs,
    letterSpacing: 0.5,
  },
  actions: { flexDirection: 'row', gap: chronicleSpacing.md },
  action: { flex: 1 },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(18, 20, 28, 0.92)' },
  modalContent: { padding: chronicleSpacing.lg },
  modalCard: { gap: chronicleSpacing.md },
  modalTitle: {
    color: chronicleColors.textPrimary,
    fontFamily: chronicleFontFamily.display,
    fontSize: chronicleType.lg,
    letterSpacing: 0.5,
  },
  optionGroup: { gap: chronicleSpacing.sm },
  optionTitle: {
    color: chronicleColors.textPrimary,
    fontFamily: chronicleFontFamily.bodySemiBold,
    fontSize: chronicleType.sm,
  },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: chronicleSpacing.sm },
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
});
