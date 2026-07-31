import { Pressable, StyleSheet, Text, View } from 'react-native';
import { type Href, usePathname, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { theme } from '../../constants/theme';
import { borders, colors, spacing } from '../../theme/tokens';
import { fontFamily } from '../../theme/typography';

const items: { label: string; href: string }[] = [
  { label: 'HOME', href: '/dashboard' },
  { label: 'NOFAP', href: '/no-fap' },
  { label: 'WORK', href: '/workout-progress' },
  { label: 'CAL', href: '/habit-calendar' },
  { label: 'LOOT', href: '/achievements' },
];

export function BottomNav() {
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, spacing.sm) }]}>
      {items.map((item) => {
        const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Pressable key={item.label} style={styles.item} onPress={() => router.push(item.href as Href)}>
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
    paddingBottom: spacing.xs,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: theme.radius.full,
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
