import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { categoryLabels, getDifficultyLabel } from '../../lib/questUtils';
import type { DailyQuest } from '../../lib/types';
import { theme } from '../../constants/theme';
import { borders, colors, spacing } from '../../theme/tokens';
import { fontFamily, typeScale } from '../../theme/typography';
import { CategoryTag } from './CategoryTag';

type QuestRowProps = {
  quest: DailyQuest;
  onPress: (quest: DailyQuest) => void;
  onComplete: (questId: string) => void;
  loading?: boolean;
  isNext?: boolean;
};

export function QuestRow({ quest, onPress, onComplete, loading = false, isNext = false }: QuestRowProps) {
  return (
    <Pressable
      style={[styles.row, isNext && styles.next, quest.completed && styles.done, quest.locked && styles.locked]}
      onPress={() => onPress(quest)}>
      <Pressable
        style={[styles.check, quest.completed && styles.checkDone, quest.locked && styles.checkLocked]}
        onPress={() => onComplete(quest.id)}
        disabled={quest.completed || loading || quest.locked}>
        {loading ? (
          <ActivityIndicator size="small" color={colors.parchment} />
        ) : quest.completed ? (
          <Text style={styles.checkMark}>✓</Text>
        ) : quest.locked ? (
          <Text style={styles.lockedMark}>!</Text>
        ) : null}
      </Pressable>
      <View style={styles.copy}>
        <View style={styles.tagRow}>
          <CategoryTag category={quest.category} />
          {quest.isAnchor ? <Text style={styles.anchorTag}>ANCHOR</Text> : null}
        </View>
        <Text style={styles.title}>{quest.title}</Text>
        <Text style={styles.meta}>
          {quest.isPunishment ? 'Punishment' : categoryLabels[quest.category]} · {getDifficultyLabel(quest.difficulty)} · {quest.recommendedTime}
        </Text>
        {quest.whyToday ? <Text style={styles.reason}>{quest.whyToday}</Text> : null}
        {quest.locked ? <Text style={styles.lockedText}>Locked until punishment quest is completed.</Text> : null}
      </View>
      <Text style={styles.xp}>+{quest.xp}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.screentone,
    borderWidth: borders.panel,
    borderColor: colors.ink,
    borderLeftWidth: 6,
    borderLeftColor: colors.screentone,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
  },
  next: {
    borderLeftColor: colors.gold,
  },
  done: {
    borderLeftColor: colors.sealRed,
    opacity: 0.55,
  },
  locked: {
    opacity: 0.78,
    borderLeftColor: colors.parchmentDim,
  },
  check: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: colors.parchmentDim,
    borderRadius: theme.radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  checkDone: {
    borderColor: colors.sealRed,
    backgroundColor: colors.sealRed,
  },
  checkLocked: {
    borderColor: colors.parchmentDim,
  },
  checkMark: {
    color: colors.ink,
    fontFamily: fontFamily.monoBold,
    fontSize: typeScale.sm,
  },
  lockedMark: {
    color: colors.parchmentDim,
    fontFamily: fontFamily.monoBold,
    fontSize: typeScale.sm,
  },
  copy: {
    flex: 1,
    gap: 4,
  },
  tagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  anchorTag: {
    color: colors.ink,
    backgroundColor: colors.gold,
    paddingHorizontal: spacing.xs,
    fontFamily: fontFamily.monoBold,
    fontSize: typeScale.xs,
  },
  title: {
    color: colors.parchment,
    fontFamily: fontFamily.serifSemiBold,
    fontSize: typeScale.md,
  },
  meta: {
    color: colors.parchmentDim,
    fontFamily: fontFamily.mono,
    fontSize: typeScale.sm,
    letterSpacing: 0.4,
  },
  reason: {
    color: colors.parchment,
    fontFamily: fontFamily.serif,
    fontSize: typeScale.sm,
    lineHeight: 20,
  },
  lockedText: {
    color: colors.gold,
    fontFamily: fontFamily.mono,
    fontSize: typeScale.sm,
  },
  xp: {
    color: colors.gold,
    fontFamily: fontFamily.display,
    fontSize: typeScale.md,
  },
});
