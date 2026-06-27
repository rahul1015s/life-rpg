import { useCallback, useMemo, useState } from 'react';
import { Alert, Image, Pressable, RefreshControl, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { nanoid } from 'nanoid/non-secure';
import { type Href, useFocusEffect, useRouter } from 'expo-router';

import { PrimaryButton } from '../components/PrimaryButton';
import { theme } from '../constants/theme';
import { summarizeWorkoutProgress } from '../lib/growthEngine';
import { getLocalDateString, saveImageToLocalDirectory } from '../lib/haircareEngine';
import { getProfile, getWorkoutEntries, setWorkoutEntries } from '../lib/storage';
import type { WorkoutEntry } from '../lib/types';

function emptyWorkout(date: string): WorkoutEntry {
  return {
    id: nanoid(),
    date,
    workoutType: 'strength',
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
    const next = [draft, ...entries].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    await setWorkoutEntries(next);
    setEntries(next);
    setDraft(emptyWorkout(getLocalDateString()));
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
      setDraft((current) => ({ ...current, imageUri: savedUri }));
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

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}>
      <Pressable onPress={() => router.back()}>
        <Text style={styles.backLink}>Back</Text>
      </Pressable>

      <View style={styles.heroCard}>
        <Text style={styles.kicker}>WORKOUT PROGRESS</Text>
        <Text style={styles.title}>Track sessions, strength, and physique photos</Text>
        <Text style={styles.body}>
          {summary.totalSessions} sessions · {summary.totalMinutes} total minutes · best weight {summary.bestWeightKg} kg
        </Text>
      </View>

      <View style={styles.metricsRow}>
        <Metric label="STRENGTH" value={String(summary.strengthSessions)} />
        <Metric label="SESSIONS" value={String(summary.totalSessions)} />
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Log workout</Text>
        <TextInput
          style={styles.input}
          value={draft.title}
          onChangeText={(text) => setDraft((current) => ({ ...current, title: text }))}
          placeholder="Push day, chest and triceps, 5K run..."
          placeholderTextColor={theme.colors.textMuted}
        />
        <View style={styles.row}>
          {workoutTypes.map((type) => (
            <Pressable
              key={type}
              style={[styles.chip, draft.workoutType === type ? styles.chipSelected : null]}
              onPress={() => setDraft((current) => ({ ...current, workoutType: type }))}>
              <Text style={styles.chipText}>{type}</Text>
            </Pressable>
          ))}
        </View>
        <NumberField label="Duration minutes" value={draft.durationMinutes} onChange={(value) => setDraft((current) => ({ ...current, durationMinutes: value }))} />
        <NumberField label="Sets" value={draft.sets} onChange={(value) => setDraft((current) => ({ ...current, sets: value }))} />
        <NumberField label="Reps" value={draft.reps} onChange={(value) => setDraft((current) => ({ ...current, reps: value }))} />
        <NumberField label="Weight kg" value={draft.weightKg} onChange={(value) => setDraft((current) => ({ ...current, weightKg: value }))} />
        <NumberField label="Effort 1-10" value={draft.effort} onChange={(value) => setDraft((current) => ({ ...current, effort: Math.max(1, Math.min(10, value)) }))} />
        <TextInput
          style={[styles.input, styles.multiline]}
          value={draft.note}
          onChangeText={(text) => setDraft((current) => ({ ...current, note: text }))}
          placeholder="How did this workout feel?"
          placeholderTextColor={theme.colors.textMuted}
          multiline
        />
        <PrimaryButton label="Add Camera or Gallery Image" onPress={chooseWorkoutImage} loading={savingImage} variant="secondary" />
        {draft.imageUri ? <Image source={{ uri: draft.imageUri }} style={styles.preview} /> : null}
        <PrimaryButton label="Save Workout" onPress={saveWorkout} />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent workouts</Text>
        {entries.slice(0, 8).map((entry) => (
          <View key={entry.id} style={styles.card}>
            <Text style={styles.cardTitle}>{entry.title || 'Workout session'}</Text>
            <Text style={styles.meta}>
              {entry.date} · {entry.workoutType} · {entry.durationMinutes} min · effort {entry.effort}/10
            </Text>
            <Text style={styles.body}>
              {entry.sets} sets · {entry.reps} reps · {entry.weightKg} kg
            </Text>
            {entry.imageUri ? <Image source={{ uri: entry.imageUri }} style={styles.image} /> : null}
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

function NumberField({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) {
  return (
    <View style={styles.fieldWrap}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput style={styles.input} keyboardType="decimal-pad" value={String(value)} onChangeText={(text) => onChange(Number(text || 0))} />
    </View>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metricCard}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.metricValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.colors.background },
  content: { padding: theme.spacing.lg, gap: theme.spacing.lg, paddingBottom: theme.spacing.xl * 2 },
  backLink: { color: theme.colors.accentGlow, fontSize: theme.font.sm, fontWeight: '700' },
  heroCard: { backgroundColor: theme.colors.surface, borderRadius: theme.radius.lg, borderWidth: 1, borderColor: theme.colors.border, padding: theme.spacing.lg, gap: theme.spacing.sm },
  kicker: { color: theme.colors.accentGlow, fontSize: theme.font.sm, fontWeight: '800', letterSpacing: 1 },
  title: { color: theme.colors.textPrimary, fontSize: theme.font.xl, fontWeight: '900' },
  body: { color: theme.colors.textPrimary, fontSize: theme.font.sm, lineHeight: 20 },
  meta: { color: theme.colors.textMuted, fontSize: theme.font.sm },
  metricsRow: { flexDirection: 'row', gap: theme.spacing.md },
  metricCard: { flex: 1, backgroundColor: theme.colors.surfaceAlt, borderRadius: theme.radius.md, borderWidth: 1, borderColor: theme.colors.accent, padding: theme.spacing.md, gap: theme.spacing.xs },
  metricLabel: { color: theme.colors.textMuted, fontSize: theme.font.sm },
  metricValue: { color: theme.colors.textPrimary, fontSize: theme.font.lg, fontWeight: '900' },
  section: { gap: theme.spacing.md },
  sectionTitle: { color: theme.colors.textPrimary, fontSize: theme.font.lg, fontWeight: '800' },
  card: { backgroundColor: theme.colors.surface, borderRadius: theme.radius.md, borderWidth: 1, borderColor: theme.colors.border, padding: theme.spacing.md, gap: theme.spacing.sm },
  cardTitle: { color: theme.colors.textPrimary, fontSize: theme.font.md, fontWeight: '800' },
  fieldWrap: { gap: theme.spacing.xs },
  fieldLabel: { color: theme.colors.textPrimary, fontSize: theme.font.sm, fontWeight: '700' },
  input: { backgroundColor: theme.colors.surfaceAlt, borderRadius: theme.radius.md, borderWidth: 1, borderColor: theme.colors.border, paddingHorizontal: theme.spacing.md, paddingVertical: theme.spacing.sm, color: theme.colors.textPrimary },
  multiline: { minHeight: 96, textAlignVertical: 'top' },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm },
  chip: { paddingHorizontal: theme.spacing.md, paddingVertical: theme.spacing.sm, borderRadius: 999, backgroundColor: theme.colors.surfaceAlt, borderWidth: 1, borderColor: theme.colors.border },
  chipSelected: { backgroundColor: theme.colors.primary, borderColor: theme.colors.accent },
  chipText: { color: theme.colors.textPrimary, fontSize: theme.font.sm, textTransform: 'capitalize' },
  preview: { width: '100%', aspectRatio: 1, borderRadius: theme.radius.md },
  image: { width: '100%', height: 220, borderRadius: theme.radius.md },
});
