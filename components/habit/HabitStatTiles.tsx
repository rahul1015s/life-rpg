import { StyleSheet, Text, View } from 'react-native';

import { chronicleColors, chronicleFontFamily, chronicleSpacing, chronicleType } from '../../theme/chronicle';
import type { HabitStatTile } from './habitTheme';

type HabitStatTilesProps = {
  tiles: HabitStatTile[];
  accent: string;
};

/** Pill-shaped stat tiles (DESIGN.md section 7 exception). Values are supplied by the caller. */
export function HabitStatTiles({ tiles, accent }: HabitStatTilesProps) {
  return (
    <View style={styles.row}>
      {tiles.map((tile) => (
        <View key={tile.label} style={styles.tile}>
          <Text style={[styles.value, { color: accent }]} numberOfLines={1} adjustsFontSizeToFit>
            {tile.value}
          </Text>
          <Text style={styles.label} numberOfLines={2}>
            {tile.label}
          </Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: chronicleSpacing.sm,
  },
  tile: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
    paddingVertical: chronicleSpacing.md,
    paddingHorizontal: chronicleSpacing.sm,
    borderRadius: 20,
    backgroundColor: chronicleColors.bgSurface,
    borderWidth: 1,
    borderColor: chronicleColors.borderSubtle,
  },
  value: {
    fontFamily: chronicleFontFamily.bodyBold,
    fontSize: chronicleType.lg,
  },
  label: {
    color: chronicleColors.textMuted,
    fontFamily: chronicleFontFamily.body,
    fontSize: chronicleType.xs,
    textAlign: 'center',
  },
});
