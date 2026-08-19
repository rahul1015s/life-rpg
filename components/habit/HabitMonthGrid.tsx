import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { IconChevronLeft, IconChevronRight } from '@tabler/icons-react-native';
import { addMonths, endOfMonth, format, getDay, startOfMonth } from 'date-fns';

import { chronicleColors, chronicleFontFamily, chronicleSpacing, chronicleType } from '../../theme/chronicle';
import { HabitDayBadge } from './HabitDayBadge';
import type { HabitDayCell, HabitTrackerConfig } from './habitTheme';

type HabitMonthGridProps = {
  month: Date;
  onMonthChange: (next: Date) => void;
  cells: HabitDayCell[];
  accent: string;
  dayIndicator: HabitTrackerConfig['dayIndicator'];
  dotColors?: string[];
};

const WEEKDAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

/**
 * Hand-rolled month grid rather than react-native-calendars: that library's markedDates API
 * cannot render a mini dot-grid beneath each date, which DESIGN.md section 7 requires.
 * AppCalendar is left untouched for the screens already using it.
 */
export function HabitMonthGrid({ month, onMonthChange, cells, accent, dayIndicator, dotColors }: HabitMonthGridProps) {
  const todayKey = format(new Date(), 'yyyy-MM-dd');

  const weeks = useMemo(() => {
    const first = startOfMonth(month);
    const total = endOfMonth(month).getDate();
    // getDay() is Sunday-indexed; shift so Monday starts the row.
    const leadingBlanks = (getDay(first) + 6) % 7;

    const slots: (number | null)[] = [
      ...Array.from({ length: leadingBlanks }, () => null),
      ...Array.from({ length: total }, (_, index) => index + 1),
    ];
    while (slots.length % 7 !== 0) {
      slots.push(null);
    }

    return Array.from({ length: slots.length / 7 }, (_, row) => slots.slice(row * 7, row * 7 + 7));
  }, [month]);

  const cellsByDate = useMemo(() => new Map(cells.map((cell) => [cell.date, cell])), [cells]);

  function keyFor(dayNumber: number) {
    return format(new Date(month.getFullYear(), month.getMonth(), dayNumber), 'yyyy-MM-dd');
  }

  return (
    <View style={styles.wrap}>
      <View style={styles.monthRow}>
        <Pressable
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          accessibilityRole="button"
          accessibilityLabel="Previous month"
          onPress={() => onMonthChange(addMonths(month, -1))}>
          <IconChevronLeft size={20} strokeWidth={1.5} color={chronicleColors.textMuted} />
        </Pressable>
        <Text style={styles.monthLabel}>{format(month, 'MMMM yyyy')}</Text>
        <Pressable
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          accessibilityRole="button"
          accessibilityLabel="Next month"
          onPress={() => onMonthChange(addMonths(month, 1))}>
          <IconChevronRight size={20} strokeWidth={1.5} color={chronicleColors.textMuted} />
        </Pressable>
      </View>

      <View style={styles.weekdayRow}>
        {WEEKDAYS.map((day, index) => (
          <Text key={`${day}-${index}`} style={styles.weekday}>
            {day}
          </Text>
        ))}
      </View>

      {weeks.map((week, rowIndex) => (
        <View key={rowIndex} style={styles.weekRow}>
          {week.map((dayNumber, colIndex) => {
            const dateKey = dayNumber === null ? null : keyFor(dayNumber);
            return (
              <HabitDayBadge
                key={`${rowIndex}-${colIndex}`}
                dayNumber={dayNumber}
                cell={dateKey ? cellsByDate.get(dateKey) ?? null : null}
                isToday={dateKey === todayKey}
                accent={accent}
                dayIndicator={dayIndicator}
                dotColors={dotColors}
              />
            );
          })}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: chronicleColors.bgSurface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: chronicleColors.borderSubtle,
    padding: chronicleSpacing.md,
    gap: chronicleSpacing.sm,
  },
  monthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  monthLabel: {
    color: chronicleColors.textPrimary,
    fontFamily: chronicleFontFamily.bodyBold,
    fontSize: chronicleType.md,
  },
  weekdayRow: {
    flexDirection: 'row',
  },
  weekday: {
    flex: 1,
    textAlign: 'center',
    color: chronicleColors.textMuted,
    fontFamily: chronicleFontFamily.body,
    fontSize: chronicleType.xs,
  },
  weekRow: {
    flexDirection: 'row',
  },
});
