import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { type Href, useFocusEffect, useRouter } from 'expo-router';

import { HairLogEntry } from '../components/HairLogEntry';
import { PrimaryButton } from '../components/PrimaryButton';
import { theme } from '../constants/theme';
import {
  getCurrentFullDoseStreak,
  getDaysSinceStart,
  getEntryForDate,
  getThirtyDayGrid,
  getLocalDateString,
  saveHairPhotoToLocalDirectory,
  upsertHairLogEntry,
} from '../lib/haircareEngine';
import { getHairLog, getProfile, setHairLog } from '../lib/storage';
import type { HairCalendarDay, HairLogEntry as HairLogEntryType, PlayerProfile } from '../lib/types';

function CalendarCell({ day }: { day: HairCalendarDay }) {
  const backgroundColor =
    day.status === 'both'
      ? theme.colors.success
      : day.status === 'one'
        ? theme.colors.accent
        : theme.colors.surfaceAlt;

  return (
    <View style={[styles.calendarCell, { backgroundColor }]}>
      <Text style={styles.calendarText}>{day.date.slice(-2)}</Text>
    </View>
  );
}

export default function HaircareScreen() {
  const router = useRouter();
  const [profile, setProfile] = useState<PlayerProfile | null>(null);
  const [entries, setEntries] = useState<HairLogEntryType[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingPhoto, setSavingPhoto] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const loadHaircare = useCallback(async () => {
    const savedProfile = await getProfile();

    if (!savedProfile) {
      router.replace('/onboarding' as Href);
      return;
    }

    if (!savedProfile.usesMinoxidil) {
      router.replace('/dashboard' as Href);
      return;
    }

    const savedEntries = await getHairLog();
    setProfile(savedProfile);
    setEntries(savedEntries);
  }, [router]);

  useFocusEffect(
    useCallback(() => {
      let active = true;

      async function run() {
        setLoading(true);
        try {
          await loadHaircare();
        } finally {
          if (active) {
            setLoading(false);
          }
        }
      }

      run();
      return () => {
        active = false;
      };
    }, [loadHaircare])
  );

  async function handleRefresh() {
    setRefreshing(true);
    try {
      await loadHaircare();
    } finally {
      setRefreshing(false);
    }
  }

  async function handleLogPhoto() {
    setSavingPhoto(true);

    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Camera permission needed', 'Camera access is required to log a progress photo.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        quality: 0.9,
        allowsEditing: false,
      });

      if (result.canceled || !result.assets[0]) {
        return;
      }

      const today = getLocalDateString();
      const savedUri = await saveHairPhotoToLocalDirectory(result.assets[0].uri, today);
      const currentEntry = getEntryForDate(entries, today);
      const nextEntries = upsertHairLogEntry(entries, {
        ...currentEntry,
        date: today,
        photoUri: savedUri,
      });

      await setHairLog(nextEntries);
      setEntries(nextEntries);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to save photo.';
      Alert.alert('Photo log failed', message);
    } finally {
      setSavingPhoto(false);
    }
  }

  if (loading || !profile) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={theme.colors.accent} />
      </View>
    );
  }

  const calendar = getThirtyDayGrid(entries);

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}>
      <Pressable onPress={() => router.back()}>
        <Text style={styles.backLink}>Back to dashboard</Text>
      </Pressable>

      <View style={styles.heroCard}>
        <Text style={styles.title}>Hair Care Tracker</Text>
        <Text style={styles.body}>Days since start: {getDaysSinceStart(profile.minoxidilStartDate)}</Text>
        <Text style={styles.body}>Current full-dose streak: {getCurrentFullDoseStreak(entries)} days</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>30-Day Consistency Grid</Text>
        <View style={styles.calendarGrid}>
          {calendar.map((day) => (
            <CalendarCell key={day.date} day={day} />
          ))}
        </View>
        <Text style={styles.legend}>Green: both doses • Gold: one dose • Gray: none</Text>
      </View>

      <View style={styles.section}>
        <PrimaryButton label="Log Photo" onPress={handleLogPhoto} loading={savingPhoto} />
        <Text style={styles.note}>
          Minoxidil results typically take 3–6+ months of consistent twice-daily use, and an initial
          shedding phase is normal. This is general informational text only, not medical advice.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Photo Log</Text>
        <View style={styles.entryList}>
          {entries.filter((entry) => entry.photoUri).length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>No photo entries logged yet.</Text>
            </View>
          ) : (
            entries
              .filter((entry) => entry.photoUri)
              .map((entry) => <HairLogEntry key={entry.date} entry={entry} />)
          )}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    padding: theme.spacing.lg,
    gap: theme.spacing.lg,
    paddingBottom: theme.spacing.xl * 2,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
  backLink: {
    color: theme.colors.accentGlow,
    fontSize: theme.font.sm,
    fontWeight: '700',
  },
  heroCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.lg,
    gap: theme.spacing.sm,
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
  note: {
    color: theme.colors.textMuted,
    fontSize: theme.font.sm,
    lineHeight: 20,
  },
  section: {
    gap: theme.spacing.md,
  },
  sectionTitle: {
    color: theme.colors.textPrimary,
    fontSize: theme.font.lg,
    fontWeight: '800',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  calendarCell: {
    width: '12.5%',
    minWidth: 42,
    aspectRatio: 1,
    borderRadius: theme.radius.sm,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  calendarText: {
    color: theme.colors.textPrimary,
    fontSize: theme.font.sm,
    fontWeight: '800',
  },
  legend: {
    color: theme.colors.textMuted,
    fontSize: theme.font.sm,
  },
  entryList: {
    gap: theme.spacing.md,
  },
  emptyState: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.md,
  },
  emptyStateText: {
    color: theme.colors.textMuted,
    fontSize: theme.font.sm,
  },
});
