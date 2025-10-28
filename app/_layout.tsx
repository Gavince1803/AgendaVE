import { DefaultTheme, ThemeProvider as NavigationThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import * as Notifications from 'expo-notifications';
import { router, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import 'react-native-reanimated';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AuthProvider } from '@/contexts/AuthContext';
import { DesignSystemProvider } from '@/theme';

export default function RootLayout() {
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  if (!loaded) {
    // Async font loading only occurs in development.
    return null;
  }

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <DesignSystemProvider>
          <NavigationThemeProvider value={DefaultTheme}>
            {/** Deep link handling for notification taps */}
            {loaded && (
              <DeepLinkHandler />
            )}
            <Stack>
              <Stack.Screen name="(auth)" options={{ headerShown: false }} />
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen name="(booking)" options={{ headerShown: false }} />
              <Stack.Screen name="+not-found" />
            </Stack>
            <StatusBar style="light" />
          </NavigationThemeProvider>
        </DesignSystemProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}

function DeepLinkHandler() {
  useEffect(() => {
    const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
      try {
        const data: any = response?.notification?.request?.content?.data;
        const type = data?.type as string | undefined;
        const appointmentId = data?.appointment_id as string | undefined;
        // Basic routing based on type
        switch (type) {
          case 'new_appointment':
            router.push('/(tabs)/appointments');
            break;
          case 'appointment_confirmed':
          case 'appointment_reminder':
          case 'appointment_cancelled':
          case 'booking_created':
            router.push('/(tabs)/bookings');
            break;
          default:
            router.push('/(tabs)');
        }
      } catch (e) {
        router.push('/(tabs)');
      }
    });

    return () => {
      subscription?.remove?.();
    };
  }, []);

  return null;
}
