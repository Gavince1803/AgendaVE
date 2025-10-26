import { Colors } from '@/constants/Colors';
import React from 'react';
import { Platform, StatusBar, useColorScheme, View, ViewStyle, StyleProp } from 'react-native';
import { StatusBar as ExpoStatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface SafeAreaViewProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  backgroundColor?: string;
  statusBarStyle?: 'light' | 'dark' | 'auto';
  statusBarBackgroundColor?: string;
  edges?: ('top' | 'bottom' | 'left' | 'right')[];
  enableKeyboardAvoidance?: boolean;
}

export function SafeAreaView({
  children,
  style,
  backgroundColor,
  statusBarStyle = 'auto',
  statusBarBackgroundColor,
  edges = ['top', 'bottom', 'left', 'right'],
  enableKeyboardAvoidance = false,
}: SafeAreaViewProps) {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  
  // Usar el color de fondo apropiado según el modo
  const defaultBackgroundColor = backgroundColor || Colors[colorScheme ?? 'light'].surface;

  const getSafeAreaStyle = (): ViewStyle => {
    const safeAreaStyle: ViewStyle = {
      flex: 1,
      backgroundColor: defaultBackgroundColor,
    };

    // Aplicar insets solo a los edges especificados
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

    return safeAreaStyle;
  };

  const containerStyles: StyleProp<ViewStyle> = [getSafeAreaStyle(), style];

  return (
    <View style={containerStyles}>
      <StatusBar
        barStyle={statusBarStyle === 'auto' ? (colorScheme === 'dark' ? 'light-content' : 'dark-content') : `${statusBarStyle}-content` as const}
        backgroundColor={statusBarBackgroundColor || defaultBackgroundColor}
        translucent={Platform.OS === 'android'}
      />
      {children}
    </View>
  );
}

// Componente especializado para pantallas de autenticación
export function AuthSafeAreaView({ children, style }: { children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  const colorScheme = useColorScheme();
  return (
    <SafeAreaView
      backgroundColor={Colors[colorScheme ?? 'light'].surface}
      statusBarStyle="dark"
      edges={['top', 'left', 'right']} // No incluir bottom para que el teclado no interfiera
      style={style}
    >
      {children}
    </SafeAreaView>
  );
}

// Componente especializado para pantallas principales con tabs
export function TabSafeAreaView({ children, style }: { children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  const colorScheme = useColorScheme();
  const insets = useSafeAreaInsets();
  const containerStyle: StyleProp<ViewStyle> = [{ paddingTop: insets.top }, style];
  return (
    <SafeAreaView
      backgroundColor={Colors[colorScheme ?? 'light'].background}
      statusBarStyle="dark"
      edges={['left', 'right']} // Keep only left and right
      style={containerStyle}
    >
      <ExpoStatusBar
        style="dark"
        backgroundColor={Colors[colorScheme ?? 'light'].background}
        translucent={false}
      />
      {children}
    </SafeAreaView>
  );
}

// Componente especializado para pantallas de booking
export function BookingSafeAreaView({ children, style }: { children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  const colorScheme = useColorScheme();
  const containerStyle: StyleProp<ViewStyle> = [{ paddingTop: 0 }, style];
  return (
    <SafeAreaView
      backgroundColor={Colors[colorScheme ?? 'light'].background}
      statusBarStyle="dark"
      statusBarBackgroundColor={Colors[colorScheme ?? 'light'].background}
      edges={['left', 'right', 'bottom']}
      style={containerStyle}
    >
      <ExpoStatusBar
        style="dark"
        backgroundColor={Colors[colorScheme ?? 'light'].background}
        translucent={false}
      />
      {children}
    </SafeAreaView>
  );
}

// Hook personalizado para obtener insets de Safe Area
export function useSafeArea() {
  const insets = useSafeAreaInsets();
  
  return {
    top: insets.top,
    bottom: insets.bottom,
    left: insets.left,
    right: insets.right,
    // Valores útiles para estilos
    headerHeight: insets.top + 44, // Altura típica de header + safe area
    tabBarHeight: insets.bottom + 49, // Altura típica de tab bar + safe area
    // Valores para diferentes dispositivos
    isIPhoneX: insets.top > 20, // Detecta si es iPhone X o superior
    isIPad: insets.top === 0 && insets.bottom === 0, // Detecta iPad
  };
}
