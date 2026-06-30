import { useMemo, useState } from 'react';
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
import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { type Href, useRouter } from 'expo-router';

import { PrimaryButton } from '../components/PrimaryButton';
import { theme } from '../constants/theme';
import { getLocalDateString } from '../lib/haircareEngine';
import { createInitialProgress } from '../lib/levelSystem';
import { setProfile, setProgress } from '../lib/storage';
import type { ExperienceLevel, MainGoal, PlayerProfile, ProfileGender } from '../lib/types';
import { getDobLimits, toIsoDateString } from '../lib/utils/profile';

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
const genderOptions: ProfileGender[] = ['male', 'female'];

type OnboardingStep = 0 | 1 | 2;

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
  const [step, setStep] = useState<OnboardingStep>(0);
  const [name, setName] = useState('');
  const [gender, setGender] = useState<ProfileGender | null>(null);
  const [dob, setDob] = useState(() => {
    const defaults = getDobLimits();
    return new Date(defaults.maximumDate.getFullYear() - 5, defaults.maximumDate.getMonth(), defaults.maximumDate.getDate());
  });
  const [showDobPicker, setShowDobPicker] = useState(Platform.OS === 'ios');
  const [mainGoals, setMainGoals] = useState<MainGoal[]>(['all-rounder']);
  const [experienceLevel, setExperienceLevel] = useState<ExperienceLevel>('normal');
  const [wakeTime, setWakeTime] = useState('07:00');
  const [sleepTarget, setSleepTarget] = useState('23:00');
  const [usesMinoxidil, setUsesMinoxidil] = useState(false);
  const [minoxidilStartDate, setMinoxidilStartDate] = useState(getLocalDateString());
  const [submitting, setSubmitting] = useState(false);

  const dobLimits = useMemo(() => getDobLimits(), []);
  const dobIsoString = useMemo(() => toIsoDateString(dob), [dob]);

  function handleDobChange(event: DateTimePickerEvent, selectedDate?: Date) {
    if (Platform.OS === 'android') {
      setShowDobPicker(false);
    }

    if (event.type === 'dismissed' || !selectedDate) {
      return;
    }

    if (selectedDate < dobLimits.minimumDate || selectedDate > dobLimits.maximumDate) {
      Alert.alert('Invalid date', 'Choose a birth date that keeps your age between 13 and 100.');
      return;
    }

    setDob(selectedDate);
  }

  function goNext() {
    if (step === 0) {
      if (!name.trim()) {
        Alert.alert('Name required', 'Enter your name to initialize the profile.');
        return;
      }
      if (!gender) {
        Alert.alert('Gender required', 'Choose male or female so the discipline tracker and quests match your profile.');
        return;
      }
      setStep(1);
      return;
    }

    if (step === 1) {
      setStep(2);
    }
  }

  function goBack() {
    setStep((current) => (current === 0 ? current : ((current - 1) as OnboardingStep)));
  }

  function toggleGoal(goal: MainGoal) {
    setMainGoals((current) => {
      if (goal === 'all-rounder') {
        return ['all-rounder'];
      }

      const withoutAllRounder = current.filter((item) => item !== 'all-rounder');
      const exists = withoutAllRounder.includes(goal);
      const next = exists
        ? withoutAllRounder.filter((item) => item !== goal)
        : [...withoutAllRounder, goal];

      return next.length > 0 ? next : ['all-rounder'];
    });
  }

  async function handleSubmit() {
    if (!name.trim()) {
      Alert.alert('Name required', 'Enter your name to initialize the profile.');
      return;
    }
    if (!gender) {
      Alert.alert('Gender required', 'Choose male or female so the discipline tracker and quests match your profile.');
      return;
    }

    setSubmitting(true);

    try {
      const profile: PlayerProfile = {
        name: name.trim(),
        gender,
        dob: dobIsoString,
        mainGoals,
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
        <Text style={styles.stepCounter}>STEP {step + 1} / 3</Text>

        {step === 0 ? (
          <View style={styles.panel}>
            <Text style={styles.title}>Create your system profile</Text>
            <Text style={styles.body}>
              Start with your basic profile so the app can personalize the discipline tracker and daily quests correctly.
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
              <Text style={styles.label}>Gender</Text>
              <View style={styles.chipWrap}>
                {genderOptions.map((option) => (
                  <Chip
                    key={option}
                    label={option}
                    selected={gender === option}
                    onPress={() => setGender(option)}
                  />
                ))}
              </View>
            </View>
          </View>
        ) : null}

        {step === 1 ? (
          <View style={styles.panel}>
            <Text style={styles.title}>When were you born?</Text>
            <Text style={styles.body}>
              We store your date of birth so age stays accurate over time instead of asking for a number again later.
            </Text>
            <View style={styles.section}>
              <Text style={styles.label}>Date of Birth</Text>
              {Platform.OS === 'android' ? (
                <Pressable style={styles.input} onPress={() => setShowDobPicker(true)}>
                  <Text style={styles.inputText}>{dobIsoString}</Text>
                </Pressable>
              ) : null}
              {showDobPicker ? (
                <View style={styles.datePickerWrap}>
                  <DateTimePicker
                    value={dob}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'inline' : 'default'}
                    minimumDate={dobLimits.minimumDate}
                    maximumDate={dobLimits.maximumDate}
                    onChange={handleDobChange}
                  />
                </View>
              ) : null}
              <Text style={styles.bodySmall}>Allowed range: ages 13 to 100.</Text>
            </View>
          </View>
        ) : null}

        {step === 2 ? (
          <View style={styles.panel}>
            <Text style={styles.title}>Set your growth baseline</Text>
            <Text style={styles.body}>
              Choose one or more targets, then set the rhythm your daily progression will follow.
            </Text>

            <View style={styles.section}>
              <Text style={styles.label}>Targets</Text>
              <Text style={styles.bodySmall}>Pick multiple if you want a mixed quest pool. Leave all-rounder for a balanced setup.</Text>
              <View style={styles.chipWrap}>
                {goalOptions.map((option) => (
                  <Chip
                    key={option}
                    label={option}
                    selected={mainGoals.includes(option)}
                    onPress={() => toggleGoal(option)}
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
          </View>
        ) : null}

        <View style={styles.actions}>
          {step > 0 ? <PrimaryButton label="Back" onPress={goBack} variant="secondary" /> : null}
          {step < 2 ? (
            <PrimaryButton label="Next" onPress={goNext} />
          ) : (
            <PrimaryButton label="Initialize Profile" onPress={handleSubmit} loading={submitting} />
          )}
        </View>
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
    paddingBottom: theme.spacing.xl * 2,
  },
  kicker: {
    color: theme.colors.accentGlow,
    fontSize: theme.font.sm,
    fontWeight: '800',
    letterSpacing: 1.4,
    marginTop: theme.spacing.lg,
  },
  stepCounter: {
    color: theme.colors.textMuted,
    fontSize: theme.font.sm,
    fontWeight: '700',
  },
  panel: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.lg,
    gap: theme.spacing.md,
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
    backgroundColor: theme.colors.surfaceAlt,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    color: theme.colors.textPrimary,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    fontSize: theme.font.md,
  },
  inputText: {
    color: theme.colors.textPrimary,
    fontSize: theme.font.md,
  },
  datePickerWrap: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surfaceAlt,
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
    backgroundColor: theme.colors.surfaceAlt,
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
    backgroundColor: theme.colors.surfaceAlt,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.md,
    flexDirection: 'row',
    gap: theme.spacing.md,
    alignItems: 'center',
  },
  toggleCopy: {
    flex: 1,
    gap: theme.spacing.xs,
  },
  actions: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
});
