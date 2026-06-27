import { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { type Href, useRouter } from 'expo-router';

import { theme } from '../constants/theme';
import { createInitialProgress } from '../lib/levelSystem';
import { setProfile, setProgress } from '../lib/storage';
import { getLocalDateString } from '../lib/haircareEngine';
import type { ExperienceLevel, MainGoal, PlayerProfile } from '../lib/types';
import { PrimaryButton } from '../components/PrimaryButton';

const goalOptions: MainGoal[] = [
  'body',
  'confidence',
  'coding',
  'study',
  'career',
  'writing',
  'personality',
  'all-rounder',
];

const experienceOptions: ExperienceLevel[] = ['beginner', 'normal', 'serious'];

function Chip({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={[styles.chip, selected ? styles.chipSelected : null]}>
      <Text style={[styles.chipText, selected ? styles.chipTextSelected : null]}>{label}</Text>
    </Pressable>
  );
}

export default function OnboardingScreen() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [mainGoal, setMainGoal] = useState<MainGoal>('all-rounder');
  const [experienceLevel, setExperienceLevel] = useState<ExperienceLevel>('normal');
  const [wakeTime, setWakeTime] = useState('07:00');
  const [sleepTarget, setSleepTarget] = useState('23:00');
  const [usesMinoxidil, setUsesMinoxidil] = useState(false);
  const [minoxidilStartDate, setMinoxidilStartDate] = useState(getLocalDateString());
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    if (!name.trim()) {
      Alert.alert('Name required', 'Enter your name to initialize the profile.');
      return;
    }

    setSubmitting(true);

    try {
      const profile: PlayerProfile = {
        name: name.trim(),
        mainGoal,
        experienceLevel,
        wakeTime: wakeTime.trim(),
        sleepTarget: sleepTarget.trim(),
        createdAt: new Date().toISOString(),
        usesMinoxidil,
        minoxidilStartDate: usesMinoxidil ? minoxidilStartDate.trim() : null,
      };

      await Promise.all([setProfile(profile), setProgress(createInitialProgress())]);
      router.replace('/dashboard' as Href);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={styles.flex} contentContainerStyle={styles.content}>
        <Text style={styles.kicker}>LIFE RPG</Text>
        <Text style={styles.title}>Create your system profile</Text>
        <Text style={styles.body}>
          Set the goal, rhythm, and discipline baseline that your daily progression will follow.
        </Text>

        <View style={styles.section}>
          <Text style={styles.label}>Name</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Your name"
            placeholderTextColor={theme.colors.textMuted}
            style={styles.input}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Main Goal</Text>
          <View style={styles.chipWrap}>
            {goalOptions.map((option) => (
              <Chip
                key={option}
                label={option}
                selected={mainGoal === option}
                onPress={() => setMainGoal(option)}
              />
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Experience Level</Text>
          <View style={styles.chipWrap}>
            {experienceOptions.map((option) => (
              <Chip
                key={option}
                label={option}
                selected={experienceLevel === option}
                onPress={() => setExperienceLevel(option)}
              />
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Wake Time</Text>
          <TextInput
            value={wakeTime}
            onChangeText={setWakeTime}
            placeholder="HH:mm"
            placeholderTextColor={theme.colors.textMuted}
            style={styles.input}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Sleep Target</Text>
          <TextInput
            value={sleepTarget}
            onChangeText={setSleepTarget}
            placeholder="HH:mm"
            placeholderTextColor={theme.colors.textMuted}
            style={styles.input}
          />
        </View>

        <View style={styles.toggleCard}>
          <View style={styles.toggleCopy}>
            <Text style={styles.label}>Hair Treatment Tracking</Text>
            <Text style={styles.bodySmall}>
              Are you currently using minoxidil or another hair treatment?
            </Text>
          </View>
          <Switch
            value={usesMinoxidil}
            onValueChange={setUsesMinoxidil}
            trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
            thumbColor={theme.colors.textPrimary}
          />
        </View>

        {usesMinoxidil ? (
          <View style={styles.section}>
            <Text style={styles.label}>Treatment Start Date</Text>
            <TextInput
              value={minoxidilStartDate}
              onChangeText={setMinoxidilStartDate}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={theme.colors.textMuted}
              style={styles.input}
            />
          </View>
        ) : null}

        <PrimaryButton label="Initialize Profile" onPress={handleSubmit} loading={submitting} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    padding: theme.spacing.lg,
    gap: theme.spacing.lg,
  },
  kicker: {
    color: theme.colors.accentGlow,
    fontSize: theme.font.sm,
    fontWeight: '800',
    letterSpacing: 1.4,
    marginTop: theme.spacing.lg,
  },
  title: {
    color: theme.colors.textPrimary,
    fontSize: theme.font.xl,
    fontWeight: '900',
  },
  body: {
    color: theme.colors.textMuted,
    fontSize: theme.font.md,
    lineHeight: 22,
  },
  bodySmall: {
    color: theme.colors.textMuted,
    fontSize: theme.font.sm,
    lineHeight: 18,
  },
  section: {
    gap: theme.spacing.sm,
  },
  label: {
    color: theme.colors.textPrimary,
    fontSize: theme.font.md,
    fontWeight: '700',
  },
  input: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    color: theme.colors.textPrimary,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    fontSize: theme.font.md,
  },
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  chip: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: 999,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  chipSelected: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  chipText: {
    color: theme.colors.textMuted,
    fontSize: theme.font.sm,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  chipTextSelected: {
    color: theme.colors.textPrimary,
  },
  toggleCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: theme.spacing.md,
  },
  toggleCopy: {
    flex: 1,
    gap: theme.spacing.xs,
  },
});
