import { useEffect, useRef } from 'react';
import { Animated, Modal, StyleSheet, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';

import { theme } from '../constants/theme';
import type { LevelUpSummary, StatKey } from '../lib/types';
import { PrimaryButton } from './PrimaryButton';

interface LevelUpModalProps {
  visible: boolean;
  summary: LevelUpSummary | null;
  onDismiss: () => void;
}

export function LevelUpModal({ visible, summary, onDismiss }: LevelUpModalProps) {
  const scale = useRef(new Animated.Value(0.9)).current;
  const opacity = useRef(new Animated.Value(0)).current;

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
        duration: 220,
        useNativeDriver: true,
      }),
      Animated.spring(scale, {
        toValue: 1,
        friction: 7,
        tension: 90,
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
          <Text style={styles.kicker}>LEVEL ASCENSION</Text>
          <Text style={styles.level}>
            Level {summary.previousLevel} {'->'} Level {summary.newLevel}
          </Text>
          <Text style={styles.body}>
            {summary.rankChanged
              ? `Rank advanced from ${summary.previousRank} to ${summary.currentRank}.`
              : `Rank remains ${summary.currentRank}.`}
          </Text>
          <View style={styles.statCard}>
            <Text style={styles.statTitle}>Stat Gains</Text>
            <Text style={styles.statBody}>
              {statGainEntries.length > 0
                ? statGainEntries.map(([key, value]) => `${key} +${value}`).join(' • ')
                : 'No additional stat gains recorded.'}
            </Text>
          </View>
          <PrimaryButton label="Continue" onPress={onDismiss} />
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
    backgroundColor: 'rgba(11, 7, 16, 0.88)',
    padding: theme.spacing.lg,
    zIndex: 2,
  },
  card: {
    width: '100%',
    maxWidth: 390,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.accent,
    padding: theme.spacing.xl,
    gap: theme.spacing.md,
    shadowColor: theme.colors.accentGlow,
    shadowOpacity: 0.25,
    shadowRadius: 22,
  },
  kicker: {
    color: theme.colors.accentGlow,
    fontSize: theme.font.sm,
    fontWeight: '800',
    letterSpacing: 1.2,
    textAlign: 'center',
  },
  level: {
    color: theme.colors.textPrimary,
    fontSize: theme.font.xl,
    fontWeight: '900',
    textAlign: 'center',
  },
  body: {
    color: theme.colors.textMuted,
    fontSize: theme.font.md,
    lineHeight: 22,
    textAlign: 'center',
  },
  statCard: {
    backgroundColor: theme.colors.surfaceAlt,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    gap: theme.spacing.xs,
  },
  statTitle: {
    color: theme.colors.textPrimary,
    fontSize: theme.font.md,
    fontWeight: '800',
  },
  statBody: {
    color: theme.colors.accentGlow,
    fontSize: theme.font.sm,
    lineHeight: 18,
  },
});
