import { StyleSheet, Text } from 'react-native';

import { ChronicleCard } from './chronicle/ChronicleCard';
import { chronicleColors, chronicleFontFamily, chronicleSpacing, chronicleType } from '../theme/chronicle';

interface MetricCardProps {
  label: string;
  value: string;
  subtitle?: string;
}

export function MetricCard({ label, value, subtitle }: MetricCardProps) {
  return (
    <ChronicleCard style={styles.card}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </ChronicleCard>
  );
}

const styles = StyleSheet.create({
  card: {
    flexBasis: '48%',
    flexGrow: 1,
    minWidth: 140,
    gap: chronicleSpacing.xs,
  },
  label: {
    color: chronicleColors.textMuted,
    fontFamily: chronicleFontFamily.bodySemiBold,
    fontSize: chronicleType.sm,
  },
  // Stat readout -> Space Mono per DESIGN.md's data/system font role.
  value: {
    color: chronicleColors.textPrimary,
    fontFamily: chronicleFontFamily.monoBold,
    fontSize: chronicleType.lg,
    letterSpacing: 0.5,
  },
  subtitle: {
    color: chronicleColors.textMuted,
    fontFamily: chronicleFontFamily.mono,
    fontSize: chronicleType.xs,
    letterSpacing: 0.5,
  },
});
