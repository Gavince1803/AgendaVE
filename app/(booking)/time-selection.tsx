import { Button } from '@/components/ui/Button';
import { Calendar } from '@/components/ui/Calendar';
import { Card } from '@/components/ui/Card';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { CalendarSkeleton, TimeSlotsSkeleton } from '@/components/ui/LoadingStates';
import { TimeSlots } from '@/components/ui/TimeSlots';
import { Colors } from '@/constants/Colors';
import { BookingService } from '@/lib/booking-service';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
} from 'react-native';

type NextSlotSuggestion = {
  date: string;
  time: string;
  label: string;
  subtitle: string;
};

export default function TimeSelectionScreen() {
  const { 
    providerId, 
    providerName, 
    serviceId, 
    serviceName, 
    servicePrice, 
    serviceDuration,
    employeeId,
    employeeName
  } = useLocalSearchParams();
  
  const [refreshing, setRefreshing] = useState(false);
  const scrollRef = useRef<ScrollView | null>(null);
  const timeSlotsYRef = useRef<number>(0);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [availableTimes, setAvailableTimes] = useState<string[]>([]);
  const [loadingTimes, setLoadingTimes] = useState(false);
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [bookedDates] = useState<string[]>([]);
  const [loadingDates, setLoadingDates] = useState(false);
  const [nextAvailableSlots, setNextAvailableSlots] = useState<NextSlotSuggestion[]>([]);

  // Generar horarios mock cuando Supabase falla
  const generateMockTimes = (date: string) => {
    const times = [];
    const startHour = 9;
    const endHour = 18;
    const interval = 30; // 30 minutos
    
    for (let hour = startHour; hour < endHour; hour++) {
      for (let minutes = 0; minutes < 60; minutes += interval) {
        const timeString = `${hour.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
        const isAvailable = Math.random() > 0.3; // Simular disponibilidad
        
        times.push({
          time: timeString,
          displayTime: `${hour}:${minutes.toString().padStart(2, '0')}`,
          isAvailable,
        });
      }
    }
    
    return times.filter(t => t.isAvailable);
  };

  // Cargar fechas disponibles al inicio y cuando cambian los parámetros clave
  // Auto-scroll to calendar on mount to show it immediately
  useEffect(() => {
    // Scroll to show calendar after initial load, keeping some of service card visible
    setTimeout(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollTo({ y: 80, animated: true });
      }
    }, 300);
  }, []);

  const fetchSlots = useCallback(async (date: string) => {
    if (!providerId || !serviceId) {
      return [];
    }

    if (employeeId && employeeId !== '') {
      console.log('🔴 [TIME SELECTION] Loading employee slots for:', { employeeId, providerId, date, serviceId });
      return BookingService.getEmployeeAvailableSlots(employeeId as string, providerId as string, date, serviceId as string);
    }

    console.log('🔴 [TIME SELECTION] Loading provider slots for:', { providerId, date, serviceId });
    return BookingService.getAvailableSlots(providerId as string, date, serviceId as string);
  }, [employeeId, providerId, serviceId]);

  const loadAvailableTimes = useCallback(async (date: string) => {
    setLoadingTimes(true);
    try {
      const times = await fetchSlots(date);
      setAvailableTimes(times);
      console.log('🔴 [TIME SELECTION] Loaded times:', { date, serviceId, serviceDuration, timesCount: times.length, employeeId });
      return times;
    } catch (error) {
      console.error('Error loading available times:', error);
      const mockTimes = generateMockTimes(date);
      setAvailableTimes(mockTimes.map(t => t.time));
      return mockTimes.map(t => t.time);
    } finally {
      setLoadingTimes(false);
    }
  }, [fetchSlots, serviceDuration, employeeId, serviceId]);

  // Cargar horarios disponibles cuando se selecciona una fecha
  useEffect(() => {
    if (selectedDate && providerId) {
      loadAvailableTimes(selectedDate);
      setTimeout(() => {
        if (scrollRef.current && timeSlotsYRef.current > 0) {
          scrollRef.current.scrollTo({ y: timeSlotsYRef.current - 12, animated: true });
        }
      }, 100);
    } else {
      setAvailableTimes([]);
    }
  }, [selectedDate, providerId, loadAvailableTimes]);

  useEffect(() => {
    if (selectedDate && !selectedTime && availableTimes.length > 0) {
      setSelectedTime(availableTimes[0]);
    }
  }, [selectedDate, selectedTime, availableTimes]);

  const prefetchNextSlots = useCallback(async (dates: string[]) => {
    if (!dates.length || !providerId || !serviceId) {
      setNextAvailableSlots([]);
      return;
    }

    const suggestions: NextSlotSuggestion[] = [];
    for (const date of dates) {
      let slots: string[] = [];
      try {
        if (employeeId && employeeId !== '') {
          slots = await BookingService.getEmployeeAvailableSlots(employeeId as string, providerId as string, date, serviceId as string);
        } else {
          slots = await BookingService.getAvailableSlots(providerId as string, date, serviceId as string);
        }
      } catch (error) {
        console.warn('🔴 [TIME SELECTION] Prefetch slots failed:', error);
      }

      if (slots.length > 0) {
        const formatted = new Date(date).toLocaleDateString('es-ES', {
          weekday: 'short',
          day: 'numeric',
          month: 'short',
        });
        suggestions.push({
          date,
          time: slots[0],
          label: formatted,
          subtitle: `${slots[0]} • ${serviceName}`,
        });
      }
      if (suggestions.length >= 3) {
        break;
      }
    }

    setNextAvailableSlots(suggestions);
  }, [employeeId, providerId, serviceId, serviceName]);

  const selectedDateRef = useRef<string | null>(selectedDate);

  useEffect(() => {
    selectedDateRef.current = selectedDate;
  }, [selectedDate]);

  const loadingDatesRef = useRef(false);

  const loadAvailableDates = useCallback(async () => {
    if (loadingDatesRef.current) {
      console.log('🔴 [TIME SELECTION] Already loading dates, skipping...');
      return;
    }

    loadingDatesRef.current = true;
    setLoadingDates(true);
    try {
      console.log('🔴 [TIME SELECTION] Loading available dates for employee/provider:', { employeeId, providerId });
      const today = new Date();
      
      // Optimized: Check availability for fewer days initially (next 14 days)
      // and only check more if needed
      const daysToCheck = 14;
      const datePromises = [];
      
      for (let i = 0; i < daysToCheck; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() + i);
        const dateString = date.toISOString().split('T')[0];
        
        // Create promise for each date check
        const datePromise = (async () => {
          try {
            let hasAvailability = false;
            
            // Check if employee or provider has availability for this date
            if (employeeId && employeeId !== '') {
              // Check employee-specific availability
              const employeeSlots = await BookingService.getEmployeeAvailableSlots(
                employeeId as string, 
                providerId as string, 
                dateString, 
                serviceId as string
              );
              hasAvailability = employeeSlots.length > 0;
            } else {
              // Check provider availability
              const providerSlots = await BookingService.getAvailableSlots(
                providerId as string, 
                dateString, 
                serviceId as string
              );
              hasAvailability = providerSlots.length > 0;
            }
            
            return hasAvailability ? dateString : null;
          } catch (dateError) {
            // If there's an error checking this specific date, log it but continue
            console.warn('🔴 [TIME SELECTION] Error checking date availability:', dateString, dateError);
            return null;
          }
        })();
        
        datePromises.push(datePromise);
      }
      
      // Wait for all date checks to complete (parallel execution)
      const dateResults = await Promise.all(datePromises);
      const validDates = dateResults.filter(date => date !== null) as string[];
      
      console.log('🔴 [TIME SELECTION] Available dates found:', { 
        totalDatesChecked: daysToCheck, 
        availableDates: validDates.length, 
        dates: validDates 
      });
      
      setAvailableDates(validDates);
      if (!selectedDateRef.current && validDates.length > 0) {
        setSelectedDate(validDates[0]);
      }
      prefetchNextSlots(validDates.slice(0, 5));
      
    } catch (error) {
      console.error('🔴 [TIME SELECTION] Error loading available dates:', error);
      // Fallback: show next 7 days if there's an error
      const fallbackDates = [];
      const today = new Date();
      for (let i = 0; i < 7; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() + i);
        fallbackDates.push(date.toISOString().split('T')[0]);
      }
      setAvailableDates(fallbackDates);
    } finally {
      loadingDatesRef.current = false;
      setLoadingDates(false);
    }
  }, [employeeId, providerId, serviceId, prefetchNextSlots]);

  useEffect(() => {
    if (providerId && serviceId) {
      console.log('🔴 [TIME SELECTION] Loading available dates for:', { employeeId, providerId, serviceId });
      loadAvailableDates();
    }
  }, [employeeId, providerId, serviceId, loadAvailableDates]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadAvailableDates();
    if (selectedDate) {
      await loadAvailableTimes(selectedDate);
    }
    setRefreshing(false);
  }, [loadAvailableDates, loadAvailableTimes, selectedDate]);

  const handleDateSelect = useCallback((date: string) => {
    setSelectedDate(date);
    setSelectedTime(''); // Reset time when date changes
  }, []);

  const handleTimeSelect = (time: string) => {
    setSelectedTime(time);
  };

  const selectNextAvailableDate = useCallback(() => {
    if (!availableDates.length) {
      return;
    }
    const currentIndex = selectedDate ? availableDates.findIndex((date) => date === selectedDate) : -1;
    const nextIndex = currentIndex >= 0 && currentIndex < availableDates.length - 1 ? currentIndex + 1 : 0;
    handleDateSelect(availableDates[nextIndex]);
  }, [availableDates, selectedDate, handleDateSelect]);

  const handleQuickSlotSelect = useCallback(async (slot: NextSlotSuggestion) => {
    handleDateSelect(slot.date);
    const times = await loadAvailableTimes(slot.date);
    if (times?.includes(slot.time)) {
      setSelectedTime(slot.time);
    } else if (times && times.length > 0) {
      setSelectedTime(times[0]);
    }
  }, [handleDateSelect, loadAvailableTimes]);

  const handleContinue = () => {
    if (!selectedDate || !selectedTime) {
      return;
    }

    router.push({
      pathname: '/(booking)/booking-confirmation',
      params: {
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
      },
    });
  };

  const selectedDateData = selectedDate ? {
    date: selectedDate,
    displayDate: new Date(selectedDate).toLocaleDateString('es-ES', { 
      weekday: 'long', 
      day: 'numeric', 
      month: 'long' 
    })
  } : null;
  const selectedTimeData = selectedTime ? { time: selectedTime, displayTime: selectedTime } : null;

  return (
    <View style={styles.container}>
      <ScrollView
        ref={scrollRef}
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header Premium */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <Text style={styles.providerName}>{providerName}</Text>
            <Text style={styles.providerSubtitle}>Selecciona tu horario</Text>
          </View>
          <View style={styles.stepIndicator}>
            <Text style={styles.stepText}>Paso 2 de 3 • Fecha y Hora</Text>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: '66%' }]} />
            </View>
            <View style={styles.progressSteps}>
              <View style={[styles.progressDot, styles.progressDotCompleted]} />
              <View style={[styles.progressDot, styles.progressDotActive]} />
              <View style={styles.progressDot} />
            </View>
          </View>
        </View>

        {/* Resumen del servicio */}
        <View style={styles.serviceSummary}>
          <Card variant="elevated" padding="medium">
            <View style={styles.summaryHeader}>
              <IconSymbol name="scissors" size={20} color={Colors.light.primary} />
              <Text style={styles.summaryTitle}>Servicio Seleccionado</Text>
            </View>
            <Text style={styles.serviceName}>{serviceName}</Text>
            <View style={styles.summaryDetails}>
              <Text style={styles.summaryText}>Duración: {serviceDuration} min</Text>
              <Text style={styles.summaryPrice}>${servicePrice}</Text>
            </View>
          </Card>
        </View>

        {/* Calendario */}
        {loadingDates ? (
          <CalendarSkeleton />
        ) : availableDates.length === 0 ? (
          <Card variant="elevated" padding="medium" style={styles.emptyStateCard}>
            <IconSymbol name="calendar.badge.clock" size={22} color={Colors.light.primary} />
            <Text style={styles.emptyStateTitle}>Sin disponibilidad inmediata</Text>
            <Text style={styles.emptyStateCopy}>
              No encontramos horarios en las próximas dos semanas. Actualiza más tarde o prueba con otro profesional.
            </Text>
            <Button
              title="Actualizar disponibilidad"
              onPress={onRefresh}
              variant="primary"
              size="medium"
              style={styles.emptyStateButton}
            />
          </Card>
        ) : (
          <>
            <Calendar
              selectedDate={selectedDate}
              onDateSelect={handleDateSelect}
              availableDates={availableDates}
              bookedDates={bookedDates}
            />
            {nextAvailableSlots.length > 0 && (
              <View style={styles.quickSlotContainer}>
                <Text style={styles.sectionTitle}>Sugerencias rápidas</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.quickSlotScroll}
                >
                  {nextAvailableSlots.map((slot) => (
                    <TouchableOpacity
                      key={`${slot.date}-${slot.time}`}
                      style={styles.quickSlotPill}
                      onPress={() => handleQuickSlotSelect(slot)}
                    >
                      <IconSymbol name="calendar.badge.clock" size={18} color={Colors.light.primary} />
                      <View style={styles.quickSlotText}>
                        <Text style={styles.quickSlotLabel}>{slot.label}</Text>
                        <Text style={styles.quickSlotSubLabel}>{slot.subtitle}</Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}
          </>
        )}

        {/* Franjas horarias */}
        {selectedDate && (
          <View
            style={styles.timeSlotsSection}
            onLayout={(e) => {
              timeSlotsYRef.current = e.nativeEvent.layout.y;
            }}
          >
            <Text style={styles.sectionTitle}>Horarios disponibles</Text>
            {loadingTimes ? (
              <TimeSlotsSkeleton />
            ) : availableTimes.length === 0 ? (
              <Card variant="outlined" padding="medium" style={styles.emptySlotsCard}>
                <IconSymbol name="clock" size={20} color={Colors.light.warning} />
                <View style={styles.emptySlotsContent}>
                  <Text style={styles.emptySlotsTitle}>Sin espacios en esta fecha</Text>
                  <Text style={styles.emptySlotsCopy}>
                    Prueba con otra fecha o selecciona una sugerencia rápida.
                  </Text>
                </View>
                <Button
                  title="Ver siguiente fecha"
                  onPress={selectNextAvailableDate}
                  variant="outline"
                  size="small"
                  style={styles.emptySlotsButton}
                />
              </Card>
            ) : (
              <TimeSlots
                slots={availableTimes.map(time => ({
                  time,
                  isAvailable: true,
                  isSelected: selectedTime === time,
                  duration: parseInt(serviceDuration as string),
                }))}
                selectedTime={selectedTime}
                onTimeSelect={handleTimeSelect}
                slotDuration={parseInt(serviceDuration as string)}
              />
            )}
          </View>
        )}

        {/* Resumen de la selección */}
        {selectedDate && selectedTime && (
          <View style={styles.selectionSummary}>
            <Text style={styles.sectionTitle}>Resumen de la Cita</Text>
            <Card variant="elevated" padding="medium">
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Fecha:</Text>
                <Text style={styles.summaryValue}>{selectedDateData?.displayDate}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Hora:</Text>
                <Text style={styles.summaryValue}>{selectedTimeData?.displayTime}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Servicio:</Text>
                <Text style={styles.summaryValue}>{serviceName}</Text>
              </View>
              {employeeName && (
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Empleado:</Text>
                  <Text style={styles.summaryValue}>{employeeName}</Text>
                </View>
              )}
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Duración:</Text>
                <Text style={styles.summaryValue}>{serviceDuration} minutos</Text>
              </View>
              <View style={[styles.summaryRow, styles.totalRow]}>
                <Text style={styles.totalLabel}>Total:</Text>
                <Text style={styles.totalValue}>${servicePrice}</Text>
              </View>
            </Card>
          </View>
        )}
      </ScrollView>

      {/* Botón de continuar premium */}
      <View style={styles.bottomSection}>
        <Button
          title="Continuar a Confirmación"
          onPress={handleContinue}
          variant="wellness"
          size="large"
          fullWidth
          elevated
          disabled={!selectedDate || !selectedTime}
          icon={<IconSymbol name="arrow.right" size={18} color="#ffffff" />}
        />
        {(!selectedDate || !selectedTime) && (
          <Text style={styles.requirementText}>
            {!selectedDate ? 'Selecciona una fecha' : 'Selecciona un horario'}
          </Text>
        )}
      </View>
    </View>
  );
}

// Platform-specific constants
const HEADER_PADDING_TOP = Platform.OS === 'ios' ? 60 : 44;
const BOTTOM_PADDING = Platform.OS === 'ios' ? 40 : 20;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fafafa',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 16,
    paddingTop: HEADER_PADDING_TOP,
    backgroundColor: Colors.light.background,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.borderLight,
  },
  headerContent: {
    marginBottom: 12,
  },
  providerName: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.light.text,
    letterSpacing: -0.5,
  },
  providerSubtitle: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    marginTop: 2,
  },
  stepIndicator: {
    alignItems: 'flex-end',
  },
  stepText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.light.textSecondary,
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  progressBar: {
    width: 120,
    height: 4,
    backgroundColor: Colors.light.borderLight,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.light.primary,
    borderRadius: 2,
  },
  progressSteps: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 6,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.light.borderLight,
  },
  progressDotCompleted: {
    backgroundColor: Colors.light.primary,
  },
  progressDotActive: {
    backgroundColor: Colors.light.primary,
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  serviceSummary: {
    padding: 16,
    paddingTop: 12,
    paddingBottom: 12,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  summaryTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.light.textSecondary,
    marginLeft: 8,
  },
  serviceName: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 6,
  },
  summaryDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryText: {
    fontSize: 13,
    color: Colors.light.textSecondary,
  },
  summaryPrice: {
    fontSize: 15,
    fontWeight: 'bold',
    color: Colors.light.success,
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 16,
  },
  timeSlotsSection: {
    flex: 1,
    marginHorizontal: 16,
  },
  emptySlotsCard: {
    marginTop: 12,
    gap: 12,
  },
  emptySlotsContent: {
    gap: 4,
  },
  emptySlotsTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.light.text,
  },
  emptySlotsCopy: {
    fontSize: 13,
    color: Colors.light.textSecondary,
    lineHeight: 18,
  },
  emptySlotsButton: {
    alignSelf: 'flex-start',
  },
  selectionSummary: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: Colors.light.textSecondary,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.light.text,
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: Colors.light.borderLight,
    paddingTop: 8,
    marginTop: 8,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
  },
  totalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.light.success,
  },
  bottomSection: {
    padding: 20,
    paddingBottom: BOTTOM_PADDING,
    backgroundColor: Colors.light.background,
    borderTopWidth: 1,
    borderTopColor: Colors.light.borderLight,
  },
  loadingContainer: {
    backgroundColor: Colors.light.background,
    borderRadius: 16,
    padding: 40,
    margin: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: Colors.light.textSecondary,
    textAlign: 'center',
  },
  emptyStateCard: {
    marginHorizontal: 16,
    alignItems: 'center',
    gap: 12,
  },
  emptyStateTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
    textAlign: 'center',
  },
  emptyStateCopy: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  emptyStateButton: {
    alignSelf: 'stretch',
  },
  quickSlotContainer: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  quickSlotScroll: {
    paddingVertical: 8,
  },
  quickSlotPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    backgroundColor: Colors.light.surface,
    borderWidth: 1,
    borderColor: Colors.light.borderLight,
    marginRight: 12,
  },
  quickSlotText: {
    flexDirection: 'column',
    gap: 2,
  },
  quickSlotLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.text,
    textTransform: 'capitalize',
  },
  quickSlotSubLabel: {
    fontSize: 12,
    color: Colors.light.textSecondary,
  },
  requirementText: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    textAlign: 'center',
    marginTop: 12,
    opacity: 0.8,
  },
});
