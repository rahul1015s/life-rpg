import { Modal, ScrollView, StyleSheet, Text, View } from 'react-native';

import { theme } from '../constants/theme';
import { categoryLabels, getDifficultyLabel } from '../lib/questUtils';
import type { DailyQuest, StatKey } from '../lib/types';
import { PrimaryButton } from './PrimaryButton';

interface QuestDetailModalProps {
  quest: DailyQuest | null;
  visible: boolean;
  onClose: () => void;
}

function formatStats(stats: Partial<Record<StatKey, number>>): string {
  return Object.entries(stats)
    .map(([key, value]) => `${key} +${value}`)
    .join(' • ');
}

export function QuestDetailModal({ quest, visible, onClose }: QuestDetailModalProps) {
  if (!quest) {
    return null;
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <ScrollView contentContainerStyle={styles.content}>
            <View style={styles.badgeRow}>
              <Text style={styles.categoryBadge}>{categoryLabels[quest.category]}</Text>
              <Text style={styles.difficultyBadge}>{getDifficultyLabel(quest.difficulty)}</Text>
              {quest.isBonus ? <Text style={styles.bonusBadge}>Bonus</Text> : null}
              {quest.isAnchor ? <Text style={styles.anchorBadge}>Anchor</Text> : null}
            </View>

            <Text style={styles.title}>{quest.title}</Text>
            <Text style={styles.body}>{quest.description}</Text>

            <View style={styles.metaCard}>
              <Text style={styles.metaLine}>XP Reward: +{quest.xp}</Text>
              <Text style={styles.metaLine}>Recommended Time: {quest.recommendedTime}</Text>
              <Text style={styles.metaLine}>Repeat Type: {quest.repeatType}</Text>
              <Text style={styles.metaLine}>Affected Stats: {formatStats(quest.statEffects)}</Text>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Why Today</Text>
              <Text style={styles.body}>{quest.whyToday || 'Generated to support your current growth system.'}</Text>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Why This Helps</Text>
              <Text style={styles.body}>{quest.whyThisHelps}</Text>
            </View>

            {quest.safetyNote ? (
              <View style={styles.noteCard}>
                <Text style={styles.sectionTitle}>Safety & Respect</Text>
                <Text style={styles.body}>{quest.safetyNote}</Text>
              </View>
            ) : null}
          </ScrollView>

          <PrimaryButton label="Close" onPress={onClose} />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'center',
    padding: theme.spacing.lg,
    backgroundColor: 'rgba(11, 7, 16, 0.85)',
    zIndex: 2,
  },
  card: {
    maxHeight: '82%',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  content: {
    gap: theme.spacing.md,
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
    borderRadius: 999,
    fontSize: theme.font.sm,
    fontWeight: '700',
  },
  difficultyBadge: {
    backgroundColor: theme.colors.primary,
    color: theme.colors.textPrimary,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: 999,
    fontSize: theme.font.sm,
    fontWeight: '700',
  },
  bonusBadge: {
    backgroundColor: theme.colors.accent,
    color: theme.colors.background,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: 999,
    fontSize: theme.font.sm,
    fontWeight: '800',
  },
  anchorBadge: {
    backgroundColor: theme.colors.textPrimary,
    color: theme.colors.background,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: 999,
    fontSize: theme.font.sm,
    fontWeight: '800',
  },
  title: {
    color: theme.colors.textPrimary,
    fontSize: theme.font.lg,
    fontWeight: '900',
  },
  body: {
    color: theme.colors.textMuted,
    fontSize: theme.font.md,
    lineHeight: 22,
  },
  metaCard: {
    backgroundColor: theme.colors.surfaceAlt,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  metaLine: {
    color: theme.colors.textPrimary,
    fontSize: theme.font.sm,
    fontWeight: '600',
  },
  section: {
    gap: theme.spacing.sm,
  },
  sectionTitle: {
    color: theme.colors.textPrimary,
    fontSize: theme.font.md,
    fontWeight: '800',
  },
  noteCard: {
    backgroundColor: theme.colors.surfaceAlt,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.accent,
    padding: theme.spacing.md,
    gap: theme.spacing.sm,
  },
});
