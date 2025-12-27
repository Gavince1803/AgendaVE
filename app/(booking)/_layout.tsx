// 📱 Layout para pantallas de reservas
import { Stack } from 'expo-router';

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
      <Stack.Screen
        name="service-selection"
        options={{
          title: 'Seleccionar Profesional',
          headerBackTitle: 'Atrás',
        }}
      />
      <Stack.Screen
        name="time-selection"
        options={{
          title: 'Seleccionar Hora',
          headerBackTitle: 'Atrás',
        }}
      />
      <Stack.Screen
        name="reviews"
        options={{
          title: 'Reseñas',
          headerBackTitle: 'Atrás',
        }}
      />
      <Stack.Screen
        name="booking-confirmation"
        options={{
          title: 'Confirmación de Reserva',
          headerBackTitle: 'Atrás',
        }}
      />
    </Stack>
  );
}