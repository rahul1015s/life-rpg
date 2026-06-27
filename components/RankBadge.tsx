import { StyleSheet, Text, View } from 'react-native';

import { theme } from '../constants/theme';
import type { RankName } from '../lib/types';

const rankIcons: Record<RankName, string> = {
  Beginner: '◈',
  Trainee: '◉',
  Hunter: '⬢',
  Elite: '✦',
  Hero: '✹',
  King: '✪',
};

interface RankBadgeProps {
  rank: RankName;
}

export function RankBadge({ rank }: RankBadgeProps) {
  return (
    <View style={styles.badge}>
      <Text style={styles.icon}>{rankIcons[rank]}</Text>
      <Text style={styles.label}>{rank}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: 999,
    backgroundColor: theme.colors.surfaceAlt,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  icon: {
    color: theme.colors.accent,
    fontSize: theme.font.md,
  },
  label: {
    color: theme.colors.textPrimary,
    fontSize: theme.font.md,
    fontWeight: '700',
  },
});
