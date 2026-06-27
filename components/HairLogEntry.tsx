import { Image, StyleSheet, Text, View } from 'react-native';

import { theme } from '../constants/theme';
import type { HairLogEntry as HairLogEntryType } from '../lib/types';

interface HairLogEntryProps {
  entry: HairLogEntryType;
}

export function HairLogEntry({ entry }: HairLogEntryProps) {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.date}>{entry.date}</Text>
        <Text style={styles.status}>
          {entry.appliedMorning && entry.appliedNight
            ? 'Both doses logged'
            : entry.appliedMorning || entry.appliedNight
              ? 'One dose logged'
              : 'No dose logged'}
        </Text>
      </View>
      {entry.photoUri ? <Image source={{ uri: entry.photoUri }} style={styles.image} /> : null}
      {entry.note ? <Text style={styles.note}>{entry.note}</Text> : null}
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
    gap: theme.spacing.sm,
  },
  header: {
    gap: theme.spacing.xs,
  },
  date: {
    color: theme.colors.textPrimary,
    fontSize: theme.font.md,
    fontWeight: '800',
  },
  status: {
    color: theme.colors.textMuted,
    fontSize: theme.font.sm,
    fontWeight: '600',
  },
  image: {
    width: '100%',
    height: 220,
    borderRadius: theme.radius.sm,
    backgroundColor: theme.colors.surfaceAlt,
  },
  note: {
    color: theme.colors.textMuted,
    fontSize: theme.font.sm,
    lineHeight: 18,
  },
});
