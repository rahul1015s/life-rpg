import { Pressable, StyleSheet, Text, View } from 'react-native';
import { type Href, usePathname, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { chronicleColors, chronicleFontFamily, chronicleSpacing } from '../../theme/chronicle';

const items: { label: string; href: string }[] = [
  { label: 'HOME', href: '/dashboard' },
  { label: 'NOFAP', href: '/no-fap' },
  { label: 'WORK', href: '/workout-progress' },
  { label: 'CAL', href: '/calendar' },
  { label: 'LOOT', href: '/achievements' },
  { label: 'MORE', href: '/command' },
];

export function BottomNav() {
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, chronicleSpacing.sm) }]}>
      {items.map((item) => {
        const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Pressable key={item.label} style={styles.item} onPress={() => router.push(item.href as Href)}>
            <Text style={[styles.label, active && styles.labelActive]}>{item.label}</Text>
            <View style={[styles.indicator, active && styles.indicatorActive]} />
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    backgroundColor: chronicleColors.bgSurface,
    borderTopWidth: 1,
    borderTopColor: chronicleColors.borderSubtle,
  },
  item: {
    flex: 1,
    alignItems: 'center',
    gap: chronicleSpacing.xs,
    paddingTop: chronicleSpacing.md,
    paddingBottom: chronicleSpacing.xs,
  },
  // "Rune mark": a thin 2px gold underline beneath the active item, per DESIGN.md
  // section 6 -- square-ended, not a pill or filled background.
  indicator: {
    width: 20,
    height: 2,
    backgroundColor: 'transparent',
  },
  indicatorActive: {
    backgroundColor: chronicleColors.accentGold,
  },
  label: {
    color: chronicleColors.textMuted,
    fontFamily: chronicleFontFamily.mono,
    fontSize: 9,
    letterSpacing: 0.5,
  },
  labelActive: {
    color: chronicleColors.accentGold,
  },
});
