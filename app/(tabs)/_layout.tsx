import { Redirect, Tabs } from 'expo-router';
import { Platform } from 'react-native';

import { HapticTab } from '@/components/HapticTab';
import TabBarBackground from '@/components/ui/TabBarBackground';
import { Colors } from '@/constants/Colors';
import { useAuth } from '@/contexts/AuthContext';
import { useColorScheme } from '@/hooks/useColorScheme';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const { user, loading } = useAuth();

  if (loading) {
    return null;
  }

  if (!user) {
    return <Redirect href="/(auth)/login" />;
  }

  // Determinar qué tabs mostrar según el rol del usuario
  const isProvider = user.profile?.role === 'provider';
  const isClient = user.profile?.role === 'client';
  
  // Debug logs
  console.log('🔍 [TAB LAYOUT] Usuario:', user?.email);
  console.log('🔍 [TAB LAYOUT] Rol:', user?.profile?.role);
  console.log('🔍 [TAB LAYOUT] isProvider:', isProvider);
  console.log('🔍 [TAB LAYOUT] isClient:', isClient);
  console.log('🔍 [TAB LAYOUT] Profile completo:', user?.profile);
  console.log('🔍 [TAB LAYOUT] Renderizando tab bookings para cliente:', isClient);
  console.log('🔍 [TAB LAYOUT] Renderizando tab appointments para proveedor:', isProvider);
  console.log('🔍 [TAB LAYOUT] Renderizando tab services para proveedor:', isProvider);

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarBackground: TabBarBackground,
        tabBarStyle: Platform.select({
          ios: {
            // Use a transparent background on iOS to show the blur effect
            position: 'absolute',
          },
          default: {},
        }),
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Inicio',
          tabBarIcon: ({ color, focused }) => (
            <MaterialIcons 
              size={focused ? 30 : 26} 
              name="home" 
              color={color} 
            />
          ),
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Explorar',
          href: isClient ? '/explore' : null,
          tabBarIcon: ({ color, focused }) => (
            <MaterialIcons 
              size={focused ? 30 : 26} 
              name="search" 
              color={color} 
            />
          ),
        }}
      />
      <Tabs.Screen
        name="bookings"
        options={{
          title: 'Mis Citas',
          href: isClient ? '/bookings' : null,
          tabBarIcon: ({ color, focused }) => (
            <MaterialIcons 
              size={focused ? 30 : 26} 
              name="event-note" 
              color={color} 
            />
          ),
        }}
      />
      <Tabs.Screen
        name="appointments"
        options={{
          title: 'Citas',
          href: isProvider ? '/appointments' : null,
          tabBarIcon: ({ color, focused }) => (
            <MaterialIcons 
              size={focused ? 30 : 26} 
              name="schedule" 
              color={color} 
            />
          ),
        }}
      />
      <Tabs.Screen
        name="services"
        options={{
          title: 'Servicios',
          href: isProvider ? '/services' : null,
          tabBarIcon: ({ color, focused }) => (
            <MaterialIcons 
              size={focused ? 30 : 26} 
              name="content-cut" 
              color={color} 
            />
          ),
        }}
      />
      <Tabs.Screen
        name="provider-calendar"
        options={{
          title: 'Calendario',
          href: isProvider ? '/provider-calendar' : null,
          tabBarIcon: ({ color, focused }) => (
            <MaterialIcons 
              size={focused ? 30 : 26} 
              name="event" 
              color={color} 
            />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Perfil',
          tabBarIcon: ({ color, focused }) => (
            <MaterialIcons 
              size={focused ? 30 : 26} 
              name="person" 
              color={color} 
            />
          ),
        }}
      />
    </Tabs>
  );
}
