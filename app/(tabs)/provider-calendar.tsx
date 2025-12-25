import { ThemedText } from '@/components/ThemedText';
import { Button } from '@/components/ui/Button';
import { CalendarView } from '@/components/ui/CalendarView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { TabSafeAreaView } from '@/components/ui/SafeAreaView';
import { Colors, DesignTokens } from '@/constants/Colors';
import { useAuth } from '@/contexts/AuthContext';
import { useAlert } from '@/contexts/GlobalAlertContext';
import { Appointment, BookingService } from '@/lib/booking-service';
import { LogCategory, useLogger } from '@/lib/logger';
import { OfflineStorage } from '@/lib/offline-storage';
import React, { useEffect, useState } from 'react';
import {
  Modal,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View
} from 'react-native';

export default function ProviderCalendarScreen() {
  const { user } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [loading, setLoading] = useState(true);
  const log = useLogger(user?.id);

  const { showAlert } = useAlert();

  useEffect(() => {
    if (user?.id) {
      loadData();
    }
  }, [user?.id]);

  const loadData = async () => {
    setLoading(true);
    log.info(LogCategory.DATABASE, 'Loading provider calendar data', { screen: 'ProviderCalendar' });

    try {
      // Try to load from cache first if offline
      const cachedAppointments = await OfflineStorage.getCachedAppointments();

      if (cachedAppointments.length > 0) {
        setAppointments(cachedAppointments);
        log.info(LogCategory.DATABASE, 'Loaded appointments from cache', { count: cachedAppointments.length });
      }

      // Try to fetch from server
      const providerAppointments = await BookingService.getProviderAppointments();
      setAppointments(providerAppointments);

      // Cache for offline use
      await OfflineStorage.cacheAppointments(providerAppointments);

      log.info(LogCategory.DATABASE, 'Provider calendar data loaded', { count: providerAppointments.length });
    } catch (error) {
      log.error(LogCategory.SERVICE, 'Error loading calendar data', error);

      // If we have cached data, use it
      const cachedAppointments = await OfflineStorage.getCachedAppointments();
      if (cachedAppointments.length > 0) {
        setAppointments(cachedAppointments);
        log.info(LogCategory.DATABASE, 'Using cached appointments (offline mode)', { count: cachedAppointments.length });
      } else {
        showAlert('Error', 'No se pudieron cargar los datos del calendario');
      }
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

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    log.userAction('Select calendar date', { date: date.toISOString(), screen: 'ProviderCalendar' });
  };

  const handleAppointmentPress = (appointment: Appointment) => {
    log.userAction('View appointment details', { appointmentId: appointment.id, screen: 'ProviderCalendar' });
    setSelectedAppointment(appointment);
  };

  return (
    <TabSafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <IconSymbol name="calendar" size={32} color={Colors.light.primary} />
          <View style={styles.headerText}>
            <ThemedText type="title" style={styles.title}>Mi Calendario</ThemedText>
            <ThemedText style={styles.subtitle}>Vista mensual y semanal de tus citas</ThemedText>
          </View>
        </View>

        {/* Calendar View Component */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ThemedText style={styles.loadingText}>Cargando calendario...</ThemedText>
          </View>
        ) : (
          <CalendarView
            appointments={appointments}
            viewMode="month"
            selectedDate={selectedDate}
            onDatePress={handleDateSelect}
            onAppointmentPress={handleAppointmentPress}
          />
        )}
      </ScrollView>

      {/* Appointment Detail Modal */}
      <Modal
        visible={!!selectedAppointment}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setSelectedAppointment(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <ThemedText type="subtitle" style={styles.modalTitle}>Detalles de la Cita</ThemedText>
              <TouchableOpacity onPress={() => setSelectedAppointment(null)} style={styles.closeButton}>
                <IconSymbol name="xmark" size={24} color={Colors.light.text} />
              </TouchableOpacity>
            </View>

            {selectedAppointment && (
              <ScrollView style={styles.modalScroll}>
                {/* Client Info */}
                <View style={styles.modalSection}>
                  <View style={styles.avatarContainer}>
                    <IconSymbol name="person.circle" size={48} color={Colors.light.primary} />
                  </View>
                  <ThemedText style={styles.modalClientName}>
                    {(selectedAppointment as any).profiles?.display_name || selectedAppointment.client_name || 'Cliente'}
                  </ThemedText>
                  {((selectedAppointment as any).profiles?.phone || selectedAppointment.client_phone) && (
                    <ThemedText style={styles.modalClientPhone}>
                      {(selectedAppointment as any).profiles?.phone || selectedAppointment.client_phone}
                    </ThemedText>
                  )}
                </View>

                {/* Service Details */}
                <View style={styles.detailRow}>
                  <IconSymbol name="scissors" size={20} color={Colors.light.textSecondary} />
                  <View style={styles.detailTextContainer}>
                    <ThemedText style={styles.detailLabel}>Servicio</ThemedText>
                    <ThemedText style={styles.detailValue}>
                      {selectedAppointment.service?.name || selectedAppointment.services?.name || 'Servicio'}
                    </ThemedText>
                  </View>
                </View>

                <View style={styles.detailRow}>
                  <IconSymbol name="clock" size={20} color={Colors.light.textSecondary} />
                  <View style={styles.detailTextContainer}>
                    <ThemedText style={styles.detailLabel}>Horario</ThemedText>
                    <ThemedText style={styles.detailValue}>
                      {new Date(selectedAppointment.appointment_date).toLocaleDateString()} - {selectedAppointment.appointment_time}
                    </ThemedText>
                  </View>
                </View>

                {selectedAppointment.notes && (
                  <View style={styles.notesBox}>
                    <ThemedText style={styles.notesLabel}>Notas:</ThemedText>
                    <ThemedText style={styles.notesValue}>{selectedAppointment.notes}</ThemedText>
                  </View>
                )}

                <View style={[styles.statusTag, { backgroundColor: getStatusColor(selectedAppointment.status) + '20' }]}>
                  <ThemedText style={[styles.statusTagText, { color: getStatusColor(selectedAppointment.status) }]}>
                    {selectedAppointment.status.toUpperCase()}
                  </ThemedText>
                </View>

              </ScrollView>
            )}

            <Button
              title="Cerrar"
              onPress={() => setSelectedAppointment(null)}
              variant="outline"
              style={styles.modalButton}
            />
          </View>
        </View>
      </Modal>
    </TabSafeAreaView>
  );
}

// Helper functions (duplicate from appointments.tsx, ideally should be shared utils)
const getStatusColor = (status: string) => {
  switch (status) {
    case 'confirmed': return Colors.light.success;
    case 'pending': return Colors.light.warning;
    case 'cancelled': return Colors.light.error;
    case 'done': return Colors.light.primary;
    default: return Colors.light.textSecondary;
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.surface,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: DesignTokens.spacing['6xl'], // Espacio extra para el TabBar
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    paddingTop: Platform.OS === 'ios' ? 20 : 10,
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
  loadingContainer: {
    padding: DesignTokens.spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 400,
  },
  loadingText: {
    fontSize: DesignTokens.typography.fontSizes.base,
    color: Colors.light.textSecondary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.light.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 4,
  },
  modalScroll: {
    maxHeight: 400,
  },
  modalSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  avatarContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.light.surfaceVariant,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalClientName: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.light.text,
    textAlign: 'center',
  },
  modalClientPhone: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    marginTop: 4,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    padding: 12,
    backgroundColor: Colors.light.background,
    borderRadius: 12,
  },
  detailTextContainer: {
    marginLeft: 12,
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 15,
    color: Colors.light.text,
    fontWeight: '500',
  },
  notesBox: {
    backgroundColor: Colors.light.surfaceVariant,
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  notesLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.light.textSecondary,
    marginBottom: 4,
  },
  notesValue: {
    fontSize: 14,
    color: Colors.light.text,
    lineHeight: 20,
  },
  statusTag: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginBottom: 24,
  },
  statusTagText: {
    fontSize: 12,
    fontWeight: '600',
  },
  modalButton: {
    width: '100%',
  },
});
