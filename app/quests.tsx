import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { IconCalendar, IconChevronLeft } from '@tabler/icons-react-native';
import { type Href, useFocusEffect, useRouter } from 'expo-router';
import { format } from 'date-fns';

import { AchievementUnlockModal } from '../components/AchievementUnlockModal';
import { GoalCompletionModal } from '../components/GoalCompletionModal';
import { LevelUpModal } from '../components/LevelUpModal';
import { QuestDetailModal } from '../components/QuestDetailModal';
import { ChronicleButton } from '../components/chronicle/ChronicleButton';
import { ChronicleCard } from '../components/chronicle/ChronicleCard';
import { ChronicleQuestCard } from '../components/chronicle/ChronicleQuestCard';
import { ChronicleUnderlineTabs } from '../components/chronicle/ChronicleUnderlineTabs';
import { completeDailyQuest, ensureDailyQuests } from '../lib/questEngine';
import { getProfile } from '../lib/storage';
import type { AchievementUnlockResult, DailyQuest, GoalRewardResult, LevelUpSummary } from '../lib/types';
import { chronicleColors, chronicleFontFamily, chronicleSpacing, chronicleType } from '../theme/chronicle';

type QuestTab = 'daily' | 'weekly';

const tabOptions: { value: QuestTab; label: string }[] = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
];

