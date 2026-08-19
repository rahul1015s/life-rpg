import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { IconBell, IconMenu2 } from '@tabler/icons-react-native';
import { type Href, useFocusEffect, useRouter } from 'expo-router';

import { AchievementUnlockModal } from '../components/AchievementUnlockModal';
import { GoalCompletionModal } from '../components/GoalCompletionModal';
import { LevelUpModal } from '../components/LevelUpModal';
import { QuestDetailModal } from '../components/QuestDetailModal';
import { ChronicleQuestCard } from '../components/chronicle/ChronicleQuestCard';
import { ChronicleStatRow } from '../components/chronicle/ChronicleStatRow';
import { ChronicleIdentityCard } from '../components/chronicle/ChronicleIdentityCard';
import { getNextLevelXP, getRankForLevel } from '../lib/levelSystem';
import { completeDailyQuest, ensureDailyQuests } from '../lib/questEngine';
import { getProfile, getProgress, getSettings, setSettings } from '../lib/storage';
import type {
  AchievementUnlockResult,
  DailyQuest,
  GoalRewardResult,
  LevelUpSummary,
  PlayerProfile,
  PlayerProgress,
} from '../lib/types';
import { chronicleColors, chronicleFontFamily, chronicleSpacing, chronicleType } from '../theme/chronicle';

