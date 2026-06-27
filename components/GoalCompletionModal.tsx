import { Modal, ScrollView, StyleSheet, Text, View } from 'react-native';

import { theme } from '../constants/theme';
import type { GoalRewardResult } from '../lib/types';
import { PrimaryButton } from './PrimaryButton';

interface GoalCompletionModalProps {
  visible: boolean;
  completedGoals: GoalRewardResult[];
  onClose: () => void;
}

export function GoalCompletionModal({
  visible,
  completedGoals,
  onClose,
}: GoalCompletionModalProps) {
  if (completedGoals.length === 0) {
    return null;
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Text style={styles.kicker}>GOAL COMPLETED</Text>
          <ScrollView contentContainerStyle={styles.list}>
            {completedGoals.map(({ goal }) => (
              <View key={goal.id} style={styles.item}>
                <Text style={styles.title}>{goal.title}</Text>
                <Text style={styles.body}>{goal.category.toUpperCase()} • {goal.progressPercent}% complete</Text>
                <Text style={styles.reward}>+{goal.bonusXP} XP reward granted</Text>
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
    maxHeight: '76%',
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
  title: {
    color: theme.colors.textPrimary,
    fontSize: theme.font.md,
    fontWeight: '800',
  },
  body: {
    color: theme.colors.textMuted,
    fontSize: theme.font.sm,
  },
  reward: {
    color: theme.colors.accent,
    fontSize: theme.font.sm,
    fontWeight: '700',
  },
});
