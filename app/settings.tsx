import { useCallback, useMemo, useState } from 'react';
import {
  Alert,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { type Href, useFocusEffect, useRouter } from 'expo-router';

import { PrimaryButton } from '../components/PrimaryButton';
import { theme } from '../constants/theme';
import {
  cancelReminder,
  getReminderCopy,
  reminderIds,
  requestNotificationPermission,
  scheduleDailyReminder,
} from '../lib/notifications/scheduleQuestReminders';
import { exportAppData, getProfile, getSettings, importAppData, setProfile, setSettings } from '../lib/storage';
import type { AppSettings, NotificationReminderSettings, PlayerProfile } from '../lib/types';
import { getDobLimits, getAgeFromDob, toIsoDateString } from '../lib/utils/profile';

type ReminderKey = keyof AppSettings['notifications'];
const energyModes: AppSettings['energyMode'][] = ['light', 'standard', 'beast'];

const reminderLabels: Record<ReminderKey, { title: string; note: string; reminderType: 'dailyQuest' | 'noFapCheckIn' | 'focusWorkout' }> = {
  dailyQuest: {
    title: 'Daily Quest Reminder',
    note: 'Warn me when core quests are still open.',
    reminderType: 'dailyQuest',
  },
  noFapCheckIn: {
    title: 'NoFap Check-In Reminder',
    note: 'Warn me before the streak day closes unlogged.',
    reminderType: 'noFapCheckIn',
  },
  focusWorkout: {
    title: 'Workout Reminder',
    note: 'Optional recovery nudge for training blocks.',
    reminderType: 'focusWorkout',
  },
};

export default function SettingsScreen() {
  const router = useRouter();
  const [profile, setProfileState] = useState<PlayerProfile | null>(null);
  const [settings, setSettingsState] = useState<AppSettings | null>(null);
  const [backupJson, setBackupJson] = useState('');
  const [importJson, setImportJson] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [dobPickerVisible, setDobPickerVisible] = useState(false);
  const [dobDraft, setDobDraft] = useState<Date>(() => new Date(2000, 0, 1));
  const [timePickerKey, setTimePickerKey] = useState<ReminderKey | null>(null);

  const dobLimits = useMemo(() => getDobLimits(), []);

  const load = useCallback(async () => {
    const savedProfile = await getProfile();
    if (!savedProfile) {
      router.replace('/onboarding' as Href);
      return;
    }

    setProfileState(savedProfile);
    setSettingsState(await getSettings());

    if (savedProfile.dob) {
      const [year, month, day] = savedProfile.dob.split('-').map(Number);
      setDobDraft(new Date(year, month - 1, day));
    } else {
      setDobDraft(dobLimits.maximumDate);
    }
  }, [dobLimits.maximumDate, router]);

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

  async function handleExport() {
    const data = await exportAppData();
    const json = JSON.stringify(data, null, 2);
    setBackupJson(json);
  }

  async function handleImport() {
    try {
      const parsed = JSON.parse(importJson);
      if (parsed?.version !== 1 || !parsed?.payload) {
        throw new Error('Invalid backup format.');
      }
      await importAppData(parsed);
      Alert.alert('Import complete', 'Your data backup has been restored.');
      setImportJson('');
      await load();
    } catch (error) {
      Alert.alert('Import failed', error instanceof Error ? error.message : 'Invalid JSON backup.');
    }
  }

  async function saveDob(date: Date) {
    if (!profile) {
      return;
    }

    if (date < dobLimits.minimumDate || date > dobLimits.maximumDate) {
      Alert.alert('Invalid date', 'Choose a birth date that keeps your age between 13 and 100.');
      return;
    }

    const nextProfile = {
      ...profile,
      dob: toIsoDateString(date),
    };

    await setProfile(nextProfile);
    setProfileState(nextProfile);
    setDobDraft(date);
    setDobPickerVisible(false);
  }

  function handleDobChange(event: DateTimePickerEvent, selectedDate?: Date) {
    if (Platform.OS === 'android') {
      setDobPickerVisible(false);
    }

    if (event.type === 'dismissed' || !selectedDate) {
      return;
    }

    void saveDob(selectedDate);
  }

  async function updateReminder(
    key: ReminderKey,
    nextReminder: NotificationReminderSettings,
    nextEnabled: boolean
  ) {
    if (!settings) {
      return;
    }

    const nextSettings: AppSettings = {
      ...settings,
      notifications: {
        ...settings.notifications,
        [key]: nextReminder,
      },
    };

    if (nextEnabled) {
      const hasPermission = await requestNotificationPermission();
      if (!hasPermission) {
        Alert.alert('Permission needed', 'Notification permission is required before reminders can be enabled.');
        return;
      }

      const copy = getReminderCopy(reminderLabels[key].reminderType);
      await scheduleDailyReminder(
        reminderIds[key],
        nextReminder.hour,
        nextReminder.minute,
        copy.title,
        copy.body
      );
    } else {
      await cancelReminder(reminderIds[key]);
    }

    await setSettings(nextSettings);
    setSettingsState(nextSettings);
  }

  async function toggleReminder(key: ReminderKey, enabled: boolean) {
    if (!settings) {
      return;
    }

    const current = settings.notifications[key];
    await updateReminder(key, { ...current, enabled }, enabled);
  }

  async function updateReminderTime(key: ReminderKey, date: Date) {
    if (!settings) {
      return;
    }

    const current = settings.notifications[key];
    const nextReminder = {
      ...current,
      hour: date.getHours(),
      minute: date.getMinutes(),
    };

    await updateReminder(key, nextReminder, current.enabled);
  }

  async function updateEnergyMode(energyMode: AppSettings['energyMode']) {
    if (!settings) {
      return;
    }

    const nextSettings: AppSettings = {
      ...settings,
      energyMode,
    };

    await setSettings(nextSettings);
    setSettingsState(nextSettings);
  }

  function handleTimeChange(event: DateTimePickerEvent, selectedDate?: Date) {
    const activeKey = timePickerKey;
    if (Platform.OS === 'android') {
      setTimePickerKey(null);
    }

    if (!activeKey || event.type === 'dismissed' || !selectedDate) {
      return;
    }

    void updateReminderTime(activeKey, selectedDate);
  }

  if (!profile || !settings) {
    return null;
  }

  const backupLength = backupJson ? `${backupJson.length} chars` : 'No backup generated yet';
  const dobValue = profile.dob || 'Missing on older profile';
  const ageLabel = profile.dob ? `${getAgeFromDob(profile.dob)} years` : 'Not calculated yet';

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}>
      <Pressable onPress={() => router.back()}>
        <Text style={styles.backLink}>Back</Text>
      </Pressable>

      <View style={styles.heroCard}>
        <Text style={styles.kicker}>SETTINGS / SYSTEM</Text>
        <Text style={styles.title}>Profile details, reminders, and backups</Text>
        <Text style={styles.body}>{backupLength}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Date of Birth</Text>
        <Text style={styles.body}>Stored as an ISO date so age stays accurate automatically.</Text>
        <Pressable style={styles.input} onPress={() => setDobPickerVisible(true)}>
          <Text style={styles.inputText}>{dobValue}</Text>
        </Pressable>
        <Text style={styles.helperText}>Current age: {ageLabel}</Text>
        {dobPickerVisible ? (
          <DateTimePicker
            value={dobDraft}
            mode="date"
            display={Platform.OS === 'ios' ? 'inline' : 'default'}
            minimumDate={dobLimits.minimumDate}
            maximumDate={dobLimits.maximumDate}
            onChange={handleDobChange}
          />
        ) : null}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Energy Mode</Text>
        <Text style={styles.body}>Controls how demanding the system should make your daily quest board.</Text>
        <View style={styles.chipRow}>
          {energyModes.map((mode) => (
            <Pressable
              key={mode}
              style={[styles.chip, settings.energyMode === mode ? styles.chipSelected : null]}
              onPress={() => {
                void updateEnergyMode(mode);
              }}>
              <Text style={[styles.chipText, settings.energyMode === mode ? styles.chipTextSelected : null]}>
                {mode}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Notifications</Text>
        <Text style={styles.body}>Local-only system reminders. Permissions are requested only when you enable one.</Text>
        {(Object.keys(settings.notifications) as ReminderKey[]).map((key) => {
          const reminder = settings.notifications[key];
          const label = reminderLabels[key];
          const timeLabel = `${String(reminder.hour).padStart(2, '0')}:${String(reminder.minute).padStart(2, '0')}`;

          return (
            <View key={key} style={styles.notificationRow}>
              <View style={styles.notificationCopy}>
                <Text style={styles.label}>{label.title}</Text>
                <Text style={styles.bodySmall}>{label.note}</Text>
                <Pressable style={styles.timeButton} onPress={() => setTimePickerKey(key)}>
                  <Text style={styles.timeButtonText}>{timeLabel}</Text>
                </Pressable>
              </View>
              <Switch
                value={reminder.enabled}
                onValueChange={(value) => {
                  void toggleReminder(key, value);
                }}
                trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
                thumbColor={theme.colors.textPrimary}
              />
            </View>
          );
        })}
        {timePickerKey ? (
          <DateTimePicker
            value={
              new Date(
                2000,
                0,
                1,
                settings.notifications[timePickerKey].hour,
                settings.notifications[timePickerKey].minute
              )
            }
            mode="time"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={handleTimeChange}
          />
        ) : null}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Export Backup</Text>
        <PrimaryButton label="Generate Backup JSON" onPress={handleExport} />
        <TextInput
          style={[styles.input, styles.multiline]}
          multiline
          editable={false}
          value={backupJson}
          placeholder="Your exported backup JSON will appear here."
          placeholderTextColor={theme.colors.textMuted}
        />
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Import Backup</Text>
        <TextInput
          style={[styles.input, styles.multiline]}
          multiline
          value={importJson}
          onChangeText={setImportJson}
          placeholder="Paste exported backup JSON here."
          placeholderTextColor={theme.colors.textMuted}
        />
        <PrimaryButton label="Import Backup" onPress={handleImport} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.colors.background },
  content: { padding: theme.spacing.lg, gap: theme.spacing.lg, paddingBottom: theme.spacing.xl * 2 },
  backLink: { color: theme.colors.accentGlow, fontSize: theme.font.sm, fontWeight: '700' },
  heroCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.lg,
    gap: theme.spacing.sm,
  },
  kicker: { color: theme.colors.accentGlow, fontSize: theme.font.sm, fontWeight: '800', letterSpacing: 1 },
  title: { color: theme.colors.textPrimary, fontSize: theme.font.xl, fontWeight: '900' },
  body: { color: theme.colors.textMuted, fontSize: theme.font.md, lineHeight: 20 },
  bodySmall: { color: theme.colors.textMuted, fontSize: theme.font.sm, lineHeight: 18 },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.md,
    gap: theme.spacing.md,
  },
  cardTitle: { color: theme.colors.textPrimary, fontSize: theme.font.md, fontWeight: '800' },
  label: { color: theme.colors.textPrimary, fontSize: theme.font.md, fontWeight: '700' },
  input: {
    backgroundColor: theme.colors.surfaceAlt,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    color: theme.colors.textPrimary,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    fontSize: theme.font.sm,
  },
  inputText: { color: theme.colors.textPrimary, fontSize: theme.font.md },
  multiline: { minHeight: 180, textAlignVertical: 'top' },
  helperText: { color: theme.colors.textMuted, fontSize: theme.font.sm },
  notificationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
  },
  notificationCopy: {
    flex: 1,
    gap: theme.spacing.xs,
  },
  timeButton: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surfaceAlt,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  timeButtonText: {
    color: theme.colors.accentGlow,
    fontSize: theme.font.sm,
    fontWeight: '700',
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  chip: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surfaceAlt,
  },
  chipSelected: {
    borderColor: theme.colors.accent,
    backgroundColor: theme.colors.primary,
  },
  chipText: {
    color: theme.colors.textPrimary,
    fontSize: theme.font.sm,
    textTransform: 'capitalize',
  },
  chipTextSelected: {
    fontWeight: '800',
  },
});
