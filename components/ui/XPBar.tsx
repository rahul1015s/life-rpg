import { StyleSheet, Text, View } from 'react-native';

import { borders, colors, spacing } from '../../theme/tokens';
import { fontFamily, typeScale } from '../../theme/typography';
import { Halftone } from './Halftone';

type XPBarProps = {
  currentXP: number;
  nextLevelXP: number;
};

export function XPBar({ currentXP, nextLevelXP }: XPBarProps) {
  const progress = Math.min(currentXP / nextLevelXP, 1);

  return (
    <View style={styles.wrap}>
      <View style={styles.meta}>
        <Text style={styles.metaText}>CURRENT EXP</Text>
        <Text style={styles.metaText}>
          {currentXP} / {nextLevelXP}
        </Text>
      </View>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${progress * 100}%` }]}>
          <Halftone density="dense" tint={colors.ink} opacity={0.25} />
          <View style={styles.edge} />
        </View>
        <View style={styles.ticks}>
          {Array.from({ length: 10 }).map((_, index) => (
            <View key={index} style={styles.tick} />
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.sm,
  },
  meta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metaText: {
    color: colors.parchmentDim,
    fontFamily: fontFamily.mono,
    fontSize: typeScale.xs,
    letterSpacing: 0.6,
  },
  track: {
    height: 22,
    backgroundColor: colors.ink,
    borderWidth: borders.panel,
    borderColor: colors.screentoneLight,
    overflow: 'hidden',
    position: 'relative',
  },
  fill: {
    height: '100%',
    backgroundColor: colors.gold,
    position: 'relative',
    overflow: 'hidden',
  },
  edge: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 4,
    backgroundColor: colors.parchment,
  },
  ticks: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    flexDirection: 'row',
  },
  tick: {
    flex: 1,
    borderRightWidth: 1,
    borderRightColor: 'rgba(10,9,8,0.5)',
  },
});
