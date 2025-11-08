import { useEffect } from 'react';
import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';

type NotificationData = {
  type?: string;
  appointment_id?: string;
};

/**
 * Centralizes deep-link routing from push notification payloads.
 */
export function useNotificationRouting() {
  useEffect(() => {
    const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
      try {
        const data = (response?.notification?.request?.content?.data ?? {}) as NotificationData;
        switch (data.type) {
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
      } catch {
        router.push('/(tabs)');
      }
    });

    return () => {
      subscription?.remove?.();
    };
  }, []);
}
