import { StyleSheet, Text, View } from 'react-native';

import { chronicleColors, chronicleFontFamily, chronicleType } from '../../theme/chronicle';
import type { HabitDayCell, HabitTrackerConfig } from './habitTheme';

type HabitDayBadgeProps = {
  cell: HabitDayCell | null;
  dayNumber: number | null;
  isToday: boolean;
  accent: string;
  dayIndicator: HabitTrackerConfig['dayIndicator'];
  /** One colour per sub-metric dot. Used by the master calendar so each habit keeps its hue. */
  dotColors?: string[];
};

/**
 * One calendar cell: circular date badge with the day number, and the per-day completion
 * indicator beneath it. Circles are intentional here (DESIGN.md section 7 exception).
 */
export function HabitDayBadge({ cell, dayNumber, isToday, accent, dayIndicator, dotColors }: HabitDayBadgeProps) {
  if (dayNumber === null) {
    return <View style={styles.slot} />;
  }

  const state = cell?.state ?? 'none';

  return (
    <View style={styles.slot}>
      <View
        style={[
          styles.badge,
          state === 'success' ? { backgroundColor: accent } : null,
          state === 'fail' ? styles.badgeFail : null,
          isToday ? { borderColor: accent, borderWidth: 2 } : null,
        ]}>
        <Text style={[styles.dayText, state === 'success' ? styles.dayTextOnAccent : null]}>{dayNumber}</Text>
      </View>

      {dayIndicator === 'grid' ? (
        <View style={styles.dotGrid}>
          {(cell?.subMetrics ?? []).map((done, index) => (
            <View
              key={index}
              style={[
                styles.gridDot,
                done ? { backgroundColor: dotColors?.[index] ?? accent } : styles.gridDotEmpty,
              ]}
            />
          ))}
        </View>
      ) : (
        <View
          style={[
            styles.dot,
            state === 'success' ? { backgroundColor: accent } : null,
            state === 'fail' ? styles.dotFail : null,
          ]}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  slot: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
  },
  badge: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: chronicleColors.bgSurfaceRaised,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  badgeFail: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: chronicleColors.accentEmber,
  },
  dayText: {
    color: chronicleColors.textPrimary,
    fontFamily: chronicleFontFamily.body,
    fontSize: chronicleType.sm,
  },
  dayTextOnAccent: {
    color: chronicleColors.bgBase,
    fontFamily: chronicleFontFamily.bodySemiBold,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: chronicleColors.borderSubtle,
  },
  dotFail: {
    backgroundColor: chronicleColors.accentEmber,
  },
  dotGrid: {
    flexDirection: 'row',
    gap: 2,
    height: 6,
  },
  gridDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  gridDotEmpty: {
    backgroundColor: chronicleColors.borderSubtle,
  },
});
