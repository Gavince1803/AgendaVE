import React, { useMemo, useState } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  TouchableOpacity,
  View,
  StyleProp,
  ViewStyle,
  TextStyle,
} from 'react-native';

import { Theme, useTheme } from '@/theme';

type InputVariant = 'default' | 'filled' | 'outlined';
type InputSize = 'small' | 'medium' | 'large';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  onRightIconPress?: () => void;
  containerStyle?: StyleProp<ViewStyle>;
  variant?: InputVariant;
  size?: InputSize;
}

export function Input({
  label,
  error,
  helperText,
  leftIcon,
  rightIcon,
  onRightIconPress,
  containerStyle,
  style,
  variant = 'default',
  size = 'medium',
  ...props
}: InputProps) {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [isFocused, setIsFocused] = useState(false);

  const handleFocus = (
    e: Parameters<NonNullable<TextInputProps['onFocus']>>[0],
  ) => {
    setIsFocused(true);
    props.onFocus?.(e);
  };

  const handleBlur = (
    e: Parameters<NonNullable<TextInputProps['onBlur']>>[0],
  ) => {
    setIsFocused(false);
    props.onBlur?.(e);
  };

  const inputContainerStyle: StyleProp<ViewStyle> = [
    styles.inputContainer,
    styles[variant],
    styles[size],
    isFocused ? styles.inputContainerFocused : undefined,
    error ? styles.inputContainerError : undefined,
    leftIcon ? styles.inputContainerWithLeftIcon : undefined,
    rightIcon ? styles.inputContainerWithRightIcon : undefined,
  ];

  const inputStyle: StyleProp<TextStyle> = [
    styles.input,
    styles[`${size}Input`],
    leftIcon ? styles.inputWithLeftIcon : undefined,
    rightIcon ? styles.inputWithRightIcon : undefined,
    style,
  ];

  const labelStyle: StyleProp<TextStyle> = [
    styles.label,
    styles[`${size}Label`],
    error ? styles.errorLabel : undefined,
  ];

  const helperStyle: StyleProp<TextStyle> = [
    styles.helperText,
    error ? styles.errorText : undefined,
  ];

  return (
    <View style={[styles.container, containerStyle]}>
      {label && <Text style={labelStyle}>{label}</Text>}

      <View style={inputContainerStyle}>
        {leftIcon ? <View style={styles.leftIconContainer}>{leftIcon}</View> : null}

        <TextInput
          style={inputStyle}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholderTextColor={theme.components.input.placeholder}
          {...props}
        />

        {rightIcon ? (
          <TouchableOpacity
            style={styles.rightIconContainer}
            onPress={onRightIconPress}
            disabled={!onRightIconPress}
          >
            {rightIcon}
          </TouchableOpacity>
        ) : null}
      </View>

      {(error || helperText) && (
        <Text style={helperStyle}>
          {error || helperText}
        </Text>
      )}
    </View>
  );
}

type InputStyles = {
  container: ViewStyle;
  label: TextStyle;
  smallLabel: TextStyle;
  mediumLabel: TextStyle;
  largeLabel: TextStyle;
  errorLabel: TextStyle;
  inputContainer: ViewStyle;
  default: ViewStyle;
  filled: ViewStyle;
  outlined: ViewStyle;
  small: ViewStyle;
  medium: ViewStyle;
  large: ViewStyle;
  inputContainerFocused: ViewStyle;
  inputContainerError: ViewStyle;
  inputContainerWithLeftIcon: ViewStyle;
  inputContainerWithRightIcon: ViewStyle;
  input: TextStyle;
  smallInput: TextStyle;
  mediumInput: TextStyle;
  largeInput: TextStyle;
  inputWithLeftIcon: TextStyle;
  inputWithRightIcon: TextStyle;
  leftIconContainer: ViewStyle;
  rightIconContainer: ViewStyle;
  helperText: TextStyle;
  errorText: TextStyle;
};

function createStyles(theme: Theme) {
  const { tokens, colors, components } = theme;

  return StyleSheet.create<InputStyles>({
    container: {
      marginBottom: tokens.spacing.xl,
    },
    label: {
      fontSize: tokens.typography.fontSizes.sm,
      fontWeight: tokens.typography.fontWeights.semibold as TextStyle['fontWeight'],
      color: colors.text,
      marginBottom: tokens.spacing.sm,
      letterSpacing: 0.2,
    },
    smallLabel: {
      fontSize: tokens.typography.fontSizes.xs,
    },
    mediumLabel: {
      fontSize: tokens.typography.fontSizes.sm,
    },
    largeLabel: {
      fontSize: tokens.typography.fontSizes.base,
    },
    errorLabel: {
      color: components.button.error,
    },
    inputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: components.input.background,
      borderWidth: 1,
      borderColor: components.input.border,
      borderRadius: tokens.radius.lg,
    },
    default: {
      backgroundColor: components.input.background,
    },
    filled: {
      backgroundColor: colors.surfaceVariant,
      borderColor: 'transparent',
    },
    outlined: {
      backgroundColor: 'transparent',
      borderWidth: 1.5,
    },
    small: {
      minHeight: 40,
      borderRadius: tokens.radius.md,
    },
    medium: {
      minHeight: 48,
      borderRadius: tokens.radius.lg,
    },
    large: {
      minHeight: 56,
      borderRadius: tokens.radius.xl,
    },
    inputContainerFocused: {
      borderColor: components.input.borderFocused,
      shadowColor: components.input.borderFocused,
      ...tokens.elevation.sm,
    },
    inputContainerError: {
      borderColor: components.button.error,
      shadowColor: components.button.error,
      ...tokens.elevation.sm,
    },
    inputContainerWithLeftIcon: {
      paddingLeft: tokens.spacing.md,
    },
    inputContainerWithRightIcon: {
      paddingRight: tokens.spacing.md,
    },
    input: {
      flex: 1,
      paddingHorizontal: tokens.spacing.lg,
      paddingVertical: tokens.spacing.md,
      fontSize: tokens.typography.fontSizes.base,
      color: colors.text,
      fontWeight: tokens.typography.fontWeights.normal as TextStyle['fontWeight'],
    },
    smallInput: {
      fontSize: tokens.typography.fontSizes.sm,
    },
    mediumInput: {
      fontSize: tokens.typography.fontSizes.base,
    },
    largeInput: {
      fontSize: tokens.typography.fontSizes.lg,
    },
    inputWithLeftIcon: {
      paddingLeft: tokens.spacing.sm,
    },
    inputWithRightIcon: {
      paddingRight: tokens.spacing.sm,
    },
    leftIconContainer: {
      marginRight: tokens.spacing.sm,
    },
    rightIconContainer: {
      marginLeft: tokens.spacing.sm,
      padding: tokens.spacing.xs,
      borderRadius: tokens.radius.sm,
    },
    helperText: {
      fontSize: tokens.typography.fontSizes.xs,
      color: colors.textSecondary,
      marginTop: tokens.spacing.xs,
      fontWeight: tokens.typography.fontWeights.normal as TextStyle['fontWeight'],
    },
    errorText: {
      color: components.button.error,
    },
  });
}
