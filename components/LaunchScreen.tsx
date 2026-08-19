import { Image } from 'expo-image';
import { StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { chronicleColors, chronicleFontFamily, chronicleSpacing, chronicleType } from '../theme/chronicle';

// Registered at module scope so the asset resolves during bundle eval rather than
// on first render. Bundled assets can't be Image.prefetch()'d - that API is remote-only.
const sigilSource = require('../assets/images/splash/splash-sigil.webp');

export function LaunchScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.screen}>
      <Image
        source={sigilSource}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
        priority="high"
        transition={180}
      />
      <LinearGradient
        colors={['transparent', 'rgba(18, 20, 28, 0.88)', chronicleColors.bgBase]}
        locations={[0.34, 0.66, 0.92]}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />
      <View style={[styles.copy, { paddingBottom: insets.bottom + chronicleSpacing.xxl }]}>
        <Text style={styles.title}>LIFE RPG</Text>
        <Text style={styles.quote}>Small quests, repeated daily, build the man you meet tomorrow.</Text>
        <Text style={styles.caption}>Load the board. Keep the streak alive.</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: chronicleColors.bgBase,
  },
  copy: {
    alignItems: 'center',
    paddingHorizontal: chronicleSpacing.xl,
    gap: chronicleSpacing.md,
  },
  title: {
    color: chronicleColors.textPrimary,
    fontFamily: chronicleFontFamily.display,
    fontSize: chronicleType.xxl,
    letterSpacing: 2,
  },
  quote: {
    maxWidth: 280,
    color: chronicleColors.textPrimary,
    textAlign: 'center',
    fontFamily: chronicleFontFamily.body,
    fontSize: chronicleType.md,
    lineHeight: 24,
  },
  caption: {
    color: chronicleColors.textMuted,
    fontFamily: chronicleFontFamily.mono,
    fontSize: chronicleType.sm,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
});
