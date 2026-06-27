import { StyleSheet, Text, View } from 'react-native';

import { borders, colors, spacing } from '../../theme/tokens';
import { fontFamily, typeScale } from '../../theme/typography';

type StatTileProps = {
  value: string;
  label: string;
  accent?: 'red' | 'gold';
};

export function StatTile({ value, label, accent = 'red' }: StatTileProps) {
  return (
    <View style={styles.tile}>
      <Text style={[styles.value, accent === 'gold' ? styles.gold : styles.red]}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  tile: {
    flex: 1,
    backgroundColor: colors.screentone,
    borderWidth: borders.panel,
    borderColor: colors.ink,
    padding: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 94,
  },
  value: {
    fontFamily: fontFamily.display,
    fontSize: typeScale.xl,
  },
  red: {
    color: colors.sealRed,
  },
  gold: {
    color: colors.gold,
  },
  label: {
    marginTop: 2,
    color: colors.parchmentDim,
    fontFamily: fontFamily.mono,
    fontSize: typeScale.xs,
    letterSpacing: 1,
    textAlign: 'center',
  },
});
