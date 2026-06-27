import { StyleSheet, Text, View } from 'react-native';

import { theme } from '../constants/theme';

interface MetricCardProps {
  label: string;
  value: string;
  subtitle?: string;
}

export function MetricCard({ label, value, subtitle }: MetricCardProps) {
  return (
    <View style={styles.card}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexBasis: '48%',
    flexGrow: 1,
    minWidth: 140,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.md,
    gap: theme.spacing.xs,
  },
  label: {
    color: theme.colors.textMuted,
    fontSize: theme.font.sm,
    fontWeight: '700',
  },
  value: {
    color: theme.colors.textPrimary,
    fontSize: theme.font.lg,
    fontWeight: '900',
  },
  subtitle: {
    color: theme.colors.accentGlow,
    fontSize: theme.font.sm,
    fontWeight: '600',
  },
});
