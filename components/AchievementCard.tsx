import { StyleSheet, Text, View } from 'react-native';

import { theme } from '../constants/theme';
import type { AchievementCardView } from '../lib/types';

interface AchievementCardProps {
  achievement: AchievementCardView;
}

export function AchievementCard({ achievement }: AchievementCardProps) {
  return (
    <View style={[styles.card, achievement.unlocked ? styles.unlockedCard : styles.lockedCard]}>
      <View style={styles.header}>
        <Text style={styles.icon}>{achievement.icon}</Text>
        <View style={styles.copy}>
          <Text style={styles.title}>{achievement.title}</Text>
          <Text style={styles.description}>{achievement.description}</Text>
        </View>
      </View>

      <View style={styles.progressBlock}>
        <Text style={styles.progressText}>
          {achievement.progress.current} / {achievement.progress.target} {achievement.progress.label}
        </Text>
        <View style={styles.track}>
          <View
            style={[
              styles.fill,
              {
                width: `${Math.min(
                  (achievement.progress.current / achievement.progress.target) * 100,
                  100
                )}%`,
              },
            ]}
          />
        </View>
      </View>

      <View style={styles.footer}>
        <Text style={styles.reward}>
          Reward: +{achievement.rewardXP} XP
          {Object.keys(achievement.rewardStats).length > 0
            ? ` • ${Object.entries(achievement.rewardStats)
                .map(([key, value]) => `${key} +${value}`)
                .join(' • ')}`
            : ''}
        </Text>
        <Text style={styles.state}>
          {achievement.unlocked ? `Unlocked ${achievement.unlockedAt?.slice(0, 10)}` : 'Locked'}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: theme.radius.md,
    borderWidth: 1,
    padding: theme.spacing.md,
    gap: theme.spacing.md,
  },
  unlockedCard: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.accent,
  },
  lockedCard: {
    backgroundColor: theme.colors.surfaceAlt,
    borderColor: theme.colors.border,
    opacity: 0.72,
  },
  header: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  icon: {
    fontSize: 28,
  },
  copy: {
    flex: 1,
    gap: theme.spacing.xs,
  },
  title: {
    color: theme.colors.textPrimary,
    fontSize: theme.font.md,
    fontWeight: '800',
  },
  description: {
    color: theme.colors.textMuted,
    fontSize: theme.font.sm,
    lineHeight: 18,
  },
  progressBlock: {
    gap: theme.spacing.sm,
  },
  progressText: {
    color: theme.colors.textPrimary,
    fontSize: theme.font.sm,
    fontWeight: '700',
  },
  track: {
    height: 10,
    borderRadius: 999,
    backgroundColor: theme.colors.background,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    backgroundColor: theme.colors.accent,
  },
  footer: {
    gap: theme.spacing.xs,
  },
  reward: {
    color: theme.colors.accentGlow,
    fontSize: theme.font.sm,
    lineHeight: 18,
  },
  state: {
    color: theme.colors.textMuted,
    fontSize: theme.font.sm,
  },
});
