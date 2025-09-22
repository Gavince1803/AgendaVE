import { Button } from '@/components/ui/Button';
import { Calendar } from '@/components/ui/Calendar';
import { Card } from '@/components/ui/Card';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { TimeSlots } from '@/components/ui/TimeSlots';
import { Colors } from '@/constants/Colors';
import { BookingService } from '@/lib/booking-service';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

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
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [availableTimes, setAvailableTimes] = useState<string[]>([]);
  const [loadingTimes, setLoadingTimes] = useState(false);
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [bookedDates, setBookedDates] = useState<string[]>([]);
  const [loadingDates, setLoadingDates] = useState(false);

  // Generar fechas disponibles (próximos 7 días)
  const generateAvailableDates = () => {
    const dates = [];
    const today = new Date();
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      
      const isToday = i === 0;
      const isTomorrow = i === 1;
      
      dates.push({
        date: date.toISOString().split('T')[0],
        displayDate: date.toLocaleDateString('es-ES', { 
          weekday: 'long', 
          day: 'numeric', 
          month: 'long' 
        }),
        shortDate: date.toLocaleDateString('es-ES', { 
          day: 'numeric', 
          month: 'short' 
        }),
        isToday,
        isTomorrow,
        isAvailable: true, // En una app real, esto vendría del backend
      });
    }
    
    return dates;
  };

  // Generar horarios disponibles
  const generateAvailableTimes = (date: string) => {
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
  useEffect(() => {
    if (providerId && serviceId && !loadingDates) {
      console.log('🔴 [TIME SELECTION] Loading available dates for:', { employeeId, providerId, serviceId });
      loadAvailableDates();
    }
  }, [employeeId, providerId, serviceId]);

  // Cargar horarios disponibles cuando se selecciona una fecha
  useEffect(() => {
    if (selectedDate && providerId) {
      loadAvailableTimes(selectedDate);
    } else {
      setAvailableTimes([]);
    }
  }, [selectedDate, providerId]);

  const loadAvailableTimes = async (date: string) => {
    setLoadingTimes(true);
    try {
      let times: string[] = [];
      
      // Use employee-specific availability if employee is selected
      if (employeeId && employeeId !== '') {
        console.log('🔴 [TIME SELECTION] Loading employee slots for:', { employeeId, providerId, date, serviceId });
        times = await BookingService.getEmployeeAvailableSlots(employeeId as string, providerId as string, date, serviceId as string);
      } else {
        console.log('🔴 [TIME SELECTION] Loading provider slots for:', { providerId, date, serviceId });
        times = await BookingService.getAvailableSlots(providerId as string, date, serviceId as string);
      }
      
      setAvailableTimes(times);
      console.log('🔴 [TIME SELECTION] Loaded times:', { date, serviceId, serviceDuration, timesCount: times.length, employeeId });
    } catch (error) {
      console.error('Error loading available times:', error);
      // Fallback a horarios mock si hay error
      const mockTimes = generateAvailableTimes(date);
      setAvailableTimes(mockTimes.map(t => t.time));
    } finally {
      setLoadingTimes(false);
    }
  };

  const loadAvailableDates = async () => {
    if (loadingDates) {
      console.log('🔴 [TIME SELECTION] Already loading dates, skipping...');
      return;
    }
    
    setLoadingDates(true);
    try {
      console.log('🔴 [TIME SELECTION] Loading available dates for employee/provider:', { employeeId, providerId });
      const availableDatesArray = [];
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
      
      // En una implementación real, aquí se cargarían las fechas ocupadas desde Supabase
      // const bookedDates = await BookingService.getBookedDates(providerId as string);
      // setBookedDates(bookedDates);
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
      setLoadingDates(false);
    }
  };

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  }, []);

  const handleDateSelect = (date: string) => {
    setSelectedDate(date);
    setSelectedTime(''); // Reset time when date changes
  };

  const handleTimeSelect = (time: string) => {
    setSelectedTime(time);
  };

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
            <Text style={styles.stepText}>Paso 2 de 3</Text>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: '66%' }]} />
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
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Cargando fechas disponibles...</Text>
          </View>
        ) : (
          <Calendar
            selectedDate={selectedDate}
            onDateSelect={handleDateSelect}
            availableDates={availableDates}
            bookedDates={bookedDates}
          />
        )}

        {/* Franjas horarias */}
        {selectedDate && (
          <View style={styles.timeSlotsSection}>
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fafafa',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 24,
    paddingTop: Platform.OS === 'ios' ? 60 : 44,
    backgroundColor: Colors.light.background,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.borderLight,
  },
  headerContent: {
    marginBottom: 16,
  },
  providerName: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.light.text,
    letterSpacing: -0.5,
  },
  providerSubtitle: {
    fontSize: 16,
    color: Colors.light.textSecondary,
    marginTop: 4,
  },
  stepIndicator: {
    alignItems: 'flex-end',
  },
  stepText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.light.textSecondary,
    marginBottom: 8,
    textTransform: 'uppercase',
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
  serviceSummary: {
    padding: 20,
    paddingTop: 0,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  summaryTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.text,
    marginLeft: 8,
  },
  serviceName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 8,
  },
  summaryDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryText: {
    fontSize: 14,
    color: Colors.light.textSecondary,
  },
  summaryPrice: {
    fontSize: 16,
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
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
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
  requirementText: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    textAlign: 'center',
    marginTop: 12,
    fontStyle: 'italic',
  },
});
