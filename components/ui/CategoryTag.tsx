import { StyleSheet, Text, View } from 'react-native';

import { categoryMeta } from '../../constants/theme';
import type { QuestCategory } from '../../lib/types';
import { colors, spacing } from '../../theme/tokens';
import { fontFamily, typeScale } from '../../theme/typography';

type CategoryTagProps = {
  category: QuestCategory;
};

export function CategoryTag({ category }: CategoryTagProps) {
  const meta = categoryMeta[category];

  return (
    <View style={[styles.skew, { backgroundColor: meta.color }]}>
      <Text style={[styles.label, { color: meta.textColor ?? colors.parchment }]}>{meta.label.toUpperCase()}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  skew: {
    alignSelf: 'flex-start',
    paddingLeft: spacing.sm,
    paddingRight: spacing.sm,
    paddingVertical: 2,
    transform: [{ skewX: '-18deg' }],
  },
  label: {
    fontFamily: fontFamily.mono,
    fontSize: typeScale.xs,
    transform: [{ skewX: '18deg' }],
  },
});
