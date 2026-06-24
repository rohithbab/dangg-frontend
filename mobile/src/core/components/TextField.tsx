import React, { forwardRef, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, type TextInputProps, View } from 'react-native';

import { AppColors } from '@theme/colors';
import { AppRadii } from '@theme/radii';
import { AppSpacing } from '@theme/spacing';
import { AppTypography, InterFont } from '@theme/typography';

export type TextFieldProps = Omit<TextInputProps, 'style'> & {
  label?: string;
  hint?: string;
  helperText?: string;
  errorText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  /** Render a password show/hide eye and toggle internal `secureTextEntry`. */
  passwordToggle?: boolean;
  /** Show a character counter when `maxLength` is set. */
  showCounter?: boolean;
  containerTestID?: string;
};

/**
 * Themed text input with label, hint, error display, optional password
 * show/hide, and character counter.
 *
 * `value` and `onChangeText` are owned by the caller — pair with
 * `react-hook-form`'s `Controller` for form integration.
 */
function TextFieldInner(
  {
    label,
    hint,
    helperText,
    errorText,
    leftIcon,
    rightIcon,
    passwordToggle = false,
    showCounter = false,
    secureTextEntry,
    maxLength,
    value,
    containerTestID,
    ...rest
  }: TextFieldProps,
  ref: React.Ref<TextInput>,
): React.ReactElement {
  const [internalSecure, setInternalSecure] = useState(passwordToggle ? true : !!secureTextEntry);
  const [focused, setFocused] = useState(false);
  const isError = !!errorText;
  const length = (value ?? '').length;

  const onFocus: TextInputProps['onFocus'] = e => {
    setFocused(true);
    rest.onFocus?.(e);
  };
  const onBlur: TextInputProps['onBlur'] = e => {
    setFocused(false);
    rest.onBlur?.(e);
  };

  return (
    <View testID={containerTestID}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View
        style={[
          styles.fieldRow,
          focused && styles.fieldRowFocused,
          isError && styles.fieldRowError,
        ]}
      >
        {leftIcon ? <View style={styles.iconLeft}>{leftIcon}</View> : null}
        <TextInput
          ref={ref}
          {...rest}
          value={value}
          maxLength={maxLength}
          placeholder={hint}
          placeholderTextColor={AppColors.onSurfaceMuted}
          secureTextEntry={passwordToggle ? internalSecure : secureTextEntry}
          onFocus={onFocus}
          onBlur={onBlur}
          style={styles.input}
        />
        {passwordToggle ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={internalSecure ? 'Show password' : 'Hide password'}
            onPress={() => setInternalSecure(prev => !prev)}
            hitSlop={12}
            style={styles.iconRight}
          >
            <Text style={styles.toggleText}>{internalSecure ? 'Show' : 'Hide'}</Text>
          </Pressable>
        ) : rightIcon ? (
          <View style={styles.iconRight}>{rightIcon}</View>
        ) : null}
      </View>
      {isError || helperText || (showCounter && maxLength) ? (
        <View style={styles.metaRow}>
          <Text style={[styles.meta, isError && styles.metaError]} numberOfLines={1}>
            {errorText ?? helperText ?? ''}
          </Text>
          {showCounter && maxLength ? (
            <Text style={styles.counter}>{`${length}/${maxLength}`}</Text>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    fontFamily: InterFont.medium,
    fontSize: 11.5,
    letterSpacing: 0.7,
    textTransform: 'uppercase',
    color: '#6B6B73',
    marginBottom: AppSpacing.sm,
  },
  fieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0E0E10',
    borderRadius: AppRadii.lg,
    borderWidth: 1,
    borderColor: AppColors.border,
    paddingHorizontal: AppSpacing.md,
    minHeight: 58,
  },
  fieldRowFocused: { borderColor: AppColors.primary, borderWidth: 1.5 },
  fieldRowError: { borderColor: AppColors.error, borderWidth: 1.5 },
  iconLeft: { marginRight: AppSpacing.sm },
  iconRight: { marginLeft: AppSpacing.sm },
  input: {
    fontFamily: InterFont.medium,
    fontSize: 16.5,
    flex: 1,
    alignSelf: 'stretch',
    paddingVertical: 0,
    textAlignVertical: 'center',
    color: AppColors.onSurface,
  },
  toggleText: {
    ...AppTypography.labelSmall,
    color: AppColors.primary,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: AppSpacing.xs,
    minHeight: 16,
  },
  meta: {
    ...AppTypography.labelSmall,
    color: AppColors.onSurfaceMuted,
    flexShrink: 1,
  },
  metaError: { color: AppColors.error },
  counter: {
    ...AppTypography.labelSmall,
    color: AppColors.onSurfaceMuted,
    marginLeft: AppSpacing.sm,
  },
});

const TextField = forwardRef<TextInput, TextFieldProps>(TextFieldInner);
TextField.displayName = 'TextField';

export default TextField;
