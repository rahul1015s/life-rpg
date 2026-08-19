import { Image } from 'expo-image';

import type { QuestCategory } from '../../lib/types';

type QuestIconKey = 'fitness' | 'coding' | 'social' | 'study' | 'discipline';

/**
 * The 14 quest categories collapse onto the 5 illustrated icon assets
 * (assets/images/icons/quest-*.webp). Grouping approved alongside the dashboard redesign.
 */
const questIconKeys: Record<QuestCategory, QuestIconKey> = {
  fitness: 'fitness',
  health: 'fitness',
  coding: 'coding',
  social: 'social',
  communication: 'social',
  study: 'study',
  writing: 'study',
  career: 'study',
  hygiene: 'discipline',
  appearance: 'discipline',
  style: 'discipline',
  haircare: 'discipline',
  confidence: 'discipline',
  'mens-health': 'discipline',
};

/**
 * Pre-rendered gold-ink badges (DESIGN.md section 8). They ship self-contained with their own
 * ring and fill -- never tinted or recoloured at runtime.
 */
const iconsByKey = {
  fitness: require('../../assets/images/icons/quest-fitness.webp'),
  coding: require('../../assets/images/icons/quest-coding.webp'),
  social: require('../../assets/images/icons/quest-social.webp'),
  study: require('../../assets/images/icons/quest-study.webp'),
  discipline: require('../../assets/images/icons/quest-discipline.webp'),
} as const;

type QuestCategoryIconProps = {
  category: QuestCategory;
  size?: number;
};

// 40px default: DESIGN.md section 8 specifies 40-48px for these badges in list rows.
export function QuestCategoryIcon({ category, size = 40 }: QuestCategoryIconProps) {
  return (
    <Image
      source={iconsByKey[questIconKeys[category]]}
      style={{ width: size, height: size }}
      contentFit="contain"
      accessible={false}
    />
  );
}
