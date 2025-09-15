// 📱 Layout para pantallas de reservas
import { Stack } from 'expo-router';
import React from 'react';

export default function BookingLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerStyle: {
          backgroundColor: '#fff',
        },
        headerTintColor: '#000',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Stack.Screen
        name="provider-detail"
        options={{
          title: 'Detalles del Proveedor',
          headerBackTitle: 'Atrás',
        }}
      />
      <Stack.Screen
        name="book-service"
        options={{
          title: 'Reservar Servicio',
          headerBackTitle: 'Atrás',
        }}
      />
    </Stack>
  );
}