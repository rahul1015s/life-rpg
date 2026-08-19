import type { ComponentType } from 'react';
import type { SvgProps } from 'react-native-svg';

/**
 * Scoped to DESIGN.md section 7 (calendar / habit-tracker exception). These screens
 * deliberately use rounded shapes and a multi-hue per-habit palette instead of the
 * sharp-corner, gold-only Chronicle system. Do not import these tokens outside
 * components/habit/ or the habit-tracker screens.
 */
export const habitAccents = {
  workout: '#F5A93F',
  nofap: '#F5A93F',
  // Documented in DESIGN.md section 7 but unused until those habits have data models.
  deepWork: '#8B5CF6',
  read: '#22D3C7',
  meditate: '#A78BFA',
  journal: '#F97316',
} as const;

export type HabitIcon = ComponentType<SvgProps & { size?: number | string; strokeWidth?: number | string }>;

export type HabitDayState = 'none' | 'success' | 'fail';

export type HabitDayCell = {
  /** yyyy-MM-dd */
  date: string;
  state: HabitDayState;
  /** Only read when config.dayIndicator is 'grid'. */
  subMetrics?: boolean[];
};

export type HabitStatTile = {
  label: string;
  value: string;
};

export type HabitTrackerConfig = {
  key: string;
  title: string;
  tagline: string;
  accent: string;
  Icon: HabitIcon;
  ctaLabel: string;
  /** 'single' = one dot per day; 'grid' = small dot grid for habits with sub-metrics. */
  dayIndicator: 'single' | 'grid';
};
