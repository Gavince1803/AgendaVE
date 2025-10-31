import React, { useMemo, useState } from 'react';
import {
  Animated,
  StyleSheet,
  TouchableOpacity,
  TouchableOpacityProps,
  View,
  ViewStyle,
  StyleProp,
} from 'react-native';

import { Theme, useTheme } from '@/theme';

type CardVariant =
  | 'default'
  | 'elevated'
  | 'outlined'
  | 'glass'
  | 'gradient'
  | 'wellness'
  | 'premium'
  | 'soft';

type CardPadding = 'none' | 'small' | 'medium' | 'large' | 'xl';
type CardShadow = 'none' | 'sm' | 'md' | 'lg' | 'xl';

interface CardProps extends TouchableOpacityProps {
  children: React.ReactNode;
  variant?: CardVariant;
  padding?: CardPadding;
  style?: StyleProp<ViewStyle>;
  rounded?: boolean;
  shadow?: CardShadow;
  borderColor?: string;
  backgroundColor?: string;
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
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [scaleValue] = useState(new Animated.Value(1));

  const cardBackgroundColor =
    backgroundColor || getBackgroundColor(theme, variant);
  const cardBorderColor = borderColor || getBorderColor(theme, variant);

  const paddingKeyMap: Record<CardPadding, keyof CardStyles> = {
    none: 'paddingNone',
    small: 'paddingSmall',
    medium: 'paddingMedium',
    large: 'paddingLarge',
    xl: 'paddingXl',
  };

  const shadowKeyMap: Record<CardShadow, keyof CardStyles> = {
    none: 'shadowNone',
    sm: 'shadowSm',
    md: 'shadowMd',
    lg: 'shadowLg',
    xl: 'shadowXl',
  };

  const cardStyle: StyleProp<ViewStyle> = [
    styles.base,
    { backgroundColor: cardBackgroundColor, borderColor: cardBorderColor },
    styles[variant],
    styles[paddingKeyMap[padding]],
    styles[shadowKeyMap[shadow]],
    rounded ? styles.rounded : undefined,
    style,
  ];

  const animatedStyle = useMemo(
    () => ({
      transform: [{ scale: scaleValue }],
    }),
    [scaleValue],
  );

  const handlePressIn = () => {
    if (!onPress) return;
    Animated.spring(scaleValue, {
      toValue: 0.98,
      useNativeDriver: true,
      tension: 300,
      friction: 10,
    }).start();
  };

  const handlePressOut = () => {
    if (!onPress) return;
    Animated.spring(scaleValue, {
      toValue: 1,
      useNativeDriver: true,
      tension: 300,
      friction: 10,
    }).start();
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

function getBackgroundColor(theme: Theme, variant: CardVariant) {
  switch (variant) {
    case 'wellness':
      return '#f0fdfa';
    case 'premium':
      return '#faf5ff';
    case 'soft':
      return '#f8fafc';
    case 'glass':
      return 'rgba(255, 255, 255, 0.8)';
    default:
      return theme.components.surface;
  }
}

function getBorderColor(theme: Theme, variant: CardVariant) {
  switch (variant) {
    case 'wellness':
      return '#ccfbf1';
    case 'premium':
      return '#f3e8ff';
    case 'soft':
      return '#e2e8f0';
    case 'glass':
      return 'rgba(255, 255, 255, 0.2)';
    default:
      return theme.components.border;
  }
}

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

type CardStyles = {
  base: ViewStyle;
  default: ViewStyle;
  elevated: ViewStyle;
  outlined: ViewStyle;
  glass: ViewStyle;
  gradient: ViewStyle;
  wellness: ViewStyle;
  premium: ViewStyle;
  soft: ViewStyle;
  paddingNone: ViewStyle;
  paddingSmall: ViewStyle;
  paddingMedium: ViewStyle;
  paddingLarge: ViewStyle;
  paddingXl: ViewStyle;
  shadowNone: ViewStyle;
  shadowSm: ViewStyle;
  shadowMd: ViewStyle;
  shadowLg: ViewStyle;
  shadowXl: ViewStyle;
  rounded: ViewStyle;
};

function createStyles(theme: Theme) {
  const { tokens, components } = theme;

  return StyleSheet.create<CardStyles>({
    base: {
      borderRadius: tokens.radius.xl,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: components.border,
      backgroundColor: components.surface,
    },
    default: {
      borderWidth: 1,
    },
    elevated: {
      ...tokens.elevation.md,
    },
    outlined: {
      borderWidth: 1.5,
    },
    glass: {
      backgroundColor: 'rgba(255, 255, 255, 0.8)',
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.2)',
    },
    gradient: {
      backgroundColor: 'transparent',
    },
    wellness: {
      borderWidth: 1,
      ...tokens.elevation.sm,
    },
    premium: {
      borderWidth: 1,
      ...tokens.elevation.md,
    },
    soft: {
      borderWidth: 1,
      ...tokens.elevation.sm,
    },
    paddingNone: {
      padding: 0,
    },
    paddingSmall: {
      padding: tokens.spacing.md,
    },
    paddingMedium: {
      padding: tokens.spacing.xl,
    },
    paddingLarge: {
      padding: tokens.spacing['2xl'],
    },
    paddingXl: {
      padding: tokens.spacing['3xl'],
    },
    shadowNone: {
      ...tokens.elevation.none,
    },
    shadowSm: {
      ...tokens.elevation.sm,
    },
    shadowMd: {
      ...tokens.elevation.md,
    },
    shadowLg: {
      ...tokens.elevation.lg,
    },
    shadowXl: {
      ...tokens.elevation.xl,
    },
    rounded: {
      borderRadius: tokens.radius.full,
    },
  });
}
