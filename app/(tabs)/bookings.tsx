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
    RefreshControl,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    View
} from 'react-native';

export default function BookingsScreen() {
  const [selectedTab, setSelectedTab] = useState('upcoming');
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
      log.info(LogCategory.DATA, 'Loading client appointments', { screen: 'Bookings' });
      
      const appointmentsData = await BookingService.getClientAppointments();
      setAppointments(appointmentsData);
      
      log.info(LogCategory.DATA, 'Client appointments loaded', { 
        count: appointmentsData.length,
        screen: 'Bookings' 
      });
    } catch (error) {
      log.error(LogCategory.ERROR, 'Error loading client appointments', error);
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

  // Filtrar citas por estado
  const today = new Date().toISOString().split('T')[0];
  const upcomingBookings = appointments.filter(apt => 
    apt.appointment_date >= today && (apt.status === 'pending' || apt.status === 'confirmed')
  );
  
  const pastBookings = appointments.filter(apt => 
    apt.appointment_date < today || apt.status === 'done' || apt.status === 'cancelled'
  );

  const handleCancelBooking = async (appointment: Appointment) => {
    try {
      log.userAction('Cancel booking', { 
        appointmentId: appointment.id,
        screen: 'Bookings' 
      });

      Alert.alert(
        'Cancelar Cita',
        '¿Estás seguro de que quieres cancelar esta cita?',
        [
          {
            text: 'No',
            style: 'cancel'
          },
          {
            text: 'Sí, Cancelar',
            style: 'destructive',
            onPress: async () => {
              await BookingService.updateAppointmentStatus(appointment.id, 'cancelled');
              await loadAppointments();
              Alert.alert('Cita Cancelada', 'Tu cita ha sido cancelada exitosamente');
            }
          }
        ]
      );
    } catch (error) {
      log.error(LogCategory.ERROR, 'Error canceling booking', error);
      Alert.alert('Error', 'No se pudo cancelar la cita');
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

  const renderBookingCard = (booking: Appointment) => (
    <Card key={booking.id} variant="elevated" style={styles.bookingCard}>
      <View style={styles.bookingHeader}>
        <View style={styles.providerImage}>
          <IconSymbol name="building.2" size={24} color={Colors.light.primary} />
        </View>
        <View style={styles.providerInfo}>
          <ThemedText style={styles.providerName}>
            {booking.provider?.business_name || 'Proveedor'}
          </ThemedText>
          <ThemedText style={styles.serviceName}>
            {booking.service?.name || 'Servicio'}
          </ThemedText>
          <ThemedText style={styles.duration}>
            {booking.service?.duration_minutes ? `${booking.service.duration_minutes} min` : 'N/A'}
          </ThemedText>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(booking.status) }]}>
          <ThemedText style={styles.statusText}>
            {getStatusText(booking.status)}
          </ThemedText>
        </View>
      </View>

      <View style={styles.bookingDetails}>
        <View style={styles.detailItem}>
          <IconSymbol name="calendar" size={16} color={Colors.light.textSecondary} />
          <ThemedText style={styles.detailText}>
            {new Date(booking.appointment_date).toLocaleDateString('es-VE')}
          </ThemedText>
        </View>
        <View style={styles.detailItem}>
          <IconSymbol name="clock" size={16} color={Colors.light.textSecondary} />
          <ThemedText style={styles.detailText}>{booking.appointment_time}</ThemedText>
        </View>
        <View style={styles.detailItem}>
          <IconSymbol name="dollarsign.circle" size={16} color={Colors.light.textSecondary} />
          <ThemedText style={styles.detailText}>
            {booking.service?.price_amount ? `$${booking.service.price_amount} ${booking.service.price_currency}` : 'N/A'}
          </ThemedText>
        </View>
      </View>

      {selectedTab === 'upcoming' && booking.status !== 'cancelled' && (
        <View style={styles.bookingActions}>
          <Button
            title="Cancelar"
            variant="outline"
            size="small"
            onPress={() => handleCancelBooking(booking)}
            style={[styles.actionButton, { borderColor: Colors.light.error }]}
          />
          <Button
            title="Reprogramar"
            variant="primary"
            size="small"
            onPress={() => {
              log.userAction('Reschedule booking', { 
                appointmentId: booking.id,
                screen: 'Bookings' 
              });
              // TODO: Implementar reprogramación
            }}
            style={styles.actionButton}
          />
        </View>
      )}

      {selectedTab === 'past' && booking.status === 'done' && (
        <View style={styles.bookingActions}>
          <Button
            title="Calificar"
            variant="outline"
            size="small"
            onPress={() => {
              log.userAction('Rate service', { 
                appointmentId: booking.id,
                screen: 'Bookings' 
              });
              router.push({
                pathname: '/(booking)/rate-appointment',
                params: { appointmentId: booking.id }
              });
            }}
            style={styles.actionButton}
          />
          <Button
            title="Reservar de nuevo"
            variant="primary"
            size="small"
            onPress={() => {
              log.userAction('Book again', { 
                appointmentId: booking.id,
                providerId: booking.provider_id,
                screen: 'Bookings' 
              });
              // TODO: Implementar reserva de nuevo
            }}
            style={styles.actionButton}
          />
        </View>
      )}
    </Card>
  );

  const currentBookings = selectedTab === 'upcoming' ? upcomingBookings : pastBookings;

  return (
    <TabSafeAreaView style={styles.container}>
      {/* Header */}
      <ThemedView style={styles.header}>
        <ThemedText type="title" style={styles.title}>
          Mis Citas
        </ThemedText>
      </ThemedView>

      {/* Tabs */}
      <ThemedView style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'upcoming' && styles.activeTab]}
          onPress={() => setSelectedTab('upcoming')}
        >
          <ThemedText style={[styles.tabText, selectedTab === 'upcoming' && styles.activeTabText]}>
            Próximas ({upcomingBookings.length})
          </ThemedText>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'past' && styles.activeTab]}
          onPress={() => setSelectedTab('past')}
        >
          <ThemedText style={[styles.tabText, selectedTab === 'past' && styles.activeTabText]}>
            Historial ({pastBookings.length})
          </ThemedText>
        </TouchableOpacity>
      </ThemedView>

      {/* Bookings List */}
      <ScrollView 
        style={styles.bookingsSection}
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
        ) : currentBookings.length === 0 ? (
          <View style={styles.emptyState}>
            <IconSymbol name="calendar" size={64} color={Colors.light.textTertiary} />
            <ThemedText style={styles.emptyStateText}>
              {selectedTab === 'upcoming' 
                ? 'No tienes citas próximas' 
                : 'No tienes citas anteriores'}
            </ThemedText>
            <ThemedText style={styles.emptyStateSubtext}>
              {selectedTab === 'upcoming' 
                ? 'Explora servicios y reserva tu próxima cita' 
                : 'Tus citas completadas aparecerán aquí'}
            </ThemedText>
            {selectedTab === 'upcoming' && (
              <Button
                title="Explorar Servicios"
                variant="primary"
                size="medium"
                onPress={() => {
                  log.userAction('Navigate to explore', { screen: 'Bookings' });
                  // TODO: Implementar navegación a explorar
                }}
                style={styles.exploreButton}
              />
            )}
          </View>
        ) : (
          <View style={styles.bookingsList}>
            {currentBookings.map((booking) => renderBookingCard(booking))}
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
    padding: DesignTokens.spacing.xl,
    paddingTop: DesignTokens.spacing.lg, // Safe Area ya maneja el padding superior
    paddingBottom: DesignTokens.spacing.lg,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.light.primary,
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
  bookingsSection: {
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
    marginBottom: 24,
  },
  exploreButton: {
    marginTop: 8,
  },
  bookingsList: {
    paddingBottom: 20,
  },
  bookingCard: {
    marginBottom: 16,
  },
  bookingHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  providerImage: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: Colors.light.surfaceVariant,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  providerInfo: {
    flex: 1,
  },
  providerName: {
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
  duration: {
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
  bookingDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
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
  bookingActions: {
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

