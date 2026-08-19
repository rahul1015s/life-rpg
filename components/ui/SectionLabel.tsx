import { StyleSheet, Text, View } from 'react-native';

import { colors, spacing } from '../../theme/tokens';
import { fontFamily, typeScale } from '../../theme/typography';

type SectionLabelProps = {
  title: string;
  counter?: string;
};

export function SectionLabel({ title, counter }: SectionLabelProps) {
  return (
    <View style={styles.row}>
      <Text style={styles.title}>{title}</Text>
      {counter ? <Text style={styles.counter}>{counter}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    backgroundColor: colors.ink,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  title: {
    color: colors.parchment,
    fontFamily: fontFamily.display,
    fontSize: typeScale.lg,
    letterSpacing: 2,
  },
  counter: {
    color: colors.gold,
    fontFamily: fontFamily.mono,
    fontSize: typeScale.sm,
  },
});
