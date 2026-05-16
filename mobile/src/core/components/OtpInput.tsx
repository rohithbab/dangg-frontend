import React, { useEffect, useImperativeHandle, useRef, useState } from 'react';
import {
  StyleSheet,
  TextInput,
  type TextInputKeyPressEventData,
  type NativeSyntheticEvent,
} from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { AppColors } from '@theme/colors';
import { AppRadii } from '@theme/radii';
import { AppSpacing } from '@theme/spacing';
import { AppTypography } from '@theme/typography';

import { OTP_LENGTH } from '../config/constants';

export type OtpInputProps = {
  /** Defaults to 6. Allowed range is 4..8. */
  length?: number;
  hasError?: boolean;
  autoFocus?: boolean;
  /** Fired when the last box is filled. */
  onCompleted: (code: string) => void;
};

/** External handle for programmatic clear/focus from the parent. */
export type OtpInputHandle = {
  clear: () => void;
  focus: () => void;
  value: () => string;
};

const OtpInput = React.forwardRef<OtpInputHandle, OtpInputProps>(function OtpInput(
  { length = OTP_LENGTH, hasError = false, autoFocus = true, onCompleted },
  ref,
): React.ReactElement {
  const inputs = useRef<Array<TextInput | null>>(Array(length).fill(null));
  const [digits, setDigits] = useState<string[]>(Array(length).fill(''));
  const shake = useSharedValue(0);

  useEffect(() => {
    if (hasError) {
      shake.value = withSequence(
        withTiming(-8, { duration: 60, easing: Easing.linear }),
        withTiming(8, { duration: 60, easing: Easing.linear }),
        withTiming(-6, { duration: 60, easing: Easing.linear }),
        withTiming(6, { duration: 60, easing: Easing.linear }),
        withTiming(0, { duration: 60, easing: Easing.linear }),
      );
    }
  }, [hasError, shake]);

  useImperativeHandle(ref, () => ({
    clear: () => {
      setDigits(Array(length).fill(''));
      inputs.current[0]?.focus();
    },
    focus: () => inputs.current[0]?.focus(),
    value: () => digits.join(''),
  }));

  const handleChange = (index: number, input: string): void => {
    // Paste path — distribute digits across boxes.
    if (input.length > 1) {
      const onlyDigits = input.replace(/\D/g, '').slice(0, length);
      const next = Array(length).fill('');
      for (let i = 0; i < onlyDigits.length; i++) {
        next[i] = onlyDigits[i];
      }
      setDigits(next);
      if (onlyDigits.length >= length) {
        onCompleted(onlyDigits);
      }
      inputs.current[Math.min(onlyDigits.length, length - 1)]?.focus();
      return;
    }

    const digit = input.replace(/\D/g, '').slice(0, 1);
    setDigits(prev => {
      const next = [...prev];
      next[index] = digit;
      if (digit && index < length - 1) {
        inputs.current[index + 1]?.focus();
      }
      if (next.every(d => d.length === 1)) {
        onCompleted(next.join(''));
      }
      return next;
    });
  };

  const handleKeyPress = (
    index: number,
    e: NativeSyntheticEvent<TextInputKeyPressEventData>,
  ): void => {
    if (e.nativeEvent.key === 'Backspace' && digits[index] === '' && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shake.value }],
  }));

  return (
    <Animated.View style={[styles.row, animatedStyle]}>
      {digits.map((value, i) => (
        <TextInput
          key={i}
          ref={el => {
            inputs.current[i] = el;
          }}
          value={value}
          autoFocus={autoFocus && i === 0}
          keyboardType="number-pad"
          textContentType="oneTimeCode"
          autoComplete="one-time-code"
          maxLength={i === 0 ? length : 1}
          textAlign="center"
          onChangeText={text => handleChange(i, text)}
          onKeyPress={e => handleKeyPress(i, e)}
          style={[styles.box, hasError && styles.boxError, value !== '' && styles.boxFilled]}
        />
      ))}
    </Animated.View>
  );
});

OtpInput.displayName = 'OtpInput';

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  box: {
    ...AppTypography.titleLarge,
    width: 46,
    height: 56,
    borderRadius: AppRadii.md,
    borderWidth: 1.5,
    borderColor: AppColors.border,
    backgroundColor: AppColors.surface,
    marginHorizontal: AppSpacing.xs / 2,
    color: AppColors.onSurface,
    paddingVertical: 0,
    textAlign: 'center',
  },
  boxFilled: { borderColor: AppColors.brandPrimary },
  boxError: { borderColor: AppColors.error },
});

export default OtpInput;
