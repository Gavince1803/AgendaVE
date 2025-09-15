import { Colors, DesignTokens } from '@/constants/Colors';
import React, { useEffect, useRef } from 'react';
import {
    Animated,
    Easing,
    StyleSheet,
    ViewStyle
} from 'react-native';

interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large';
  color?: string;
  style?: ViewStyle;
}

export function LoadingSpinner({
  size = 'medium',
  color = Colors.light.primary,
  style,
}: LoadingSpinnerProps) {
  const spinValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const spin = () => {
      spinValue.setValue(0);
      Animated.timing(spinValue, {
        toValue: 1,
        duration: 1000,
        easing: Easing.linear,
        useNativeDriver: true,
      }).start(() => spin());
    };
    spin();
  }, [spinValue]);

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const spinnerStyle = [
    styles.spinner,
    styles[size],
    { borderTopColor: color },
    style,
  ];

  return (
    <Animated.View
      style={[
        spinnerStyle,
        {
          transform: [{ rotate: spin }],
        },
      ]}
    />
  );
}

const styles = StyleSheet.create({
  spinner: {
    borderWidth: 2,
    borderColor: 'transparent',
    borderRadius: DesignTokens.radius.full,
  },
  
  // Tamaños
  small: {
    width: 16,
    height: 16,
    borderWidth: 1.5,
  },
  medium: {
    width: 24,
    height: 24,
    borderWidth: 2,
  },
  large: {
    width: 32,
    height: 32,
    borderWidth: 3,
  },
});
