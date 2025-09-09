import { Button } from '@/components/ui/Button';
import { Calendar } from '@/components/ui/Calendar';
import { Card } from '@/components/ui/Card';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { useAuth } from '@/contexts/AuthContext';
import { BookingService } from '@/lib/booking';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    Platform,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';

export default function ProviderCalendarScreen() {
  const { user } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [bookedDates, setBookedDates] = useState<string[]>([]);

  useEffect(() => {
    if (user?.id) {
      loadData();
    }
  }, [user?.id]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Cargar citas del proveedor
      const providerAppointments = await BookingService.getProviderAppointments(user!.id);
      setAppointments(providerAppointments);

      // Procesar fechas disponibles y ocupadas
      const dates = new Set<string>();
      const booked = new Set<string>();
      
      providerAppointments.forEach(appointment => {
        const date = appointment.appointment_date;
        dates.add(date);
        
        if (appointment.status === 'confirmed' || appointment.status === 'pending') {
          booked.add(date);
        }
      });

      setAvailableDates(Array.from(dates));
      setBookedDates(Array.from(booked));
    } catch (error) {
      console.error('Error loading calendar data:', error);
      Alert.alert('Error', 'No se pudieron cargar los datos del calendario');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    loadData().finally(() => {
      setRefreshing(false);
    });
  }, [user?.id]);

  const handleDateSelect = (date: string) => {
    setSelectedDate(date);
  };

  const getAppointmentsForDate = (date: string) => {
    return appointments.filter(apt => apt.appointment_date === date);
  };

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const minute = parseInt(minutes);
    
    if (hour === 0) return `12:${minutes} AM`;
    if (hour < 12) return `${hour}:${minutes} AM`;
    if (hour === 12) return `12:${minutes} PM`;
    return `${hour - 12}:${minutes} PM`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return Colors.light.success;
      case 'pending':
        return Colors.light.warning;
      case 'cancelled':
        return Colors.light.error;
      case 'completed':
        return Colors.light.textSecondary;
      default:
        return Colors.light.textSecondary;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'Confirmada';
      case 'pending':
        return 'Pendiente';
      case 'cancelled':
        return 'Cancelada';
      case 'completed':
        return 'Completada';
      default:
        return status;
    }
  };

  const handleAppointmentAction = async (appointmentId: number, action: string) => {
    try {
      switch (action) {
        case 'confirm':
          await BookingService.confirmAppointment(appointmentId);
          break;
        case 'cancel':
          await BookingService.cancelAppointment(appointmentId);
          break;
        case 'complete':
          await BookingService.completeAppointment(appointmentId);
          break;
      }
      await loadData(); // Recargar datos
      Alert.alert('Éxito', `Cita ${action === 'confirm' ? 'confirmada' : action === 'cancel' ? 'cancelada' : 'completada'} correctamente`);
    } catch (error) {
      console.error('Error updating appointment:', error);
      Alert.alert('Error', 'No se pudo actualizar la cita');
    }
  };

  const selectedDateAppointments = selectedDate ? getAppointmentsForDate(selectedDate) : [];

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <IconSymbol name="calendar" size={32} color={Colors.light.primary} />
        <View style={styles.headerText}>
          <Text style={styles.title}>Mi Calendario</Text>
          <Text style={styles.subtitle}>Gestiona tus citas y disponibilidad</Text>
        </View>
      </View>

      {/* Calendario */}
      <Calendar
        selectedDate={selectedDate}
        onDateSelect={handleDateSelect}
        availableDates={availableDates}
        bookedDates={bookedDates}
      />

      {/* Citas del día seleccionado */}
      {selectedDate && (
        <View style={styles.appointmentsSection}>
          <Text style={styles.sectionTitle}>
            Citas del {new Date(selectedDate).toLocaleDateString('es-ES', { 
              weekday: 'long', 
              day: 'numeric', 
              month: 'long' 
            })}
          </Text>
          
          {selectedDateAppointments.length === 0 ? (
            <Card variant="elevated" padding="medium">
              <View style={styles.emptyState}>
                <IconSymbol name="calendar" size={48} color={Colors.light.textTertiary} />
                <Text style={styles.emptyText}>No hay citas programadas para este día</Text>
              </View>
            </Card>
          ) : (
            <View style={styles.appointmentsList}>
              {selectedDateAppointments.map((appointment) => (
                <Card key={appointment.id} variant="elevated" padding="medium" style={styles.appointmentCard}>
                  <View style={styles.appointmentHeader}>
                    <View style={styles.appointmentTime}>
                      <IconSymbol name="clock" size={16} color={Colors.light.primary} />
                      <Text style={styles.timeText}>{formatTime(appointment.appointment_time)}</Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(appointment.status) + '20' }]}>
                      <Text style={[styles.statusText, { color: getStatusColor(appointment.status) }]}>
                        {getStatusText(appointment.status)}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.appointmentDetails}>
                    <Text style={styles.clientName}>
                      {appointment.profiles?.full_name || 'Cliente'}
                    </Text>
                    <Text style={styles.serviceName}>
                      {appointment.services?.name || 'Servicio'}
                    </Text>
                    <Text style={styles.serviceDuration}>
                      Duración: {appointment.services?.duration || 30} min
                    </Text>
                    <Text style={styles.servicePrice}>
                      Precio: ${appointment.services?.price || 0}
                    </Text>
                  </View>

                  {appointment.notes && (
                    <View style={styles.notesContainer}>
                      <Text style={styles.notesLabel}>Notas:</Text>
                      <Text style={styles.notesText}>{appointment.notes}</Text>
                    </View>
                  )}

                  {/* Acciones según el estado */}
                  <View style={styles.appointmentActions}>
                    {appointment.status === 'pending' && (
                      <>
                        <Button
                          title="Confirmar"
                          onPress={() => handleAppointmentAction(appointment.id, 'confirm')}
                          variant="success"
                          size="small"
                          style={styles.actionButton}
                        />
                        <Button
                          title="Cancelar"
                          onPress={() => handleAppointmentAction(appointment.id, 'cancel')}
                          variant="destructive"
                          size="small"
                          style={styles.actionButton}
                        />
                      </>
                    )}
                    {appointment.status === 'confirmed' && (
                      <Button
                        title="Completar"
                        onPress={() => handleAppointmentAction(appointment.id, 'complete')}
                        variant="primary"
                        size="small"
                        style={styles.actionButton}
                      />
                    )}
                  </View>
                </Card>
              ))}
            </View>
          )}
        </View>
      )}

      {/* Estadísticas rápidas */}
      <View style={styles.statsSection}>
        <Text style={styles.sectionTitle}>Estadísticas del Mes</Text>
        <View style={styles.statsGrid}>
          <Card variant="elevated" padding="medium" style={styles.statCard}>
            <Text style={styles.statNumber}>
              {appointments.filter(apt => apt.status === 'confirmed').length}
            </Text>
            <Text style={styles.statLabel}>Confirmadas</Text>
          </Card>
          <Card variant="elevated" padding="medium" style={styles.statCard}>
            <Text style={styles.statNumber}>
              {appointments.filter(apt => apt.status === 'pending').length}
            </Text>
            <Text style={styles.statLabel}>Pendientes</Text>
          </Card>
          <Card variant="elevated" padding="medium" style={styles.statCard}>
            <Text style={styles.statNumber}>
              {appointments.filter(apt => apt.status === 'completed').length}
            </Text>
            <Text style={styles.statLabel}>Completadas</Text>
          </Card>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.surface,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 16,
    backgroundColor: Colors.light.background,
  },
  headerText: {
    marginLeft: 12,
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.light.primary,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.light.textSecondary,
    lineHeight: 22,
  },
  appointmentsSection: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 16,
  },
  emptyState: {
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    color: Colors.light.textSecondary,
    textAlign: 'center',
    marginTop: 12,
  },
  appointmentsList: {
    gap: 16,
  },
  appointmentCard: {
    marginBottom: 0,
  },
  appointmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  appointmentTime: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.primary,
    marginLeft: 6,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  appointmentDetails: {
    marginBottom: 12,
  },
  clientName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 4,
  },
  serviceName: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    marginBottom: 2,
  },
  serviceDuration: {
    fontSize: 12,
    color: Colors.light.textTertiary,
    marginBottom: 2,
  },
  servicePrice: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.success,
  },
  notesContainer: {
    marginBottom: 12,
    padding: 12,
    backgroundColor: Colors.light.surfaceVariant,
    borderRadius: 8,
  },
  notesLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.light.textSecondary,
    marginBottom: 4,
  },
  notesText: {
    fontSize: 14,
    color: Colors.light.text,
    lineHeight: 20,
  },
  appointmentActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
  },
  statsSection: {
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    marginBottom: 0,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.light.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    textAlign: 'center',
  },
});
