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
  View,
} from 'react-native';
import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Image } from 'expo-image';
import { type Href, useRouter } from 'expo-router';

import { ChronicleButton } from '../components/chronicle/ChronicleButton';
import { ChronicleCard } from '../components/chronicle/ChronicleCard';
import { ChronicleInput } from '../components/chronicle/ChronicleInput';
import { chronicleColors, chronicleFontFamily, chronicleRadius, chronicleSpacing, chronicleType } from '../theme/chronicle';
import { getLocalDateString } from '../lib/haircareEngine';
import { createInitialProgress } from '../lib/levelSystem';
import { setProfile, setProgress } from '../lib/storage';
import type { ExperienceLevel, MainGoal, PlayerProfile, ProfileGender } from '../lib/types';
import { getDobLimits, toIsoDateString } from '../lib/utils/profile';

const emblemSource = require('../assets/images/splash/splash-emblem.png');

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
    <Pressable
      onPress={onPress}
      // Chips render ~36px tall; 4px of slop on each edge brings the touch target to
      // ~44px without changing their visual size. 4 (not 5) because chipWrap's gap is
      // 8px — any more and adjacent chips' touch regions would overlap.
      hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
      style={[styles.chip, selected ? styles.chipSelected : null]}>
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
        <Image source={emblemSource} style={styles.emblem} contentFit="contain" accessible={false} />
        <Text style={styles.kicker}>LIFE RPG</Text>
        <Text style={styles.stepCounter}>STEP {step + 1} / 3</Text>

        {step === 0 ? (
          <ChronicleCard style={styles.panel}>
            <Text style={styles.title}>Create your system profile</Text>
            <Text style={styles.body}>
              Life RPG turns daily habits into a quest board: clear quests, earn XP, build a streak, and unlock
              achievements as it grows. Start with your basic profile so the app can personalize the discipline
              tracker and daily quests correctly.
            </Text>
            <ChronicleInput
              label="Name"
              value={name}
              onChangeText={setName}
              placeholder="Your name"
            />
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
          </ChronicleCard>
        ) : null}

        {step === 1 ? (
          <ChronicleCard style={styles.panel}>
            <Text style={styles.title}>When were you born?</Text>
            <Text style={styles.body}>
              We store your date of birth so age stays accurate over time instead of asking for a number again later.
            </Text>
            <View style={styles.section}>
              <Text style={styles.label}>Date of Birth</Text>
              {Platform.OS === 'android' ? (
                <Pressable style={[styles.input, styles.dobField]} onPress={() => setShowDobPicker(true)}>
                  <Text style={styles.inputText}>{dobIsoString}</Text>
                </Pressable>
              ) : null}
              {showDobPicker ? (
                // Wrapper is styled only on iOS, where the picker renders inline.
                // On Android it's a native dialog, so an unstyled (invisible) view avoids
                // leaving an empty bordered strip behind it.
                <View style={Platform.OS === 'ios' ? styles.datePickerWrap : null}>
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
          </ChronicleCard>
        ) : null}

        {step === 2 ? (
          <ChronicleCard style={styles.panel}>
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

            <ChronicleInput
              label="Wake Time"
              value={wakeTime}
              onChangeText={setWakeTime}
              placeholder="HH:mm"
            />

            <ChronicleInput
              label="Sleep Target"
              value={sleepTarget}
              onChangeText={setSleepTarget}
              placeholder="HH:mm"
            />

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
                trackColor={{ false: chronicleColors.bgSurfaceRaised, true: chronicleColors.accentGold }}
                thumbColor={usesMinoxidil ? chronicleColors.bgBase : chronicleColors.textMuted}
                ios_backgroundColor={chronicleColors.bgSurfaceRaised}
              />
            </View>

            {usesMinoxidil ? (
              <ChronicleInput
                label="Treatment Start Date"
                value={minoxidilStartDate}
                onChangeText={setMinoxidilStartDate}
                placeholder="YYYY-MM-DD"
              />
            ) : null}
          </ChronicleCard>
        ) : null}

        <View style={styles.actions}>
          {step > 0 ? (
            <View style={styles.action}>
              <ChronicleButton label="Back" onPress={goBack} variant="secondary" />
            </View>
          ) : null}
          <View style={styles.action}>
            {step < 2 ? (
              <ChronicleButton label="Next" onPress={goNext} />
            ) : (
              <ChronicleButton label="Initialize Profile" onPress={handleSubmit} loading={submitting} />
            )}
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: chronicleColors.bgBase,
  },
  content: {
    padding: chronicleSpacing.lg,
    gap: chronicleSpacing.lg,
    paddingBottom: chronicleSpacing.xl * 2,
  },
  emblem: {
    width: 56,
    height: 56,
    marginTop: chronicleSpacing.lg,
  },
  kicker: {
    color: chronicleColors.accentGold,
    fontFamily: chronicleFontFamily.display,
    fontSize: chronicleType.sm,
    letterSpacing: 2,
  },
  stepCounter: {
    color: chronicleColors.textMuted,
    fontFamily: chronicleFontFamily.mono,
    fontSize: chronicleType.xs,
    letterSpacing: 0.5,
  },
  panel: {
    gap: chronicleSpacing.md,
  },
  title: {
    color: chronicleColors.textPrimary,
    fontFamily: chronicleFontFamily.display,
    fontSize: chronicleType.lg,
    letterSpacing: 0.5,
  },
  body: {
    color: chronicleColors.textMuted,
    fontFamily: chronicleFontFamily.body,
    fontSize: chronicleType.md,
    lineHeight: 24,
  },
  bodySmall: {
    color: chronicleColors.textMuted,
    fontFamily: chronicleFontFamily.body,
    fontSize: chronicleType.sm,
    lineHeight: 20,
  },
  section: {
    gap: chronicleSpacing.sm,
  },
  label: {
    color: chronicleColors.textPrimary,
    fontFamily: chronicleFontFamily.bodySemiBold,
    fontSize: chronicleType.sm,
  },
  input: {
    // Mirrors ChronicleInput's field styling so the DOB control is indistinguishable
    // from the real inputs around it.
    backgroundColor: chronicleColors.bgSurfaceRaised,
    borderRadius: chronicleRadius.md,
    borderWidth: 1,
    borderColor: chronicleColors.borderSubtle,
    color: chronicleColors.textPrimary,
    paddingHorizontal: chronicleSpacing.md,
    paddingVertical: chronicleSpacing.sm,
    fontFamily: chronicleFontFamily.body,
    fontSize: chronicleType.sm,
  },
  dobField: {
    // Pressable, so it needs a real touch target unlike the text fields.
    minHeight: 44,
    justifyContent: 'center',
  },
  inputText: {
    color: chronicleColors.textPrimary,
    fontFamily: chronicleFontFamily.body,
    fontSize: chronicleType.sm,
  },
  datePickerWrap: {
    borderWidth: 1,
    borderColor: chronicleColors.borderSubtle,
    borderRadius: chronicleRadius.md,
    backgroundColor: chronicleColors.bgSurfaceRaised,
  },
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: chronicleSpacing.sm,
  },
  chip: {
    paddingHorizontal: chronicleSpacing.md,
    paddingVertical: chronicleSpacing.sm,
    // Pill radius is intentional here: chips read as tags, not structural cards.
    borderRadius: 999,
    backgroundColor: chronicleColors.bgSurfaceRaised,
    borderWidth: 1,
    borderColor: chronicleColors.textMuted,
  },
  chipSelected: {
    backgroundColor: chronicleColors.accentGold,
    borderColor: chronicleColors.accentGold,
  },
  chipText: {
    color: chronicleColors.textMuted,
    fontFamily: chronicleFontFamily.bodySemiBold,
    fontSize: chronicleType.sm,
    textTransform: 'capitalize',
  },
  chipTextSelected: {
    color: chronicleColors.bgBase,
  },
  toggleCard: {
    backgroundColor: chronicleColors.bgSurfaceRaised,
    borderRadius: chronicleRadius.md,
    borderWidth: 1,
    borderColor: chronicleColors.borderSubtle,
    padding: chronicleSpacing.md,
    flexDirection: 'row',
    gap: chronicleSpacing.md,
    alignItems: 'center',
  },
  toggleCopy: {
    flex: 1,
    gap: chronicleSpacing.xs,
  },
  actions: {
    flexDirection: 'row',
    gap: chronicleSpacing.md,
  },
  action: {
    flex: 1,
  },
});
