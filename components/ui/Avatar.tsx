import { Colors, DesignTokens } from '@/constants/Colors';
import React from 'react';
import {
    Image,
    ImageSourcePropType,
    StyleSheet,
    Text,
    View,
    ViewStyle,
} from 'react-native';

interface AvatarProps {
  source?: ImageSourcePropType;
  name?: string;
  size?: 'small' | 'medium' | 'large' | 'xl';
  variant?: 'circle' | 'rounded' | 'square';
  backgroundColor?: string;
  textColor?: string;
  style?: ViewStyle;
}

export function Avatar({
  source,
  name,
  size = 'medium',
  variant = 'circle',
  backgroundColor,
  textColor,
  style,
}: AvatarProps) {
  const avatarStyle = [
    styles.base,
    styles[size],
    styles[variant],
    backgroundColor && { backgroundColor },
    style,
  ];

  const textStyle = [
    styles.text,
    styles[`${size}Text`],
    textColor && { color: textColor },
  ];

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <View style={avatarStyle}>
      {source ? (
        <Image source={source} style={styles.image} />
      ) : name ? (
        <Text style={textStyle}>{getInitials(name)}</Text>
      ) : (
        <Text style={textStyle}>?</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.light.surfaceVariant,
    overflow: 'hidden',
  },
  
  // Tamaños
  small: {
    width: 32,
    height: 32,
  },
  medium: {
    width: 40,
    height: 40,
  },
  large: {
    width: 56,
    height: 56,
  },
  xl: {
    width: 80,
    height: 80,
  },
  
  // Variantes
  circle: {
    borderRadius: DesignTokens.radius.full,
  },
  rounded: {
    borderRadius: DesignTokens.radius.lg,
  },
  square: {
    borderRadius: DesignTokens.radius.sm,
  },
  
  // Imagen
  image: {
    width: '100%',
    height: '100%',
  },
  
  // Texto
  text: {
    fontWeight: DesignTokens.typography.fontWeights.semibold,
    color: Colors.light.textSecondary,
    textAlign: 'center',
  },
  smallText: {
    fontSize: DesignTokens.typography.fontSizes.xs,
  },
  mediumText: {
    fontSize: DesignTokens.typography.fontSizes.sm,
  },
  largeText: {
    fontSize: DesignTokens.typography.fontSizes.lg,
  },
  xlText: {
    fontSize: DesignTokens.typography.fontSizes['2xl'],
  },
});
