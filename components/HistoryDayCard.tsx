import { StyleSheet, Text, View } from 'react-native';

import { theme } from '../constants/theme';
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
    <View style={styles.card}>
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
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.md,
    gap: theme.spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: theme.spacing.md,
  },
  date: {
    color: theme.colors.textPrimary,
    fontSize: theme.font.md,
    fontWeight: '800',
  },
  meta: {
    color: theme.colors.textMuted,
    fontSize: theme.font.sm,
  },
  badge: {
    color: theme.colors.accentGlow,
    fontSize: theme.font.sm,
    fontWeight: '700',
  },
  questList: {
    gap: theme.spacing.sm,
  },
  questRow: {
    padding: theme.spacing.sm,
    borderRadius: theme.radius.sm,
    backgroundColor: theme.colors.surfaceAlt,
  },
  questTitle: {
    color: theme.colors.textPrimary,
    fontSize: theme.font.md,
    fontWeight: '700',
  },
  questMeta: {
    color: theme.colors.textMuted,
    fontSize: theme.font.sm,
    marginTop: 2,
  },
  emptyText: {
    color: theme.colors.textMuted,
    fontSize: theme.font.sm,
    lineHeight: 18,
  },
  statsLine: {
    color: theme.colors.accent,
    fontSize: theme.font.sm,
    lineHeight: 18,
  },
});
