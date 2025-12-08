import {
  Outfit_400Regular,
  Outfit_500Medium,
  Outfit_600SemiBold,
  Outfit_700Bold,
  useFonts
} from '@expo-google-fonts/outfit';
import { DefaultTheme, ThemeProvider as NavigationThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AuthProvider } from '@/contexts/AuthContext';
import { TextScaleProvider } from '@/contexts/TextScaleContext';
import { useNotificationRouting } from '@/hooks/useNotificationRouting';
import { DesignSystemProvider } from '@/theme';

export default function RootLayout() {
  const [loaded] = useFonts({
    Outfit_400Regular,
    Outfit_500Medium,
    Outfit_600SemiBold,
    Outfit_700Bold,
  });

  if (!loaded) {
    // Async font loading only occurs in development.
    return null;
  }

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <DesignSystemProvider>
          <TextScaleProvider>
            <NavigationThemeProvider value={DefaultTheme}>
              {/** Deep link handling for notification taps */}
              {loaded && <NotificationRouter />}
              <Stack screenOptions={{ headerShown: false }}>
                <Stack.Screen name="(auth)" />
                <Stack.Screen name="(tabs)" />
                <Stack.Screen name="(booking)" />
                <Stack.Screen name="(onboarding)" />
                <Stack.Screen name="(provider)" />
                <Stack.Screen name="accept-invite" options={{ title: 'Aceptar invitación', headerShown: true }} />
                <Stack.Screen name="+not-found" options={{ title: 'Oops!', headerShown: true }} />
              </Stack>
              <StatusBar style="light" />
            </NavigationThemeProvider>
          </TextScaleProvider>
        </DesignSystemProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}

function NotificationRouter() {
  useNotificationRouting();
  return null;
}
