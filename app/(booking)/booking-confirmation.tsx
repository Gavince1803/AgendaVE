import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { useAuth } from '@/contexts/AuthContext';
import { BookingService } from '@/lib/booking-service';
import { NotificationService } from '@/lib/notification-service';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import {
    Alert,
    Platform,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';

export default function BookingConfirmationScreen() {
  const { user } = useAuth();
  const { 
    providerId, 
    providerName, 
    serviceId, 
    serviceName, 
    servicePrice, 
    serviceDuration,
    employeeId,
    employeeName,
    selectedDate,
    selectedTime,
  } = useLocalSearchParams();
  
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [notes, setNotes] = useState('');

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  }, []);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', { 
      weekday: 'long', 
      day: 'numeric', 
      month: 'long',
      year: 'numeric'
    });
  };

  const handleConfirmBooking = async () => {
    if (!user) {
      Alert.alert('Error', 'Debes estar autenticado para hacer una reserva');
      return;
    }

    setLoading(true);
    
    try {
      // Crear la reserva usando el servicio
      const bookingData = {
        client_id: user.id,
        provider_id: providerId as string,
        service_id: parseInt(serviceId as string),
        appointment_date: selectedDate as string,
        appointment_time: selectedTime as string,
        status: 'pending' as const,
        notes: notes || undefined,
      };

      const created = await BookingService.createAppointment(
        providerId as string,
        serviceId as string,
        selectedDate as string,
        selectedTime as string,
        (employeeId as string) || undefined,
        notes
      );

      // Intentar enviar notificaciones (no bloquear la UX si falla)
      try {
        // Notificar al cliente (confirmación/local)
        await NotificationService.sendLocalNotification({
          title: 'Reserva creada',
          body: `${serviceName} el ${formatDate(selectedDate as string)} a las ${selectedTime}`,
          data: { type: 'booking_created', appointment_id: created.id },
        });

        if (user?.id) {
          await NotificationService.notifyAppointmentConfirmation(user.id, {
            id: created.id,
            provider_name: providerName,
            appointment_date: selectedDate,
          });
        }

        // Notificar al proveedor sobre nueva reserva
        try {
          const providerDetails = await BookingService.getProviderDetails(providerId as string);
          if (providerDetails?.user_id) {
            await NotificationService.notifyNewAppointment(providerDetails.user_id, {
              id: created.id,
              client_name: user?.profile?.display_name || user?.email || 'Cliente',
              service_name: serviceName,
            });
          }
        } catch (e) {
          console.warn('Provider notification skipped:', e);
        }
      } catch (notifyErr) {
        console.warn('Push notifications failed or unavailable:', notifyErr);
      }

      Alert.alert(
        '¡Reserva Confirmada!',
        'Tu cita ha sido reservada exitosamente. Recibirás una confirmación por email.',
        [
          {
            text: 'Ver Mis Citas',
            onPress: () => {
              router.push('/(tabs)/bookings');
            },
          },
          {
            text: 'Volver al Inicio',
            onPress: () => {
              router.push('/(tabs)');
            },
          },
        ]
      );
    } catch (error) {
      console.error('Error creating booking:', error);
      const errorMessage = error instanceof Error ? error.message : 'No se pudo confirmar la reserva. Por favor, inténtalo de nuevo.';
      Alert.alert('Error', errorMessage, [{ text: 'OK' }]);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    Alert.alert(
      'Cancelar Reserva',
      '¿Estás seguro de que quieres cancelar esta reserva?',
      [
        { text: 'No', style: 'cancel' },
        { 
          text: 'Sí, Cancelar', 
          style: 'destructive',
          onPress: () => router.back()
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.providerName}>{providerName}</Text>
          <Text style={styles.stepText}>Paso 3 de 3</Text>
        </View>

        {/* Resumen de la reserva */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Resumen de tu Reserva</Text>
          <Card variant="elevated" padding="medium">
            <View style={styles.summaryItem}>
              <IconSymbol name="scissors" size={20} color={Colors.light.primary} />
              <View style={styles.summaryContent}>
                <Text style={styles.summaryLabel}>Servicio</Text>
                <Text style={styles.summaryValue}>{serviceName}</Text>
              </View>
            </View>
            
            {employeeName && (
              <View style={styles.summaryItem}>
                <IconSymbol name="person" size={20} color={Colors.light.primary} />
                <View style={styles.summaryContent}>
                  <Text style={styles.summaryLabel}>Empleado</Text>
                  <Text style={styles.summaryValue}>{employeeName}</Text>
                </View>
              </View>
            )}
            
            <View style={styles.summaryItem}>
              <IconSymbol name="calendar" size={20} color={Colors.light.primary} />
              <View style={styles.summaryContent}>
                <Text style={styles.summaryLabel}>Fecha</Text>
                <Text style={styles.summaryValue}>{formatDate(selectedDate as string)}</Text>
              </View>
            </View>
            
            <View style={styles.summaryItem}>
              <IconSymbol name="clock" size={20} color={Colors.light.primary} />
              <View style={styles.summaryContent}>
                <Text style={styles.summaryLabel}>Hora</Text>
                <Text style={styles.summaryValue}>{selectedTime}</Text>
              </View>
            </View>
            
            <View style={styles.summaryItem}>
              <IconSymbol name="dollarsign.circle" size={20} color={Colors.light.primary} />
              <View style={styles.summaryContent}>
                <Text style={styles.summaryLabel}>Precio</Text>
                <Text style={styles.summaryValue}>${servicePrice}</Text>
              </View>
            </View>
          </Card>
        </View>

        {/* Información del proveedor */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Información del Proveedor</Text>
          <Card variant="elevated" padding="medium">
            <View style={styles.providerInfo}>
              <View style={styles.providerDetails}>
                <Text style={styles.providerNameDetails}>{providerName}</Text>
                <Text style={styles.providerCategory}>Peluquería</Text>
                <Text style={styles.providerAddress}>Av. Francisco de Miranda, Caracas</Text>
                <Text style={styles.providerPhone}>+58 212 555-0123</Text>
              </View>
            </View>
          </Card>
        </View>

        {/* Notas adicionales */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notas Adicionales (Opcional)</Text>
          <Card variant="elevated" padding="medium">
            <Text style={styles.notesLabel}>
              ¿Hay algo específico que quieras mencionar para tu cita?
            </Text>
            <View style={styles.notesInput}>
              <Text style={styles.notesPlaceholder}>
                Ej: "Quiero un corte corto", "Tengo alergia a ciertos productos", etc.
              </Text>
            </View>
          </Card>
        </View>

        {/* Términos y condiciones */}
        <View style={[styles.section, styles.termsSection]}>
          <Card variant="elevated" padding="medium">
            <View style={styles.termsContainer}>
              <IconSymbol name="info.circle" size={20} color={Colors.light.info} />
              <View style={styles.termsContent}>
                <Text style={styles.termsTitle}>Términos y Condiciones</Text>
                <Text style={styles.termsText}>
                  • Puedes cancelar tu cita hasta 2 horas antes sin costo{'\n'}
                  • Llega 10 minutos antes de tu cita{'\n'}
                  • En caso de retraso, tu cita podría ser reprogramada{'\n'}
                  • El pago se realiza al finalizar el servicio
                </Text>
              </View>
            </View>
          </Card>
        </View>

        {/* Política de cancelación */}
        <View style={[styles.section, styles.policySection]}>
          <Card variant="elevated" padding="medium">
            <View style={styles.policyContainer}>
              <IconSymbol name="exclamationmark.triangle" size={20} color={Colors.light.warning} />
              <View style={styles.policyContent}>
                <Text style={styles.policyTitle}>Política de Cancelación</Text>
                <Text style={styles.policyText}>
                  Si cancelas con menos de 2 horas de anticipación, se aplicará una tarifa del 50% del valor del servicio.
                </Text>
              </View>
            </View>
          </Card>
        </View>
      </ScrollView>

      {/* Botones de acción */}
      <View style={styles.bottomSection}>
        <View style={styles.buttonRow}>
          <Button
            title="Cancelar"
            onPress={handleCancel}
            variant="outline"
            size="large"
            style={styles.cancelButton}
          />
          <Button
            title="Confirmar Reserva"
            onPress={handleConfirmBooking}
            variant="primary"
            size="large"
            loading={loading}
            disabled={loading}
            style={styles.confirmButton}
            icon={<IconSymbol name="checkmark" size={16} color="#ffffff" />}
          />
        </View>
        
        <Text style={styles.confirmationNote}>
          Al confirmar, aceptas nuestros términos y condiciones
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.surface,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    backgroundColor: Colors.light.background,
  },
  providerName: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.light.text,
  },
  stepText: {
    fontSize: 14,
    color: Colors.light.text,
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  termsSection: {
    marginBottom: 12,
  },
  policySection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 16,
  },
  summaryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  summaryContent: {
    marginLeft: 12,
    flex: 1,
  },
  summaryLabel: {
    fontSize: 14,
    color: Colors.light.text,
    marginBottom: 2,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
  },
  providerInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  providerDetails: {
    flex: 1,
  },
  providerNameDetails: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 4,
  },
  providerCategory: {
    fontSize: 14,
    color: Colors.light.text,
    marginBottom: 8,
  },
  providerAddress: {
    fontSize: 14,
    color: Colors.light.text,
    marginBottom: 4,
  },
  providerPhone: {
    fontSize: 14,
    color: Colors.light.text,
  },
  notesLabel: {
    fontSize: 14,
    color: Colors.light.text,
    marginBottom: 12,
  },
  notesInput: {
    backgroundColor: Colors.light.surfaceVariant,
    borderRadius: 8,
    padding: 12,
    minHeight: 80,
  },
  notesPlaceholder: {
    fontSize: 14,
    color: Colors.light.text,
    fontStyle: 'italic',
  },
  termsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  termsContent: {
    flex: 1,
  },
  termsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 10,
  },
  termsText: {
    fontSize: 12,
    color: Colors.light.text,
    lineHeight: 20,
  },
  policyContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  policyContent: {
    flex: 1,
  },
  policyTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 10,
  },
  policyText: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    lineHeight: 20,
  },
  bottomSection: {
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
    backgroundColor: Colors.light.background,
    borderTopWidth: 1,
    borderTopColor: Colors.light.borderLight,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  cancelButton: {
    flex: 1,
  },
  confirmButton: {
    flex: 2,
  },
  confirmationNote: {
    fontSize: 12,
    color: Colors.light.textTertiary,
    textAlign: 'center',
    lineHeight: 16,
  },
});
