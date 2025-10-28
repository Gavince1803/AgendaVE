import React, { useEffect, useRef } from 'react';
import { Animated, ViewProps } from 'react-native';

interface MotionFadeInProps extends ViewProps {
  delay?: number;
  offset?: number;
}

export function MotionFadeIn({
  children,
  style,
  delay = 0,
  offset = 16,
  ...props
}: MotionFadeInProps) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(offset)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 260,
        delay,
        useNativeDriver: true,
      }),
      Animated.spring(translateY, {
        toValue: 0,
        delay,
        useNativeDriver: true,
        damping: 12,
        stiffness: 120,
      }),
    ]).start();
  }, [delay, offset, opacity, translateY]);

  return (
    <Animated.View
      {...props}
      style={[
        { opacity, transform: [{ translateY }] },
        style,
      ]}
    >
      {children}
    </Animated.View>
  );
}
