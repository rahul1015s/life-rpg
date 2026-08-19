import { spacing } from './tokens';

/**
 * "Chronicle" design tokens — RPG character-sheet / illuminated-manuscript direction.
 * Used by Home, Workout, No-Fap, Achievements, and the Progress hub. Remaining screens
 * still use theme/tokens.ts + theme/typography.ts (the manhwa-ink system) until redone.
 */
export const chronicleColors = {
  bgBase: '#12141C',
  bgSurface: '#1C2030',
  bgSurfaceRaised: '#242A3D',
  accentGold: '#E8B34D',
  // 60/40 mix of accentGold with bgBase — inactive/secondary gold (pagination dots,
  // muted icons). Derived from the shipping gold, not DESIGN.md's #8A6E3A.
  accentGoldMuted: '#927339',
  accentEmber: '#D64545',
  accentJade: '#4FAE8B',
  textPrimary: '#EDE7DB',
  textMuted: '#9A96A8',
  borderSubtle: '#33384A',
} as const;

export const chronicleFontFamily = {
  display: 'CinzelBold',
  displaySemiBold: 'Cinzel',
  body: 'Manrope',
  bodySemiBold: 'ManropeSemiBold',
  bodyBold: 'ManropeBold',
  mono: 'SpaceMono',
  monoBold: 'SpaceMonoBold',
} as const;

export const chronicleType = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 20,
  xl: 28,
  xxl: 38,
} as const;

export const chronicleRadius = {
  sm: 4,
  md: 6,
  lg: 8,
} as const;

export const chronicleSpacing = spacing;
