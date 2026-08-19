import type { PropsWithChildren } from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';

import { chronicleColors, chronicleRadius, chronicleSpacing } from '../../theme/chronicle';

type ChronicleCardProps = PropsWithChildren<{
  style?: ViewStyle | ViewStyle[];
  highlighted?: boolean;
  padded?: boolean;
}>;

export function ChronicleCard({ children, style, highlighted = false, padded = true }: ChronicleCardProps) {
  return (
    <View style={[styles.card, padded && styles.padded, highlighted && styles.highlighted, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: chronicleColors.bgSurface,
    borderRadius: chronicleRadius.md,
    borderWidth: 1,
    borderColor: chronicleColors.borderSubtle,
  },
  padded: {
    padding: chronicleSpacing.lg,
  },
  highlighted: {
    backgroundColor: chronicleColors.bgSurfaceRaised,
    borderColor: chronicleColors.accentGold,
    shadowColor: chronicleColors.accentGold,
    shadowOpacity: 0.35,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 0 },
    elevation: 4,
  },
});
