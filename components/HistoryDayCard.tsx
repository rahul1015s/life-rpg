import { StyleSheet, Text, View } from 'react-native';

import { ChronicleCard } from './chronicle/ChronicleCard';
import { chronicleColors, chronicleFontFamily, chronicleRadius, chronicleSpacing, chronicleType } from '../theme/chronicle';
import type { DailyHistoryGroup, StatKey } from '../lib/types';

interface HistoryDayCardProps {
  group: DailyHistoryGroup;
}

function formatStats(statTotals: DailyHistoryGroup['statTotals']): string {
  const entries = Object.entries(statTotals) as [StatKey, number][];
  if (entries.length === 0) {
    return 'No stat detail available';
  }

  return entries.map(([key, value]) => `${key} +${value}`).join(' • ');
}

export function HistoryDayCard({ group }: HistoryDayCardProps) {
  return (
    <ChronicleCard style={styles.card}>
      <View style={styles.header}>
        <View>
          <Text style={styles.date}>{group.date}</Text>
          <Text style={styles.meta}>
            {group.questsCompleted} quests • {group.totalXP} XP
          </Text>
        </View>
        {group.isLegacySummary ? <Text style={styles.badge}>Legacy summary</Text> : null}
      </View>

      {group.quests.length === 0 ? (
        <Text style={styles.emptyText}>Quest-by-quest details are not available for this older saved day.</Text>
      ) : (
        <View style={styles.questList}>
          {group.quests.map((quest) => (
            <View key={`${group.date}-${quest.questId}`} style={styles.questRow}>
              <Text style={styles.questTitle}>{quest.title}</Text>
              <Text style={styles.questMeta}>
                {quest.category} • +{quest.xp} XP
              </Text>
            </View>
          ))}
        </View>
      )}

      <Text style={styles.statsLine}>Stats improved: {formatStats(group.statTotals)}</Text>
    </ChronicleCard>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: chronicleSpacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: chronicleSpacing.md,
  },
  date: {
    color: chronicleColors.textPrimary,
    fontFamily: chronicleFontFamily.monoBold,
    fontSize: chronicleType.md,
    letterSpacing: 0.5,
  },
  meta: {
    color: chronicleColors.textMuted,
    fontFamily: chronicleFontFamily.mono,
    fontSize: chronicleType.xs,
    letterSpacing: 0.5,
  },
  badge: {
    color: chronicleColors.accentGoldMuted,
    fontFamily: chronicleFontFamily.mono,
    fontSize: chronicleType.xs,
    letterSpacing: 0.5,
  },
  questList: {
    gap: chronicleSpacing.sm,
  },
  questRow: {
    padding: chronicleSpacing.sm,
    borderRadius: chronicleRadius.sm,
    backgroundColor: chronicleColors.bgSurfaceRaised,
  },
  // Quest titles are user/content strings of unbounded length -> Manrope, not Cinzel.
  questTitle: {
    color: chronicleColors.textPrimary,
    fontFamily: chronicleFontFamily.bodySemiBold,
    fontSize: chronicleType.sm,
  },
  questMeta: {
    color: chronicleColors.textMuted,
    fontFamily: chronicleFontFamily.mono,
    fontSize: chronicleType.xs,
    letterSpacing: 0.5,
    marginTop: 2,
  },
  emptyText: {
    color: chronicleColors.textMuted,
    fontFamily: chronicleFontFamily.body,
    fontSize: chronicleType.sm,
    lineHeight: 20,
  },
  statsLine: {
    color: chronicleColors.accentGold,
    fontFamily: chronicleFontFamily.mono,
    fontSize: chronicleType.xs,
    letterSpacing: 0.5,
    lineHeight: 18,
  },
});
