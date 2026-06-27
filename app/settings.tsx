import { useCallback, useMemo, useState } from 'react';
import { Alert, Pressable, RefreshControl, ScrollView, Share, StyleSheet, Text, TextInput, View } from 'react-native';
import { type Href, useFocusEffect, useRouter } from 'expo-router';

import { PrimaryButton } from '../components/PrimaryButton';
import { theme } from '../constants/theme';
import { exportAppData, getProfile, importAppData } from '../lib/storage';

export default function SettingsScreen() {
  const router = useRouter();
  const [backupJson, setBackupJson] = useState('');
  const [importJson, setImportJson] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const profile = await getProfile();
    if (!profile) {
      router.replace('/onboarding' as Href);
    }
  }, [router]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

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

  async function handleShare() {
    if (!backupJson) {
      await handleExport();
    }
    const message = backupJson || JSON.stringify(await exportAppData(), null, 2);
    await Share.share({ message });
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
    } catch (error) {
      Alert.alert('Import failed', error instanceof Error ? error.message : 'Invalid JSON backup.');
    }
  }

  const backupLength = useMemo(() => (backupJson ? `${backupJson.length} chars` : 'No backup generated yet'), [backupJson]);

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}>
      <Pressable onPress={() => router.back()}>
        <Text style={styles.backLink}>Back</Text>
      </Pressable>

      <View style={styles.heroCard}>
        <Text style={styles.kicker}>SETTINGS / BACKUP</Text>
        <Text style={styles.title}>Export and import your growth data</Text>
        <Text style={styles.body}>{backupLength}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Export Backup</Text>
        <PrimaryButton label="Generate Backup JSON" onPress={handleExport} />
        <PrimaryButton label="Share Backup" onPress={handleShare} variant="secondary" />
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
  heroCard: { backgroundColor: theme.colors.surface, borderRadius: theme.radius.lg, borderWidth: 1, borderColor: theme.colors.border, padding: theme.spacing.lg, gap: theme.spacing.sm },
  kicker: { color: theme.colors.accentGlow, fontSize: theme.font.sm, fontWeight: '800', letterSpacing: 1 },
  title: { color: theme.colors.textPrimary, fontSize: theme.font.xl, fontWeight: '900' },
  body: { color: theme.colors.textMuted, fontSize: theme.font.md },
  card: { backgroundColor: theme.colors.surface, borderRadius: theme.radius.md, borderWidth: 1, borderColor: theme.colors.border, padding: theme.spacing.md, gap: theme.spacing.md },
  cardTitle: { color: theme.colors.textPrimary, fontSize: theme.font.md, fontWeight: '800' },
  input: { backgroundColor: theme.colors.surfaceAlt, borderRadius: theme.radius.md, borderWidth: 1, borderColor: theme.colors.border, color: theme.colors.textPrimary, paddingHorizontal: theme.spacing.md, paddingVertical: theme.spacing.md, fontSize: theme.font.sm },
  multiline: { minHeight: 180, textAlignVertical: 'top' },
});

