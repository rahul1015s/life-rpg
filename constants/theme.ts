import type { QuestCategory, RankName, StatKey } from '../lib/types';
import { borders, colors, spacing } from '../theme/tokens';
import { fontFamily, typeScale } from '../theme/typography';

export const theme = {
  colors: {
    background: colors.ink,
    surface: colors.screentone,
    surfaceAlt: colors.inkSoft,
    border: colors.ink,
    primary: colors.indigo,
    accent: colors.gold,
    accentGlow: colors.parchment,
    success: colors.sealRed,
    danger: colors.sealRed,
    textPrimary: colors.parchment,
    textMuted: colors.parchmentDim,
    ...colors,
  },
  spacing,
  radius: {
    sm: 0,
    md: 0,
    lg: 0,
    full: 999,
  },
  font: {
    sm: typeScale.sm,
    md: typeScale.md,
    lg: typeScale.lg,
    xl: typeScale.xl,
  },
  family: fontFamily,
  borders,
} as const;

export const statOrder: StatKey[] = [
  'strength',
  'stamina',
  'focus',
  'discipline',
  'charisma',
  'confidence',
  'creativity',
  'appearance',
  'communication',
  'style',
];

export const statMeta: Record<StatKey, { label: string; icon: string }> = {
  strength: { label: 'Strength', icon: 'STR' },
  stamina: { label: 'Stamina', icon: 'STA' },
  focus: { label: 'Focus', icon: 'FOC' },
  discipline: { label: 'Discipline', icon: 'DIS' },
  charisma: { label: 'Charisma', icon: 'CHA' },
  confidence: { label: 'Confidence', icon: 'CON' },
  creativity: { label: 'Creativity', icon: 'CRE' },
  appearance: { label: 'Appearance', icon: 'APP' },
  communication: { label: 'Communication', icon: 'COM' },
  style: { label: 'Style', icon: 'STY' },
};

export const categoryMeta: Record<QuestCategory, { label: string; color: string; textColor?: string }> = {
  fitness: { label: 'Fitness', color: colors.gold, textColor: colors.ink },
  study: { label: 'Study', color: colors.screentoneLight },
  coding: { label: 'Coding', color: colors.indigo },
  writing: { label: 'Writing', color: colors.parchmentDim, textColor: colors.ink },
  hygiene: { label: 'Hygiene', color: colors.screentoneLight },
  appearance: { label: 'Appearance', color: colors.parchmentDim, textColor: colors.ink },
  confidence: { label: 'Confidence', color: colors.gold, textColor: colors.ink },
  social: { label: 'Social', color: colors.indigo },
  communication: { label: 'Comms', color: colors.indigo },
  career: { label: 'Career', color: colors.gold, textColor: colors.ink },
  health: { label: 'Health', color: colors.sealRed },
  'mens-health': { label: "Men's Health", color: colors.sealRed },
  style: { label: 'Style', color: colors.parchmentDim, textColor: colors.ink },
  haircare: { label: 'Hair Care', color: colors.sealRed },
};

export const rankMeta: Record<RankName, { letter: string; outer: string; inner?: string }> = {
  Beginner: { letter: 'E', outer: colors.parchmentDim },
  Trainee: { letter: 'D', outer: colors.indigo },
  Hunter: { letter: 'C', outer: colors.sealRed },
  Elite: { letter: 'B', outer: colors.gold },
  Hero: { letter: 'A', outer: colors.parchment, inner: colors.parchmentDim },
  King: { letter: 'S', outer: colors.sealRed, inner: colors.gold },
};
