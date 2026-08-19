import { StyleSheet, Text, View } from 'react-native';
import { IconCheck } from '@tabler/icons-react-native';

import { chronicleColors, chronicleFontFamily, chronicleSpacing, chronicleType } from '../../theme/chronicle';

type HabitWeekRowProps = {
  /** Monday-first, seven entries. */
  days: boolean[];
  accent: string;
};

const WEEKDAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

/** Weekly progress strip for habits with a simple daily-boolean model. */
export function HabitWeekRow({ days, accent }: HabitWeekRowProps) {
  return (
    <View style={styles.row}>
      {WEEKDAYS.map((label, index) => {
        const done = days[index] ?? false;
        return (
          <View key={`${label}-${index}`} style={styles.day}>
            <Text style={styles.label}>{label}</Text>
            <View style={[styles.circle, done ? { backgroundColor: accent, borderColor: accent } : null]}>
              {done ? <IconCheck size={14} strokeWidth={2.5} color={chronicleColors.bgBase} /> : null}
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    backgroundColor: chronicleColors.bgSurface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: chronicleColors.borderSubtle,
    paddingVertical: chronicleSpacing.md,
    paddingHorizontal: chronicleSpacing.sm,
  },
  day: {
    flex: 1,
    alignItems: 'center',
    gap: chronicleSpacing.xs,
  },
  label: {
    color: chronicleColors.textMuted,
    fontFamily: chronicleFontFamily.body,
    fontSize: chronicleType.xs,
  },
  circle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: chronicleColors.borderSubtle,
  },
});
