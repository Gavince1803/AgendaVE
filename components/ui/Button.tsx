import { Colors, ComponentColors, DesignTokens, Gradients } from '@/constants/Colors';
import React, { useState } from 'react';
import {
    Animated,
    StyleSheet,
    Text,
    TouchableOpacity,
    TouchableOpacityProps,
    StyleProp,
    ViewStyle,
    TextStyle
} from 'react-native';
import { LoadingSpinner } from './LoadingSpinner';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'success' | 'warning' | 'error' | 'wellness' | 'premium' | 'soft';
type ButtonSize = 'small' | 'medium' | 'large' | 'xl';

interface ButtonProps extends TouchableOpacityProps {
  title: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  icon?: React.ReactNode;
  leftIcon?: React.ReactNode; // Alias for icon with left position
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
  // Use leftIcon as icon if provided
  const actualIcon = leftIcon || icon;
  const [scaleValue] = useState(new Animated.Value(1));
  const [isPressed, setIsPressed] = useState(false);

  const handlePressIn = () => {
    setIsPressed(true);
    Animated.spring(scaleValue, {
      toValue: 0.96,
      useNativeDriver: true,
      tension: 300,
      friction: 10,
    }).start();
  };

  const handlePressOut = () => {
    setIsPressed(false);
    Animated.spring(scaleValue, {
      toValue: 1,
      useNativeDriver: true,
      tension: 300,
      friction: 10,
    }).start();
  };

  const buttonStyle: StyleProp<ViewStyle> = [
    styles.base,
    styles[variant] as ViewStyle,
    styles[size] as ViewStyle,
    fullWidth ? styles.fullWidth : undefined,
    rounded ? styles.rounded : undefined,
    elevated ? styles.elevated : undefined,
    gradient ? styles.gradient : undefined,
    (disabled || loading) ? styles.disabled : undefined,
    style,
  ];

  const textStyle: StyleProp<TextStyle> = [
    styles.text,
    styles[`${variant}Text`] as TextStyle,
    styles[`${size}Text`] as TextStyle,
    (disabled || loading) ? styles.disabledText : undefined,
  ];

  const animatedStyle = {
    transform: [{ scale: scaleValue }],
  };

  return (
    <Animated.View style={[animatedStyle, fullWidth ? styles.fullWidthContainer : undefined]}>
      <TouchableOpacity
        style={buttonStyle}
        disabled={disabled || loading}
        activeOpacity={0.9}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={props.onPress}
        {...props}
      >
        {loading ? (
          <LoadingSpinner 
            color={getLoadingColor(variant)} 
            size="small" 
          />
        ) : (
          <>
            {actualIcon && iconPosition === 'left' && (
              <>{actualIcon}</>
            )}
            <Text style={textStyle}>{title}</Text>
            {actualIcon && iconPosition === 'right' && (
              <>{actualIcon}</>
            )}
          </>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

// Función helper para obtener el color del loading indicator
function getLoadingColor(variant: string): string {
  switch (variant) {
    case 'primary':
    case 'success':
    case 'warning':
    case 'error':
      return '#ffffff';
    case 'secondary':
    case 'outline':
    case 'ghost':
    default:
      return Colors.light.primary;
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

const styles = StyleSheet.create<ButtonStyles>({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: DesignTokens.radius.lg,
    borderWidth: 1,
    borderColor: 'transparent',
    ...DesignTokens.elevation.sm,
  },
  
  // Variantes
  primary: {
    backgroundColor: ComponentColors.button.primary,
    shadowColor: ComponentColors.button.primary,
    ...DesignTokens.elevation.md,
  },
  secondary: {
    backgroundColor: ComponentColors.button.secondary,
    borderColor: Colors.light.borderMedium,
  },
  outline: {
    backgroundColor: 'transparent',
    borderColor: ComponentColors.button.primary,
    borderWidth: 1.5,
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  success: {
    backgroundColor: ComponentColors.button.success,
    shadowColor: ComponentColors.button.success,
    ...DesignTokens.elevation.md,
  },
  warning: {
    backgroundColor: ComponentColors.button.warning,
    shadowColor: ComponentColors.button.warning,
    ...DesignTokens.elevation.md,
  },
  error: {
    backgroundColor: ComponentColors.button.error,
    shadowColor: ComponentColors.button.error,
    ...DesignTokens.elevation.md,
  },
  wellness: {
    backgroundColor: '#14b8a6', // mint
    shadowColor: '#14b8a6',
    ...DesignTokens.elevation.md,
  },
  premium: {
    backgroundColor: '#a855f7', // lavender
    shadowColor: '#a855f7',
    ...DesignTokens.elevation.lg,
  },
  soft: {
    backgroundColor: '#f1f5f9',
    borderColor: '#e2e8f0',
    borderWidth: 1,
  },
  
  // Tamaños
  small: {
    paddingHorizontal: 16,
    paddingVertical: DesignTokens.spacing.sm,
    minHeight: 36,
    borderRadius: DesignTokens.radius.md,
  },
  medium: {
    paddingHorizontal: DesignTokens.spacing.xl,
    paddingVertical: DesignTokens.spacing.md,
    minHeight: 44,
    borderRadius: DesignTokens.radius.lg,
  },
  large: {
    paddingHorizontal: DesignTokens.spacing['2xl'],
    paddingVertical: 16,
    minHeight: 52,
    borderRadius: DesignTokens.radius.xl,
  },
  xl: {
    paddingHorizontal: DesignTokens.spacing['3xl'],
    paddingVertical: DesignTokens.spacing.xl,
    minHeight: 60,
    borderRadius: DesignTokens.radius['2xl'],
  },
  
  // Estados
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
    borderRadius: DesignTokens.radius.full,
  },
  elevated: {
    ...DesignTokens.elevation.lg,
    transform: [{ translateY: -1 }],
  },
  gradient: {
    // Los gradientes se manejarán con LinearGradient en una versión futura
    ...DesignTokens.elevation.lg,
  },
  
  // Texto
  text: {
    fontWeight: DesignTokens.typography.fontWeights.semibold as TextStyle['fontWeight'],
    textAlign: 'center',
    letterSpacing: 0.2,
  },
  primaryText: {
    color: Colors.light.textOnPrimary,
  },
  secondaryText: {
    color: Colors.light.text,
  },
  outlineText: {
    color: ComponentColors.button.primary,
  },
  ghostText: {
    color: ComponentColors.button.primary,
  },
  successText: {
    color: Colors.light.textOnPrimary,
  },
  warningText: {
    color: Colors.light.textOnPrimary,
  },
  errorText: {
    color: Colors.light.textOnPrimary,
  },
  wellnessText: {
    color: Colors.light.textOnPrimary,
  },
  premiumText: {
    color: Colors.light.textOnPrimary,
  },
  softText: {
    color: Colors.light.text,
  },
  
  // Tamaños de texto
  smallText: {
    fontSize: DesignTokens.typography.fontSizes.sm,
  },
  mediumText: {
    fontSize: DesignTokens.typography.fontSizes.base,
  },
  largeText: {
    fontSize: DesignTokens.typography.fontSizes.lg,
  },
  xlText: {
    fontSize: DesignTokens.typography.fontSizes.xl,
  },
  
  disabledText: {
    opacity: 0.6,
  },
});
