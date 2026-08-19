import { useCallback, useMemo, useState } from 'react';
import { Alert, Image, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { nanoid } from 'nanoid/non-secure';
import { type Href, useFocusEffect, useRouter } from 'expo-router';
import type { MarkedDates } from 'react-native-calendars/src/types';

import { AppCalendar } from '../components/AppCalendar';
import { ChronicleButton } from '../components/chronicle/ChronicleButton';
import { ChronicleCard } from '../components/chronicle/ChronicleCard';
import { ChronicleInput } from '../components/chronicle/ChronicleInput';
import { ChronicleSectionHeader } from '../components/chronicle/ChronicleSectionHeader';
import { ChronicleSegmentedControl } from '../components/chronicle/ChronicleSegmentedControl';
import { ChronicleStatPanel } from '../components/chronicle/ChronicleStatPanel';
import { summarizeWorkoutProgress } from '../lib/growthEngine';
import { deleteLocalImage, getLocalDateString, saveImageToLocalDirectory } from '../lib/haircareEngine';
import { getProfile, getWorkoutEntries, setWorkoutEntries } from '../lib/storage';
import type { WorkoutEntry } from '../lib/types';
import { chronicleColors, chronicleFontFamily, chronicleSpacing, chronicleType } from '../theme/chronicle';
import { chronicleCalendarTheme } from '../theme/chronicleCalendarTheme';

function emptyWorkout(date: string): WorkoutEntry {
  return {
    id: nanoid(),
    date,
    workoutType: 'strength',
    sessionTime: 'both',
    title: '',
    durationMinutes: 45,
    sets: 3,
    reps: 8,
    weightKg: 0,
    effort: 7,
    note: '',
    imageUri: null,
    createdAt: new Date().toISOString(),
  };
}

const workoutTypes: WorkoutEntry['workoutType'][] = ['strength', 'cardio', 'mobility', 'sports'];
const sessionTimes: WorkoutEntry['sessionTime'][] = ['morning', 'evening', 'both'];

export default function WorkoutProgressScreen() {
  const router = useRouter();
  const [entries, setEntries] = useState<WorkoutEntry[]>([]);
  const [draft, setDraft] = useState<WorkoutEntry>(emptyWorkout(getLocalDateString()));
  const [refreshing, setRefreshing] = useState(false);
  const [savingImage, setSavingImage] = useState(false);

  const load = useCallback(async () => {
    const profile = await getProfile();
    if (!profile) {
      router.replace('/onboarding' as Href);
      return;
    }
    const stored = (await getWorkoutEntries()).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    setEntries(stored);
    setDraft(emptyWorkout(getLocalDateString()));
  }, [router]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  async function handleRefresh() {
    setRefreshing(true);
    try {
      await load();
    } finally {
      setRefreshing(false);
    }
  }

  async function saveWorkout() {
    try {
      const next = [draft, ...entries].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      await setWorkoutEntries(next);
      setEntries(next);
      setDraft(emptyWorkout(getLocalDateString()));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to save this workout.';
      Alert.alert('Save failed', message);
    }
  }

  async function pickWorkoutImage(source: 'camera' | 'gallery') {
    setSavingImage(true);
    try {
      const permission =
        source === 'camera'
          ? await ImagePicker.requestCameraPermissionsAsync()
          : await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {
        Alert.alert(
          source === 'camera' ? 'Camera permission needed' : 'Gallery permission needed',
          source === 'camera' ? 'Camera access is required for workout progress photos.' : 'Photo library access is required for workout progress photos.'
        );
        return;
      }

      const result =
        source === 'camera'
          ? await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.9, allowsEditing: false })
          : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.9, allowsEditing: false });

      if (result.canceled || !result.assets[0]) {
        return;
      }

      const savedUri = await saveImageToLocalDirectory(result.assets[0].uri, 'workout', draft.date);
      const previousImageUri = draft.imageUri;
      setDraft((current) => ({ ...current, imageUri: savedUri }));

      if (previousImageUri && previousImageUri !== savedUri) {
        deleteLocalImage(previousImageUri);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to save workout image.';
      Alert.alert('Image save failed', message);
    } finally {
      setSavingImage(false);
    }
  }

  function chooseWorkoutImage() {
    Alert.alert('Workout Progress Photo', 'Choose camera or gallery.', [
      { text: 'Camera', onPress: () => void pickWorkoutImage('camera') },
      { text: 'Gallery', onPress: () => void pickWorkoutImage('gallery') },
      { text: 'Cancel', style: 'cancel' },
    ]);
  }

  const summary = useMemo(() => summarizeWorkoutProgress(entries), [entries]);
  const markedDates = useMemo<MarkedDates>(
    () =>
      entries.reduce<MarkedDates>((acc, entry) => {
        acc[entry.date] = {
          dots: [{ key: 'workout', color: chronicleColors.accentGold }],
        };
        return acc;
      }, {}),
    [entries]
  );

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={chronicleColors.accentGold} />}>
      <View style={styles.topLinks}>
        <Pressable onPress={() => router.back()} style={({ pressed }) => (pressed ? styles.pressed : null)}>
          <Text style={styles.backLink}>‹ Back</Text>
        </Pressable>
        <Pressable
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          accessibilityRole="button"
          onPress={() => router.push('/workout-calendar' as Href)}
          style={({ pressed }) => (pressed ? styles.pressed : null)}>
          <Text style={styles.backLink}>Month View ›</Text>
        </Pressable>
      </View>

      <View style={styles.hero}>
        <Text style={styles.kicker}>WORKOUT PROGRESS</Text>
        <Text style={styles.title}>Track sessions, strength, and physique photos</Text>
        <Text style={styles.body}>
          {summary.totalSessions} sessions · {summary.totalMinutes} total minutes · best weight {summary.bestWeightKg} kg
        </Text>
      </View>

      <View style={styles.metricsRow}>
        <ChronicleStatPanel value={String(summary.strengthSessions)} label="STRENGTH" />
        <ChronicleStatPanel value={String(summary.totalSessions)} label="SESSIONS" />
      </View>

      <View style={styles.section}>
        <ChronicleSectionHeader title="Workout Calendar" />
        <ChronicleCard>
          <Text style={styles.meta}>Gold marks show completed workout logs.</Text>
          <AppCalendar markedDates={markedDates} current={draft.date} calendarTheme={chronicleCalendarTheme} />
        </ChronicleCard>
      </View>

      <View style={styles.section}>
        <ChronicleSectionHeader title="Log Workout" />
        <ChronicleCard style={styles.formCard}>
          <ChronicleInput
            label="Title"
            value={draft.title}
            onChangeText={(text) => setDraft((current) => ({ ...current, title: text }))}
            placeholder="Push day, chest and triceps, 5K run..."
          />

          <View style={styles.fieldWrap}>
            <Text style={styles.fieldLabel}>Workout type</Text>
            <ChronicleSegmentedControl
              options={workoutTypes.map((type) => ({ value: type, label: type }))}
              value={draft.workoutType}
              onChange={(value) => setDraft((current) => ({ ...current, workoutType: value }))}
            />
          </View>

          <View style={styles.fieldWrap}>
            <Text style={styles.fieldLabel}>Session time</Text>
            <ChronicleSegmentedControl
              options={sessionTimes.map((time) => ({ value: time, label: time }))}
              value={draft.sessionTime}
              onChange={(value) => setDraft((current) => ({ ...current, sessionTime: value }))}
            />
          </View>

          <ChronicleInput
            label="Duration minutes"
            keyboardType="decimal-pad"
            value={String(draft.durationMinutes)}
            onChangeText={(text) => setDraft((current) => ({ ...current, durationMinutes: Number(text || 0) }))}
          />
          <ChronicleInput
            label="Sets"
            keyboardType="decimal-pad"
            value={String(draft.sets)}
            onChangeText={(text) => setDraft((current) => ({ ...current, sets: Number(text || 0) }))}
          />
          <ChronicleInput
            label="Reps"
            keyboardType="decimal-pad"
            value={String(draft.reps)}
            onChangeText={(text) => setDraft((current) => ({ ...current, reps: Number(text || 0) }))}
          />
          <ChronicleInput
            label="Weight kg"
            keyboardType="decimal-pad"
            value={String(draft.weightKg)}
            onChangeText={(text) => setDraft((current) => ({ ...current, weightKg: Number(text || 0) }))}
          />
          <ChronicleInput
            label="Effort 1-10"
            keyboardType="decimal-pad"
            value={String(draft.effort)}
            onChangeText={(text) =>
              setDraft((current) => ({ ...current, effort: Math.max(1, Math.min(10, Number(text || 0))) }))
            }
          />
          <ChronicleInput
            label="Notes"
            value={draft.note}
            onChangeText={(text) => setDraft((current) => ({ ...current, note: text }))}
            placeholder="How did this workout feel?"
            multiline
          />

          <ChronicleButton label="Add Camera or Gallery Image" onPress={chooseWorkoutImage} loading={savingImage} variant="secondary" />
          {draft.imageUri ? <Image source={{ uri: draft.imageUri }} style={styles.preview} /> : null}
          <ChronicleButton label="Save Workout" onPress={saveWorkout} />
        </ChronicleCard>
      </View>

      <View style={styles.section}>
        <ChronicleSectionHeader title="Recent Workouts" />
        {entries.length === 0 ? (
          <ChronicleCard>
            <Text style={styles.entryTitle}>Nothing logged yet</Text>
            <Text style={styles.body}>Fill in the form above and save your first session — it&apos;ll show up here and mark today on the calendar.</Text>
          </ChronicleCard>
        ) : null}
        <View style={styles.entryList}>
          {entries.slice(0, 8).map((entry) => (
            <ChronicleCard key={entry.id}>
              <Text style={styles.entryTitle}>{entry.title || 'Workout session'}</Text>
              <Text style={styles.meta}>
                {entry.date} · {entry.sessionTime} · {entry.workoutType} · {entry.durationMinutes} min · effort {entry.effort}/10
              </Text>
              <Text style={styles.body}>
                {entry.sets} sets · {entry.reps} reps · {entry.weightKg} kg
              </Text>
              {entry.imageUri ? <Image source={{ uri: entry.imageUri }} style={styles.image} /> : null}
            </ChronicleCard>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  topLinks: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  screen: {
    flex: 1,
    backgroundColor: chronicleColors.bgBase,
  },
  content: {
    padding: chronicleSpacing.lg,
    gap: chronicleSpacing.lg,
    paddingBottom: chronicleSpacing.xxl,
  },
  backLink: {
    color: chronicleColors.accentGold,
    fontFamily: chronicleFontFamily.mono,
    fontSize: chronicleType.sm,
  },
  pressed: {
    opacity: 0.7,
  },
  hero: {
    backgroundColor: chronicleColors.bgSurface,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: chronicleColors.borderSubtle,
    padding: chronicleSpacing.lg,
    gap: chronicleSpacing.sm,
  },
  kicker: {
    color: chronicleColors.accentGold,
    fontFamily: chronicleFontFamily.mono,
    fontSize: chronicleType.xs,
    letterSpacing: 1,
  },
  title: {
    color: chronicleColors.textPrimary,
    fontFamily: chronicleFontFamily.display,
    fontSize: chronicleType.lg,
  },
  body: {
    color: chronicleColors.textMuted,
    fontFamily: chronicleFontFamily.body,
    fontSize: chronicleType.sm,
    lineHeight: 20,
  },
  meta: {
    color: chronicleColors.textMuted,
    fontFamily: chronicleFontFamily.mono,
    fontSize: chronicleType.sm,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: chronicleSpacing.md,
  },
  section: {
    gap: chronicleSpacing.sm,
  },
  formCard: {
    gap: chronicleSpacing.md,
  },
  fieldWrap: {
    gap: chronicleSpacing.sm,
  },
  fieldLabel: {
    color: chronicleColors.textPrimary,
    fontFamily: chronicleFontFamily.bodySemiBold,
    fontSize: chronicleType.sm,
  },
  preview: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 6,
  },
  entryList: {
    gap: chronicleSpacing.md,
  },
  entryTitle: {
    color: chronicleColors.textPrimary,
    fontFamily: chronicleFontFamily.bodySemiBold,
    fontSize: chronicleType.md,
    marginBottom: 4,
  },
  image: {
    width: '100%',
    height: 220,
    borderRadius: 6,
    marginTop: chronicleSpacing.sm,
  },
});
