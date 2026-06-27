import { StyleSheet, Text, View } from 'react-native';

import { theme } from '../constants/theme';

interface XPBarProps {
  currentXP: number;
  nextLevelXP: number;
}

export function XPBar({ currentXP, nextLevelXP }: XPBarProps) {
  const progress = Math.min(currentXP / nextLevelXP, 1);

  return (
    <View style={styles.wrapper}>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${progress * 100}%` }]} />
      </View>
      <Text style={styles.label}>
        {currentXP} / {nextLevelXP} XP
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: theme.spacing.sm,
  },
  track: {
    height: 12,
    borderRadius: 999,
    backgroundColor: theme.colors.surfaceAlt,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  fill: {
    height: '100%',
    backgroundColor: theme.colors.accent,
  },
  label: {
    color: theme.colors.textMuted,
    fontSize: theme.font.sm,
    fontWeight: '600',
  },
});
