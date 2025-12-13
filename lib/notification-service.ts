import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { supabase } from './supabase';

// Configurar el comportamiento de las notificaciones
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export interface NotificationData {
  title: string;
  body: string;
  data?: any;
}

export class NotificationService {
  /**
   * Solicitar permisos de notificación
   */
  static async requestPermissions(): Promise<boolean> {
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      return finalStatus === 'granted';
    } catch (error) {
      console.error('Error requesting notification permissions:', error);
      return false;
    }
  }

  /**
   * Obtener token de notificación del dispositivo
   */
  static async getDeviceToken(): Promise<string | null> {
    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        console.log('Notification permissions not granted');
        return null;
      }

      // Skip token generation on web; mobile requires proper EAS project ID
      // Web push is not implemented in this project
      // @ts-ignore Platform available from react-native
      if (Platform.OS === 'web') {
        return null;
      }

      const token = await Notifications.getExpoPushTokenAsync();
      return token.data;
    } catch (error) {
      console.log('Push notifications not available in Expo Go');
      return null;
    }
  }

  /**
   * Registrar token en la base de datos
   */
  static async registerToken(userId: string): Promise<void> {
    try {
      const token = await this.getDeviceToken();
      if (!token) {
        console.log('No token available to register');
        return;
      }

      const platform = Platform.OS;

      // Verificar si el token ya existe
      const { data: existingToken } = await supabase
        .from('device_push_tokens')
        .select('id')
        .eq('user_id', userId)
        .eq('expo_token', token)
        .single();

      if (existingToken) {
        console.log('Token already registered');
        return;
      }

      // Insertar o actualizar el token
      const { error } = await supabase
        .from('device_push_tokens')
        .upsert({
          user_id: userId,
          expo_token: token,
          token: token,
          platform,
          is_active: true,
        });

      if (error) {
        console.error('Error registering token:', error);
        throw new Error(`Error al registrar token: ${error.message}`);
      }

      console.log('Token registered successfully');
    } catch (error) {
      console.error('Error in registerToken:', error);
      throw error;
    }
  }

  static async unregisterToken(userId: string) {
    if (!userId) return;

    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      // If we don't have permission, we can't get the token to delete specific one,
      // but we can try to delete all tokens for this user on this device if we had a way to identify device.
      // For now, let's delete strictly by user_id and maybe device info.

      // Best effort: Delete all tokens for this user. 
      // In a multi-device scenario, this logs them out of notifications on ALL devices.
      // A better approach would be to store the specific token in local storage and delete ONLY that one.

      // For this MVP, let's just log it.
      // Ideally:
      // const token = (await Notifications.getExpoPushTokenAsync()).data;
      // await supabase.from('device_push_tokens').delete().match({ token, user_id: userId });

      // However, getting the token might fail if permissions were revoked.
      // Let's try to get the token, if fails, just return.

      let token;
      try {
        token = (await Notifications.getExpoPushTokenAsync({
          projectId: Constants.expoConfig.extra.eas.projectId,
        })).data;
      } catch (e) {
        // Ignore error, maybe permissions revoked
      }

      if (token) {
        const { error } = await supabase
          .from('device_push_tokens')
          .delete()
          .eq('user_id', userId)
          .eq('token', token);

        if (error) {
          console.error('Error unregistering token:', error);
        } else {
          console.log('Token unregistered successfully');
        }
      }

    } catch (error) {
      console.error('Error in unregisterToken:', error);
    }
  }

  /**
   * Enviar notificación local
   */
  static async sendLocalNotification(data: NotificationData): Promise<void> {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: data.title,
          body: data.body,
          data: data.data,
        },
        trigger: null, // Enviar inmediatamente
      });
    } catch (error) {
      console.error('Error sending local notification:', error);
    }
  }

  static async scheduleLocalNotification(data: NotificationData & { trigger: any }): Promise<void> {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: data.title,
          body: data.body,
          data: data.data,
        },
        trigger: data.trigger,
      });
    } catch (error) {
      console.error('Error scheduling local notification:', error);
    }
  }

  /**
   * Enviar notificación push a un usuario específico
   */
  static async sendPushNotification(
    userId: string,
    notification: NotificationData
  ): Promise<void> {
    try {
      console.log('📤 [NOTIFICATION SERVICE] Sending push notification to user:', userId);
      console.log('📤 [NOTIFICATION SERVICE] Notification:', notification);

      // Obtener tokens del usuario
      const { data: tokens, error } = await supabase
        .from('device_push_tokens')
        .select('expo_token, token')
        .eq('user_id', userId)
        .eq('is_active', true);

      if (error) {
        console.error('❌ [NOTIFICATION SERVICE] Error fetching user tokens:', error);
        return;
      }

      if (!tokens || tokens.length === 0) {
        console.warn('⚠️ [NOTIFICATION SERVICE] No active tokens found for user:', userId);
        console.warn('⚠️ [NOTIFICATION SERVICE] User may need to register their device token');
        return;
      }

      console.log('✅ [NOTIFICATION SERVICE] Found', tokens.length, 'active token(s) for user');

      // Enviar notificación a todos los tokens del usuario
      const messages = tokens.map(tokenData => ({
        to: tokenData.token || tokenData.expo_token,
        sound: 'default',
        title: notification.title,
        body: notification.body,
        data: notification.data,
      }));

      // Enviar notificaciones usando Expo Push API
      const response = await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Accept-encoding': 'gzip, deflate',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(messages),
      });

      if (!response.ok) {
        throw new Error(`Push notification failed: ${response.status}`);
      }

      const result = await response.json();
      console.log('Push notifications sent:', result);

    } catch (error) {
      console.error('Error sending push notification:', error);
    }
  }

  /**
   * Notificar nueva reserva al proveedor
   */
  static async notifyNewAppointment(providerId: string, appointmentData: any): Promise<void> {
    try {
      const notification: NotificationData = {
        title: 'Nueva Reserva 📅',
        body: `Tienes una nueva cita con ${appointmentData.client_name} para ${appointmentData.service_name}`,
        data: {
          type: 'new_appointment',
          appointment_id: appointmentData.id,
          provider_id: providerId,
        },
      };

      await this.sendPushNotification(providerId, notification);
    } catch (error) {
      console.error('Error notifying new appointment:', error);
    }
  }

  static async notifyEmployeeNewAppointment(
    employeeProfileId: string,
    appointmentData: any
  ): Promise<void> {
    try {
      const timeLabel = appointmentData.appointment_time
        ? ` a las ${appointmentData.appointment_time}`
        : '';

      const notification: NotificationData = {
        title: 'Nueva cita asignada 📆',
        body: `${appointmentData.service_name || 'Servicio'} en ${appointmentData.provider_name}${timeLabel}`,
        data: {
          type: 'employee_new_appointment',
          appointment_id: appointmentData.id,
          provider_name: appointmentData.provider_name,
          client_name: appointmentData.client_name,
        },
      };

      await this.sendPushNotification(employeeProfileId, notification);
    } catch (error) {
      console.error('Error notifying employee new appointment:', error);
    }
  }

  static async notifyEmployeeAppointmentUpdate(
    employeeProfileId: string,
    appointmentData: any
  ): Promise<void> {
    try {
      const timeLabel = appointmentData.appointment_time
        ? ` a las ${appointmentData.appointment_time}`
        : '';

      const notification: NotificationData = {
        title: 'Cita reprogramada 🔄',
        body: `La cita de ${appointmentData.service_name || 'Servicio'} ha sido reprogramada para el ${appointmentData.appointment_date}${timeLabel}`,
        data: {
          type: 'employee_appointment_update',
          appointment_id: appointmentData.id,
          provider_name: appointmentData.provider_name,
          client_name: appointmentData.client_name,
        },
      };

      await this.sendPushNotification(employeeProfileId, notification);
    } catch (error) {
      console.error('Error notifying employee appointment update:', error);
    }
  }

  static async notifyAppointmentReschedule(
    userId: string,
    appointmentData: any
  ): Promise<void> {
    try {
      const notification: NotificationData = {
        title: 'Cita Reprogramada 🔄',
        body: `La cita con ${appointmentData.client_name} ha sido reprogramada para el ${appointmentData.appointment_date} a las ${appointmentData.appointment_time}`,
        data: {
          type: 'appointment_reschedule',
          appointment_id: appointmentData.id,
          provider_id: appointmentData.provider_id,
        },
      };

      await this.sendPushNotification(userId, notification);
    } catch (error) {
      console.error('Error notifying appointment reschedule:', error);
    }
  }

  /**
   * Notificar confirmación de cita al cliente
   */
  static async notifyAppointmentConfirmation(
    clientId: string,
    appointmentData: any
  ): Promise<void> {
    try {
      const timeLabel = appointmentData.appointment_time
        ? ` a las ${appointmentData.appointment_time}`
        : '';
      const notification: NotificationData = {
        title: 'Cita Confirmada ✅',
        body: `Tu cita en ${appointmentData.provider_name} ha sido confirmada para ${appointmentData.appointment_date}${timeLabel}`,
        data: {
          type: 'appointment_confirmed',
          appointment_id: appointmentData.id,
          client_id: clientId,
        },
      };

      await this.sendPushNotification(clientId, notification);
    } catch (error) {
      console.error('Error notifying appointment confirmation:', error);
    }
  }

  /**
   * Notificar cancelación de cita
   */
  static async notifyAppointmentCancellation(
    userId: string,
    appointmentData: any,
    isClient: boolean
  ): Promise<void> {
    try {
      const notification: NotificationData = {
        title: 'Cita Cancelada ❌',
        body: isClient
          ? `Tu cita en ${appointmentData.provider_name} ha sido cancelada`
          : `La cita con ${appointmentData.client_name} ha sido cancelada`,
        data: {
          type: 'appointment_cancelled',
          appointment_id: appointmentData.id,
          user_id: userId,
        },
      };

      await this.sendPushNotification(userId, notification);
    } catch (error) {
      console.error('Error notifying appointment cancellation:', error);
    }
  }

  /**
   * Notificar recordatorio de cita
   */
  static async notifyAppointmentReminder(
    userId: string,
    appointmentData: any
  ): Promise<void> {
    try {
      const notification: NotificationData = {
        title: 'Recordatorio de Cita ⏰',
        body: `Tienes una cita en ${appointmentData.provider_name} en 1 hora`,
        data: {
          type: 'appointment_reminder',
          appointment_id: appointmentData.id,
          user_id: userId,
        },
      };

      await this.sendPushNotification(userId, notification);
    } catch (error) {
      console.error('Error notifying appointment reminder:', error);
    }
  }

  /**
   * Limpiar tokens inactivos
   */
  static async cleanupInactiveTokens(): Promise<void> {
    try {
      // Marcar tokens como inactivos si no se han usado en 30 días
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { error } = await supabase
        .from('device_push_tokens')
        .update({ is_active: false })
        .lt('updated_at', thirtyDaysAgo.toISOString());

      if (error) {
        console.error('Error cleaning up inactive tokens:', error);
      }
    } catch (error) {
      console.error('Error in cleanupInactiveTokens:', error);
    }
  }
}
