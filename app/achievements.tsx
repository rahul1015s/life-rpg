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
import { theme } from '../constants/theme';
import { buildAchievementCards, buildAchievementState } from '../lib/achievementEngine';
import { getAchievements, getCompletionLog, getProfile, getProgress } from '../lib/storage';
import type { AchievementCardView, PlayerProfile, PlayerProgress } from '../lib/types';

export default function AchievementsScreen() {
  const router = useRouter();
  const [profile, setProfile] = useState<PlayerProfile | null>(null);
  const [progress, setProgress] = useState<PlayerProgress | null>(null);
  const [cards, setCards] = useState<AchievementCardView[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

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
        <ActivityIndicator size="large" color={theme.colors.accent} />
      </View>
    );
  }

  const unlockedCount = cards.filter((card) => card.unlocked).length;

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}>
      <Pressable onPress={() => router.back()}>
        <Text style={styles.backLink}>Back to dashboard</Text>
      </Pressable>

      <View style={styles.heroCard}>
        <Text style={styles.kicker}>ACHIEVEMENT ARCHIVE</Text>
        <Text style={styles.title}>Badges of Progress</Text>
        <Text style={styles.body}>
          {unlockedCount} / {cards.length} achievements unlocked.
        </Text>
      </View>

      <View style={styles.list}>
        {cards.map((achievement) => (
          <AchievementCard key={achievement.id} achievement={achievement} />
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.colors.background },
  content: {
    padding: theme.spacing.lg,
    gap: theme.spacing.lg,
    paddingBottom: theme.spacing.xl * 2,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
  backLink: {
    color: theme.colors.accentGlow,
    fontSize: theme.font.sm,
    fontWeight: '700',
  },
  heroCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.lg,
    gap: theme.spacing.sm,
  },
  kicker: {
    color: theme.colors.accentGlow,
    fontSize: theme.font.sm,
    fontWeight: '800',
    letterSpacing: 1,
  },
  title: {
    color: theme.colors.textPrimary,
    fontSize: theme.font.xl,
    fontWeight: '900',
  },
  body: {
    color: theme.colors.textMuted,
    fontSize: theme.font.md,
    lineHeight: 22,
  },
  list: {
    gap: theme.spacing.md,
  },
});
