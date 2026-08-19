import type { Theme } from 'react-native-calendars/src/types';

import { chronicleColors, chronicleFontFamily, chronicleType } from './chronicle';

/** react-native-calendars theme override for Chronicle screens (Workout, No-Fap, Progress hub). */
export const chronicleCalendarTheme: Theme = {
  backgroundColor: chronicleColors.bgBase,
  calendarBackground: chronicleColors.bgSurface,
  textSectionTitleColor: chronicleColors.textMuted,
  monthTextColor: chronicleColors.textPrimary,
  dayTextColor: chronicleColors.textPrimary,
  todayTextColor: chronicleColors.accentGold,
  selectedDayTextColor: chronicleColors.bgBase,
  selectedDayBackgroundColor: chronicleColors.accentGold,
  textDisabledColor: chronicleColors.textMuted,
  textInactiveColor: chronicleColors.textMuted,
  arrowColor: chronicleColors.accentGold,
  dotColor: chronicleColors.accentGold,
  selectedDotColor: chronicleColors.bgBase,
  textDayFontFamily: chronicleFontFamily.mono,
  textMonthFontFamily: chronicleFontFamily.displaySemiBold,
  textDayHeaderFontFamily: chronicleFontFamily.mono,
  textDayFontSize: chronicleType.sm,
  textMonthFontSize: chronicleType.lg,
  textDayHeaderFontSize: chronicleType.xs,
  weekVerticalMargin: 6,
  stylesheet: {
    calendar: {
      main: {
        borderWidth: 1,
        borderColor: chronicleColors.borderSubtle,
        paddingBottom: chronicleType.sm,
      },
      header: {
        borderBottomWidth: 1,
        borderBottomColor: chronicleColors.borderSubtle,
        marginBottom: chronicleType.sm,
        paddingHorizontal: chronicleType.sm,
        paddingTop: chronicleType.sm,
      },
    },
    day: {
      basic: {
        base: {
          width: 40,
          height: 40,
          alignItems: 'center',
          justifyContent: 'center',
        },
        selected: {
          borderRadius: 20,
        },
        today: {
          borderWidth: 1,
          borderColor: chronicleColors.accentGold,
          borderRadius: 20,
        },
      },
    },
  },
};
