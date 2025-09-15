import { Colors, DesignTokens } from '@/constants/Colors';
import React, { useEffect, useRef } from 'react';
import {
    Animated,
    StyleSheet,
    View,
    ViewStyle,
} from 'react-native';

interface ScrollIndicatorProps {
  scrollY: Animated.Value;
  contentHeight: number;
  containerHeight: number;
  style?: ViewStyle;
}

export function ScrollIndicator({
  scrollY,
  contentHeight,
  containerHeight,
  style,
}: ScrollIndicatorProps) {
  const indicatorHeight = useRef(new Animated.Value(0)).current;
  const indicatorOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const maxScroll = contentHeight - containerHeight;
    const maxIndicatorHeight = containerHeight * 0.8; // 80% del contenedor

    const listener = scrollY.addListener(({ value }) => {
      if (maxScroll <= 0) {
        // No hay scroll necesario
        Animated.timing(indicatorOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: false,
        }).start();
        return;
      }

      // Mostrar indicador
      Animated.timing(indicatorOpacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: false,
      }).start();

      // Calcular posición y altura del indicador
      const scrollProgress = Math.min(Math.max(value / maxScroll, 0), 1);
      const indicatorTop = scrollProgress * (containerHeight - maxIndicatorHeight);
      const currentIndicatorHeight = maxIndicatorHeight * (containerHeight / contentHeight);

      Animated.timing(indicatorHeight, {
        toValue: currentIndicatorHeight,
        duration: 100,
        useNativeDriver: false,
      }).start();

      // Actualizar posición
      indicatorHeight.setOffset(indicatorTop);
    });

    return () => {
      scrollY.removeListener(listener);
    };
  }, [scrollY, contentHeight, containerHeight, indicatorHeight, indicatorOpacity]);

  if (contentHeight <= containerHeight) {
    return null; // No mostrar indicador si no hay scroll
  }

  return (
    <View style={[styles.container, style]}>
      <Animated.View
        style={[
          styles.indicator,
          {
            height: indicatorHeight,
            opacity: indicatorOpacity,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    right: DesignTokens.spacing.sm,
    top: DesignTokens.spacing.xl,
    bottom: DesignTokens.spacing.xl,
    width: 4,
    backgroundColor: Colors.light.borderLight,
    borderRadius: DesignTokens.radius.sm,
  },
  indicator: {
    width: '100%',
    backgroundColor: Colors.light.primary,
    borderRadius: DesignTokens.radius.sm,
  },
});
