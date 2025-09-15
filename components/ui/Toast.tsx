import { Colors, DesignTokens } from '@/constants/Colors';
import React, { useEffect, useRef } from 'react';
import {
    Animated,
    StyleSheet,
    Text,
    ViewStyle
} from 'react-native';
import { IconSymbol } from './IconSymbol';

interface ToastProps {
  message: string;
  type?: 'success' | 'error' | 'warning' | 'info';
  visible: boolean;
  duration?: number;
  onHide?: () => void;
  style?: ViewStyle;
}

export function Toast({
  message,
  type = 'info',
  visible,
  duration = 3000,
  onHide,
  style,
}: ToastProps) {
  const translateY = useRef(new Animated.Value(-100)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // Show animation
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: 0,
          duration: DesignTokens.transitions.normal,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: DesignTokens.transitions.normal,
          useNativeDriver: true,
        }),
      ]).start();

      // Auto hide
      const timer = setTimeout(() => {
        hideToast();
      }, duration);

      return () => clearTimeout(timer);
    } else {
      hideToast();
    }
  }, [visible, duration]);

  const hideToast = () => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -100,
        duration: DesignTokens.transitions.fast,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: DesignTokens.transitions.fast,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onHide?.();
    });
  };

  const getToastStyle = () => {
    switch (type) {
      case 'success':
        return {
          backgroundColor: Colors.light.successBg,
          borderColor: Colors.light.success,
        };
      case 'error':
        return {
          backgroundColor: Colors.light.errorBg,
          borderColor: Colors.light.error,
        };
      case 'warning':
        return {
          backgroundColor: Colors.light.warningBg,
          borderColor: Colors.light.warning,
        };
      default:
        return {
          backgroundColor: Colors.light.infoBg,
          borderColor: Colors.light.info,
        };
    }
  };

  const getIconName = () => {
    switch (type) {
      case 'success':
        return 'checkmark.circle.fill';
      case 'error':
        return 'xmark.circle.fill';
      case 'warning':
        return 'exclamationmark.triangle.fill';
      default:
        return 'info.circle.fill';
    }
  };

  const getIconColor = () => {
    switch (type) {
      case 'success':
        return Colors.light.success;
      case 'error':
        return Colors.light.error;
      case 'warning':
        return Colors.light.warning;
      default:
        return Colors.light.info;
    }
  };

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        getToastStyle(),
        {
          transform: [{ translateY }],
          opacity,
        },
        style,
      ]}
    >
      <IconSymbol 
        name={getIconName()} 
        size={20} 
        color={getIconColor()} 
      />
      <Text style={styles.message}>{message}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 60,
    left: DesignTokens.spacing.xl,
    right: DesignTokens.spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: DesignTokens.spacing.lg,
    paddingVertical: DesignTokens.spacing.md,
    borderRadius: DesignTokens.radius.lg,
    borderWidth: 1,
    ...DesignTokens.elevation.lg,
    zIndex: 1000,
  },
  message: {
    flex: 1,
    fontSize: DesignTokens.typography.fontSizes.sm,
    fontWeight: DesignTokens.typography.fontWeights.medium as any,
    color: Colors.light.text,
    marginLeft: DesignTokens.spacing.sm,
  },
});
