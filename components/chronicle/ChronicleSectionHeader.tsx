import { StyleSheet, Text, View } from 'react-native';

import { chronicleColors, chronicleFontFamily, chronicleSpacing, chronicleType } from '../../theme/chronicle';

type ChronicleSectionHeaderProps = {
  title: string;
  counter?: string;
};

export function ChronicleSectionHeader({ title, counter }: ChronicleSectionHeaderProps) {
  return (
    <View style={styles.row}>
      <Text style={styles.title}>{title}</Text>
      {counter ? <Text style={styles.counter}>{counter}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: chronicleSpacing.sm,
  },
  title: {
    color: chronicleColors.textPrimary,
    fontFamily: chronicleFontFamily.display,
    fontSize: chronicleType.lg,
    letterSpacing: 0.5,
  },
  counter: {
    color: chronicleColors.accentGold,
    fontFamily: chronicleFontFamily.mono,
    fontSize: chronicleType.xs,
    letterSpacing: 0.5,
  },
});
