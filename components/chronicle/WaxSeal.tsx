import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Animated, Pressable, StyleSheet, Text } from 'react-native';

import { chronicleColors } from '../../theme/chronicle';

type WaxSealProps = {
  completed: boolean;
  onPress?: () => void;
  loading?: boolean;
  disabled?: boolean;
  size?: number;
};

export function WaxSeal({ completed, onPress, loading = false, disabled = false, size = 32 }: WaxSealProps) {
  const [scale] = useState(() => new Animated.Value(completed ? 1 : 0));
  const wasCompleted = useRef(completed);

  useEffect(() => {
    if (completed && !wasCompleted.current) {
      scale.setValue(0.3);
      Animated.spring(scale, {
        toValue: 1,
        friction: 4,
        tension: 90,
        useNativeDriver: true,
      }).start();
    } else if (!completed) {
      scale.setValue(0);
    }
    wasCompleted.current = completed;
  }, [completed, scale]);

  const slop = Math.max(0, (44 - size) / 2);

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading || completed}
      hitSlop={slop}
      style={({ pressed }) => [
        styles.seal,
        { width: size, height: size, borderRadius: size / 2 },
        completed ? styles.sealComplete : styles.sealEmpty,
        pressed && !completed && !disabled && !loading ? styles.pressed : null,
      ]}>
      {loading ? (
        <ActivityIndicator size="small" color={chronicleColors.accentGold} />
      ) : (
        <Animated.View
          style={[
            styles.stamp,
            { opacity: scale, transform: [{ scale }] },
          ]}>
          <Text style={[styles.glyph, { fontSize: size * 0.42 }]}>✦</Text>
        </Animated.View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  seal: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    flexShrink: 0,
  },
  sealEmpty: {
    borderColor: chronicleColors.textMuted,
    backgroundColor: 'transparent',
  },
  sealComplete: {
    borderColor: chronicleColors.accentGold,
    backgroundColor: chronicleColors.accentGold,
  },
  pressed: {
    opacity: 0.6,
  },
  stamp: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  glyph: {
    color: chronicleColors.bgBase,
  },
});
