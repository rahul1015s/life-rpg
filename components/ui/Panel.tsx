import type { PropsWithChildren } from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';

import { colors, spacing, borders } from '../../theme/tokens';

type PanelProps = PropsWithChildren<{
  style?: ViewStyle | ViewStyle[];
  padded?: boolean;
}>;

export function Panel({ children, style, padded = true }: PanelProps) {
  return <View style={[styles.panel, padded && styles.padded, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  panel: {
    backgroundColor: colors.screentone,
    borderWidth: borders.panel,
    borderColor: colors.ink,
    position: 'relative',
    overflow: 'hidden',
  },
  padded: {
    padding: spacing.lg,
  },
});
