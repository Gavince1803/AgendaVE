import { Button } from '@/components/ui/Button';
import { Calendar } from '@/components/ui/Calendar';
import { Card } from '@/components/ui/Card';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { CalendarSkeleton, TimeSlotsSkeleton } from '@/components/ui/LoadingStates';
import { TimeSlots } from '@/components/ui/TimeSlots';
import { Colors, DesignTokens } from '@/constants/Colors';
import { useAuth } from '@/contexts/AuthContext';
import { BookingService } from '@/lib/booking-service';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';



export default function TimeSelectionScreen() {
  const { user } = useAuth();
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
  const [availableDates, setAvailableDates] = useState<({ date: string; slots: number } | string)[]>([]);
  const [bookedDates] = useState<string[]>([]);
  const [loadingDates, setLoadingDates] = useState(false);

  // Generar horarios mock cuando Supabase falla


  // Cargar fechas disponibles al inicio y cuando cambian los parámetros clave
  const loadAvailableTimes = useCallback(async (date: string) => {
    if (!providerId || !serviceId) return [];

    setLoadingTimes(true);
    try {
      console.log('🔴 [TIME SELECTION] Loading times for date:', date);
      let slots: string[] = [];

      if (employeeId && employeeId !== '' && employeeId !== 'any') {
        slots = await BookingService.getEmployeeAvailableSlots(
          employeeId as string,
          providerId as string,
          date,
          serviceId as string
        );
      } else {
        slots = await BookingService.getAvailableSlots(
          providerId as string,
          date,
          serviceId as string
        );
      }

      setAvailableTimes(slots);
      return slots;
    } catch (error) {
      console.error('🔴 [TIME SELECTION] Error loading times:', error);
      setAvailableTimes([]);
      return [];
    } finally {
      setLoadingTimes(false);
    }
  }, [employeeId, providerId, serviceId]);

  // Auto-scroll to calendar on mount to show it immediately
  // Auto-scroll to time slots when they become available
  useEffect(() => {
    if (availableTimes.length > 0 && selectedDate) {
      // Delay to ensure layout is calculated and UI is ready
      setTimeout(() => {
        if (scrollRef.current && timeSlotsYRef.current > 0) {
          scrollRef.current.scrollTo({
            y: timeSlotsYRef.current - 20, // Add a bit more padding
            animated: true
          });
        }
      }, 200); // Faster autoscroll as requested
    }
  }, [availableTimes.length, selectedDate]);

  // Cargar horarios disponibles cuando se selecciona una fecha
  useEffect(() => {
    if (selectedDate && providerId) {
      loadAvailableTimes(selectedDate);
    } else {
      setAvailableTimes([]);
    }
  }, [selectedDate, providerId, loadAvailableTimes]);

  useEffect(() => {
    if (selectedDate && !selectedTime && availableTimes.length > 0) {
      setSelectedTime(availableTimes[0]);
    }
  }, [selectedDate, selectedTime, availableTimes]);



  const selectedDateRef = useRef<string | null>(selectedDate);

  useEffect(() => {
    selectedDateRef.current = selectedDate;
  }, [selectedDate]);

  const loadingDatesRef = useRef(false);

  const loadAvailableDates = useCallback(async () => {
    if (loadingDatesRef.current) return;

    loadingDatesRef.current = true;
    setLoadingDates(true);
    try {
      console.log('🔴 [TIME SELECTION] Loading available dates with counts:', { employeeId, providerId });

      const today = new Date();
      // Ensure we fetch from 'today' correctly regardless of UTC shift, by buffering -1 day
      const start = new Date(today);
      start.setDate(today.getDate() - 1);

      const end = new Date(today);
      end.setDate(today.getDate() + 30); // Check next 30 days

      const startDateStr = start.toISOString().split('T')[0];
      const endDateStr = end.toISOString().split('T')[0];

      // Use the optimized bulk fetch method that returns slot counts
      const datesWithSlots = await BookingService.getDaysWithAvailability(
        providerId as string,
        startDateStr,
        endDateStr,
        serviceId as string
      );

      console.log('🔴 [TIME SELECTION] Bulk availability loaded:', datesWithSlots.length, 'days');
      setAvailableDates(datesWithSlots);

    } catch (error) {
      console.error('🔴 [TIME SELECTION] Error loading available dates:', error);
      setAvailableDates([]);
    } finally {
      loadingDatesRef.current = false;
      setLoadingDates(false);
    }
  }, [employeeId, providerId, serviceId]);

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
    const getDateStr = (d: string | { date: string; slots: number }) => typeof d === 'string' ? d : d.date;

    const currentIndex = selectedDate ? availableDates.findIndex((d) => getDateStr(d) === selectedDate) : -1;
    const nextIndex = currentIndex >= 0 && currentIndex < availableDates.length - 1 ? currentIndex + 1 : 0;
    const nextDate = availableDates[nextIndex];
    handleDateSelect(getDateStr(nextDate));
  }, [availableDates, selectedDate, handleDateSelect]);



  const handleContinue = () => {
    if (!selectedDate || !selectedTime) return;

    // Check if user is logged in
    if (!user) {
      // Redirect to login with returnUrl
      const returnUrl = `/(booking)/booking-confirmation?providerId=${providerId}&providerName=${providerName}&serviceId=${serviceId}&serviceName=${serviceName}&servicePrice=${servicePrice}&serviceDuration=${serviceDuration}&employeeId=${employeeId || 'any'}&employeeName=${employeeName || ''}&selectedDate=${selectedDate}&selectedTime=${selectedTime}`;

      router.push({
        pathname: '/(auth)/login',
        params: { returnUrl }
      });
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
        employeeId: employeeId || 'any',
        employeeName: employeeName || '',
        selectedDate,
        selectedTime,
      }
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
        {/* Header Premium (Simplified) */}
        <View style={styles.header}>
          <View style={styles.stepIndicator}>
            <Text style={styles.stepText}>Paso 2 de 3 • Fecha y Hora</Text>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, styles.progressTwoThirds]} />
            </View>
            <View style={styles.progressSteps}>
              <View style={[styles.progressDot, styles.progressDotCompleted]} />
              <View style={[styles.progressDot, styles.progressDotActive]} />
              <View style={styles.progressDot} />
            </View>
          </View>
        </View>



        {/* Quick Date Selection (Para Viejitos) */}
        <View style={styles.quickDateSection}>
          <Text style={styles.sectionTitle}>Selección Rápida</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.quickDateScroll}>
            {(() => {
              const today = new Date();
              const tomorrow = new Date(today);
              tomorrow.setDate(today.getDate() + 1);

              const nextFriday = new Date(today);
              const daysUntilFriday = (5 - today.getDay() + 7) % 7;
              nextFriday.setDate(today.getDate() + (daysUntilFriday === 0 ? 7 : daysUntilFriday));

              const quickDates = [
                { label: 'Hoy', date: today.toISOString().split('T')[0] },
                { label: 'Mañana', date: tomorrow.toISOString().split('T')[0] },
                { label: 'Este Viernes', date: nextFriday.toISOString().split('T')[0] }
              ];

              return quickDates.map((qd) => {
                const isAvailable = availableDates.some(d => {
                  const dStr = typeof d === 'string' ? d : d.date;
                  return dStr === qd.date;
                });
                const isSelected = selectedDate === qd.date;

                return (
                  <TouchableOpacity
                    key={qd.label}
                    style={[
                      styles.quickDateButton,
                      isSelected && styles.quickDateButtonSelected,
                      !isAvailable && styles.quickDateButtonDisabled
                    ]}
                    onPress={() => isAvailable && handleDateSelect(qd.date)}
                    disabled={!isAvailable}
                  >
                    <Text style={[
                      styles.quickDateLabel,
                      isSelected && styles.quickDateLabelSelected,
                      !isAvailable && styles.quickDateLabelDisabled
                    ]}>
                      {qd.label}
                    </Text>
                    <Text style={[
                      styles.quickDateSubLabel,
                      isSelected && styles.quickDateSubLabelSelected,
                      !isAvailable && styles.quickDateSubLabelDisabled
                    ]}>
                      {new Date(qd.date).getDate()}
                    </Text>
                  </TouchableOpacity>
                );
              });
            })()}
          </ScrollView>
        </View>

        {/* Calendario */}
        {loadingDates ? (
          <CalendarSkeleton />
        ) : availableDates.length === 0 ? (
          <Card variant="elevated" padding="medium" style={styles.emptyStateCard}>
            <IconSymbol name="calendar.badge.clock" size={22} color={Colors.light.primary} />
            <Text style={styles.emptyStateTitle}>Sin disponibilidad inmediata</Text>
            <Text style={styles.emptyStateCopy}>
              No encontramos horarios en las próximas dos semanas.
            </Text>
            <Button
              title="Ver siguiente fecha disponible"
              onPress={selectNextAvailableDate}
              variant="primary"
              size="medium"
              style={styles.emptyStateButton}
            />
            <Button
              title="Actualizar disponibilidad"
              onPress={onRefresh}
              variant="ghost"
              size="small"
              style={{ marginTop: 8 }}
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
                variant="horizontal"
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

      {/* Botón de continuar premium + Resumen */}
      <View style={styles.bottomSection}>
        {/* Resumen del servicio en el footer */}
        <View style={styles.footerSummary}>
          <Text style={styles.footerServiceName}>{serviceName}</Text>
          <View style={styles.footerServiceDetails}>
            <Text style={styles.footerServiceText}>{serviceDuration} min</Text>
            <Text style={styles.footerServiceDot}>•</Text>
            <Text style={styles.footerServicePrice}>${servicePrice}</Text>
          </View>
        </View>

        <Button
          title="Continuar"
          onPress={handleContinue}
          variant="wellness"
          size="large"
          fullWidth
          elevated
          disabled={!selectedDate || !selectedTime}
          icon={<IconSymbol name="arrow.right" size={18} color={Colors.light.textOnPrimary} />}
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
    backgroundColor: Colors.light.background,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    paddingHorizontal: DesignTokens.spacing.lg,
    paddingTop: HEADER_PADDING_TOP,
    paddingBottom: DesignTokens.spacing.sm, // Reduced bottom padding
    backgroundColor: Colors.light.background,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.borderLight,
  },
  // Removed headerContent, providerName, providerSubtitle styles

  stepIndicator: {
    alignItems: 'center', // Center the progress bar
    width: '100%',
  },
  stepText: {
    fontSize: DesignTokens.typography.fontSizes.sm,
    fontWeight: '600',
    color: Colors.light.textSecondary,
    marginBottom: DesignTokens.spacing.xs, // Reduced margin
    letterSpacing: 0.5,
  },
  // ... (progressBar styles remain)

  quickDateSection: {
    paddingHorizontal: DesignTokens.spacing.lg,
    marginTop: DesignTokens.spacing.sm, // Reduced top margin
    marginBottom: DesignTokens.spacing.sm, // Reduced bottom margin
  },
  progressBar: {
    width: 120,
    height: 4,
    backgroundColor: Colors.light.borderLight,
    borderRadius: DesignTokens.radius.xs,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.light.primary,
    borderRadius: DesignTokens.radius.xs,
  },
  progressTwoThirds: {
    width: '66%',
  },
  progressSteps: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: DesignTokens.spacing.sm,
    gap: 6,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: DesignTokens.radius.xs,
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
    paddingHorizontal: DesignTokens.spacing.lg,
    paddingVertical: DesignTokens.spacing.sm,
    marginBottom: DesignTokens.spacing.sm,
  },
  compactSummaryText: {
    fontSize: DesignTokens.typography.fontSizes.md,
    color: Colors.light.textSecondary,
    fontWeight: '500',
    textAlign: 'center',
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  summaryTitle: {
    fontSize: DesignTokens.typography.fontSizes.xs,
    fontWeight: '600',
    color: Colors.light.textSecondary,
    marginLeft: DesignTokens.spacing.sm,
  },
  serviceName: {
    fontSize: DesignTokens.typography.fontSizes.base,
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
    fontSize: DesignTokens.typography.fontSizes.sm,
    color: Colors.light.textSecondary,
  },
  summaryPrice: {
    fontSize: DesignTokens.typography.fontSizes.base,
    fontWeight: 'bold',
    color: Colors.light.success,
  },
  section: {
    paddingHorizontal: DesignTokens.spacing.xl,
    marginBottom: DesignTokens.spacing.xl,
  },
  sectionTitle: {
    fontSize: DesignTokens.typography.fontSizes.lg,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: DesignTokens.spacing.lg,
  },
  timeSlotsSection: {
    flex: 1,
    marginHorizontal: DesignTokens.spacing.lg,
  },
  emptySlotsCard: {
    marginTop: DesignTokens.spacing.md,
    gap: DesignTokens.spacing.md,
  },
  emptySlotsContent: {
    gap: 4,
  },
  emptySlotsTitle: {
    fontSize: DesignTokens.typography.fontSizes.base,
    fontWeight: '600',
    color: Colors.light.text,
  },
  emptySlotsCopy: {
    fontSize: DesignTokens.typography.fontSizes.sm,
    color: Colors.light.textSecondary,
    lineHeight: 18,
  },
  emptySlotsButton: {
    alignSelf: 'flex-start',
  },
  selectionSummary: {
    paddingHorizontal: DesignTokens.spacing.xl,
    marginBottom: DesignTokens.spacing.xl,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: DesignTokens.spacing.sm,
  },
  summaryLabel: {
    fontSize: DesignTokens.typography.fontSizes.sm,
    color: Colors.light.textSecondary,
  },
  summaryValue: {
    fontSize: DesignTokens.typography.fontSizes.sm,
    fontWeight: '500',
    color: Colors.light.text,
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: Colors.light.borderLight,
    paddingTop: DesignTokens.spacing.sm,
    marginTop: DesignTokens.spacing.sm,
  },
  totalLabel: {
    fontSize: DesignTokens.typography.fontSizes.md,
    fontWeight: '600',
    color: Colors.light.text,
  },
  totalValue: {
    fontSize: DesignTokens.typography.fontSizes.lg,
    fontWeight: 'bold',
    color: Colors.light.success,
  },
  bottomSection: {
    padding: DesignTokens.spacing.xl,
    paddingBottom: BOTTOM_PADDING,
    backgroundColor: Colors.light.background,
    borderTopWidth: 1,
    borderTopColor: Colors.light.borderLight,
    ...DesignTokens.elevation.lg,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    elevation: 20,
    zIndex: 100,
  },
  loadingContainer: {
    backgroundColor: Colors.light.background,
    borderRadius: DesignTokens.radius.xl,
    padding: DesignTokens.spacing['4xl'],
    margin: DesignTokens.spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: DesignTokens.typography.fontSizes.md,
    color: Colors.light.textSecondary,
    textAlign: 'center',
  },
  emptyStateCard: {
    marginHorizontal: DesignTokens.spacing.lg,
    alignItems: 'center',
    gap: DesignTokens.spacing.md,
  },
  emptyStateTitle: {
    fontSize: DesignTokens.typography.fontSizes.md,
    fontWeight: '600',
    color: Colors.light.text,
    textAlign: 'center',
  },
  emptyStateCopy: {
    fontSize: DesignTokens.typography.fontSizes.sm,
    color: Colors.light.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  emptyStateButton: {
    alignSelf: 'stretch',
  },

  requirementText: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    textAlign: 'center',
    marginTop: 12,
    opacity: 0.8,
  },

  quickDateScroll: {
    gap: DesignTokens.spacing.sm,
  },
  quickDateButton: {
    paddingVertical: DesignTokens.spacing.md,
    paddingHorizontal: DesignTokens.spacing.lg,
    borderRadius: DesignTokens.radius.md,
    backgroundColor: Colors.light.surface,
    borderWidth: 1,
    borderColor: Colors.light.border,
    alignItems: 'center',
    minWidth: 100,
    ...DesignTokens.elevation.sm,
  },
  quickDateButtonSelected: {
    backgroundColor: Colors.light.primary,
    borderColor: Colors.light.primary,
  },
  quickDateButtonDisabled: {
    backgroundColor: Colors.light.background,
    borderColor: Colors.light.borderLight,
    opacity: 0.5,
  },
  quickDateLabel: {
    fontSize: DesignTokens.typography.fontSizes.sm,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 4,
  },
  quickDateLabelSelected: {
    color: Colors.light.textOnPrimary,
  },
  quickDateLabelDisabled: {
    color: Colors.light.textSecondary,
  },
  quickDateSubLabel: {
    fontSize: DesignTokens.typography.fontSizes.lg,
    fontWeight: 'bold',
    color: Colors.light.text,
  },
  quickDateSubLabelSelected: {
    color: Colors.light.textOnPrimary,
  },
  quickDateSubLabelDisabled: {
    color: Colors.light.textSecondary,
  },
  footerSummary: {
    marginBottom: DesignTokens.spacing.md,
    alignItems: 'center',
  },
  footerServiceName: {
    fontSize: DesignTokens.typography.fontSizes.lg,
    fontWeight: '700',
    color: Colors.light.text,
    marginBottom: 2,
  },
  footerServiceDetails: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  footerServiceText: {
    fontSize: DesignTokens.typography.fontSizes.sm,
    color: Colors.light.textSecondary,
  },
  footerServiceDot: {
    fontSize: DesignTokens.typography.fontSizes.sm,
    color: Colors.light.textSecondary,
    marginHorizontal: 6,
  },
  footerServicePrice: {
    fontSize: DesignTokens.typography.fontSizes.md,
    fontWeight: '700',
    color: Colors.light.primary,
  },
});
