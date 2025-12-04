import React, { useMemo, useState } from 'react';
import {
  Animated,
  StyleProp,
  StyleSheet,
  Text,
  TextStyle,
  TouchableOpacity,
  TouchableOpacityProps,
  ViewStyle,
} from 'react-native';

import { Colors } from '@/constants/Colors';
import { Theme, useTheme } from '@/theme';
import { LoadingSpinner } from './LoadingSpinner';

type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'outline'
  | 'ghost'
  | 'success'
  | 'warning'
  | 'error'
  | 'wellness'
  | 'premium'
  | 'soft';

type ButtonSize = 'small' | 'medium' | 'large' | 'xl';

interface ButtonProps extends TouchableOpacityProps {
  title: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  icon?: React.ReactNode;
  leftIcon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  gradient?: boolean | 'primary' | 'wellness' | 'premium' | 'soft';
  rounded?: boolean;
  elevated?: boolean;
}

export function Button({
  title,
  variant = 'primary',
  size = 'medium',
  loading = false,
  disabled = false,
  fullWidth = false,
  icon,
  leftIcon,
  iconPosition = 'left',
  gradient = false,
  rounded = false,
  elevated = false,
  style,
  ...props
}: ButtonProps) {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const actualIcon = leftIcon || icon;
  const [scaleValue] = useState(new Animated.Value(1));

  const handlePressIn = () => {
    Animated.spring(scaleValue, {
      toValue: 0.96,
      useNativeDriver: true,
      tension: 300,
      friction: 10,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleValue, {
      toValue: 1,
      useNativeDriver: true,
      tension: 300,
      friction: 10,
    }).start();
  };

  const buttonStyle: StyleProp<ViewStyle> = [
    styles.base,
    styles[variant],
    styles[size],
    fullWidth ? styles.fullWidth : undefined,
    rounded ? styles.rounded : undefined,
    elevated ? styles.elevated : undefined,
    gradient ? styles.gradient : undefined,
    (disabled || loading) ? styles.disabled : undefined,
    style,
  ];

  const textStyle: StyleProp<TextStyle> = [
    styles.text,
    styles[`${variant}Text`],
    styles[`${size}Text`],
    (disabled || loading) ? styles.disabledText : undefined,
  ];

  const animatedStyle = useMemo(
    () => ({
      transform: [{ scale: scaleValue }],
    }),
    [scaleValue],
  );

  return (
    <Animated.View style={[animatedStyle, fullWidth ? styles.fullWidthContainer : undefined]}>
      <TouchableOpacity
        style={buttonStyle}
        disabled={disabled || loading}
        activeOpacity={0.9}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        {...props}
      >
        {loading ? (
          <LoadingSpinner color={getLoadingColor(theme, variant)} size="small" />
        ) : (
          <>
            {actualIcon && iconPosition === 'left' && actualIcon}
            <Text style={textStyle}>{title}</Text>
            {actualIcon && iconPosition === 'right' && actualIcon}
          </>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

function getLoadingColor(theme: Theme, variant: ButtonVariant): string {
  switch (variant) {
    case 'primary':
    case 'success':
    case 'warning':
    case 'error':
    case 'premium':
    case 'wellness':
      return theme.colors.textOnPrimary;
    default:
      return theme.colors.primary;
  }
}

type ButtonStyles = {
  base: ViewStyle;
  primary: ViewStyle;
  secondary: ViewStyle;
  outline: ViewStyle;
  ghost: ViewStyle;
  success: ViewStyle;
  warning: ViewStyle;
  error: ViewStyle;
  wellness: ViewStyle;
  premium: ViewStyle;
  soft: ViewStyle;
  small: ViewStyle;
  medium: ViewStyle;
  large: ViewStyle;
  xl: ViewStyle;
  disabled: ViewStyle;
  fullWidth: ViewStyle;
  fullWidthContainer: ViewStyle;
  rounded: ViewStyle;
  elevated: ViewStyle;
  gradient: ViewStyle;
  text: TextStyle;
  primaryText: TextStyle;
  secondaryText: TextStyle;
  outlineText: TextStyle;
  ghostText: TextStyle;
  successText: TextStyle;
  warningText: TextStyle;
  errorText: TextStyle;
  wellnessText: TextStyle;
  premiumText: TextStyle;
  softText: TextStyle;
  smallText: TextStyle;
  mediumText: TextStyle;
  largeText: TextStyle;
  xlText: TextStyle;
  disabledText: TextStyle;
};

function createStyles(theme: Theme) {
  const { tokens, colors, components } = theme;

  return StyleSheet.create<ButtonStyles>({
    base: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: tokens.radius.lg,
      borderWidth: 1,
      borderColor: 'transparent',
      ...tokens.elevation.sm,
      gap: tokens.spacing.xs,
    },
    primary: {
      backgroundColor: components.button.primary,
      shadowColor: components.button.primary,
      ...tokens.elevation.md,
    },
    secondary: {
      backgroundColor: components.button.secondary,
      borderColor: colors.border,
    },
    outline: {
      backgroundColor: 'transparent',
      borderColor: components.button.primary,
      borderWidth: 1.5,
    },
    ghost: {
      backgroundColor: 'transparent',
    },
    success: {
      backgroundColor: components.button.success,
      shadowColor: components.button.success,
      ...tokens.elevation.md,
    },
    warning: {
      backgroundColor: components.button.warning,
      shadowColor: components.button.warning,
      ...tokens.elevation.md,
    },
    error: {
      backgroundColor: components.button.error,
      shadowColor: components.button.error,
      ...tokens.elevation.md,
    },
    wellness: {
      backgroundColor: Colors.light.success,
      shadowColor: Colors.light.success,
      ...tokens.elevation.md,
    },
    premium: {
      backgroundColor: Colors.light.accent,
      shadowColor: Colors.light.accent,
      ...tokens.elevation.lg,
    },
    soft: {
      backgroundColor: Colors.light.surfaceVariant,
      borderColor: Colors.light.border,
      borderWidth: 1,
    },
    small: {
      paddingHorizontal: tokens.spacing.lg,
      paddingVertical: tokens.spacing.sm,
      minHeight: 36,
      borderRadius: tokens.radius.md,
    },
    medium: {
      paddingHorizontal: tokens.spacing.xl,
      paddingVertical: tokens.spacing.md,
      minHeight: 44,
      borderRadius: tokens.radius.lg,
    },
    large: {
      paddingHorizontal: tokens.spacing['2xl'],
      paddingVertical: tokens.spacing.lg,
      minHeight: 52,
      borderRadius: tokens.radius.xl,
    },
    xl: {
      paddingHorizontal: tokens.spacing['3xl'],
      paddingVertical: tokens.spacing.xl,
      minHeight: 60,
      borderRadius: tokens.radius['2xl'],
    },
    disabled: {
      opacity: 0.5,
    },
    fullWidth: {
      width: '100%',
    },
    fullWidthContainer: {
      width: '100%',
    },
    rounded: {
      borderRadius: tokens.radius.full,
    },
    elevated: {
      ...tokens.elevation.lg,
      transform: [{ translateY: -1 }],
    },
    gradient: {
      ...tokens.elevation.lg,
    },
    text: {
      fontWeight: tokens.typography.fontWeights.semibold as TextStyle['fontWeight'],
      textAlign: 'center',
      letterSpacing: 0.2,
    },
    primaryText: {
      color: colors.textOnPrimary,
    },
    secondaryText: {
      color: colors.text,
    },
    outlineText: {
      color: components.button.primary,
    },
    ghostText: {
      color: components.button.primary,
    },
    successText: {
      color: colors.textOnPrimary,
    },
    warningText: {
      color: colors.textOnPrimary,
    },
    errorText: {
      color: colors.textOnPrimary,
    },
    wellnessText: {
      color: colors.textOnPrimary,
    },
    premiumText: {
      color: colors.textOnPrimary,
    },
    softText: {
      color: colors.text,
    },
    smallText: {
      fontSize: tokens.typography.fontSizes.sm,
    },
    mediumText: {
      fontSize: tokens.typography.fontSizes.base,
    },
    largeText: {
      fontSize: tokens.typography.fontSizes.lg,
    },
    xlText: {
      fontSize: tokens.typography.fontSizes.xl,
    },
    disabledText: {
      opacity: 0.6,
    },
  });
}