export default function DashboardScreen() {
  const router = useRouter();
  const [profile, setProfile] = useState<PlayerProfile | null>(null);
  const [progress, setProgress] = useState<PlayerProgress | null>(null);
  const [quests, setQuests] = useState<DailyQuest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [completingQuestId, setCompletingQuestId] = useState<string | null>(null);
  const [levelUpSummary, setLevelUpSummary] = useState<LevelUpSummary | null>(null);
  const [showLevelUpModal, setShowLevelUpModal] = useState(false);
  const [selectedQuest, setSelectedQuest] = useState<DailyQuest | null>(null);
  const [achievementUnlocks, setAchievementUnlocks] = useState<AchievementUnlockResult[]>([]);
  const [showAchievementModal, setShowAchievementModal] = useState(false);
  const [completedGoals, setCompletedGoals] = useState<GoalRewardResult[]>([]);
  const [showGoalModal, setShowGoalModal] = useState(false);

  const loadDashboard = useCallback(async () => {
    const savedProfile = await getProfile();
    if (!savedProfile) {
      router.replace('/onboarding' as Href);
      return;
    }

    const [savedProgress, nextQuests, settings] = await Promise.all([
      getProgress(),
      ensureDailyQuests(savedProfile),
      getSettings(),
    ]);

    if (!savedProgress) {
      router.replace('/onboarding' as Href);
      return;
    }

    setProfile(savedProfile);
    setProgress(savedProgress);
    setQuests(nextQuests);

    if (!savedProfile.dob && !settings.dobPromptDismissedAt) {
      Alert.alert('Complete your profile', 'Add your date of birth once so age-based features stay accurate over time.', [
        {
          text: 'Later',
          onPress: () => {
            void setSettings({
              ...settings,
              dobPromptDismissedAt: new Date().toISOString(),
            });
          },
        },
        {
          text: 'Open Settings',
          onPress: () => {
            void setSettings({
              ...settings,
              dobPromptDismissedAt: new Date().toISOString(),
            });
            router.push('/settings' as Href);
          },
        },
      ]);
    }
  }, [router]);

  useFocusEffect(
    useCallback(() => {
      let active = true;

      async function run() {
        setLoading(true);
        try {
          await loadDashboard();
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
    }, [loadDashboard])
  );

  async function handleRefresh() {
    setRefreshing(true);
    try {
      await loadDashboard();
    } finally {
      setRefreshing(false);
    }
  }

  async function handleCompleteQuest(questId: string) {
    try {
      setCompletingQuestId(questId);
      const result = await completeDailyQuest(questId);
      setQuests(result.quests);
      setProgress(result.progress);
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

  if (loading || !profile || !progress) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={chronicleColors.accentGold} />
      </View>
    );
  }

  const punishmentQuests = quests.filter((quest) => quest.isPunishment);
  const mainQuests = quests.filter((quest) => !quest.isBonus && !quest.isPunishment);
  const bonusQuests = quests.filter((quest) => quest.isBonus);
  const mainCompleted = mainQuests.filter((quest) => quest.completed).length;
  const pendingMainQuests = mainQuests.length - mainCompleted;
  const nextQuestId = quests.find((quest) => !quest.completed && !quest.locked)?.id ?? null;
  // Scoped to mainQuests so this counts the same quest set as the Quests Done tile.
  const xpToday = mainQuests.reduce((total, quest) => (quest.completed ? total + quest.xp : total), 0);
  // selectedQuest is a snapshot taken at tap time; re-read it from `quests` so completing
  // from inside the modal updates the modal's own seal instead of showing stale state.
  const selectedQuestLive = selectedQuest
    ? quests.find((quest) => quest.id === selectedQuest.id) ?? selectedQuest
    : null;


  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.header}>
        {/* Temporary target until the side-drawer spec lands. */}
        <Pressable
          style={styles.headerSlot}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          accessibilityRole="button"
          accessibilityLabel="Open settings"
          onPress={() => router.push('/settings' as Href)}>
          <IconMenu2 size={24} strokeWidth={1.5} color={chronicleColors.textPrimary} />
        </Pressable>
        <Text style={styles.wordmark}>LIFE RPG</Text>
        {/* Static mark: no notification centre route exists yet. */}
        <View style={styles.headerSlot}>
          <IconBell size={24} strokeWidth={1.5} color={chronicleColors.textPrimary} />
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={chronicleColors.accentGold} />
        }>
        <ChronicleIdentityCard
          name={profile.name}
          rank={getRankForLevel(progress.level)}
          level={progress.level}
          xp={progress.xp}
          nextLevelXP={getNextLevelXP(progress.level)}
        />

        <ChronicleStatRow
          questsDone={mainCompleted}
          questsTotal={mainQuests.length}
          streak={progress.streak}
          totalXP={progress.totalXP}
          xpToday={xpToday}
        />

        {punishmentQuests.length > 0 ? (
          <View style={styles.section}>
            <View style={styles.eyebrowRow}>
              <Text style={styles.eyebrow}>PUNISHMENT QUESTS</Text>
              <Text style={styles.eyebrowNote}>Clear these first</Text>
            </View>
            <View style={styles.questList}>
              {punishmentQuests.map((quest) => (
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
          </View>
        ) : null}

        <View style={styles.section}>
          <View style={styles.eyebrowRow}>
            <Text style={styles.eyebrow}>{"TODAY'S QUESTS"}</Text>
            <Pressable
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              accessibilityRole="button"
              onPress={() => router.push('/quests' as Href)}>
              <Text style={styles.viewAll}>View All</Text>
            </Pressable>
          </View>
          <View style={styles.questList}>
            {mainQuests.map((quest) => (
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
        </View>

        {pendingMainQuests === 0 && bonusQuests.length > 0 ? (
          <Pressable
            style={({ pressed }) => [styles.ctaBanner, pressed && styles.pressed]}
            onPress={() => router.push('/command' as Href)}>
            <View style={styles.ctaBannerCopy}>
              <Text style={styles.ctaBannerTitle}>
                {bonusQuests.length} bonus quest{bonusQuests.length > 1 ? 's' : ''} available
              </Text>
              <Text style={styles.ctaBannerSub}>Extra XP is waiting in the Chronicle.</Text>
            </View>
            <Text style={styles.ctaBannerLink}>OPEN CHRONICLE ›</Text>
          </Pressable>
        ) : null}
      </ScrollView>

      <LevelUpModal
        visible={showLevelUpModal}
        summary={levelUpSummary}
        onDismiss={() => setShowLevelUpModal(false)}
      />
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
  safeArea: {
    flex: 1,
    backgroundColor: chronicleColors.bgBase,
  },
  scroll: {
    flex: 1,
    backgroundColor: chronicleColors.bgBase,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: chronicleSpacing.lg,
    paddingVertical: chronicleSpacing.md,
  },
  // Equal-width side slots keep the wordmark optically centred between the two icons.
  headerSlot: {
    width: 24,
    alignItems: 'center',
  },
  wordmark: {
    color: chronicleColors.accentGold,
    fontFamily: chronicleFontFamily.display,
    fontSize: chronicleType.lg,
    letterSpacing: 2,
  },
  content: {
    padding: chronicleSpacing.lg,
    paddingBottom: chronicleSpacing.xxl,
    gap: chronicleSpacing.lg,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: chronicleColors.bgBase,
  },
  section: {
    gap: chronicleSpacing.sm,
  },
  eyebrowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: chronicleSpacing.xs,
  },
  eyebrow: {
    color: chronicleColors.textMuted,
    fontFamily: chronicleFontFamily.mono,
    fontSize: chronicleType.xs,
    letterSpacing: 1,
  },
  viewAll: {
    color: chronicleColors.accentGold,
    fontFamily: chronicleFontFamily.bodySemiBold,
    fontSize: chronicleType.sm,
  },
  // Ember rather than gold: this is a Hard Mode penalty note, per DESIGN.md section 1.
  eyebrowNote: {
    color: chronicleColors.accentEmber,
    fontFamily: chronicleFontFamily.bodySemiBold,
    fontSize: chronicleType.sm,
  },
  questList: {
    gap: chronicleSpacing.md,
  },
  ctaBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: chronicleSpacing.md,
    backgroundColor: chronicleColors.bgSurfaceRaised,
    borderWidth: 1,
    borderColor: chronicleColors.accentGold,
    borderRadius: 6,
    padding: chronicleSpacing.md,
  },
  pressed: {
    opacity: 0.75,
  },
  ctaBannerCopy: {
    flex: 1,
    gap: 2,
  },
  ctaBannerTitle: {
    color: chronicleColors.textPrimary,
    fontFamily: chronicleFontFamily.bodySemiBold,
    fontSize: chronicleType.sm,
  },
  ctaBannerSub: {
    color: chronicleColors.textMuted,
    fontFamily: chronicleFontFamily.body,
    fontSize: chronicleType.xs,
  },
  ctaBannerLink: {
    color: chronicleColors.accentGold,
    fontFamily: chronicleFontFamily.mono,
    fontSize: chronicleType.xs,
    letterSpacing: 0.4,
  },
});
