import { useEffect, useState } from 'react';
import { Animated, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';

import type { LevelUpSummary, StatKey } from '../lib/types';
import { colors, spacing, borders } from '../theme/tokens';
import { fontFamily, typeScale } from '../theme/typography';
import { RankSeal } from './ui/RankSeal';

interface LevelUpModalProps {
  visible: boolean;
  summary: LevelUpSummary | null;
  onDismiss: () => void;
}

export function LevelUpModal({ visible, summary, onDismiss }: LevelUpModalProps) {
  const [scale] = useState(() => new Animated.Value(0.9));
  const [opacity] = useState(() => new Animated.Value(0));

  useEffect(() => {
    if (!visible) {
      scale.setValue(0.9);
      opacity.setValue(0);
      return;
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined);

    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 180,
        useNativeDriver: true,
      }),
      Animated.timing(scale, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  }, [opacity, scale, visible]);

  if (!summary) {
    return null;
  }

  const statGainEntries = Object.entries(summary.statGains) as [StatKey, number][];

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onDismiss}>
      <View style={styles.backdrop}>
        <Animated.View style={[styles.card, { opacity, transform: [{ scale }] }]}>
          <Text style={styles.kicker}>SYSTEM NOTICE</Text>
          <Text style={styles.title}>LEVEL UP</Text>

          <View style={styles.jumpRow}>
            <RankSeal rank={summary.previousRank} size="lg" />
            <Text style={styles.arrow}>{'->'}</Text>
            <RankSeal rank={summary.currentRank} size="lg" />
          </View>

          <Text style={styles.levels}>
            LV {summary.previousLevel} {'->'} LV {summary.newLevel}
          </Text>
          <Text style={styles.body}>
            {summary.rankChanged
              ? `Rank advanced from ${summary.previousRank} to ${summary.currentRank}.`
              : `Rank remains ${summary.currentRank}.`}
          </Text>

          <View style={styles.gains}>
            {statGainEntries.length > 0 ? (
              statGainEntries.map(([key, value]) => (
                <View key={key} style={styles.gainChip}>
                  <Text style={styles.gainText}>
                    {key.toUpperCase()} +{value}
                  </Text>
                </View>
              ))
            ) : (
              <View style={styles.gainChip}>
                <Text style={styles.gainText}>SYSTEM PROGRESS RECORDED</Text>
              </View>
            )}
          </View>

          <Pressable style={styles.button} onPress={onDismiss}>
            <Text style={styles.buttonText}>CONTINUE</Text>
          </Pressable>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(10, 9, 8, 0.92)',
    padding: spacing.lg,
  },
  card: {
    width: '100%',
    maxWidth: 390,
    backgroundColor: colors.ink,
    borderWidth: borders.panel,
    borderColor: colors.ink,
    padding: spacing.xl,
    gap: spacing.md,
  },
  kicker: {
    color: colors.parchmentDim,
    fontFamily: fontFamily.mono,
    fontSize: typeScale.sm,
    textAlign: 'center',
    letterSpacing: 1,
  },
  title: {
    color: colors.parchment,
    fontFamily: fontFamily.display,
    fontSize: typeScale.xxl,
    textAlign: 'center',
    textShadowColor: colors.sealRedDim,
    textShadowOffset: { width: 3, height: 3 },
    textShadowRadius: 0,
  },
  jumpRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.lg,
    marginVertical: spacing.sm,
  },
  arrow: {
    color: colors.gold,
    fontFamily: fontFamily.display,
    fontSize: typeScale.xl,
  },
  levels: {
    color: colors.gold,
    fontFamily: fontFamily.display,
    fontSize: typeScale.lg,
    textAlign: 'center',
  },
  body: {
    color: colors.parchment,
    fontFamily: fontFamily.serif,
    fontSize: typeScale.md,
    lineHeight: 22,
    textAlign: 'center',
  },
  gains: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  gainChip: {
    backgroundColor: colors.screentone,
    borderWidth: 1,
    borderColor: colors.gold,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  gainText: {
    color: colors.gold,
    fontFamily: fontFamily.mono,
    fontSize: typeScale.sm,
  },
  button: {
    marginTop: spacing.sm,
    backgroundColor: colors.sealRed,
    borderWidth: borders.panel,
    borderColor: colors.ink,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  buttonText: {
    color: colors.ink,
    fontFamily: fontFamily.display,
    fontSize: typeScale.md,
    letterSpacing: 1.2,
  },
});
