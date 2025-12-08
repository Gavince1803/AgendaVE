// 📱 Pantalla de Reserva de Servicio
// Permite al cliente seleccionar fecha y hora para reservar un servicio

import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  type TextStyle
} from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Button } from '@/components/ui/Button';
import { Calendar } from '@/components/ui/Calendar';
import { Card } from '@/components/ui/Card';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { TabSafeAreaView } from '@/components/ui/SafeAreaView';
import { Colors, DesignTokens } from '@/constants/Colors';
import { BookingService, type AppointmentValidationResult, type Provider, type Service } from '@/lib/booking-service';
import { LogCategory, useLogger } from '@/lib/logger';

export default function BookServiceScreen() {
  const {
    providerId,
    serviceId,
    rescheduleId,
    mode
  } = useLocalSearchParams<{
    providerId: string;
    serviceId: string;
    rescheduleId?: string;
    mode?: string;
  }>();

  const [provider, setProvider] = useState<Provider | null>(null);
  const [service, setService] = useState<Service | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [slotValidation, setSlotValidation] = useState<AppointmentValidationResult | null>(null);
  const [slotValidationStatus, setSlotValidationStatus] = useState<'idle' | 'checking' | 'ok' | 'error'>('idle');
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [availableDates, setAvailableDates] = useState<{ date: string; slots: number }[]>([]); // New state for availability levels
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState({ title: '', message: '' });
  // Removed showDatePicker state as custom Calendar is always visible
  const log = useLogger();
  const defaultValidationSettings = useMemo(
    () => ({
      bufferBeforeMinutes: 0,
      bufferAfterMinutes: 0,
      allowOverlaps: false,
      cancellationPolicyHours: 0,
      cancellationPolicyMessage: '',
      reminderLeadTimeMinutes: 0,
    }),
    []
  );

  // Smooth auto-scroll handling
  const scrollRef = useRef<ScrollView | null>(null);
  const timeSectionYRef = useRef<number>(0);

  const loadData = useCallback(async () => {
    if (!providerId || !serviceId) return;

    try {
      setLoading(true);
      log.info(LogCategory.DATABASE, 'Loading booking data', { providerId, serviceId });

      // Cargar datos del proveedor y servicio
      const [providerData, servicesData] = await Promise.all([
        BookingService.getProviderDetails(providerId),
        BookingService.getProviderServices(providerId)
      ]);

      setProvider(providerData);
      const serviceData = servicesData.find(s => s.id === serviceId);
      setService(serviceData || null);

      log.info(LogCategory.DATABASE, 'Booking data loaded successfully', {
        provider: providerData?.business_name,
        service: serviceData?.name
      });
    } catch (error) {
      log.error(LogCategory.SERVICE, 'Error loading booking data', error);
      Alert.alert('Error', 'No se pudo cargar la información del servicio');
    } finally {
      setLoading(false);
    }
  }, [log, providerId, serviceId]);

  const loadAvailableSlots = useCallback(async () => {
    if (!providerId || !selectedDate) return;

    try {
      const dateString = selectedDate.toISOString().split('T')[0];
      const dayOfWeek = selectedDate.getDay();
      const weekdayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

      console.log('🔴 [BOOK SERVICE] Loading slots for:', {
        providerId,
        dateString,
        dayOfWeek,
        dayName: weekdayNames[dayOfWeek]
      });

      const slots = await BookingService.getAvailableSlots(providerId, dateString, serviceId);
      setAvailableSlots(slots);

      console.log('🔴 [BOOK SERVICE] Slots loaded:', {
        date: dateString,
        slotsCount: slots.length,
        slots
      });

      log.info(LogCategory.DATABASE, 'Available slots loaded', {
        date: dateString,
        slotsCount: slots.length
      });
    } catch (error) {
      console.error('🔴 [BOOK SERVICE] Error loading available slots:', error);
      log.error(LogCategory.SERVICE, 'Error loading available slots', error);
      setAvailableSlots([]);
    }
  }, [providerId, selectedDate, serviceId, log]);

  // Load monthly availability for calendar dots
  const loadMonthAvailability = useCallback(async () => {
    if (!providerId || !serviceId) return;

    // Calculate range: from today to +30 days (or generic month range if needed)
    // For now, let's just checking next 60 days to cover current and next month view
    const start = new Date();
    start.setDate(start.getDate() - 1); // Buffer: Start from yesterday to cover timezone offsets
    const end = new Date();
    end.setDate(end.getDate() + 60);

    const startDateStr = start.toISOString().split('T')[0];
    const endDateStr = end.toISOString().split('T')[0];

    try {
      const dates = await BookingService.getDaysWithAvailability(providerId, startDateStr, endDateStr, serviceId);
      setAvailableDates(dates);
    } catch (e) {
      console.error('Error loading month availability', e);
    }
  }, [providerId, serviceId]);

  useEffect(() => {
    loadData();
    loadMonthAvailability(); // Fetch dots on mount
  }, [loadData, loadMonthAvailability]);

  useEffect(() => {
    loadAvailableSlots();
  }, [loadAvailableSlots]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    await loadData();
    await loadMonthAvailability();
    await loadAvailableSlots();
    setRefreshing(false);
  };

  const handleCalendarSelect = (dateString: string) => {
    // Calendar returns YYYY-MM-DD string
    // Create date object at noon to avoid timezone shift issues when displaying
    const dateParts = dateString.split('-').map(Number);
    const newDate = new Date(dateParts[0], dateParts[1] - 1, dateParts[2], 12, 0, 0);

    setSelectedDate(newDate);
    setSelectedTime('');

    // Smooth scroll
    setTimeout(() => {
      if (scrollRef.current && timeSectionYRef.current > 0) {
        scrollRef.current.scrollTo({ y: timeSectionYRef.current - 12, animated: true });
      }
    }, 120);
  };
  // Removed handleDateChange and handleWebDateChange as they are replaced by handleCalendarSelect



  const handleTimeSelect = (time: string) => {
    setSelectedTime(time);
    log.userAction('Select time slot', { time, date: selectedDate.toISOString().split('T')[0] });
  };

  useEffect(() => {
    if (!selectedTime || !service || !provider) {
      setSlotValidation(null);
      setSlotValidationStatus('idle');
      return;
    }

    let isMounted = true;
    const validate = async () => {
      setSlotValidationStatus('checking');
      try {
        const validation = await BookingService.validateAppointmentSlot({
          providerId: provider.id,
          serviceId: service.id,
          appointmentDate: selectedDate.toISOString().split('T')[0],
          appointmentTime: selectedTime,
          ignoreAppointmentId: mode === 'reschedule' && rescheduleId ? rescheduleId : undefined,
        });

        if (!isMounted) {
          return;
        }

        setSlotValidation(validation);
        setSlotValidationStatus(validation.ok ? 'ok' : 'error');
      } catch (error) {
        if (!isMounted) {
          return;
        }

        const message = error instanceof Error ? error.message : 'No se pudo validar la disponibilidad.';
        setSlotValidation({
          ok: false,
          reason: 'conflict',
          message,
          settings: defaultValidationSettings,
        });
        setSlotValidationStatus('error');
      }
    };

    validate();

    return () => {
      isMounted = false;
    };
  }, [
    selectedTime,
    selectedDate,
    service,
    provider,
    rescheduleId,
    mode,
    defaultValidationSettings,
  ]);

  const handleBookAppointment = async () => {
    if (!selectedTime || !service || !provider) {
      Alert.alert('Error', 'Por favor selecciona una hora disponible');
      return;
    }

    // Show confirmation dialog before booking
    const bookingDetails = `Servicio: ${service.name}\nProveedor: ${provider.business_name}\nFecha: ${formatDate(selectedDate)}\nHora: ${selectedTime}\nDuración: ${formatDuration(service.duration_minutes)}\nPrecio: ${formatPrice(service.price_amount)}`;

    Alert.alert(
      'Confirmar Reserva',
      `¿Estás seguro de que quieres hacer esta reserva?\n\n${bookingDetails}\n\nSe enviará una solicitud al proveedor y te notificaremos cuando sea confirmada.`,
      [
        {
          text: 'Cancelar',
          style: 'cancel'
        },
        {
          text: 'Confirmar Reserva',
          style: 'default',
          onPress: createAppointment
        }
      ]
    );
  };

  const createAppointment = async () => {
    if (!selectedTime || !service || !provider) return;

    try {
      setBooking(true);
      const isRescheduling = mode === 'reschedule' && rescheduleId;

      log.userAction(isRescheduling ? 'Reschedule appointment' : 'Book appointment', {
        providerId: provider.id,
        serviceId: service.id,
        date: selectedDate.toISOString().split('T')[0],
        time: selectedTime,
        originalAppointmentId: rescheduleId
      });

      const validation = await BookingService.validateAppointmentSlot({
        providerId: provider.id,
        serviceId: service.id,
        appointmentDate: selectedDate.toISOString().split('T')[0],
        appointmentTime: selectedTime,
        ignoreAppointmentId: isRescheduling && rescheduleId ? rescheduleId : undefined,
      });

      if (!validation.ok) {
        setSlotValidation(validation);
        setSlotValidationStatus('error');
        Alert.alert('Horario no disponible', validation.message || 'Este horario ya fue tomado.');
        return;
      }

      let appointment;
      if (isRescheduling) {
        // Update existing appointment with new date/time
        appointment = await BookingService.updateAppointment(rescheduleId, {
          appointment_date: selectedDate.toISOString().split('T')[0],
          appointment_time: selectedTime,
        });

        // Reset status to pending for provider confirmation
        appointment = await BookingService.updateAppointmentStatus(rescheduleId, 'pending');
      } else {
        // Create new appointment
        appointment = await BookingService.createAppointment(
          provider.id,
          service.id,
          selectedDate.toISOString().split('T')[0],
          selectedTime
        );
      }

      log.info(LogCategory.DATABASE, isRescheduling ? 'Appointment rescheduled successfully' : 'Appointment created successfully', { appointmentId: appointment.id });

      const successTitle = isRescheduling ? '¡Cita Reprogramada!' : '¡Reserva Confirmada!';
      const successMessageText = isRescheduling
        ? `Tu cita ha sido reprogramada para el ${formatDate(selectedDate)} a las ${selectedTime}. El proveedor confirmará el nuevo horario pronto.`
        : `Tu cita ha sido solicitada para el ${formatDate(selectedDate)} a las ${selectedTime}. El proveedor te confirmará pronto.`;

      setSuccessMessage({ title: successTitle, message: successMessageText });
      setShowSuccessModal(true);
    } catch (error) {
      log.error(LogCategory.SERVICE, 'Error creating appointment', error);

      const errorMessage = error instanceof Error ? error.message : 'No se pudo crear la reserva. Inténtalo de nuevo.';
      Alert.alert('Error', errorMessage);
    } finally {
      setBooking(false);
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('es-VE', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatPrice = (price: number) => {
    return `$${price.toLocaleString('en-US')}`;
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}min` : `${hours}h`;
  };

  if (loading) {
    return (
      <TabSafeAreaView style={styles.container}>
        <ThemedView style={styles.loadingContainer}>
          <ThemedText style={styles.loadingText}>Cargando información...</ThemedText>
        </ThemedView>
      </TabSafeAreaView>
    );
  }

  if (!provider || !service) {
    return (
      <TabSafeAreaView style={styles.container}>
        <ThemedView style={styles.errorContainer}>
          <ThemedText style={styles.errorText}>Información no encontrada</ThemedText>
          <Button
            title="Volver"
            onPress={() => router.back()}
            style={styles.backButton}
          />
        </ThemedView>
      </TabSafeAreaView>
    );
  }

  return (
    <TabSafeAreaView style={styles.container}>
      <ScrollView
        ref={scrollRef}
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Header del Servicio - Redesigned */}
        <ThemedView style={styles.section}>
          <ThemedView style={styles.sectionCard}>
            <ThemedView style={styles.headerContent}>
              <ThemedText style={styles.providerName}>{provider.business_name}</ThemedText>
              <ThemedText style={styles.serviceName}>{service.name}</ThemedText>

              <ThemedView style={styles.serviceDetails}>
                <ThemedView style={styles.durationBadge}>
                  <IconSymbol name="clock" size={12} color={Colors.light.textSecondary} />
                  <ThemedText style={styles.durationText}>{formatDuration(service.duration_minutes)}</ThemedText>
                </ThemedView>
                <ThemedText style={styles.servicePrice}>{formatPrice(service.price_amount)}</ThemedText>
              </ThemedView>

              {service.description && (
                <ThemedText style={styles.serviceDescription}>{service.description}</ThemedText>
              )}
            </ThemedView>
          </ThemedView>
        </ThemedView>

        {/* Selección de Fecha */}
        <ThemedView
          style={styles.section}
          onLayout={(e) => {
            // Date section position is not used currently, but retained for extensibility
          }}
        >
          <ThemedText style={styles.sectionTitle}>Selecciona la Fecha</ThemedText>
          <Calendar
            selectedDate={selectedDate.toISOString().split('T')[0]}
            onDateSelect={handleCalendarSelect}
            availableDates={availableDates}
            minDate={new Date()}
          />
        </ThemedView>

        {/* Selección de Hora */}
        <ThemedView
          style={styles.section}
          onLayout={(e) => {
            timeSectionYRef.current = e.nativeEvent.layout.y;
          }}
        >
          <ThemedText style={styles.sectionTitle}>Selecciona la Hora</ThemedText>
          {availableSlots.length > 0 ? (
            <ThemedView style={styles.timeSlotsContainer}>
              {availableSlots.map((time) => (
                <TouchableOpacity
                  key={time}
                  style={[
                    styles.timeSlot,
                    selectedTime === time && styles.selectedTimeSlot
                  ]}
                  onPress={() => handleTimeSelect(time)}
                >
                  <ThemedText style={[
                    styles.timeSlotText,
                    selectedTime === time && styles.selectedTimeSlotText
                  ]}>
                    {time}
                  </ThemedText>
                </TouchableOpacity>
              ))}
            </ThemedView>
          ) : (
            <Card variant="outlined" style={styles.noSlotsCard}>
              <ThemedText style={styles.noSlotsText}>
                No hay horarios disponibles para esta fecha
              </ThemedText>
            </Card>
          )}
          {slotValidationStatus === 'checking' && (
            <ThemedText style={styles.slotStatusInfo}>
              Verificando disponibilidad en tiempo real...
            </ThemedText>
          )}
          {slotValidationStatus === 'error' && slotValidation?.message && (
            <Card variant="outlined" style={styles.slotWarningCard}>
              <IconSymbol name="exclamationmark.triangle" size={16} color={Colors.light.warning} />
              <ThemedText style={styles.slotWarningText}>{slotValidation.message}</ThemedText>
            </Card>
          )}
          {slotValidationStatus === 'ok' && (
            <ThemedText style={styles.slotStatusSuccess}>
              Horario disponible • sin conflictos
            </ThemedText>
          )}
        </ThemedView>

        {/* Botón de Reserva */}
        <ThemedView style={styles.section}>
          <Button
            title={booking ? (mode === 'reschedule' ? "Reprogramando..." : "Reservando...") : (mode === 'reschedule' ? "Confirmar Reprogramación" : "Confirmar Reserva")}
            onPress={handleBookAppointment}
            disabled={!selectedTime || booking || slotValidationStatus === 'error' || slotValidationStatus === 'checking'}
            style={styles.bookButton}
            size="large"
          />
        </ThemedView>
      </ScrollView>



      <ConfirmationModal
        visible={showSuccessModal}
        title={successMessage.title}
        message={successMessage.message}
        confirmText="Ver Mis Citas"
        cancelText="Continuar"
        onConfirm={() => {
          setShowSuccessModal(false);
          router.push('/(tabs)/bookings');
        }}
        onCancel={() => {
          setShowSuccessModal(false);
          router.back();
        }}
      />
    </TabSafeAreaView >
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
  scrollContent: {
    paddingBottom: DesignTokens.spacing['6xl'],
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: DesignTokens.typography.fontSizes.lg,
    color: Colors.light.textSecondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: DesignTokens.spacing.xl,
  },
  errorText: {
    fontSize: DesignTokens.typography.fontSizes.lg,
    color: Colors.light.textSecondary,
    marginBottom: DesignTokens.spacing.lg,
    textAlign: 'center',
  },
  backButton: {
    marginTop: DesignTokens.spacing.md,
  },
  sectionCard: {
    backgroundColor: Colors.light.surface,
    borderRadius: DesignTokens.radius['2xl'],
    padding: DesignTokens.spacing.lg,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  headerContent: {
    gap: DesignTokens.spacing.sm,
  },
  providerName: {
    fontSize: DesignTokens.typography.fontSizes.lg,
    color: Colors.light.textSecondary,
  },
  serviceName: {
    fontSize: DesignTokens.typography.fontSizes['2xl'],
    fontWeight: DesignTokens.typography.fontWeights.bold as TextStyle['fontWeight'],
    color: Colors.light.text,
  },
  serviceDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: DesignTokens.spacing.sm,
  },
  durationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DesignTokens.spacing.xs,
    paddingHorizontal: DesignTokens.spacing.sm,
    paddingVertical: DesignTokens.spacing.xs,
    backgroundColor: Colors.light.surfaceVariant,
    borderRadius: DesignTokens.radius.md,
    alignSelf: 'flex-start',
  },
  durationText: {
    fontSize: DesignTokens.typography.fontSizes.xs,
    color: Colors.light.textSecondary,
  },
  servicePrice: {
    fontSize: DesignTokens.typography.fontSizes.xl,
    fontWeight: DesignTokens.typography.fontWeights.bold as TextStyle['fontWeight'],
    color: Colors.light.primary,
  },
  serviceDescription: {
    fontSize: DesignTokens.typography.fontSizes.base,
    color: Colors.light.text,
    lineHeight: 22,
    marginTop: DesignTokens.spacing.sm,
  },
  section: {
    marginHorizontal: DesignTokens.spacing.lg,
    marginBottom: DesignTokens.spacing.xl,
  },
  sectionTitle: {
    fontSize: DesignTokens.typography.fontSizes.xl,
    fontWeight: DesignTokens.typography.fontWeights.bold as TextStyle['fontWeight'],
    color: Colors.light.text,
    marginBottom: DesignTokens.spacing.md,
  },


  timeSlotsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: DesignTokens.spacing.sm,
    justifyContent: 'flex-start',
  },
  slotStatusInfo: {
    marginTop: DesignTokens.spacing.md,
    color: Colors.light.textSecondary,
    fontSize: DesignTokens.typography.fontSizes.sm,
  },
  slotStatusSuccess: {
    marginTop: DesignTokens.spacing.md,
    color: Colors.light.success,
    fontSize: DesignTokens.typography.fontSizes.sm,
    fontWeight: DesignTokens.typography.fontWeights.medium as TextStyle['fontWeight'],
  },
  slotWarningCard: {
    marginTop: DesignTokens.spacing.md,
    padding: DesignTokens.spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: DesignTokens.spacing.sm,
    borderColor: Colors.light.warning,
    backgroundColor: Colors.light.warningBg,
  },
  slotWarningText: {
    flex: 1,
    color: Colors.light.warning,
    fontSize: DesignTokens.typography.fontSizes.sm,
  },
  timeSlot: {
    paddingHorizontal: DesignTokens.spacing.md,
    paddingVertical: DesignTokens.spacing.sm,
    backgroundColor: Colors.light.surface,
    borderRadius: DesignTokens.radius.lg,
    borderWidth: 1,
    borderColor: Colors.light.border,
    minWidth: 70,
    flex: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedTimeSlot: {
    backgroundColor: Colors.light.primary,
    borderColor: Colors.light.primary,
  },
  timeSlotText: {
    fontSize: DesignTokens.typography.fontSizes.sm,
    color: Colors.light.text,
    fontWeight: DesignTokens.typography.fontWeights.medium as TextStyle['fontWeight'],
    textAlign: 'center',
  },
  selectedTimeSlotText: {
    color: Colors.light.surface,
  },
  noSlotsCard: {
    padding: DesignTokens.spacing.xl,
    alignItems: 'center',
  },
  noSlotsText: {
    fontSize: DesignTokens.typography.fontSizes.base,
    color: Colors.light.textSecondary,
    textAlign: 'center',
  },
  bookButton: {
    marginTop: DesignTokens.spacing.lg,
  },

});
