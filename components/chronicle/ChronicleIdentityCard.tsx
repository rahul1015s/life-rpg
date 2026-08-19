import { StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';

import type { RankName } from '../../lib/types';
import { chronicleColors, chronicleFontFamily, chronicleRadius, chronicleSpacing, chronicleType } from '../../theme/chronicle';
import { ChronicleCard } from './ChronicleCard';
import { ChronicleProgressBar } from './ChronicleProgressBar';

const avatarSource = require('../../assets/images/avatar/avatar-bust.webp');

type ChronicleIdentityCardProps = {
  name: string;
  rank: RankName;
  level: number;
  xp: number;
  nextLevelXP: number;
};

// Hermes' Intl support varies by build, so group digits directly rather than
// relying on toLocaleString().
function formatXP(value: number): string {
  return String(value).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

export function ChronicleIdentityCard({ name, rank, level, xp, nextLevelXP }: ChronicleIdentityCardProps) {
  const progress = nextLevelXP > 0 ? xp / nextLevelXP : 0;

  return (
    <ChronicleCard style={styles.card}>
      <View style={styles.row}>
        <View style={styles.avatarRing}>
          <Image source={avatarSource} style={styles.avatarImage} contentFit="cover" />
        </View>

        <View style={styles.identity}>
          <Text style={styles.name} numberOfLines={1}>
            {name}
          </Text>
          <Text style={styles.rank}>{rank}</Text>
        </View>

        <View style={styles.levelBadge}>
          <Text style={styles.levelBadgeText}>LEVEL {level}</Text>
        </View>
      </View>

      <View style={styles.xpBlock}>
        <Text style={styles.xpLabel}>
          XP {formatXP(xp)} / {formatXP(nextLevelXP)}
        </Text>
        <ChronicleProgressBar progress={progress} />
      </View>
    </ChronicleCard>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: chronicleSpacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: chronicleSpacing.md,
  },
  // Circular per DESIGN.md section 8 (portrait frame), which overrides the
  // sharp-corner default in section 3.
  avatarRing: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    borderColor: chronicleColors.accentGold,
    backgroundColor: chronicleColors.bgSurfaceRaised,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  identity: {
    flex: 1,
    gap: 2,
  },
  name: {
    color: chronicleColors.textPrimary,
    fontFamily: chronicleFontFamily.bodySemiBold,
    fontSize: chronicleType.lg,
  },
  rank: {
    color: chronicleColors.textMuted,
    fontFamily: chronicleFontFamily.body,
    fontSize: chronicleType.sm,
  },
  levelBadge: {
    backgroundColor: chronicleColors.bgSurfaceRaised,
    borderWidth: 1,
    borderColor: chronicleColors.borderSubtle,
    borderRadius: chronicleRadius.sm,
    paddingHorizontal: chronicleSpacing.sm,
    paddingVertical: chronicleSpacing.xs,
  },
  levelBadgeText: {
    color: chronicleColors.accentGold,
    fontFamily: chronicleFontFamily.mono,
    fontSize: chronicleType.xs,
    letterSpacing: 0.6,
  },
  xpBlock: {
    gap: chronicleSpacing.xs,
  },
  xpLabel: {
    color: chronicleColors.textMuted,
    fontFamily: chronicleFontFamily.mono,
    fontSize: chronicleType.xs,
    letterSpacing: 0.4,
  },
});
