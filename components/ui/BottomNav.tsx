import { Pressable, StyleSheet, Text, View } from 'react-native';
import { type Href, usePathname, useRouter } from 'expo-router';

import { borders, colors, spacing } from '../../theme/tokens';
import { fontFamily } from '../../theme/typography';

const items: { label: string; href: Href }[] = [
  { label: 'HOME', href: '/dashboard' },
  { label: 'ACHIEVE', href: '/achievements' },
  { label: 'GOALS', href: '/goals' },
  { label: 'QUESTS', href: '/custom-quests' },
  { label: 'PROFILE', href: '/profile' },
];

export function BottomNav() {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <View style={styles.bar}>
      {items.map((item) => {
        const active = pathname === item.href;
        return (
          <Pressable key={item.label} style={styles.item} onPress={() => router.push(item.href)}>
            <View style={[styles.dot, active && styles.dotActive]} />
            <Text style={[styles.label, active && styles.labelActive]}>{item.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    backgroundColor: colors.ink,
    borderTopWidth: borders.panel,
    borderTopColor: colors.sealRed,
  },
  item: {
    flex: 1,
    alignItems: 'center',
    gap: spacing.xs,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 999,
    backgroundColor: 'transparent',
  },
  dotActive: {
    backgroundColor: colors.gold,
  },
  label: {
    color: colors.parchmentDim,
    fontFamily: fontFamily.mono,
    fontSize: 9,
    letterSpacing: 0.5,
  },
  labelActive: {
    color: colors.gold,
  },
});