export default function QuestsScreen() {
  const router = useRouter();
  const [quests, setQuests] = useState<DailyQuest[]>([]);
  const [tab, setTab] = useState<QuestTab>('daily');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [completingQuestId, setCompletingQuestId] = useState<string | null>(null);
  const [selectedQuest, setSelectedQuest] = useState<DailyQuest | null>(null);
  const [levelUpSummary, setLevelUpSummary] = useState<LevelUpSummary | null>(null);
  const [showLevelUpModal, setShowLevelUpModal] = useState(false);
  const [achievementUnlocks, setAchievementUnlocks] = useState<AchievementUnlockResult[]>([]);
  const [showAchievementModal, setShowAchievementModal] = useState(false);
  const [completedGoals, setCompletedGoals] = useState<GoalRewardResult[]>([]);
  const [showGoalModal, setShowGoalModal] = useState(false);

  const loadQuests = useCallback(async () => {
    const savedProfile = await getProfile();
    if (!savedProfile) {
      router.replace('/onboarding' as Href);
      return;
    }
    setQuests(await ensureDailyQuests(savedProfile));
  }, [router]);

  useFocusEffect(
    useCallback(() => {
      let active = true;

      async function run() {
        setLoading(true);
        try {
          await loadQuests();
        } finally {
          if (active) {
            setLoading(false);
          }
        }
      }

      run();
      return () => {
        active = false;
      };
    }, [loadQuests])
  );

  async function handleRefresh() {
    setRefreshing(true);
    try {
      await loadQuests();
    } finally {
      setRefreshing(false);
    }
  }

  async function handleCompleteQuest(questId: string) {
    try {
      setCompletingQuestId(questId);
      const result = await completeDailyQuest(questId);
      setQuests(result.quests);
      if (result.levelUp) {
        setLevelUpSummary(result.levelUp);
        setShowLevelUpModal(true);
      }
      if (result.unlockedAchievements.length > 0) {
        setAchievementUnlocks(result.unlockedAchievements);
        setShowAchievementModal(true);
      }
      if (result.completedGoals.length > 0) {
        setCompletedGoals(result.completedGoals);
        setShowGoalModal(true);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to complete quest.';
      Alert.alert('Quest update failed', message);
    } finally {
      setCompletingQuestId(null);
    }
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={chronicleColors.accentGold} />
      </View>
    );
  }

  // Catalog is overwhelmingly repeatType 'daily', so the Weekly tab collects everything
  // that is not a daily quest (weekly / flexible / one-time) rather than 'weekly' alone.
  const visibleQuests = quests.filter((quest) =>
    tab === 'daily' ? quest.repeatType === 'daily' : quest.repeatType !== 'daily'
  );
  const nextQuestId = quests.find((quest) => !quest.completed && !quest.locked)?.id ?? null;
  // selectedQuest is a snapshot taken at tap time; re-read it from `quests` so completing
  // from inside the modal updates the modal's own seal instead of showing stale state.
  const selectedQuestLive = selectedQuest
    ? quests.find((quest) => quest.id === selectedQuest.id) ?? selectedQuest
    : null;


  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.header}>
        <Pressable
          style={styles.headerSlot}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          onPress={() => router.back()}>
          <IconChevronLeft size={24} strokeWidth={1.5} color={chronicleColors.textPrimary} />
        </Pressable>
        <Text style={styles.wordmark}>QUESTS</Text>
        <Pressable
          style={styles.headerSlot}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          accessibilityRole="button"
          accessibilityLabel="Open habit calendar"
          onPress={() => router.push('/habit-calendar' as Href)}>
          <IconCalendar size={24} strokeWidth={1.5} color={chronicleColors.textPrimary} />
        </Pressable>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={chronicleColors.accentGold}
            colors={[chronicleColors.accentGold]}
          />
        }>
        <ChronicleUnderlineTabs options={tabOptions} value={tab} onChange={setTab} />

        <Text style={styles.dateLabel}>{format(new Date(), "'Today,' d MMM")}</Text>

        {visibleQuests.length === 0 ? (
          <ChronicleCard>
            <Text style={styles.emptyText}>
              {tab === 'daily'
                ? 'No daily quests assigned yet.'
                : 'No weekly or flexible quests today.'}
            </Text>
          </ChronicleCard>
        ) : (
          <View style={styles.questList}>
            {visibleQuests.map((quest) => (
              <ChronicleQuestCard
                key={`${quest.dateAssigned}-${quest.id}`}
                quest={quest}
                onPress={setSelectedQuest}
                onComplete={handleCompleteQuest}
                loading={completingQuestId === quest.id}
                isNext={quest.id === nextQuestId}
                showCategoryIcon
              />
            ))}
          </View>
        )}

        <ChronicleButton label="+ Add Custom Quest" onPress={() => router.push('/custom-quests' as Href)} />
      </ScrollView>

      <LevelUpModal visible={showLevelUpModal} summary={levelUpSummary} onDismiss={() => setShowLevelUpModal(false)} />
      <QuestDetailModal
        visible={selectedQuest !== null}
        quest={selectedQuestLive}
        onClose={() => setSelectedQuest(null)}
        onComplete={handleCompleteQuest}
        completing={completingQuestId === selectedQuestLive?.id}
      />
      <AchievementUnlockModal
        visible={showAchievementModal}
        achievements={achievementUnlocks}
        onClose={() => setShowAchievementModal(false)}
      />
      <GoalCompletionModal
        visible={showGoalModal}
        completedGoals={completedGoals}
        onClose={() => setShowGoalModal(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: chronicleColors.bgBase },
  scroll: { flex: 1, backgroundColor: chronicleColors.bgBase },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: chronicleColors.bgBase,
  },
  content: {
    padding: chronicleSpacing.lg,
    paddingBottom: chronicleSpacing.xxl,
    gap: chronicleSpacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: chronicleSpacing.lg,
    paddingVertical: chronicleSpacing.md,
  },
  headerSlot: { width: 24, alignItems: 'center' },
  wordmark: {
    color: chronicleColors.accentGold,
    fontFamily: chronicleFontFamily.display,
    fontSize: chronicleType.lg,
    letterSpacing: 2,
  },
  dateLabel: {
    color: chronicleColors.textMuted,
    fontFamily: chronicleFontFamily.mono,
    fontSize: chronicleType.xs,
    letterSpacing: 0.5,
  },
  questList: { gap: chronicleSpacing.md },
  emptyText: {
    color: chronicleColors.textMuted,
    fontFamily: chronicleFontFamily.body,
    fontSize: chronicleType.sm,
    lineHeight: 20,
  },
});
