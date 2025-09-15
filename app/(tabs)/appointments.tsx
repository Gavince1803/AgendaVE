import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { TabSafeAreaView } from '@/components/ui/SafeAreaView';
import { Colors, ComponentColors, DesignTokens } from '@/constants/Colors';
import { Appointment, BookingService } from '@/lib/booking-service';
import { LogCategory, useLogger } from '@/lib/logger';
import { useEffect, useState } from 'react';
import {
    Alert,
    Platform,
    RefreshControl,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    View,
} from 'react-native';

export default function AppointmentsScreen() {
  const [selectedTab, setSelectedTab] = useState('today');
  const [refreshing, setRefreshing] = useState(false);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const log = useLogger();

  useEffect(() => {
    loadAppointments();
  }, []);

  const loadAppointments = async () => {
    try {
      setLoading(true);
      log.info(LogCategory.DATA, 'Loading provider appointments', { screen: 'Appointments' });
      
      const appointmentsData = await BookingService.getProviderAppointments();
      setAppointments(appointmentsData);
      
      log.info(LogCategory.DATA, 'Provider appointments loaded', { 
        count: appointmentsData.length,
        screen: 'Appointments' 
      });
    } catch (error) {
      log.error(LogCategory.ERROR, 'Error loading provider appointments', error);
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAppointments();
    setRefreshing(false);
  };

  // Filtrar citas por fecha
  const today = new Date().toISOString().split('T')[0];
  const todayAppointments = appointments.filter(apt => apt.appointment_date === today);
  
  const upcomingAppointments = appointments.filter(apt => 
    apt.appointment_date > today && (apt.status === 'pending' || apt.status === 'confirmed')
  );
  
  const pastAppointments = appointments.filter(apt => 
    apt.appointment_date < today || apt.status === 'done' || apt.status === 'cancelled'
  );

  const handleAppointmentAction = async (appointment: Appointment, action: 'confirm' | 'cancel' | 'complete') => {
    try {
      log.userAction('Appointment action', { 
        appointmentId: appointment.id, 
        action,
        status: appointment.status,
        screen: 'Appointments' 
      });

      let newStatus: 'confirmed' | 'cancelled' | 'done';
      switch (action) {
        case 'confirm':
          newStatus = 'confirmed';
          break;
        case 'cancel':
          newStatus = 'cancelled';
          break;
        case 'complete':
          newStatus = 'done';
          break;
      }

      await BookingService.updateAppointmentStatus(appointment.id, newStatus);
      
      // Recargar citas
      await loadAppointments();
      
      Alert.alert(
        'Éxito',
        `Cita ${action === 'confirm' ? 'confirmada' : action === 'cancel' ? 'cancelada' : 'completada'} exitosamente`
      );
    } catch (error) {
      log.error(LogCategory.ERROR, 'Error updating appointment status', error);
      Alert.alert('Error', 'No se pudo actualizar el estado de la cita');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return ComponentColors.appointment.confirmed;
      case 'pending':
        return ComponentColors.appointment.pending;
      case 'cancelled':
        return ComponentColors.appointment.cancelled;
      case 'done':
        return ComponentColors.appointment.completed;
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
      case 'done':
        return 'Completada';
      default:
        return status;
    }
  };

  const renderAppointmentCard = (appointment: Appointment) => (
    <Card key={appointment.id} variant="elevated" style={styles.appointmentCard}>
      <View style={styles.appointmentHeader}>
        <View style={styles.clientAvatar}>
          <IconSymbol name="person.circle" size={24} color={Colors.light.primary} />
        </View>
        <View style={styles.clientInfo}>
          <ThemedText style={styles.clientName}>
            {appointment.client?.display_name || 'Cliente'}
          </ThemedText>
          <ThemedText style={styles.serviceName}>
            {appointment.service?.name || 'Servicio'}
          </ThemedText>
          <ThemedText style={styles.appointmentDate}>
            {new Date(appointment.appointment_date).toLocaleDateString('es-VE')}
          </ThemedText>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(appointment.status) }]}>
          <ThemedText style={styles.statusText}>
            {getStatusText(appointment.status)}
          </ThemedText>
        </View>
      </View>

      <View style={styles.appointmentDetails}>
        <View style={styles.detailItem}>
          <IconSymbol name="clock" size={16} color={Colors.light.textSecondary} />
          <ThemedText style={styles.detailText}>{appointment.appointment_time}</ThemedText>
        </View>
        <View style={styles.detailItem}>
          <IconSymbol name="timer" size={16} color={Colors.light.textSecondary} />
          <ThemedText style={styles.detailText}>
            {appointment.service?.duration_minutes ? `${appointment.service.duration_minutes} min` : 'N/A'}
          </ThemedText>
        </View>
        <View style={styles.detailItem}>
          <IconSymbol name="dollarsign.circle" size={16} color={Colors.light.textSecondary} />
          <ThemedText style={styles.detailText}>
            {appointment.service?.price_amount ? `$${appointment.service.price_amount} ${appointment.service.price_currency}` : 'N/A'}
          </ThemedText>
        </View>
      </View>

      {appointment.client?.phone && (
        <View style={styles.contactInfo}>
          <IconSymbol name="phone" size={16} color={Colors.light.textSecondary} />
          <ThemedText style={styles.phoneText}>{appointment.client.phone}</ThemedText>
        </View>
      )}

      {appointment.notes && (
        <View style={styles.notesContainer}>
          <ThemedText style={styles.notesLabel}>Notas:</ThemedText>
          <ThemedText style={styles.notesText}>{appointment.notes}</ThemedText>
        </View>
      )}

      {appointment.status === 'pending' && (
        <View style={styles.appointmentActions}>
          <Button
            title="Confirmar"
            variant="primary"
            size="small"
            onPress={() => handleAppointmentAction(appointment, 'confirm')}
            style={[styles.actionButton, { backgroundColor: Colors.light.success }]}
          />
          <Button
            title="Rechazar"
            variant="outline"
            size="small"
            onPress={() => handleAppointmentAction(appointment, 'cancel')}
            style={[styles.actionButton, { borderColor: Colors.light.error }]}
          />
        </View>
      )}

      {appointment.status === 'confirmed' && (
        <View style={styles.appointmentActions}>
          <Button
            title="Completar"
            variant="primary"
            size="small"
            onPress={() => handleAppointmentAction(appointment, 'complete')}
            style={[styles.actionButton, { backgroundColor: Colors.light.success }]}
          />
        </View>
      )}
    </Card>
  );

  const currentAppointments = selectedTab === 'today' ? todayAppointments : upcomingAppointments;

  return (
    <TabSafeAreaView style={styles.container}>
      {/* Header */}
      <ThemedView style={styles.header}>
        <ThemedText type="title" style={styles.title}>
          Mis Citas
        </ThemedText>
        <ThemedText style={styles.subtitle}>
          Gestiona las citas de tus clientes
        </ThemedText>
      </ThemedView>

      {/* Tabs */}
      <ThemedView style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'today' && styles.activeTab]}
          onPress={() => setSelectedTab('today')}
        >
          <ThemedText style={[styles.tabText, selectedTab === 'today' && styles.activeTabText]}>
            Hoy ({todayAppointments.length})
          </ThemedText>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'upcoming' && styles.activeTab]}
          onPress={() => setSelectedTab('upcoming')}
        >
          <ThemedText style={[styles.tabText, selectedTab === 'upcoming' && styles.activeTabText]}>
            Próximas ({upcomingAppointments.length})
          </ThemedText>
        </TouchableOpacity>
      </ThemedView>

      {/* Appointments List */}
      <ScrollView 
        style={styles.appointmentsSection}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[Colors.light.primary]}
            tintColor={Colors.light.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <View style={styles.loadingState}>
            <ThemedText style={styles.loadingText}>Cargando citas...</ThemedText>
          </View>
        ) : currentAppointments.length === 0 ? (
          <View style={styles.emptyState}>
            <IconSymbol name="calendar" size={64} color={Colors.light.textTertiary} />
            <ThemedText style={styles.emptyStateText}>
              {selectedTab === 'today' 
                ? 'No tienes citas hoy' 
                : 'No tienes citas próximas'}
            </ThemedText>
            <ThemedText style={styles.emptyStateSubtext}>
              {selectedTab === 'today' 
                ? 'Disfruta de tu día libre' 
                : 'Las nuevas citas aparecerán aquí'}
            </ThemedText>
          </View>
        ) : (
          <View style={styles.appointmentsList}>
            {currentAppointments.map((appointment) => renderAppointmentCard(appointment))}
          </View>
        )}
      </ScrollView>
    </TabSafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.surface,
  },
  header: {
    padding: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.light.primary,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.light.textSecondary,
  },
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 20,
    backgroundColor: Colors.light.background,
    borderRadius: 12,
    padding: 4,
    shadowColor: Colors.light.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: Colors.light.primary,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.textSecondary,
  },
  activeTabText: {
    color: '#ffffff',
  },
  appointmentsSection: {
    flex: 1,
    paddingHorizontal: DesignTokens.spacing.xl,
  },
  scrollContent: {
    paddingBottom: DesignTokens.spacing['6xl'], // Espacio extra para el TabBar
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.light.text,
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  appointmentsList: {
    paddingBottom: 20,
  },
  appointmentCard: {
    marginBottom: 16,
  },
  appointmentHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  clientAvatar: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: Colors.light.surfaceVariant,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  clientInfo: {
    flex: 1,
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
  appointmentDate: {
    fontSize: 12,
    color: Colors.light.textTertiary,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#ffffff',
  },
  appointmentDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  detailText: {
    fontSize: 13,
    color: Colors.light.textSecondary,
    fontWeight: '500',
  },
  contactInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  phoneText: {
    fontSize: 13,
    color: Colors.light.textSecondary,
    fontWeight: '500',
  },
  notesContainer: {
    backgroundColor: Colors.light.surfaceVariant,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
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
    lineHeight: 18,
  },
  appointmentActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
  },
  loadingState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 16,
    color: Colors.light.textSecondary,
    textAlign: 'center',
  },
});

