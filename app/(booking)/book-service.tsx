// 📱 Pantalla de Reserva de Servicio
// Permite al cliente seleccionar fecha y hora para reservar un servicio

import DateTimePicker from '@react-native-community/datetimepicker';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
    Alert,
    Platform,
    RefreshControl,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
} from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { TabSafeAreaView } from '@/components/ui/SafeAreaView';
import { Colors, DesignTokens } from '@/constants/Colors';
import { BookingService, Provider, Service } from '@/lib/booking-service';
import { LogCategory, useLogger } from '@/lib/logger';

export default function BookServiceScreen() {
  const { 
    providerId, 
    serviceId, 
    serviceName, 
    servicePrice, 
    serviceDuration,
    rescheduleId,
    mode
  } = useLocalSearchParams<{
    providerId: string;
    serviceId: string;
    serviceName: string;
    servicePrice: string;
    serviceDuration: string;
    rescheduleId?: string;
    mode?: string;
  }>();

  const [provider, setProvider] = useState<Provider | null>(null);
  const [service, setService] = useState<Service | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const log = useLogger();

  // Smooth auto-scroll handling
  const scrollRef = useRef<ScrollView | null>(null);
  const timeSectionYRef = useRef<number>(0);

  useEffect(() => {
    if (providerId && serviceId) {
      loadData();
    }
  }, [providerId, serviceId]);

  useEffect(() => {
    if (selectedDate && providerId) {
      loadAvailableSlots();
    }
  }, [selectedDate, providerId]);

  const loadData = async () => {
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
  };

  const loadAvailableSlots = async () => {
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
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    await loadAvailableSlots();
    setRefreshing(false);
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setSelectedDate(selectedDate);
      setSelectedTime(''); // Reset selected time when date changes
      // Smooth scroll to time slots section shortly after selecting the date
      setTimeout(() => {
        if (scrollRef.current && timeSectionYRef.current > 0) {
          scrollRef.current.scrollTo({ y: timeSectionYRef.current - 12, animated: true });
        }
      }, 120);
    }
  };

  const handleWebDateChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedDate = new Date(event.target.value);
    setSelectedDate(selectedDate);
    setSelectedTime(''); // Reset selected time when date changes
    // Smooth scroll to time slots on web as well
    setTimeout(() => {
      if (scrollRef.current && timeSectionYRef.current > 0) {
        scrollRef.current.scrollTo({ y: timeSectionYRef.current - 12, animated: true });
      }
    }, 120);
  };

  const handleTimeSelect = (time: string) => {
    setSelectedTime(time);
    log.userAction('Select time slot', { time, date: selectedDate.toISOString().split('T')[0] });
  };

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
      const successMessage = isRescheduling 
        ? `Tu cita ha sido reprogramada para el ${formatDate(selectedDate)} a las ${selectedTime}. El proveedor confirmará el nuevo horario pronto.`
        : `Tu cita ha sido solicitada para el ${formatDate(selectedDate)} a las ${selectedTime}. El proveedor te confirmará pronto.`;

      Alert.alert(
        successTitle,
        successMessage,
        [
          {
            text: 'Ver Mis Citas',
            onPress: () => router.push('/(tabs)/bookings')
          },
          {
            text: 'Continuar',
            onPress: () => router.back()
          }
        ]
      );
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

  const isDateValid = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date >= today;
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
        {/* Header del Servicio */}
        <Card variant="elevated" style={styles.headerCard}>
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
        </Card>

        {/* Selección de Fecha */}
        <ThemedView
          style={styles.section}
          onLayout={(e) => {
            // Date section position is not used currently, but retained for extensibility
          }}
        >
          <ThemedText style={styles.sectionTitle}>Selecciona la Fecha</ThemedText>
          {Platform.OS === 'web' ? (
            // Web date input
            <input
              type="date"
              value={selectedDate.toISOString().split('T')[0]}
              min={new Date().toISOString().split('T')[0]}
              onChange={handleWebDateChange}
              style={{
                width: '100%',
                padding: 16,
                fontSize: 16,
                borderRadius: 12,
                border: `1px solid ${Colors.light.border}`,
                backgroundColor: Colors.light.surface,
                color: Colors.light.text
              }}
            />
          ) : (
            // Native date selector
            <TouchableOpacity
              style={styles.dateSelector}
              onPress={() => setShowDatePicker(true)}
            >
              <IconSymbol name="calendar" size={20} color={Colors.light.primary} />
              <ThemedText style={styles.dateText}>
                {formatDate(selectedDate)}
              </ThemedText>
              <IconSymbol name="chevron.right" size={16} color={Colors.light.textSecondary} />
            </TouchableOpacity>
          )}
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
        </ThemedView>

        {/* Botón de Reserva */}
        <ThemedView style={styles.section}>
          <Button
            title={booking ? (mode === 'reschedule' ? "Reprogramando..." : "Reservando...") : (mode === 'reschedule' ? "Confirmar Reprogramación" : "Confirmar Reserva")}
            onPress={handleBookAppointment}
            disabled={!selectedTime || booking}
            style={styles.bookButton}
            size="large"
          />
        </ThemedView>
      </ScrollView>

      {/* Date Picker - Native Only */}
      {Platform.OS !== 'web' && showDatePicker && (
        Platform.OS === 'ios' ? (
          <DateTimePicker
            value={selectedDate}
            mode="date"
            display="spinner"
            minimumDate={new Date()}
            onChange={handleDateChange}
            style={{
              backgroundColor: Colors.light.surface,
            }}
            textColor={Colors.light.text}
          />
        ) : (
          <DateTimePicker
            value={selectedDate}
            mode="date"
            display="default"
            minimumDate={new Date()}
            onChange={handleDateChange}
          />
        )
      )}
    </TabSafeAreaView>
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
  headerCard: {
    margin: DesignTokens.spacing.lg,
    padding: DesignTokens.spacing.xl,
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
    fontWeight: DesignTokens.typography.fontWeights.bold as any,
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
    fontWeight: DesignTokens.typography.fontWeights.bold as any,
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
    fontWeight: DesignTokens.typography.fontWeights.bold as any,
    color: Colors.light.text,
    marginBottom: DesignTokens.spacing.md,
  },
  dateSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: DesignTokens.spacing.lg,
    backgroundColor: Colors.light.surface,
    borderRadius: DesignTokens.radius.lg,
    borderWidth: 1,
    borderColor: Colors.light.border,
    gap: DesignTokens.spacing.md,
  },
  dateText: {
    flex: 1,
    fontSize: DesignTokens.typography.fontSizes.base,
    color: Colors.light.text,
  },
  timeSlotsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: DesignTokens.spacing.sm,
    justifyContent: 'flex-start',
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
    fontWeight: DesignTokens.typography.fontWeights.medium as any,
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
