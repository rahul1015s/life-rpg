import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { IconChevronLeft } from '@tabler/icons-react-native';

import { categoryLabels, getDifficultyLabel } from '../lib/questUtils';
import type { DailyQuest } from '../lib/types';
import { chronicleColors, chronicleFontFamily, chronicleRadius, chronicleSpacing, chronicleType } from '../theme/chronicle';
import { ChronicleButton } from './chronicle/ChronicleButton';
import { ChronicleProgressBar } from './chronicle/ChronicleProgressBar';
import { QuestCategoryIcon } from './chronicle/QuestCategoryIcon';
import { WaxSeal } from './chronicle/WaxSeal';

interface QuestDetailModalProps {
  quest: DailyQuest | null;
  visible: boolean;
  onClose: () => void;
  /** Optional: when supplied, the detail view can complete the quest itself. */
  onComplete?: (questId: string) => void;
  completing?: boolean;
}

function DataRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={styles.dataRow}>
      <Text style={styles.dataLabel}>{label}</Text>
      {children}
    </View>
  );
}

export function QuestDetailModal({ quest, visible, onClose, onComplete, completing = false }: QuestDetailModalProps) {
  if (!quest) {
    return null;
  }

  // The model has no partial-progress field -- a quest is done or it is not.
  const done = quest.completed ? 1 : 0;

  const tags = [categoryLabels[quest.category].toUpperCase(), getDifficultyLabel(quest.difficulty).toUpperCase()];
  if (quest.isBonus) tags.push('BONUS');
  if (quest.isAnchor) tags.push('ANCHOR');

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <View style={styles.header}>
            <Pressable
              style={styles.headerSlot}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              accessibilityRole="button"
              accessibilityLabel="Close quest detail"
              onPress={onClose}>
              <IconChevronLeft size={24} strokeWidth={1.5} color={chronicleColors.textPrimary} />
            </Pressable>
            <Text style={styles.headerTitle}>QUEST DETAIL</Text>
            <View style={styles.headerSlot} />
          </View>

          <ScrollView contentContainerStyle={styles.content}>
            <View style={styles.badgeRing}>
              <QuestCategoryIcon category={quest.category} size={88} />
            </View>

            <Text style={styles.title}>{quest.title}</Text>
            <Text style={styles.description}>{quest.description}</Text>
            <Text style={styles.tags}>{tags.join(' · ')}</Text>

            <View style={styles.dataList}>
              <DataRow label="XP Reward">
                <Text style={styles.dataValueGold}>{quest.xp} XP</Text>
              </DataRow>

              <View style={styles.dataRowStacked}>
                <View style={styles.dataRowInner}>
                  <Text style={styles.dataLabel}>Progress</Text>
                  <Text style={styles.dataValue}>{done}/1</Text>
                </View>
                <ChronicleProgressBar progress={done} height={8} />
              </View>

              {onComplete ? (
                <DataRow label="Mark as Complete">
                  <WaxSeal
                    completed={quest.completed}
                    loading={completing}
                    disabled={quest.locked}
                    onPress={() => onComplete(quest.id)}
                  />
                </DataRow>
              ) : null}

              <DataRow label="Recommended Time">
                <Text style={styles.dataValue}>{quest.recommendedTime}</Text>
              </DataRow>
            </View>

            {quest.whyToday ? (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Why Today</Text>
                <Text style={styles.body}>{quest.whyToday}</Text>
              </View>
            ) : null}

            {quest.safetyNote ? (
              <View style={styles.noteCard}>
                <Text style={styles.sectionTitle}>Safety &amp; Respect</Text>
                <Text style={styles.body}>{quest.safetyNote}</Text>
              </View>
            ) : null}

            {quest.whyThisHelps ? (
              <View style={styles.quoteCard}>
                <Text style={styles.quote}>{quest.whyThisHelps}</Text>
                <Text style={styles.quoteAttribution}>— The System</Text>
              </View>
            ) : null}
          </ScrollView>

          <View style={styles.footer}>
            <ChronicleButton label="Close" onPress={onClose} variant="secondary" />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'center',
    padding: chronicleSpacing.lg,
    backgroundColor: 'rgba(18, 20, 28, 0.92)',
    zIndex: 2,
  },
  card: {
    maxHeight: '86%',
    backgroundColor: chronicleColors.bgSurface,
    borderRadius: chronicleRadius.md,
    borderWidth: 1,
    borderColor: chronicleColors.borderSubtle,
    paddingHorizontal: chronicleSpacing.lg,
    paddingBottom: chronicleSpacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: chronicleSpacing.md,
  },
  headerSlot: { width: 24, alignItems: 'center' },
  headerTitle: {
    color: chronicleColors.accentGold,
    fontFamily: chronicleFontFamily.display,
    fontSize: chronicleType.md,
    letterSpacing: 2,
  },
  content: { gap: chronicleSpacing.md, paddingBottom: chronicleSpacing.md },
  footer: { paddingTop: chronicleSpacing.md },
  // Thin gold ring around the pre-rendered badge art, per DESIGN.md section 8.
  badgeRing: {
    alignSelf: 'center',
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 2,
    borderColor: chronicleColors.accentGold,
    backgroundColor: chronicleColors.bgSurfaceRaised,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    color: chronicleColors.textPrimary,
    fontFamily: chronicleFontFamily.display,
    fontSize: chronicleType.xl,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  description: {
    color: chronicleColors.textMuted,
    fontFamily: chronicleFontFamily.body,
    fontSize: chronicleType.md,
    lineHeight: 24,
    textAlign: 'center',
  },
  tags: {
    color: chronicleColors.textMuted,
    fontFamily: chronicleFontFamily.mono,
    fontSize: chronicleType.xs,
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  dataList: { marginTop: chronicleSpacing.sm },
  dataRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: chronicleSpacing.md,
    paddingVertical: chronicleSpacing.md,
    borderTopWidth: 1,
    borderTopColor: chronicleColors.borderSubtle,
  },
  dataRowStacked: {
    gap: chronicleSpacing.sm,
    paddingVertical: chronicleSpacing.md,
    borderTopWidth: 1,
    borderTopColor: chronicleColors.borderSubtle,
  },
  dataRowInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dataLabel: {
    color: chronicleColors.textMuted,
    fontFamily: chronicleFontFamily.body,
    fontSize: chronicleType.sm,
  },
  dataValue: {
    color: chronicleColors.textPrimary,
    fontFamily: chronicleFontFamily.mono,
    fontSize: chronicleType.sm,
    letterSpacing: 0.5,
  },
  dataValueGold: {
    color: chronicleColors.accentGold,
    fontFamily: chronicleFontFamily.monoBold,
    fontSize: chronicleType.sm,
    letterSpacing: 0.5,
  },
  section: { gap: chronicleSpacing.xs },
  sectionTitle: {
    color: chronicleColors.textPrimary,
    fontFamily: chronicleFontFamily.bodySemiBold,
    fontSize: chronicleType.sm,
  },
  body: {
    color: chronicleColors.textMuted,
    fontFamily: chronicleFontFamily.body,
    fontSize: chronicleType.sm,
    lineHeight: 20,
  },
  noteCard: {
    backgroundColor: chronicleColors.bgSurfaceRaised,
    borderRadius: chronicleRadius.sm,
    borderWidth: 1,
    borderColor: chronicleColors.accentEmber,
    padding: chronicleSpacing.md,
    gap: chronicleSpacing.xs,
  },
  quoteCard: {
    backgroundColor: chronicleColors.bgSurfaceRaised,
    borderRadius: chronicleRadius.sm,
    borderLeftWidth: 2,
    borderLeftColor: chronicleColors.accentGold,
    padding: chronicleSpacing.md,
    gap: chronicleSpacing.xs,
  },
  quote: {
    color: chronicleColors.textMuted,
    fontFamily: chronicleFontFamily.body,
    fontStyle: 'italic',
    fontSize: chronicleType.sm,
    lineHeight: 20,
  },
  quoteAttribution: {
    color: chronicleColors.accentGoldMuted,
    fontFamily: chronicleFontFamily.mono,
    fontSize: chronicleType.xs,
    letterSpacing: 0.5,
  },
});
