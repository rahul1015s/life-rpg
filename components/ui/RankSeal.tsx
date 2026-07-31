import { StyleSheet, Text, View } from 'react-native';

import { rankMeta, theme } from '../../constants/theme';
import type { RankName } from '../../lib/types';
import { colors } from '../../theme/tokens';
import { fontFamily } from '../../theme/typography';
import { Halftone } from './Halftone';

type RankSealProps = {
  rank: RankName;
  size?: 'sm' | 'md' | 'lg';
};

const sizeMap = {
  sm: 44,
  md: 58,
  lg: 88,
} as const;

export function RankSeal({ rank, size = 'md' }: RankSealProps) {
  const meta = rankMeta[rank];
  const dimension = sizeMap[size];

  return (
    <View style={[styles.outer, { width: dimension, height: dimension, borderColor: meta.outer }]}>
      <Halftone tint={meta.outer} opacity={0.12} density="normal" />
      <View style={[styles.inner, { borderColor: meta.inner ?? meta.outer }]}>
        <Text style={[styles.letter, { color: meta.outer, fontSize: Math.round(dimension * 0.42) }]}>
          {meta.letter}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    borderWidth: 2.5,
    borderRadius: theme.radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ rotate: '-6deg' }],
    overflow: 'hidden',
    backgroundColor: colors.ink,
  },
  inner: {
    position: 'absolute',
    top: 4,
    right: 4,
    bottom: 4,
    left: 4,
    borderWidth: 1,
    borderRadius: theme.radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  letter: {
    fontFamily: fontFamily.display,
    transform: [{ rotate: '6deg' }],
    lineHeight: 40,
  },
});
