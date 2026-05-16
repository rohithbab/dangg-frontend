import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { AppColors } from '@theme/colors';
import { AppRadii } from '@theme/radii';
import { AppSpacing } from '@theme/spacing';
import { AppTypography } from '@theme/typography';

export type PasswordStrength = 0 | 1 | 2 | 3 | 4;

const SEGMENT_COUNT = 4;

/**
 * Returns a 0..4 strength score:
 *   * 0 — empty
 *   * 1 — very weak: fewer than 6 chars
 *   * 2 — weak: 6–7 chars, OR 8+ chars missing letter/digit complexity
 *   * 3 — good: 8+ chars with at least one letter and one digit
 *   * 4 — strong: 12+ chars with letter + digit + special character
 *
 * Exposed for unit tests and to keep the meter and `Validators.password`
 * speaking the same language.
 */
export function scorePassword(password: string): PasswordStrength {
  if (!password) {
    return 0;
  }
  if (password.length < 6) {
    return 1;
  }
  const hasLetter = /[A-Za-z]/.test(password);
  const hasDigit = /\d/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);
  if (password.length < 8 || !hasLetter || !hasDigit) {
    return 2;
  }
  if (password.length >= 12 && hasSpecial) {
    return 4;
  }
  return 3;
}

const LABEL: Record<PasswordStrength, string> = {
  0: ' ',
  1: 'Very weak',
  2: 'Weak',
  3: 'Good',
  4: 'Strong',
};

function colorFor(score: PasswordStrength): string {
  switch (score) {
    case 1:
      return AppColors.error;
    case 2:
      return AppColors.warning;
    case 3:
    case 4:
      return AppColors.success;
    default:
      return AppColors.divider;
  }
}

export type PasswordStrengthMeterProps = {
  password: string;
};

/**
 * 4-segment strength meter — purely presentational. Pair with a `TextField`
 * for the `Password` slot and pass the same value through.
 */
function PasswordStrengthMeter({ password }: PasswordStrengthMeterProps): React.ReactElement {
  const score = useMemo(() => scorePassword(password), [password]);
  const litColor = colorFor(score);

  return (
    <View accessibilityLabel={`Password strength: ${LABEL[score]}`}>
      <View style={styles.row}>
        {Array.from({ length: SEGMENT_COUNT }).map((_, i) => (
          <View
            key={i}
            style={[styles.segment, { backgroundColor: i < score ? litColor : AppColors.divider }]}
          />
        ))}
      </View>
      <Text style={[styles.label, { color: score === 0 ? AppColors.transparent : litColor }]}>
        {score === 0 ? ' ' : `Strength: ${LABEL[score]}`}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: AppSpacing.xs },
  segment: {
    flex: 1,
    height: 4,
    borderRadius: AppRadii.sm,
  },
  label: {
    ...AppTypography.labelSmall,
    marginTop: AppSpacing.xs,
  },
});

export default PasswordStrengthMeter;
