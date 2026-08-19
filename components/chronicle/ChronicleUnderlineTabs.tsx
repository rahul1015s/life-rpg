import { Pressable, StyleSheet, Text, View } from 'react-native';

import { chronicleColors, chronicleFontFamily, chronicleSpacing, chronicleType } from '../../theme/chronicle';

type ChronicleUnderlineTabsProps<T extends string> = {
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
};

/**
 * Tab row using the "rune mark" active indicator from DESIGN.md section 6: a thin 2px gold
 * underline beneath the active item, never a pill or filled background. Same treatment as
 * BottomNav, so the two read as one system.
 */
export function ChronicleUnderlineTabs<T extends string>({
  options,
  value,
  onChange,
}: ChronicleUnderlineTabsProps<T>) {
  return (
    <View style={styles.row}>
      {options.map((option) => {
        const active = option.value === value;
        return (
          <Pressable
            key={option.value}
            style={styles.tab}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
            onPress={() => onChange(option.value)}>
            <Text style={[styles.label, active ? styles.labelActive : null]}>{option.label}</Text>
            <View style={[styles.indicator, active ? styles.indicatorActive : null]} />
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: chronicleSpacing.lg,
  },
  tab: {
    alignItems: 'center',
    gap: chronicleSpacing.xs,
  },
  label: {
    color: chronicleColors.textMuted,
    fontFamily: chronicleFontFamily.bodySemiBold,
    fontSize: chronicleType.sm,
  },
  labelActive: {
    color: chronicleColors.textPrimary,
  },
  indicator: {
    height: 2,
    alignSelf: 'stretch',
    backgroundColor: 'transparent',
  },
  indicatorActive: {
    backgroundColor: chronicleColors.accentGold,
  },
});
