import { StyleSheet, Text, View } from 'react-native';

import { WaxSeal } from './chronicle/WaxSeal';
import type { AchievementCardView } from '../lib/types';
import { chronicleColors, chronicleFontFamily, chronicleRadius, chronicleSpacing, chronicleType } from '../theme/chronicle';

interface AchievementCardProps {
  achievement: AchievementCardView;
}

export function AchievementCard({ achievement }: AchievementCardProps) {
  return (
    <View style={[styles.card, achievement.unlocked ? styles.unlockedCard : styles.lockedCard]}>
      <View style={styles.header}>
        <WaxSeal completed={achievement.unlocked} size={36} />
        <View style={styles.copy}>
          <Text style={[styles.title, !achievement.unlocked && styles.mutedText]}>{achievement.title}</Text>
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
    borderRadius: chronicleRadius.md,
    borderWidth: 1,
    padding: chronicleSpacing.md,
    gap: chronicleSpacing.md,
  },
  unlockedCard: {
    backgroundColor: chronicleColors.bgSurfaceRaised,
    borderColor: chronicleColors.accentGold,
  },
  lockedCard: {
    backgroundColor: chronicleColors.bgSurface,
    borderColor: chronicleColors.borderSubtle,
  },
  header: {
    flexDirection: 'row',
    gap: chronicleSpacing.md,
  },
  copy: {
    flex: 1,
    gap: 4,
  },
  title: {
    color: chronicleColors.textPrimary,
    fontFamily: chronicleFontFamily.display,
    fontSize: chronicleType.md,
  },
  mutedText: {
    color: chronicleColors.textMuted,
  },
  description: {
    color: chronicleColors.textMuted,
    fontFamily: chronicleFontFamily.body,
    fontSize: chronicleType.sm,
    lineHeight: 20,
  },
  progressBlock: {
    gap: chronicleSpacing.sm,
  },
  progressText: {
    color: chronicleColors.textPrimary,
    fontFamily: chronicleFontFamily.mono,
    fontSize: chronicleType.xs,
  },
  track: {
    height: 12,
    borderWidth: 1,
    borderColor: chronicleColors.borderSubtle,
    backgroundColor: chronicleColors.bgSurfaceRaised,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    backgroundColor: chronicleColors.accentGold,
  },
  footer: {
    gap: 2,
  },
  reward: {
    color: chronicleColors.accentGold,
    fontFamily: chronicleFontFamily.body,
    fontSize: chronicleType.sm,
    lineHeight: 18,
  },
  state: {
    color: chronicleColors.textMuted,
    fontFamily: chronicleFontFamily.mono,
    fontSize: chronicleType.xs,
  },
});
