import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors, DesignTokens } from '@/constants/Colors';
import { useAuth } from '@/contexts/AuthContext';
import { BookingService } from '@/lib/booking-service';
import { NotificationService } from '@/lib/notification-service';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Linking,
  Platform,
  RefreshControl,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

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
  const [showSuccessModal, setShowSuccessModal] = useState(false);

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

  const formatDurationValue = (value?: string | string[]) => {
    const rawValue = Array.isArray(value) ? value[0] : value;
    if (!rawValue) {
      return null;
    }

    const minutes = Number(rawValue);
    if (Number.isNaN(minutes)) {
      return rawValue;
    }

    if (minutes < 60) {
      return `${minutes} min`;
    }

    const hours = Math.floor(minutes / 60);
    const remainder = minutes % 60;
    return remainder > 0 ? `${hours}h ${remainder}min` : `${hours}h`;
  };

  const durationLabel = formatDurationValue(serviceDuration);

  const handleConfirmBooking = async () => {
    if (!user) {
      Alert.alert('Error', 'Debes estar autenticado para hacer una reserva');
      return;
    }

    setLoading(true);

    try {
      const created = await BookingService.createAppointment(
        providerId as string,
        serviceId as string,
        selectedDate as string,
        selectedTime as string,
        (employeeId && employeeId !== 'any' ? (employeeId as string) : undefined),
        notes
      );

      // Intentar enviar notificaciones push (no bloquear la UX si falla)
      try {
        // Notificar al cliente (confirmación/local)
        await NotificationService.sendLocalNotification({
          title: 'Reserva creada',
          body: `${serviceName} el ${formatDate(selectedDate as string)} a las ${selectedTime}`,
          data: { type: 'booking_created', appointment_id: created.id },
        });

        // La notificación push para el proveedor y el empleado asignado se maneja en el backend
        // a través de BookingService.createAppointment.
      } catch (notifyErr) {
        console.warn('Push notifications failed or unavailable:', notifyErr);
      }

      setShowSuccessModal(true);
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

  const insets = useSafeAreaInsets();

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header (Simplified) */}
        <View style={styles.header}>
          {/* Content removed for cleaner look */}
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
              <Button
                title="Editar"
                variant="ghost"
                size="small"
                onPress={() => router.push({
                  pathname: '/(booking)/service-selection',
                  params: { providerId, providerName }
                })}
              />
            </View>

            <View style={styles.summaryItem}>
              <IconSymbol name="person" size={20} color={Colors.light.primary} />
              <View style={styles.summaryContent}>
                <Text style={styles.summaryLabel}>Empleado</Text>
                <Text style={styles.summaryValue}>{employeeName || 'Sin preferencia'}</Text>
              </View>
              <Button
                title="Editar"
                variant="ghost"
                size="small"
                onPress={() => router.push({
                  pathname: '/(booking)/service-selection',
                  params: { providerId, providerName, preselectedServiceId: serviceId }
                })}
              />
            </View>

            <View style={styles.summaryItem}>
              <IconSymbol name="calendar" size={20} color={Colors.light.primary} />
              <View style={styles.summaryContent}>
                <Text style={styles.summaryLabel}>Fecha</Text>
                <Text style={styles.summaryValue}>{formatDate(selectedDate as string)}</Text>
              </View>
              <Button
                title="Editar"
                variant="ghost"
                size="small"
                onPress={() => router.back()}
              />
            </View>

            <View style={styles.summaryItem}>
              <IconSymbol name="clock" size={20} color={Colors.light.primary} />
              <View style={styles.summaryContent}>
                <Text style={styles.summaryLabel}>Hora</Text>
                <Text style={styles.summaryValue}>{selectedTime}</Text>
              </View>
              <Button
                title="Editar"
                variant="ghost"
                size="small"
                onPress={() => router.back()}
              />
            </View>

            {durationLabel && (
              <View style={styles.summaryItem}>
                <IconSymbol name="timer" size={20} color={Colors.light.primary} />
                <View style={styles.summaryContent}>
                  <Text style={styles.summaryLabel}>Duración</Text>
                  <Text style={styles.summaryValue}>{durationLabel}</Text>
                </View>
              </View>
            )}

            <View style={styles.summaryItem}>
              <IconSymbol name="dollarsign.circle" size={20} color={Colors.light.primary} />
              <View style={styles.summaryContent}>
                <Text style={styles.summaryLabel}>Precio</Text>
                <Text style={styles.summaryValue}>${servicePrice}</Text>
              </View>
            </View>

            {/* 
            <View style={styles.summaryItem}>
              <IconSymbol name="creditcard" size={20} color={Colors.light.primary} />
              <View style={styles.summaryContent}>
                <Text style={styles.summaryLabel}>Método de Pago</Text>
                <Text style={styles.summaryValue}>Pago en sitio / Pago Móvil</Text>
              </View>
            </View>
            */}
          </Card>
        </View>

        {/* Notas adicionales */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notas Adicionales (Opcional)</Text>
          <Card variant="elevated" padding="medium">
            <Text style={styles.notesLabel}>
              ¿Hay algo específico que quieras mencionar para tu cita?
            </Text>
            <TextInput
              style={styles.notesInput}
              multiline
              placeholder='Ej: "Quiero un corte corto", "Tengo alergia a ciertos productos"...'
              placeholderTextColor={Colors.light.textSecondary}
              value={notes}
              onChangeText={setNotes}
              maxLength={240}
              textAlignVertical="top"
            />
            <Text style={styles.notesCounter}>{`${notes.length}/240`}</Text>
          </Card>
        </View>

        {/* Ubicación (Compacto) */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ubicación</Text>
          <Card variant="outlined" padding="medium">
            <View style={styles.providerInfo}>
              <IconSymbol name="mappin.and.ellipse" size={20} color={Colors.light.primary} />
              <View style={styles.summaryContent}>
                <Text style={styles.providerNameDetails}>{providerName}</Text>
                <Text style={styles.providerAddress}>Av. Francisco de Miranda, Caracas</Text>
              </View>
            </View>
            <View style={styles.actionButtonsRow}>
              <Button
                title="Ayuda"
                onPress={() => {
                  const message = `Hola, necesito ayuda con mi reserva...`;
                  Linking.openURL(`whatsapp://send?text=${encodeURIComponent(message)}&phone=584121234567`);
                }}
                variant="ghost"
                size="small"
                icon={<IconSymbol name="questionmark.circle" size={16} color={Colors.light.primary} />}
              />
              <Button
                title="Compartir"
                onPress={async () => {
                  try {
                    const message = `📅 *Cita Confirmada*\n\n📍 *Lugar:* ${providerName}\n✂️ *Servicio:* ${serviceName}\n🗓 *Fecha:* ${formatDate(selectedDate as string)}\n⏰ *Hora:* ${selectedTime}\n\nReservado con MiCita ✨`;
                    await Share.share({ message });
                  } catch (error) {
                    // ignore
                  }
                }}
                variant="ghost"
                size="small"
                icon={<IconSymbol name="square.and.arrow.up" size={16} color={Colors.light.primary} />}
              />
            </View>
          </Card>
        </View>

        {/* Información Importante (Términos + Política) */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Información Importante</Text>
          <Card variant="elevated" padding="medium">
            <View style={styles.termsContainer}>
              <View style={styles.termsContent}>
                <View style={styles.termItem}>
                  <IconSymbol name="clock.arrow.circlepath" size={16} color={Colors.light.textSecondary} />
                  <Text style={styles.termText}>Cancelación gratuita hasta 2 horas antes</Text>
                </View>
                <View style={styles.termItem}>
                  <IconSymbol name="figure.walk" size={16} color={Colors.light.textSecondary} />
                  <Text style={styles.termText}>Llega 10 minutos antes de tu cita</Text>
                </View>
                <View style={styles.termItem}>
                  <IconSymbol name="creditcard" size={16} color={Colors.light.textSecondary} />
                  <Text style={styles.termText}>Pago al finalizar el servicio</Text>
                </View>

                <View style={[styles.termItem, { marginTop: 8 }]}>
                  <IconSymbol name="exclamationmark.triangle.fill" size={16} color={Colors.light.warning} />
                  <Text style={[styles.termText, { color: Colors.light.warning }]}>
                    Cancelación tardía: 50% de recargo
                  </Text>
                </View>
              </View>
            </View>
          </Card>
        </View>
      </ScrollView>

      {/* Botones de acción */}
      <View style={[styles.bottomSection, { paddingBottom: Math.max(insets.bottom + 20, 40) }]}>
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
            icon={<IconSymbol name="checkmark" size={16} color={Colors.light.textOnPrimary} />}
          />
        </View>

        <Text style={styles.confirmationNote}>
          Al confirmar, aceptas nuestros términos y condiciones
        </Text>
      </View>


      <ConfirmationModal
        visible={showSuccessModal}
        title="¡Reserva Confirmada!"
        message="Tu cita ha sido reservada exitosamente. Recibirás una confirmación por email."
        confirmText="Ver Mis Citas"
        cancelText="Volver al Inicio"
        onConfirm={() => {
          setShowSuccessModal(false);
          router.push('/(tabs)/bookings');
        }}
        onCancel={() => {
          setShowSuccessModal(false);
          router.push('/(tabs)');
        }}
      />
    </KeyboardAvoidingView >
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
    paddingHorizontal: DesignTokens.spacing.xl,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: DesignTokens.spacing.sm, // Reduced
    backgroundColor: Colors.light.background,
  },
  // Removed providerName and stepText styles
  section: {
    paddingHorizontal: DesignTokens.spacing.xl,
    marginBottom: DesignTokens.spacing.md, // Reduced from xl
  },
  termsSection: {
    marginBottom: DesignTokens.spacing.sm,
  },
  policySection: {
    marginBottom: DesignTokens.spacing.xl,
  },
  sectionTitle: {
    fontSize: DesignTokens.typography.fontSizes.lg,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: DesignTokens.spacing.sm, // Reduced from lg
  },
  summaryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: DesignTokens.spacing.md, // Reduced from lg
  },
  summaryContent: {
    marginLeft: DesignTokens.spacing.md,
    flex: 1,
  },
  summaryLabel: {
    fontSize: DesignTokens.typography.fontSizes.sm,
    color: Colors.light.text,
    marginBottom: 2,
  },
  summaryValue: {
    fontSize: DesignTokens.typography.fontSizes.md,
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
    fontSize: DesignTokens.typography.fontSizes.md,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: DesignTokens.spacing.xs,
  },
  providerCategory: {
    fontSize: DesignTokens.typography.fontSizes.sm,
    color: Colors.light.text,
    marginBottom: DesignTokens.spacing.sm,
  },
  providerAddress: {
    fontSize: DesignTokens.typography.fontSizes.sm,
    color: Colors.light.text,
    marginBottom: DesignTokens.spacing.xs,
  },
  providerPhone: {
    fontSize: DesignTokens.typography.fontSizes.sm,
    color: Colors.light.text,
  },
  notesLabel: {
    fontSize: DesignTokens.typography.fontSizes.sm,
    color: Colors.light.text,
    marginBottom: DesignTokens.spacing.md,
  },
  notesInput: {
    backgroundColor: Colors.light.surfaceVariant,
    borderRadius: DesignTokens.radius.md,
    padding: DesignTokens.spacing.md,
    minHeight: 80,
    color: Colors.light.text,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  notesCounter: {
    fontSize: DesignTokens.typography.fontSizes.xs,
    color: Colors.light.textSecondary,
    textAlign: 'right',
    marginTop: DesignTokens.spacing.sm,
  },
  termsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: DesignTokens.spacing.md,
  },
  termsContent: {
    flex: 1,
  },
  termsTitle: {
    fontSize: DesignTokens.typography.fontSizes.sm,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 10,
  },
  termsText: {
    fontSize: DesignTokens.typography.fontSizes.xs,
    color: Colors.light.text,
    lineHeight: 20,
  },
  policyContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: DesignTokens.spacing.md,
  },
  policyContent: {
    flex: 1,
  },
  policyTitle: {
    fontSize: DesignTokens.typography.fontSizes.sm,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 10,
  },
  policyText: {
    fontSize: DesignTokens.typography.fontSizes.xs,
    color: Colors.light.textSecondary,
    lineHeight: 20,
  },
  bottomSection: {
    padding: DesignTokens.spacing.xl,
    paddingBottom: Platform.OS === 'ios' ? 80 : 40,
    backgroundColor: Colors.light.background,
    borderTopWidth: 1,
    borderTopColor: Colors.light.borderLight,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: DesignTokens.spacing.md,
    marginBottom: DesignTokens.spacing.md,
  },
  cancelButton: {
    flex: 1,
  },
  confirmButton: {
    flex: 2,
  },
  confirmationNote: {
    fontSize: DesignTokens.typography.fontSizes.xs,
    color: Colors.light.textTertiary,
    textAlign: 'center',
    lineHeight: 16,
  },
  termItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: DesignTokens.spacing.sm,
    gap: DesignTokens.spacing.sm,
  },
  termText: {
    fontSize: DesignTokens.typography.fontSizes.sm,
    color: Colors.light.text,
    flex: 1,
  },
  policyCard: {
    backgroundColor: Colors.light.warning + '10',
    borderColor: Colors.light.warning + '30',
    borderWidth: 1,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 8,
  },
});
