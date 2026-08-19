import type { ComponentType } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { IconBolt, IconChecks, IconFlame, IconTrophy } from '@tabler/icons-react-native';
import type { SvgProps } from 'react-native-svg';

import { chronicleColors, chronicleFontFamily, chronicleSpacing, chronicleType } from '../../theme/chronicle';
import { ChronicleCard } from './ChronicleCard';

type ChronicleStatRowProps = {
  questsDone: number;
  questsTotal: number;
  streak: number;
  totalXP: number;
  xpToday: number;
};

// Hermes' Intl support varies by build, so group digits directly.
function formatNumber(value: number): string {
  return String(value).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

function StatTile({
  Icon,
  value,
  label,
}: {
  Icon: ComponentType<SvgProps & { size?: number | string; strokeWidth?: number | string }>;
  value: string;
  label: string;
}) {
  return (
    <View style={styles.tile}>
      <Icon size={20} strokeWidth={1.5} color={chronicleColors.accentGold} />
      <Text style={styles.value} numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

export function ChronicleStatRow({ questsDone, questsTotal, streak, totalXP, xpToday }: ChronicleStatRowProps) {
  return (
    <ChronicleCard style={styles.card}>
      <StatTile Icon={IconChecks} value={`${questsDone}/${questsTotal}`} label="Quests Done" />
      <StatTile Icon={IconFlame} value={formatNumber(streak)} label="Current Streak" />
      <StatTile Icon={IconTrophy} value={formatNumber(totalXP)} label="Total XP" />
      <StatTile Icon={IconBolt} value={`+${formatNumber(xpToday)}`} label="XP Gained" />
    </ChronicleCard>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    gap: chronicleSpacing.sm,
  },
  tile: {
    flex: 1,
    alignItems: 'center',
    gap: chronicleSpacing.xs,
  },
  // Data readout -> Space Mono per DESIGN.md section 2.
  value: {
    color: chronicleColors.textPrimary,
    fontFamily: chronicleFontFamily.monoBold,
    fontSize: chronicleType.md,
    letterSpacing: 0.5,
  },
  label: {
    color: chronicleColors.textMuted,
    fontFamily: chronicleFontFamily.body,
    fontSize: chronicleType.xs,
    textAlign: 'center',
  },
});
