import { StyleSheet, Text, View } from 'react-native';

import { chronicleColors, chronicleFontFamily, chronicleRadius, chronicleSpacing, chronicleType } from '../../theme/chronicle';

type ChronicleStatPanelProps = {
  value: string;
  label: string;
  accent?: 'gold' | 'jade' | 'ember';
};

const accentColor: Record<NonNullable<ChronicleStatPanelProps['accent']>, string> = {
  gold: chronicleColors.accentGold,
  jade: chronicleColors.accentJade,
  ember: chronicleColors.accentEmber,
};

export function ChronicleStatPanel({ value, label, accent = 'gold' }: ChronicleStatPanelProps) {
  return (
    <View style={[styles.panel, { borderColor: accentColor[accent] }]}>
      <Text style={[styles.value, { color: accentColor[accent] }]}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    flex: 1,
    backgroundColor: chronicleColors.bgSurface,
    borderRadius: chronicleRadius.md,
    borderWidth: 1,
    padding: chronicleSpacing.md,
    gap: 2,
  },
  value: {
    fontFamily: chronicleFontFamily.display,
    fontSize: chronicleType.xl,
  },
  label: {
    color: chronicleColors.textMuted,
    fontFamily: chronicleFontFamily.mono,
    fontSize: chronicleType.xs,
    letterSpacing: 0.6,
  },
});
