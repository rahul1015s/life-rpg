import { Image, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { theme } from '../constants/theme';

export function LaunchScreen() {
  return (
    <LinearGradient colors={['#0B0710', '#14101F', '#1B2440']} style={styles.screen}>
      <View style={styles.glow} />
      <View style={styles.card}>
        <Image source={require('../assets/images/splash-icon.png')} style={styles.logo} resizeMode="contain" />
        <Text style={styles.title}>LIFE RPG</Text>
        <Text style={styles.quote}>Small quests, repeated daily, build the man you meet tomorrow.</Text>
        <Text style={styles.caption}>Load the board. Keep the streak alive.</Text>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.background,
  },
  glow: {
    position: 'absolute',
    width: 320,
    height: 320,
    borderRadius: 999,
    backgroundColor: 'rgba(201, 162, 39, 0.12)',
  },
  card: {
    alignItems: 'center',
    paddingHorizontal: theme.spacing.xl,
    gap: theme.spacing.md,
  },
  logo: {
    width: 180,
    height: 180,
  },
  title: {
    color: theme.colors.textPrimary,
    fontSize: theme.font.xl + 8,
    fontWeight: '900',
    letterSpacing: 2,
  },
  quote: {
    maxWidth: 280,
    color: theme.colors.textPrimary,
    textAlign: 'center',
    fontSize: theme.font.md,
    lineHeight: 24,
  },
  caption: {
    color: theme.colors.textMuted,
    fontSize: theme.font.sm,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
});
