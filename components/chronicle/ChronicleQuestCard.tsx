import { Pressable, StyleSheet, Text, View } from 'react-native';

import { categoryLabels, getDifficultyLabel } from '../../lib/questUtils';
import type { DailyQuest } from '../../lib/types';
import { chronicleColors, chronicleFontFamily, chronicleSpacing, chronicleType } from '../../theme/chronicle';
import { ChronicleCard } from './ChronicleCard';
import { QuestCategoryIcon } from './QuestCategoryIcon';
import { WaxSeal } from './WaxSeal';

type ChronicleQuestCardProps = {
  quest: DailyQuest;
  onPress: (quest: DailyQuest) => void;
  onComplete: (questId: string) => void;
  loading?: boolean;
  isNext?: boolean;
  /** Opt-in so existing consumers (e.g. the Chronicle command centre) are unaffected. */
  showCategoryIcon?: boolean;
};

export function ChronicleQuestCard({
  quest,
  onPress,
  onComplete,
  loading = false,
  isNext = false,
  showCategoryIcon = false,
}: ChronicleQuestCardProps) {
  return (
    <Pressable onPress={() => onPress(quest)} style={({ pressed }) => (pressed ? styles.pressed : null)}>
      <ChronicleCard highlighted={isNext && !quest.completed} style={quest.completed ? styles.completedCard : undefined}>
        <View style={styles.row}>
          <WaxSeal
            completed={quest.completed}
            onPress={() => onComplete(quest.id)}
            loading={loading}
            disabled={quest.locked}
          />
          {showCategoryIcon ? (
            <View style={styles.categoryIcon}>
              <QuestCategoryIcon category={quest.category} />
            </View>
          ) : null}
          <View style={styles.copy}>
            <View style={styles.tagRow}>
              <Text style={styles.category}>{categoryLabels[quest.category].toUpperCase()}</Text>
              {quest.isAnchor ? <Text style={styles.anchorTag}>ANCHOR</Text> : null}
            </View>
            <Text style={styles.title}>{quest.title}</Text>
            <Text style={styles.description}>{quest.whyToday || quest.description}</Text>
            <Text style={styles.meta}>
              {getDifficultyLabel(quest.difficulty)} · {quest.recommendedTime}
            </Text>
            {quest.locked ? <Text style={styles.lockedText}>Locked until punishment quest is cleared.</Text> : null}
          </View>
          <Text style={styles.xp}>+{quest.xp}</Text>
        </View>
      </ChronicleCard>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  categoryIcon: {
    alignSelf: 'flex-start',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: chronicleSpacing.md,
  },
  completedCard: {
    opacity: 0.6,
  },
  pressed: {
    opacity: 0.75,
  },
  copy: {
    flex: 1,
    gap: 4,
  },
  tagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: chronicleSpacing.sm,
  },
  category: {
    color: chronicleColors.accentGold,
    fontFamily: chronicleFontFamily.mono,
    fontSize: chronicleType.xs,
    letterSpacing: 0.8,
  },
  anchorTag: {
    color: chronicleColors.bgBase,
    backgroundColor: chronicleColors.accentGold,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 3,
    fontFamily: chronicleFontFamily.bodyBold,
    fontSize: 10,
    letterSpacing: 0.4,
  },
  title: {
    color: chronicleColors.textPrimary,
    fontFamily: chronicleFontFamily.bodySemiBold,
    fontSize: chronicleType.md,
  },
  description: {
    color: chronicleColors.textMuted,
    fontFamily: chronicleFontFamily.body,
    fontSize: chronicleType.sm,
    lineHeight: 20,
  },
  meta: {
    color: chronicleColors.textMuted,
    fontFamily: chronicleFontFamily.mono,
    fontSize: chronicleType.xs,
    letterSpacing: 0.4,
  },
  lockedText: {
    color: chronicleColors.accentEmber,
    fontFamily: chronicleFontFamily.body,
    fontSize: chronicleType.xs,
  },
  xp: {
    color: chronicleColors.accentGold,
    fontFamily: chronicleFontFamily.mono,
    fontSize: chronicleType.sm,
  },
});
