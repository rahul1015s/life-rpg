import { StyleSheet, Text, View } from 'react-native';

import type { PlayerProfile, PlayerProgress } from '../../lib/types';
import { getNextLevelXP } from '../../lib/levelSystem';
import { borders, colors, spacing } from '../../theme/tokens';
import { fontFamily, typeScale } from '../../theme/typography';
import { Halftone } from './Halftone';
import { RankSeal } from './RankSeal';
import { XPBar } from './XPBar';

type StatusHeaderProps = {
  profile: PlayerProfile;
  progress: PlayerProgress;
  rank: import('../../lib/types').RankName;
};

function getGoalLabel(mainGoals: PlayerProfile['mainGoals']) {
  const goals = mainGoals.filter((goal) => goal !== 'all-rounder');
  if (goals.length === 0) {
    return 'ALL ROUNDER';
  }

  return goals
    .slice(0, 2)
    .map((goal) => goal.replace(/-/g, ' ').toUpperCase())
    .join(' + ');
}

export function StatusHeader({ profile, progress, rank }: StatusHeaderProps) {
  return (
    <View style={styles.header}>
      <Halftone tint={colors.parchment} opacity={0.06} />
      <View style={styles.row}>
        <RankSeal rank={rank} />
        <View style={styles.copy}>
          <Text style={styles.name}>{profile.name}</Text>
          <Text style={styles.sub}>HUNTER RANK · {getGoalLabel(profile.mainGoals)} PATH</Text>
        </View>
        <View>
          <Text style={styles.level}>LV {progress.level}</Text>
          <Text style={styles.levelSub}>CURRENT LEVEL</Text>
        </View>
      </View>
      <View style={styles.xpWrap}>
        <XPBar currentXP={progress.xp} nextLevelXP={getNextLevelXP(progress.level)} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: colors.ink,
    paddingTop: spacing.xl,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    borderBottomWidth: borders.panel,
    borderBottomColor: colors.sealRed,
    position: 'relative',
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    zIndex: 1,
  },
  copy: {
    flex: 1,
  },
  name: {
    color: colors.parchment,
    fontFamily: fontFamily.display,
    fontSize: typeScale.lg,
    letterSpacing: 0.5,
  },
  sub: {
    marginTop: 2,
    color: colors.parchmentDim,
    fontFamily: fontFamily.mono,
    fontSize: typeScale.sm,
    letterSpacing: 1,
  },
  level: {
    color: colors.gold,
    fontFamily: fontFamily.display,
    fontSize: typeScale.xl,
    textAlign: 'right',
    lineHeight: typeScale.xl + 2,
  },
  levelSub: {
    marginTop: 2,
    color: colors.parchmentDim,
    fontFamily: fontFamily.mono,
    fontSize: typeScale.xs,
    letterSpacing: 1,
    textAlign: 'right',
  },
  xpWrap: {
    marginTop: spacing.lg,
    zIndex: 1,
  },
});
