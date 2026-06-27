import { StyleSheet, Text, View } from 'react-native';

import { borders, colors, spacing } from '../../theme/tokens';
import { fontFamily, typeScale } from '../../theme/typography';

type BonusCardProps = {
  title: string;
  xp: number;
};

export function BonusCard({ title, xp }: BonusCardProps) {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.value}>+{xp} XP</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: colors.indigoDim,
    borderWidth: borders.panel,
    borderColor: colors.ink,
    padding: spacing.md,
    minHeight: 82,
    justifyContent: 'space-between',
  },
  title: {
    color: colors.parchment,
    fontFamily: fontFamily.serif,
    fontSize: typeScale.sm,
  },
  value: {
    color: colors.gold,
    fontFamily: fontFamily.display,
    fontSize: typeScale.md,
  },
});
