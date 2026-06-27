import type { StatKey } from '../lib/types';

export const theme = {
  colors: {
    background: '#0B0710',
    surface: '#15101F',
    surfaceAlt: '#1E1730',
    border: '#2D2440',
    primary: '#7C3AED',
    accent: '#FFB800',
    accentGlow: '#FFD966',
    success: '#22C55E',
    danger: '#EF4444',
    textPrimary: '#F5F2FA',
    textMuted: '#9B8FB5',
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
  radius: {
    sm: 8,
    md: 14,
    lg: 22,
  },
  font: {
    sm: 12,
    md: 15,
    lg: 20,
    xl: 28,
  },
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
  strength: { label: 'Strength', icon: '⚔️' },
  stamina: { label: 'Stamina', icon: '🏃' },
  focus: { label: 'Focus', icon: '🎯' },
  discipline: { label: 'Discipline', icon: '🛡️' },
  charisma: { label: 'Charisma', icon: '✨' },
  confidence: { label: 'Confidence', icon: '👑' },
  creativity: { label: 'Creativity', icon: '✍️' },
  appearance: { label: 'Appearance', icon: '🪞' },
  communication: { label: 'Communication', icon: '🗣️' },
  style: { label: 'Style', icon: '🧥' },
};

export const categoryMeta = {
  fitness: { label: 'Fitness', icon: '💪', color: '#FFB800' },
  study: { label: 'Study', icon: '📘', color: '#7C3AED' },
  coding: { label: 'Coding', icon: '💻', color: '#22C55E' },
  writing: { label: 'Writing', icon: '✍️', color: '#FFD966' },
  hygiene: { label: 'Hygiene', icon: '🧼', color: '#9B8FB5' },
  appearance: { label: 'Appearance', icon: '🪞', color: '#FFB800' },
  confidence: { label: 'Confidence', icon: '👑', color: '#EF4444' },
  social: { label: 'Social Skills', icon: '🤝', color: '#FFD966' },
  communication: { label: 'Communication', icon: '🗣️', color: '#22C55E' },
  career: { label: 'Career', icon: '📈', color: '#7C3AED' },
  health: { label: 'Health', icon: '🌿', color: '#22C55E' },
  'mens-health': { label: "Men's Health", icon: '🛡️', color: '#38BDF8' },
  style: { label: 'Style', icon: '🧥', color: '#FFB800' },
  haircare: { label: 'Hair Care', icon: '🧴', color: '#38BDF8' },
} as const;
