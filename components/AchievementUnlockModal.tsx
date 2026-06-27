import { useEffect } from 'react';
import { Modal, ScrollView, StyleSheet, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';

import { theme } from '../constants/theme';
import type { AchievementUnlockResult } from '../lib/types';
import { PrimaryButton } from './PrimaryButton';

interface AchievementUnlockModalProps {
  visible: boolean;
  achievements: AchievementUnlockResult[];
  onClose: () => void;
}

export function AchievementUnlockModal({
  visible,
  achievements,
  onClose,
}: AchievementUnlockModalProps) {
  useEffect(() => {
    if (!visible) {
      return;
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined);
  }, [visible]);

  if (achievements.length === 0) {
    return null;
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Text style={styles.kicker}>ACHIEVEMENT UNLOCKED</Text>
          <ScrollView contentContainerStyle={styles.list}>
            {achievements.map(({ achievement, unlockedAt }) => (
              <View key={achievement.id} style={styles.item}>
                <Text style={styles.itemTitle}>
                  {achievement.icon} {achievement.title}
                </Text>
                <Text style={styles.itemBody}>{achievement.description}</Text>
                <Text style={styles.itemReward}>
                  +{achievement.rewardXP} XP
                  {Object.keys(achievement.rewardStats).length > 0
                    ? ` • ${Object.entries(achievement.rewardStats)
                        .map(([key, value]) => `${key} +${value}`)
                        .join(' • ')}`
                    : ''}
                </Text>
                <Text style={styles.itemDate}>{unlockedAt.slice(0, 10)}</Text>
              </View>
            ))}
          </ScrollView>
          <PrimaryButton label="Continue" onPress={onClose} />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'rgba(11, 7, 16, 0.88)',
    padding: theme.spacing.lg,
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.accent,
    padding: theme.spacing.lg,
    gap: theme.spacing.md,
    maxHeight: '80%',
  },
  kicker: {
    color: theme.colors.accentGlow,
    fontSize: theme.font.sm,
    fontWeight: '800',
    letterSpacing: 1.2,
    textAlign: 'center',
  },
  list: {
    gap: theme.spacing.md,
  },
  item: {
    backgroundColor: theme.colors.surfaceAlt,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    gap: theme.spacing.xs,
  },
  itemTitle: {
    color: theme.colors.textPrimary,
    fontSize: theme.font.md,
    fontWeight: '800',
  },
  itemBody: {
    color: theme.colors.textMuted,
    fontSize: theme.font.sm,
    lineHeight: 18,
  },
  itemReward: {
    color: theme.colors.accent,
    fontSize: theme.font.sm,
    lineHeight: 18,
  },
  itemDate: {
    color: theme.colors.textMuted,
    fontSize: theme.font.sm,
  },
});
