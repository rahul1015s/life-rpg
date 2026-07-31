import { useEffect, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';

import { theme } from '../constants/theme';
import { categoryLabels, getDifficultyLabel } from '../lib/questUtils';
import type { DailyQuest } from '../lib/types';
import { PrimaryButton } from './PrimaryButton';

interface QuestCardProps {
  quest: DailyQuest;
  onComplete: (questId: string) => void;
  onOpenDetails: (quest: DailyQuest) => void;
  loading?: boolean;
}

export function QuestCard({ quest, onComplete, onOpenDetails, loading = false }: QuestCardProps) {
  const [rewardAnimation] = useState(() => new Animated.Value(0));
  const didAnimateRef = useRef(quest.completed);

  useEffect(() => {
    if (quest.completed && !didAnimateRef.current) {
      didAnimateRef.current = true;
      rewardAnimation.setValue(0);
      Animated.sequence([
        Animated.timing(rewardAnimation, {
          toValue: 1,
          duration: 220,
          useNativeDriver: true,
        }),
        Animated.timing(rewardAnimation, {
          toValue: 0,
          duration: 260,
          delay: 500,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [quest.completed, rewardAnimation]);

  return (
    <View style={[styles.card, quest.completed ? styles.completedCard : null]}>
      <Pressable style={styles.detailsArea} onPress={() => onOpenDetails(quest)}>
        <View style={styles.badgeRow}>
          <Text style={styles.categoryBadge}>{categoryLabels[quest.category]}</Text>
          <Text style={styles.difficultyBadge}>{getDifficultyLabel(quest.difficulty)}</Text>
          {quest.isBonus ? <Text style={styles.bonusBadge}>Bonus</Text> : null}
        </View>
        <View style={styles.header}>
          <View style={styles.copy}>
            <Text style={styles.title}>{quest.title}</Text>
            <Text style={styles.description}>{quest.description}</Text>
          </View>
          <Text style={styles.xp}>+{quest.xp} XP</Text>
        </View>
        <Text style={styles.effects}>
          {Object.entries(quest.statEffects)
            .map(([key, value]) => `${key} +${value}`)
            .join(' • ')}
        </Text>
      </Pressable>

      <View style={styles.footer}>
        <PrimaryButton
          label={quest.completed ? 'Completed' : 'Complete'}
          onPress={() => onComplete(quest.id)}
          disabled={quest.completed}
          loading={loading}
          variant={quest.completed ? 'secondary' : 'primary'}
        />
      </View>

      <Animated.View
        pointerEvents="none"
        style={[
          styles.reward,
          {
            opacity: rewardAnimation,
            transform: [
              {
                scale: rewardAnimation.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.92, 1],
                }),
              },
            ],
          },
        ]}>
        <Text style={styles.rewardText}>Reward Claimed</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.md,
    gap: theme.spacing.md,
    overflow: 'hidden',
  },
  completedCard: {
    borderColor: theme.colors.success,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: theme.spacing.md,
  },
  copy: {
    flex: 1,
    gap: theme.spacing.xs,
  },
  detailsArea: {
    gap: theme.spacing.sm,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  categoryBadge: {
    backgroundColor: theme.colors.surfaceAlt,
    color: theme.colors.accentGlow,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.radius.full,
    fontSize: theme.font.sm,
    fontWeight: '700',
  },
  difficultyBadge: {
    backgroundColor: theme.colors.primary,
    color: theme.colors.textPrimary,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.radius.full,
    fontSize: theme.font.sm,
    fontWeight: '700',
  },
  bonusBadge: {
    backgroundColor: theme.colors.accent,
    color: theme.colors.background,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.radius.full,
    fontSize: theme.font.sm,
    fontWeight: '800',
  },
  title: {
    color: theme.colors.textPrimary,
    fontSize: theme.font.md,
    fontWeight: '700',
  },
  description: {
    color: theme.colors.textMuted,
    fontSize: theme.font.sm,
    lineHeight: 18,
  },
  xp: {
    color: theme.colors.accent,
    fontSize: theme.font.md,
    fontWeight: '800',
  },
  footer: {
    gap: theme.spacing.md,
  },
  effects: {
    color: theme.colors.textMuted,
    fontSize: theme.font.sm,
    lineHeight: 18,
  },
  reward: {
    position: 'absolute',
    top: theme.spacing.md,
    right: theme.spacing.md,
    backgroundColor: theme.colors.success,
    borderRadius: theme.radius.full,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  rewardText: {
    color: theme.colors.textPrimary,
    fontSize: theme.font.sm,
    fontWeight: '800',
  },
});
