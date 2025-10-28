import React, { useMemo } from 'react';
import {
  Platform,
  StatusBar,
  View,
  ViewStyle,
  StyleProp,
} from 'react-native';
import { StatusBar as ExpoStatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '@/theme';

interface SafeAreaViewProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  backgroundColor?: string;
  statusBarStyle?: 'light' | 'dark' | 'auto';
  statusBarBackgroundColor?: string;
  edges?: ('top' | 'bottom' | 'left' | 'right')[];
}

export function SafeAreaView({
  children,
  style,
  backgroundColor,
  statusBarStyle = 'auto',
  statusBarBackgroundColor,
  edges = ['top', 'bottom', 'left', 'right'],
}: SafeAreaViewProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const defaultBackgroundColor = backgroundColor ?? colors.surface;

  const containerStyles = useMemo(() => {
    const safeAreaStyle: ViewStyle = {
      flex: 1,
      backgroundColor: defaultBackgroundColor,
    };

    if (edges.includes('top')) {
      safeAreaStyle.paddingTop = insets.top;
    }
    if (edges.includes('bottom')) {
      safeAreaStyle.paddingBottom = insets.bottom;
    }
    if (edges.includes('left')) {
      safeAreaStyle.paddingLeft = insets.left;
    }
    if (edges.includes('right')) {
      safeAreaStyle.paddingRight = insets.right;
    }

    return [safeAreaStyle, style] as StyleProp<ViewStyle>;
  }, [defaultBackgroundColor, edges, insets.bottom, insets.left, insets.right, insets.top, style]);

  const barStyle =
    statusBarStyle === 'auto'
      ? 'dark-content'
      : (`${statusBarStyle}-content` as const);

  return (
    <View style={containerStyles}>
      <StatusBar
        barStyle={barStyle}
        backgroundColor={statusBarBackgroundColor || defaultBackgroundColor}
        translucent={Platform.OS === 'android'}
      />
      {children}
    </View>
  );
}

export function AuthSafeAreaView({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  const { colors } = useTheme();
  return (
    <SafeAreaView
      backgroundColor={colors.surface}
      statusBarStyle="dark"
      edges={['top', 'left', 'right']}
      style={style}
    >
      {children}
    </SafeAreaView>
  );
}

export function TabSafeAreaView({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const containerStyle: StyleProp<ViewStyle> = [{ paddingTop: insets.top }, style];
  return (
    <SafeAreaView
      backgroundColor={colors.background}
      statusBarStyle="dark"
      edges={['left', 'right']}
      style={containerStyle}
    >
      <ExpoStatusBar
        style="dark"
        backgroundColor={colors.background}
        translucent={false}
      />
      {children}
    </SafeAreaView>
  );
}

export function BookingSafeAreaView({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  const { colors } = useTheme();
  const containerStyle: StyleProp<ViewStyle> = [{ paddingTop: 0 }, style];
  return (
    <SafeAreaView
      backgroundColor={colors.background}
      statusBarStyle="dark"
      statusBarBackgroundColor={colors.background}
      edges={['left', 'right', 'bottom']}
      style={containerStyle}
    >
      <ExpoStatusBar
        style="dark"
        backgroundColor={colors.background}
        translucent={false}
      />
      {children}
    </SafeAreaView>
  );
}

export function useSafeArea() {
  const insets = useSafeAreaInsets();

  return {
    top: insets.top,
    bottom: insets.bottom,
    left: insets.left,
    right: insets.right,
    headerHeight: insets.top + 44,
    tabBarHeight: insets.bottom + 49,
    isIPhoneX: insets.top > 20,
    isIPad: insets.top === 0 && insets.bottom === 0,
  };
}
