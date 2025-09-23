import { ComponentColors, DesignTokens } from '@/constants/Colors';
import React, { useState } from 'react';
import {
    Animated,
    StyleSheet,
    TouchableOpacity,
    TouchableOpacityProps,
    View,
    ViewStyle,
} from 'react-native';

interface CardProps extends TouchableOpacityProps {
  children: React.ReactNode;
  variant?: 'default' | 'elevated' | 'outlined' | 'glass' | 'gradient' | 'wellness' | 'premium' | 'soft';
  padding?: 'none' | 'small' | 'medium' | 'large' | 'xl';
  onPress?: () => void;
  style?: ViewStyle;
  rounded?: boolean;
  shadow?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  borderColor?: string;
  backgroundColor?: string;
}

// Helper functions for dynamic styling
function getBackgroundColor(variant: string): string {
  switch (variant) {
    case 'wellness':
      return '#f0fdfa'; // mint background
    case 'premium':
      return '#faf5ff'; // lavender background
    case 'soft':
      return '#f8fafc'; // soft gray background
    case 'glass':
      return 'rgba(255, 255, 255, 0.8)';
    default:
      return ComponentColors.surface;
  }
}

function getBorderColor(variant: string): string {
  switch (variant) {
    case 'wellness':
      return '#ccfbf1'; // light mint
    case 'premium':
      return '#f3e8ff'; // light lavender
    case 'soft':
      return '#e2e8f0'; // light gray
    case 'glass':
      return 'rgba(255, 255, 255, 0.2)';
    default:
      return ComponentColors.border;
  }
}

export function Card({
  children,
  variant = 'default',
  padding = 'medium',
  onPress,
  style,
  rounded = false,
  shadow = 'md',
  borderColor,
  backgroundColor,
  ...props
}: CardProps) {
  const [scaleValue] = useState(new Animated.Value(1));
  
  // Colores dinámicos basados en variant o props
  const cardBackgroundColor = backgroundColor || getBackgroundColor(variant);
  const cardBorderColor = borderColor || getBorderColor(variant);

  const handlePressIn = () => {
    if (onPress) {
      Animated.spring(scaleValue, {
        toValue: 0.98,
        useNativeDriver: true,
        tension: 300,
        friction: 10,
      }).start();
    }
  };

  const handlePressOut = () => {
    if (onPress) {
      Animated.spring(scaleValue, {
        toValue: 1,
        useNativeDriver: true,
        tension: 300,
        friction: 10,
      }).start();
    }
  };

  const cardStyle = [
    styles.base,
    { backgroundColor: cardBackgroundColor, borderColor: cardBorderColor },
    styles[variant],
    styles[`padding${padding.charAt(0).toUpperCase() + padding.slice(1)}`],
    styles[`shadow${shadow.charAt(0).toUpperCase() + shadow.slice(1)}`],
    rounded && styles.rounded,
    style,
  ];

  const animatedStyle = {
    transform: [{ scale: scaleValue }],
  };

  if (onPress) {
    return (
      <Animated.View style={animatedStyle}>
        <TouchableOpacity
          style={cardStyle}
          onPress={onPress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          activeOpacity={0.95}
          {...props}
        >
          {children}
        </TouchableOpacity>
      </Animated.View>
    );
  }

  return (
    <View style={cardStyle} {...props}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: DesignTokens.radius.xl,
    overflow: 'hidden',
  },
  
  // Variantes
  default: {
    borderWidth: 1,
  },
  elevated: {
    // backgroundColor se maneja dinámicamente
  },
  outlined: {
    borderWidth: 1.5,
  },
  glass: {
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    backdropFilter: 'blur(10px)',
  },
  gradient: {
    backgroundColor: 'transparent',
  },
  wellness: {
    borderWidth: 1,
    ...DesignTokens.elevation.sm,
  },
  premium: {
    borderWidth: 1,
    ...DesignTokens.elevation.md,
  },
  soft: {
    borderWidth: 1,
    ...DesignTokens.elevation.sm,
  },
  
  // Padding
  paddingNone: {
    padding: 0,
  },
  paddingSmall: {
    padding: 16,
  },
  paddingMedium: {
    padding: DesignTokens.spacing.xl,
  },
  paddingLarge: {
    padding: DesignTokens.spacing['2xl'],
  },
  paddingXl: {
    padding: DesignTokens.spacing['3xl'],
  },
  
  // Sombras
  shadowNone: {
    ...DesignTokens.elevation.none,
  },
  shadowSm: {
    shadowColor: ComponentColors.card.shadow,
    ...DesignTokens.elevation.sm,
  },
  shadowMd: {
    shadowColor: ComponentColors.card.shadow,
    ...DesignTokens.elevation.md,
  },
  shadowLg: {
    shadowColor: ComponentColors.card.shadow,
    ...DesignTokens.elevation.lg,
  },
  shadowXl: {
    shadowColor: ComponentColors.card.shadow,
    ...DesignTokens.elevation.xl,
  },
  
  // Bordes redondeados
  rounded: {
    borderRadius: DesignTokens.radius['3xl'],
  },
});
