import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { type Href, useFocusEffect, useRouter } from 'expo-router';

import { AchievementCard } from '../components/AchievementCard';
import { buildAchievementCards, buildAchievementState } from '../lib/achievementEngine';
import { getAchievements, getCompletionLog, getProfile, getProgress } from '../lib/storage';
import type { AchievementCardView, AchievementCategory, PlayerProfile, PlayerProgress } from '../lib/types';
import { chronicleColors, chronicleFontFamily, chronicleSpacing, chronicleType } from '../theme/chronicle';

const categoryOrder: AchievementCategory[] = ['streak', 'quests', 'level', 'xp', 'category', 'mens-health', 'haircare'];
const categoryGroupLabels: Record<AchievementCategory, string> = {
  streak: 'Streaks',
  quests: 'Quests',
  level: 'Levels',
  xp: 'Experience',
  category: 'Skill Milestones',
  'mens-health': 'Discipline',
  haircare: 'Hair Care',
};

export default function AchievementsScreen() {
  const router = useRouter();
  const [profile, setProfile] = useState<PlayerProfile | null>(null);
  const [progress, setProgress] = useState<PlayerProgress | null>(null);
  const [cards, setCards] = useState<AchievementCardView[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [collapsed, setCollapsed] = useState<Set<AchievementCategory>>(new Set());

  function toggleCategory(category: AchievementCategory) {
    setCollapsed((current) => {
      const next = new Set(current);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      return next;
    });
  }

  const load = useCallback(async () => {
    const savedProfile = await getProfile();
    if (!savedProfile) {
      router.replace('/onboarding' as Href);
      return;
    }

    const [savedProgress, completionLog, unlocked] = await Promise.all([
      getProgress(),
      getCompletionLog(),
      getAchievements(),
    ]);

    if (!savedProgress) {
      router.replace('/onboarding' as Href);
      return;
    }

    const state = buildAchievementState(savedProgress, completionLog, savedProfile.usesMinoxidil);
    setProfile(savedProfile);
    setProgress(savedProgress);
    setCards(buildAchievementCards(state, unlocked));
  }, [router]);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      async function run() {
        setLoading(true);
        try {
          await load();
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

  if (loading || !profile || !progress) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={chronicleColors.accentGold} />
      </View>
    );
  }

  const unlockedCount = cards.filter((card) => card.unlocked).length;
  const groups = categoryOrder
    .map((category) => ({ category, items: cards.filter((card) => card.category === category) }))
    .filter((group) => group.items.length > 0);

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={chronicleColors.accentGold} />}>
      <Pressable onPress={() => router.back()} style={({ pressed }) => (pressed ? styles.pressed : null)}>
        <Text style={styles.backLink}>‹ Back to dashboard</Text>
      </Pressable>

      <View style={styles.hero}>
        <Text style={styles.kicker}>ACHIEVEMENT ARCHIVE</Text>
        <Text style={styles.title}>Badges of Progress</Text>
        <Text style={styles.body}>
          {unlockedCount} / {cards.length} achievements unlocked.
        </Text>
      </View>

      <View style={styles.list}>
        {groups.map(({ category, items }) => {
          const unlockedInGroup = items.filter((item) => item.unlocked).length;
          const isCollapsed = collapsed.has(category);
          return (
            <View key={category} style={styles.group}>
              <Pressable
                style={({ pressed }) => [styles.groupHeader, pressed && styles.pressed]}
                onPress={() => toggleCategory(category)}>
                <Text style={styles.groupTitle}>
                  {isCollapsed ? '▸' : '▾'} {categoryGroupLabels[category]}
                </Text>
                <Text style={styles.groupCounter}>
                  {unlockedInGroup}/{items.length}
                </Text>
              </Pressable>
              {!isCollapsed ? (
                <View style={styles.groupList}>
                  {items.map((achievement) => (
                    <AchievementCard key={achievement.id} achievement={achievement} />
                  ))}
                </View>
              ) : null}
            </View>
          );
        })}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: chronicleColors.bgBase,
  },
  content: {
    padding: chronicleSpacing.lg,
    gap: chronicleSpacing.lg,
    paddingBottom: chronicleSpacing.xxl,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: chronicleColors.bgBase,
  },
  backLink: {
    color: chronicleColors.accentGold,
    fontFamily: chronicleFontFamily.mono,
    fontSize: chronicleType.sm,
  },
  hero: {
    backgroundColor: chronicleColors.bgSurface,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: chronicleColors.borderSubtle,
    padding: chronicleSpacing.lg,
    gap: chronicleSpacing.sm,
  },
  kicker: {
    color: chronicleColors.accentGold,
    fontFamily: chronicleFontFamily.mono,
    fontSize: chronicleType.xs,
    letterSpacing: 1,
  },
  title: {
    color: chronicleColors.textPrimary,
    fontFamily: chronicleFontFamily.display,
    fontSize: chronicleType.xl,
  },
  body: {
    color: chronicleColors.textMuted,
    fontFamily: chronicleFontFamily.body,
    fontSize: chronicleType.sm,
    lineHeight: 22,
  },
  list: {
    gap: chronicleSpacing.lg,
  },
  group: {
    gap: chronicleSpacing.md,
  },
  groupHeader: {
    minHeight: 44,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: chronicleColors.borderSubtle,
    paddingBottom: chronicleSpacing.xs,
  },
  pressed: {
    opacity: 0.7,
  },
  groupTitle: {
    color: chronicleColors.textPrimary,
    fontFamily: chronicleFontFamily.display,
    fontSize: chronicleType.lg,
  },
  groupCounter: {
    color: chronicleColors.accentGold,
    fontFamily: chronicleFontFamily.mono,
    fontSize: chronicleType.sm,
  },
  groupList: {
    gap: chronicleSpacing.md,
  },
});
