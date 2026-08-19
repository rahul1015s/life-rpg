import { StyleSheet, Text, TextInput, View, type KeyboardTypeOptions } from 'react-native';

import { chronicleColors, chronicleFontFamily, chronicleRadius, chronicleSpacing, chronicleType } from '../../theme/chronicle';

type ChronicleInputProps = {
  label?: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  multiline?: boolean;
  keyboardType?: KeyboardTypeOptions;
};

export function ChronicleInput({ label, value, onChangeText, placeholder, multiline = false, keyboardType }: ChronicleInputProps) {
  return (
    <View style={styles.wrap}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <TextInput
        style={[styles.input, multiline && styles.multiline]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={chronicleColors.textMuted}
        multiline={multiline}
        keyboardType={keyboardType}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: chronicleSpacing.sm,
  },
  label: {
    color: chronicleColors.textPrimary,
    fontFamily: chronicleFontFamily.bodySemiBold,
    fontSize: chronicleType.sm,
  },
  input: {
    // Raised fill: every usage sits inside a bgSurface ChronicleCard, so a
    // bgSurface field would read flush against its container.
    backgroundColor: chronicleColors.bgSurfaceRaised,
    borderRadius: chronicleRadius.md,
    borderWidth: 1,
    borderColor: chronicleColors.borderSubtle,
    paddingHorizontal: chronicleSpacing.md,
    paddingVertical: chronicleSpacing.sm,
    color: chronicleColors.textPrimary,
    fontFamily: chronicleFontFamily.body,
    fontSize: chronicleType.sm,
  },
  multiline: {
    minHeight: 96,
    textAlignVertical: 'top',
  },
});
