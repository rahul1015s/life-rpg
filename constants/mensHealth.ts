import type { LifestyleQuestTemplate } from '../lib/types';

export const mensHealthLifestyleQuests: LifestyleQuestTemplate[] = [
  {
    id: 'sleep-8-hours',
    title: 'Sleep 8 hours',
    description: 'Aim for a full night of restorative sleep.',
    xp: 12,
    statEffects: { stamina: 1, discipline: 1 },
  },
  {
    id: 'drink-3l-water',
    title: 'Drink 3L water',
    description: 'Stay hydrated across the full day.',
    xp: 10,
    statEffects: { stamina: 1, discipline: 1 },
  },
  {
    id: 'avoid-excessive-porn',
    title: 'Avoid excessive pornography today',
    description: 'Reduce overstimulation and choose healthier use of time.',
    xp: 14,
    statEffects: { discipline: 2, focus: 1 },
  },
  {
    id: 'exercise-session',
    title: 'Exercise today',
    description: 'Do a meaningful training or movement session.',
    xp: 15,
    statEffects: { stamina: 2, strength: 1 },
  },
  {
    id: 'stretch-session',
    title: 'Stretch for recovery',
    description: 'Do a short stretch or mobility session.',
    xp: 8,
    statEffects: { stamina: 1, discipline: 1 },
  },
  {
    id: 'walk-session',
    title: 'Walk with intention',
    description: 'Take a deliberate walk for movement and clarity.',
    xp: 10,
    statEffects: { stamina: 1, confidence: 1 },
  },
  {
    id: 'meditation-session',
    title: 'Meditate',
    description: 'Take a short calm reset for attention and stress control.',
    xp: 10,
    statEffects: { focus: 1, confidence: 1 },
  },
  {
    id: 'healthy-breakfast',
    title: 'Healthy breakfast',
    description: 'Start the day with a balanced meal.',
    xp: 8,
    statEffects: { stamina: 1, discipline: 1 },
  },
];
