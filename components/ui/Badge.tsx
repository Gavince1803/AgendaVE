import { Colors, ComponentColors, DesignTokens } from '@/constants/Colors';
import React from 'react';
import {
    StyleSheet,
    Text,
    View,
    ViewStyle,
} from 'react-native';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info';
  size?: 'small' | 'medium' | 'large';
  rounded?: boolean;
  style?: ViewStyle;
}

export function Badge({
  children,
  variant = 'primary',
  size = 'medium',
  rounded = false,
  style,
}: BadgeProps) {
  const badgeStyle = [
    styles.base,
    styles[variant],
    styles[size],
    rounded && styles.rounded,
    style,
  ];

  const textStyle = [
    styles.text,
    styles[`${variant}Text`],
    styles[`${size}Text`],
  ];

  return (
    <View style={badgeStyle}>
      <Text style={textStyle}>{children}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    alignSelf: 'flex-start',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: DesignTokens.radius.md,
  },
  
  // Variantes
  primary: {
    backgroundColor: ComponentColors.badge.primary,
  },
  secondary: {
    backgroundColor: ComponentColors.badge.secondary,
  },
  success: {
    backgroundColor: ComponentColors.badge.success,
  },
  warning: {
    backgroundColor: ComponentColors.badge.warning,
  },
  error: {
    backgroundColor: ComponentColors.badge.error,
  },
  info: {
    backgroundColor: Colors.light.infoBg,
  },
  
  // Tamaños
  small: {
    paddingHorizontal: DesignTokens.spacing.sm,
    paddingVertical: DesignTokens.spacing.xs,
    minHeight: 20,
  },
  medium: {
    paddingHorizontal: DesignTokens.spacing.md,
    paddingVertical: DesignTokens.spacing.sm,
    minHeight: 24,
  },
  large: {
    paddingHorizontal: 16,
    paddingVertical: DesignTokens.spacing.md,
    minHeight: 28,
  },
  
  // Bordes redondeados
  rounded: {
    borderRadius: DesignTokens.radius.full,
  },
  
  // Texto
  text: {
    fontWeight: DesignTokens.typography.fontWeights.medium,
    textAlign: 'center',
  },
  primaryText: {
    color: Colors.light.primary,
  },
  secondaryText: {
    color: Colors.light.textSecondary,
  },
  successText: {
    color: Colors.light.success,
  },
  warningText: {
    color: Colors.light.warning,
  },
  errorText: {
    color: Colors.light.error,
  },
  infoText: {
    color: Colors.light.info,
  },
  
  // Tamaños de texto
  smallText: {
    fontSize: DesignTokens.typography.fontSizes.xs,
  },
  mediumText: {
    fontSize: DesignTokens.typography.fontSizes.sm,
  },
  largeText: {
    fontSize: DesignTokens.typography.fontSizes.base,
  },
});
