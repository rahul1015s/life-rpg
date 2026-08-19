import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { IconChevronLeft } from '@tabler/icons-react-native';

import { chronicleColors, chronicleFontFamily, chronicleSpacing, chronicleType } from '../../theme/chronicle';
import { HabitMonthGrid } from './HabitMonthGrid';
import { HabitStatTiles } from './HabitStatTiles';
import { HabitWeekRow } from './HabitWeekRow';
import type { HabitDayCell, HabitIcon, HabitStatTile, HabitTrackerConfig } from './habitTheme';

type HabitTrackerScreenProps = {
  config: HabitTrackerConfig;
  cells: HabitDayCell[];
  month: Date;
  onMonthChange: (next: Date) => void;
  statTiles: HabitStatTile[];
  onBack: () => void;
  onLogPress: () => void;
  /** Monday-first week strip; omit for habits without a daily-boolean model. */
  weekRow?: boolean[];
  quote?: string | null;
  ctaDisabled?: boolean;
  ctaLoading?: boolean;
  refreshing?: boolean;
  onRefresh?: () => void;
  /** Optional persistent header link, e.g. through to this habit's full logging form. */
  headerAction?: {
    Icon: HabitIcon;
    label: string;
    onPress: () => void;
  };
};

/**
 * Shared per-habit tracker template (DESIGN.md section 7 scoped exception: rounded shapes,
 * per-habit accent hue). Everything habit-specific arrives via `config` and props -- this
 * component computes no metrics of its own.
 */
export function HabitTrackerScreen({
  config,
  cells,
  month,
  onMonthChange,
  statTiles,
  onBack,
  onLogPress,
  weekRow,
  quote,
  ctaDisabled = false,
  ctaLoading = false,
  refreshing = false,
  onRefresh,
  headerAction,
}: HabitTrackerScreenProps) {
  const { Icon, accent } = config;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.header}>
        <Pressable
          style={styles.backSlot}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          onPress={onBack}>
          <IconChevronLeft size={24} strokeWidth={1.5} color={chronicleColors.textPrimary} />
        </Pressable>

        <View style={styles.headerCopy}>
          <Text style={styles.title}>{config.title}</Text>
          <Text style={styles.tagline}>{config.tagline}</Text>
        </View>

        {headerAction ? (
          <Pressable
            style={styles.iconButton}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityRole="button"
            accessibilityLabel={headerAction.label}
            onPress={headerAction.onPress}>
            <headerAction.Icon size={20} strokeWidth={1.5} color={chronicleColors.textMuted} />
          </Pressable>
        ) : null}

        <View style={[styles.iconButton, { borderColor: accent }]}>
          <Icon size={22} strokeWidth={1.5} color={accent} />
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        refreshControl={
          onRefresh ? (
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={accent} colors={[accent]} />
          ) : undefined
        }>
        <HabitMonthGrid
          month={month}
          onMonthChange={onMonthChange}
          cells={cells}
          accent={accent}
          dayIndicator={config.dayIndicator}
        />

        <HabitStatTiles tiles={statTiles} accent={accent} />

        {weekRow ? <HabitWeekRow days={weekRow} accent={accent} /> : null}

        {quote ? (
          <View style={[styles.quoteCard, { borderLeftColor: accent }]}>
            <Text style={styles.quote}>{quote}</Text>
          </View>
        ) : null}

        <Pressable
          accessibilityRole="button"
          disabled={ctaDisabled || ctaLoading}
          onPress={onLogPress}
          style={({ pressed }) => [
            styles.cta,
            { backgroundColor: accent },
            (ctaDisabled || ctaLoading) && styles.ctaDisabled,
            pressed && !ctaDisabled && !ctaLoading ? styles.ctaPressed : null,
          ]}>
          {ctaLoading ? (
            <ActivityIndicator color={chronicleColors.bgBase} />
          ) : (
            <Text style={styles.ctaLabel}>{config.ctaLabel}</Text>
          )}
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: chronicleColors.bgBase },
  scroll: { flex: 1 },
  content: {
    padding: chronicleSpacing.lg,
    paddingBottom: chronicleSpacing.xxl,
    gap: chronicleSpacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: chronicleSpacing.md,
    paddingHorizontal: chronicleSpacing.lg,
    paddingVertical: chronicleSpacing.md,
  },
  backSlot: { width: 24, alignItems: 'center' },
  headerCopy: { flex: 1, gap: 2 },
  // Section 7: bold sans heading rather than Cinzel display.
  title: {
    color: chronicleColors.textPrimary,
    fontFamily: chronicleFontFamily.bodyBold,
    fontSize: chronicleType.xl,
  },
  tagline: {
    color: chronicleColors.textMuted,
    fontFamily: chronicleFontFamily.body,
    fontSize: chronicleType.sm,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    backgroundColor: chronicleColors.bgSurface,
  },
  quoteCard: {
    backgroundColor: chronicleColors.bgSurface,
    borderRadius: 20,
    borderLeftWidth: 3,
    padding: chronicleSpacing.md,
  },
  quote: {
    color: chronicleColors.textMuted,
    fontFamily: chronicleFontFamily.body,
    fontSize: chronicleType.sm,
    lineHeight: 20,
  },
  cta: {
    minHeight: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: chronicleSpacing.lg,
  },
  ctaDisabled: { opacity: 0.5 },
  ctaPressed: { transform: [{ scale: 0.98 }] },
  ctaLabel: {
    color: chronicleColors.bgBase,
    fontFamily: chronicleFontFamily.bodyBold,
    fontSize: chronicleType.md,
  },
});
