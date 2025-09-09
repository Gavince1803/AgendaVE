import { Stack } from 'expo-router';
import React from 'react';

export default function BookingLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerStyle: {
          backgroundColor: '#2563eb',
        },
        headerTintColor: '#ffffff',
        headerTitleStyle: {
          fontWeight: '600',
        },
      }}
    >
      <Stack.Screen
        name="provider-detail"
        options={{
          title: 'Detalle del Proveedor',
        }}
      />
      <Stack.Screen
        name="service-selection"
        options={{
          title: 'Seleccionar Servicio',
        }}
      />
      <Stack.Screen
        name="time-selection"
        options={{
          title: 'Seleccionar Horario',
        }}
      />
      <Stack.Screen
        name="booking-confirmation"
        options={{
          title: 'Confirmar Reserva',
        }}
      />
    </Stack>
  );
}
