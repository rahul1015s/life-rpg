import { StyleSheet, View } from 'react-native';
import { Calendar } from 'react-native-calendars';
import type { DateData, MarkedDates, Theme } from 'react-native-calendars/src/types';

import { theme } from '../constants/theme';

type AppCalendarProps = {
  markedDates: MarkedDates;
  onDayPress?: (day: DateData) => void;
  calendarTheme?: Theme;
  current?: string;
  hideArrows?: boolean;
  disableMonthChange?: boolean;
};

const baseTheme: Theme = {
  backgroundColor: theme.colors.background,
  calendarBackground: theme.colors.surface,
  textSectionTitleColor: theme.colors.textMuted,
  monthTextColor: theme.colors.textPrimary,
  dayTextColor: theme.colors.textPrimary,
  todayTextColor: theme.colors.accent,
  selectedDayTextColor: theme.colors.background,
  selectedDayBackgroundColor: theme.colors.accent,
  textDisabledColor: theme.colors.textMuted,
  textInactiveColor: theme.colors.textMuted,
  arrowColor: theme.colors.accent,
  dotColor: theme.colors.accent,
  selectedDotColor: theme.colors.background,
  textDayFontFamily: theme.family.mono,
  textMonthFontFamily: theme.family.serifBold,
  textDayHeaderFontFamily: theme.family.monoBold,
  textDayFontSize: theme.font.sm,
  textMonthFontSize: theme.font.lg,
  textDayHeaderFontSize: theme.font.sm,
  weekVerticalMargin: 6,
  stylesheet: {
    calendar: {
      main: {
        borderWidth: theme.borders.panel,
        borderColor: theme.colors.border,
        paddingBottom: theme.spacing.sm,
      },
      header: {
        borderBottomWidth: theme.borders.hairline,
        borderBottomColor: theme.colors.border,
        marginBottom: theme.spacing.sm,
        paddingHorizontal: theme.spacing.sm,
        paddingTop: theme.spacing.sm,
      },
    },
    day: {
      basic: {
        base: {
          width: 34,
          height: 34,
          alignItems: 'center',
          justifyContent: 'center',
        },
        selected: {
          borderRadius: 0,
        },
        today: {
          borderWidth: theme.borders.hairline,
          borderColor: theme.colors.accent,
          borderRadius: 0,
        },
      },
    },
  },
};

export function AppCalendar({
  markedDates,
  onDayPress,
  calendarTheme,
  current,
  hideArrows = false,
  disableMonthChange = false,
}: AppCalendarProps) {
  const mergedTheme = {
    ...baseTheme,
    ...calendarTheme,
    stylesheet: {
      ...baseTheme.stylesheet,
      ...calendarTheme?.stylesheet,
      calendar: {
        ...baseTheme.stylesheet?.calendar,
        ...calendarTheme?.stylesheet?.calendar,
      },
      day: {
        ...baseTheme.stylesheet?.day,
        ...calendarTheme?.stylesheet?.day,
      },
    },
  } satisfies Theme;

  return (
    <View style={styles.wrap}>
      <Calendar
        current={current}
        markedDates={markedDates}
        markingType="multi-dot"
        onDayPress={onDayPress}
        hideExtraDays={false}
        disableMonthChange={disableMonthChange}
        hideArrows={hideArrows}
        theme={mergedTheme}
        style={styles.calendar}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: theme.colors.background,
  },
  calendar: {
    borderRadius: 0,
  },
});
