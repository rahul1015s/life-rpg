import { StyleSheet, Text, View } from 'react-native';

import { theme } from '../constants/theme';

interface StatCardProps {
  icon: string;
  label: string;
  value: number;
}

export function StatCard({ icon, label, value }: StatCardProps) {
  return (
    <View style={styles.card}>
      <Text style={styles.icon}>{icon}</Text>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
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
  icon: {
    fontSize: theme.font.lg,
  },
  label: {
    color: theme.colors.textMuted,
    fontSize: theme.font.sm,
    fontWeight: '600',
  },
  value: {
    color: theme.colors.textPrimary,
    fontSize: theme.font.lg,
    fontWeight: '800',
  },
});
