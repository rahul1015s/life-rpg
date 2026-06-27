import { useId } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Defs, Pattern, Rect } from 'react-native-svg';

type HalftoneProps = {
  density?: 'normal' | 'dense';
  tint: string;
  opacity?: number;
};

export function Halftone({ density = 'normal', tint, opacity = 0.18 }: HalftoneProps) {
  const patternId = useId();
  const size = density === 'dense' ? 5 : 6;
  const radius = density === 'dense' ? 1.2 : 1;

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <Svg width="100%" height="100%">
        <Defs>
          <Pattern id={patternId} patternUnits="userSpaceOnUse" width={size} height={size}>
            <Circle cx={radius + 0.5} cy={radius + 0.5} r={radius} fill={tint} fillOpacity={opacity} />
          </Pattern>
        </Defs>
        <Rect width="100%" height="100%" fill={`url(#${patternId})`} />
      </Svg>
    </View>
  );
}
