import { StyleSheet, View } from 'react-native';

import { chronicleColors, chronicleRadius } from '../../theme/chronicle';

type ChronicleProgressBarProps = {
  progress: number;
  height?: number;
};

export function ChronicleProgressBar({ progress, height = 12 }: ChronicleProgressBarProps) {
  const clamped = Math.max(0, Math.min(progress, 1));

  return (
    <View style={[styles.track, { height }]}>
      <View style={[styles.fill, { width: `${clamped * 100}%` }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    // 4px max per DESIGN.md section 3 -- this was previously height/2, i.e. a full pill.
    borderRadius: chronicleRadius.sm,
    backgroundColor: chronicleColors.bgSurfaceRaised,
    borderWidth: 1,
    borderColor: chronicleColors.borderSubtle,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    backgroundColor: chronicleColors.accentGold,
    borderRadius: chronicleRadius.sm,
  },
});
