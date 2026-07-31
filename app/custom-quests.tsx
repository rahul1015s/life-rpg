import { nanoid } from 'nanoid/non-secure';
import { useCallback, useMemo, useState } from 'react';
import {
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { type Href, useFocusEffect, useRouter } from 'expo-router';

import { PrimaryButton } from '../components/PrimaryButton';
import { theme } from '../constants/theme';
import { getCustomQuests, getProfile, setCustomQuests } from '../lib/storage';
import type { CustomQuest, QuestCategory, QuestDifficulty, QuestRepeatType, StatKey } from '../lib/types';

const categories: QuestCategory[] = [
  'fitness',
  'study',
  'coding',
  'writing',
  'hygiene',
  'appearance',
  'confidence',
  'social',
  'communication',
  'career',
  'health',
  'style',
  'haircare',
];
const difficulties: QuestDifficulty[] = ['easy', 'medium', 'hard'];
const repeatTypes: QuestRepeatType[] = ['daily', 'weekly', 'one-time'];
const statKeys: StatKey[] = [
  'strength',
  'stamina',
  'focus',
  'discipline',
  'charisma',
  'confidence',
  'creativity',
  'appearance',
  'communication',
  'style',
];

function emptyQuest(): CustomQuest {
  return {
    id: '',
    title: '',
    description: '',
    category: 'fitness',
    difficulty: 'easy',
    baseXP: 10,
    affectedStats: {},
    repeatType: 'daily',
    recommendedTime: '10 min',
    whyThisHelps: '',
    safetyNote: null,
    createdAt: '',
    active: true,
    completedCount: 0,
  };
}

export default function CustomQuestsScreen() {
  const router = useRouter();
  const [quests, setQuests] = useState<CustomQuest[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [editingQuest, setEditingQuest] = useState<CustomQuest | null>(null);
  const [visible, setVisible] = useState(false);

  const load = useCallback(async () => {
    const profile = await getProfile();
    if (!profile) {
      router.replace('/onboarding' as Href);
      return;
    }
    setQuests(await getCustomQuests());
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

  async function saveQuest() {
    if (!editingQuest || !editingQuest.title.trim()) {
      return;
    }
    const nextQuest: CustomQuest = {
      ...editingQuest,
      id: editingQuest.id || nanoid(),
      createdAt: editingQuest.createdAt || new Date().toISOString(),
      whyThisHelps: editingQuest.whyThisHelps || 'Supports a personal system objective through repetition.',
    };
    const next = [...quests.filter((quest) => quest.id !== nextQuest.id), nextQuest].sort((a, b) =>
      b.createdAt.localeCompare(a.createdAt)
    );
    await setCustomQuests(next);
    setQuests(next);
    setVisible(false);
  }

  async function deleteQuest(id: string) {
    const next = quests.filter((quest) => quest.id !== id);
    await setCustomQuests(next);
    setQuests(next);
  }

  const activeCount = useMemo(() => quests.filter((quest) => quest.active).length, [quests]);

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
          <Text style={styles.kicker}>CUSTOM QUESTS</Text>
          <Text style={styles.title}>Personal Quest Builder</Text>
          <Text style={styles.body}>{activeCount} active quests • {quests.length} total created</Text>
        </View>

        <PrimaryButton
          label="Create Custom Quest"
          onPress={() => {
            setEditingQuest(emptyQuest());
            setVisible(true);
          }}
        />

        <View style={styles.list}>
          {quests.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>No custom quests yet</Text>
              <Text style={styles.emptyBody}>Create personal quests and they can join the daily system.</Text>
            </View>
          ) : (
            quests.map((quest) => (
              <View key={quest.id} style={styles.questCard}>
                <View style={styles.questHeader}>
                  <View style={styles.questCopy}>
                    <Text style={styles.questTitle}>{quest.title}</Text>
                    <Text style={styles.questMeta}>
                      {quest.category} • {quest.difficulty} • {quest.baseXP} XP
                    </Text>
                  </View>
                  <Switch
                    value={quest.active}
                    onValueChange={async (value) => {
                      const next = quests.map((item) => (item.id === quest.id ? { ...item, active: value } : item));
                      await setCustomQuests(next);
                      setQuests(next);
                    }}
                    trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
                    thumbColor={theme.colors.textPrimary}
                  />
                </View>
                <Text style={styles.questMeta}>Created {quest.createdAt.slice(0, 10)} • Completed {quest.completedCount} times</Text>
                <View style={styles.actions}>
                  <PrimaryButton
                    label="Edit"
                    onPress={() => {
                      setEditingQuest(quest);
                      setVisible(true);
                    }}
                    variant="secondary"
                  />
                  <PrimaryButton label="Delete" onPress={() => deleteQuest(quest.id)} />
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
              <Text style={styles.modalTitle}>{editingQuest?.id ? 'Edit Custom Quest' : 'Create Custom Quest'}</Text>
              <TextInput
                style={styles.input}
                placeholder="Quest title"
                placeholderTextColor={theme.colors.textMuted}
                value={editingQuest?.title ?? ''}
                onChangeText={(text) => setEditingQuest((current) => (current ? { ...current, title: text } : current))}
              />
              <TextInput
                style={[styles.input, styles.multiline]}
                multiline
                placeholder="Description"
                placeholderTextColor={theme.colors.textMuted}
                value={editingQuest?.description ?? ''}
                onChangeText={(text) => setEditingQuest((current) => (current ? { ...current, description: text } : current))}
              />
              <TextInput
                style={styles.input}
                placeholder="XP reward"
                placeholderTextColor={theme.colors.textMuted}
                keyboardType="numeric"
                value={String(editingQuest?.baseXP ?? 10)}
                onChangeText={(text) =>
                  setEditingQuest((current) =>
                    current ? { ...current, baseXP: Number(text) || 0 } : current
                  )
                }
              />
              <TextInput
                style={styles.input}
                placeholder="Recommended time"
                placeholderTextColor={theme.colors.textMuted}
                value={editingQuest?.recommendedTime ?? ''}
                onChangeText={(text) =>
                  setEditingQuest((current) => (current ? { ...current, recommendedTime: text } : current))
                }
              />
              <TextInput
                style={[styles.input, styles.multiline]}
                multiline
                placeholder="Why this helps"
                placeholderTextColor={theme.colors.textMuted}
                value={editingQuest?.whyThisHelps ?? ''}
                onChangeText={(text) => setEditingQuest((current) => (current ? { ...current, whyThisHelps: text } : current))}
              />
              <View style={styles.optionGroup}>
                <Text style={styles.optionTitle}>Category</Text>
                <View style={styles.chipWrap}>
                  {categories.map((category) => (
                    <Pressable
                      key={category}
                      style={[styles.chip, editingQuest?.category === category ? styles.chipSelected : null]}
                      onPress={() =>
                        setEditingQuest((current) => (current ? { ...current, category } : current))
                      }>
                      <Text style={styles.chipText}>{category}</Text>
                    </Pressable>
                  ))}
                </View>
              </View>
              <View style={styles.optionGroup}>
                <Text style={styles.optionTitle}>Difficulty</Text>
                <View style={styles.chipWrap}>
                  {difficulties.map((difficulty) => (
                    <Pressable
                      key={difficulty}
                      style={[styles.chip, editingQuest?.difficulty === difficulty ? styles.chipSelected : null]}
                      onPress={() =>
                        setEditingQuest((current) => (current ? { ...current, difficulty } : current))
                      }>
                      <Text style={styles.chipText}>{difficulty}</Text>
                    </Pressable>
                  ))}
                </View>
              </View>
              <View style={styles.optionGroup}>
                <Text style={styles.optionTitle}>Repeat Type</Text>
                <View style={styles.chipWrap}>
                  {repeatTypes.map((repeatType) => (
                    <Pressable
                      key={repeatType}
                      style={[styles.chip, editingQuest?.repeatType === repeatType ? styles.chipSelected : null]}
                      onPress={() =>
                        setEditingQuest((current) => (current ? { ...current, repeatType } : current))
                      }>
                      <Text style={styles.chipText}>{repeatType}</Text>
                    </Pressable>
                  ))}
                </View>
              </View>
              <View style={styles.optionGroup}>
                <Text style={styles.optionTitle}>Affected Stats</Text>
                <View style={styles.chipWrap}>
                  {statKeys.map((statKey) => {
                    const selected = Boolean(editingQuest?.affectedStats[statKey]);
                    return (
                      <Pressable
                        key={statKey}
                        style={[styles.chip, selected ? styles.chipSelected : null]}
                        onPress={() =>
                          setEditingQuest((current) => {
                            if (!current) {
                              return current;
                            }
                            const nextStats = { ...current.affectedStats };
                            if (nextStats[statKey]) {
                              delete nextStats[statKey];
                            } else {
                              nextStats[statKey] = 1;
                            }
                            return { ...current, affectedStats: nextStats };
                          })
                        }>
                        <Text style={styles.chipText}>{statKey}</Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
              <View style={styles.switchRow}>
                <Text style={styles.optionTitle}>Active</Text>
                <Switch
                  value={editingQuest?.active ?? true}
                  onValueChange={(value) => setEditingQuest((current) => (current ? { ...current, active: value } : current))}
                  trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
                  thumbColor={theme.colors.textPrimary}
                />
              </View>
              <View style={styles.actions}>
                <PrimaryButton label="Cancel" onPress={() => setVisible(false)} variant="secondary" />
                <PrimaryButton label="Save Quest" onPress={saveQuest} />
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
  questCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  questHeader: { flexDirection: 'row', gap: theme.spacing.md, alignItems: 'center' },
  questCopy: { flex: 1, gap: theme.spacing.xs },
  questTitle: { color: theme.colors.textPrimary, fontSize: theme.font.md, fontWeight: '800' },
  questMeta: { color: theme.colors.textMuted, fontSize: theme.font.sm },
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
  multiline: { minHeight: 90, textAlignVertical: 'top' },
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
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
});
