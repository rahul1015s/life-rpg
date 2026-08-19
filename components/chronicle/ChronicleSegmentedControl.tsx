import { Pressable, StyleSheet, Text, View } from 'react-native';

import { chronicleColors, chronicleFontFamily, chronicleRadius, chronicleSpacing, chronicleType } from '../../theme/chronicle';

type ChronicleSegmentOption<T extends string> = {
  value: T;
  label: string;
  /** Fill color when selected. Omit for the default gold. */
  activeColor?: string;
  /** Text color when selected. Defaults to dark text (for bright fills like gold/jade/ember). */
  activeTextColor?: string;
};

type ChronicleSegmentedControlProps<T extends string> = {
  options: ChronicleSegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
};

export function ChronicleSegmentedControl<T extends string>({ options, value, onChange }: ChronicleSegmentedControlProps<T>) {
  return (
    <View style={styles.row}>
      {options.map((option) => {
        const selected = option.value === value;
        const activeColor = option.activeColor ?? chronicleColors.accentGold;
        const activeTextColor = option.activeTextColor ?? chronicleColors.bgBase;
        return (
          <Pressable
            key={option.value}
            style={({ pressed }) => [
              styles.segment,
              selected ? { backgroundColor: activeColor, borderColor: activeColor } : styles.segmentUnselected,
              pressed ? styles.pressed : null,
            ]}
            onPress={() => onChange(option.value)}>
            <Text style={[styles.label, selected ? { color: activeTextColor } : styles.labelUnselected]}>{option.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: chronicleSpacing.sm,
  },
  segment: {
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: chronicleSpacing.md,
    paddingVertical: chronicleSpacing.sm,
    borderRadius: chronicleRadius.lg,
    borderWidth: 2,
  },
  segmentUnselected: {
    backgroundColor: chronicleColors.bgSurfaceRaised,
    borderColor: chronicleColors.bgSurfaceRaised,
  },
  pressed: {
    opacity: 0.75,
  },
  label: {
    fontFamily: chronicleFontFamily.bodyBold,
    fontSize: chronicleType.sm,
    textTransform: 'capitalize',
  },
  labelUnselected: {
    color: chronicleColors.textMuted,
  },
});
