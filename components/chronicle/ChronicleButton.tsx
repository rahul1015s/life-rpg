import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';

import { chronicleColors, chronicleFontFamily, chronicleRadius, chronicleSpacing, chronicleType } from '../../theme/chronicle';

type ChronicleButtonProps = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: 'primary' | 'secondary' | 'danger';
};

export function ChronicleButton({ label, onPress, disabled = false, loading = false, variant = 'primary' }: ChronicleButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.button,
        variant === 'secondary' ? styles.secondary : variant === 'danger' ? styles.danger : styles.primary,
        isDisabled && styles.disabled,
        pressed && !isDisabled ? styles.pressed : null,
      ]}>
      {loading ? (
        <ActivityIndicator
          color={
            variant === 'secondary'
              ? chronicleColors.accentGold
              : variant === 'danger'
                ? chronicleColors.accentEmber
                : chronicleColors.bgBase
          }
        />
      ) : (
        <Text
          style={[
            styles.label,
            variant === 'secondary' ? styles.labelSecondary : variant === 'danger' ? styles.labelDanger : styles.labelPrimary,
          ]}>
          {label}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 52,
    borderRadius: chronicleRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: chronicleSpacing.lg,
  },
  primary: {
    backgroundColor: chronicleColors.accentGold,
  },
  secondary: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: chronicleColors.accentGold,
  },
  // Destructive actions use ember, never gold (DESIGN.md section 1).
  danger: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: chronicleColors.accentEmber,
  },
  disabled: {
    opacity: 0.5,
  },
  pressed: {
    transform: [{ scale: 0.98 }],
  },
  label: {
    fontFamily: chronicleFontFamily.bodyBold,
    fontSize: chronicleType.md,
  },
  labelPrimary: {
    color: chronicleColors.bgBase,
  },
  labelSecondary: {
    color: chronicleColors.accentGold,
  },
  labelDanger: {
    color: chronicleColors.accentEmber,
  },
});
