import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { IconSymbol } from '@/components/ui/IconSymbol';
import NotificationBell from '@/components/ui/NotificationBell';
import { TabSafeAreaView } from '@/components/ui/SafeAreaView';
import { Skeleton } from '@/components/ui/Skeleton';
import { Colors, ComponentColors, DesignTokens } from '@/constants/Colors';
import { useAuth } from '@/contexts/AuthContext';
import { useAlert } from '@/contexts/GlobalAlertContext';
import { Appointment, BookingService } from '@/lib/booking-service';
import { LogCategory, useLogger } from '@/lib/logger';
import { useEffect, useState } from 'react';
import {
  Linking,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View
} from 'react-native';

export default function AppointmentsScreen() {
  const [selectedTab, setSelectedTab] = useState('today');
  const [refreshing, setRefreshing] = useState(false);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const log = useLogger();
  const { activeRole, employeeProfile } = useAuth();

  useEffect(() => {
    loadAppointments();
  }, []);

  const loadAppointments = async () => {
    try {
      setLoading(true);
      log.info(LogCategory.DATA, 'Loading appointments', { screen: 'Appointments', role: activeRole });

      let appointmentsData: Appointment[] = [];

      if (activeRole === 'employee') {
        appointmentsData = await BookingService.getEmployeeAppointments();

        // Fallback: if none returned, try provider appointments filtered by this employee id
        if ((!appointmentsData || appointmentsData.length === 0) && employeeProfile?.id && employeeProfile?.provider_id) {
          const providerAppointments = await BookingService.getAppointmentsByProviderId(employeeProfile.provider_id);
          appointmentsData = providerAppointments.filter(
            (apt: any) => apt.employee_id === employeeProfile.id || !apt.employee_id
          );
        }
      } else {
        appointmentsData = await BookingService.getProviderAppointments();
      }

      // Enriquecer citas con estadísticas de No Show
      const enrichedAppointments = await Promise.all(appointmentsData.map(async (apt) => {
        if (apt.client_id) {
          const stats = await BookingService.getClientStats(apt.client_id);
          return { ...apt, no_show_count: stats.noShowCount };
        }
        return apt;
      }));

      setAppointments(enrichedAppointments);

      log.info(LogCategory.DATA, 'Appointments loaded', {
        count: appointmentsData.length,
        screen: 'Appointments',
        role: activeRole,
      });
    } catch (error) {
      log.error(LogCategory.ERROR, 'Error loading appointments', error);
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

  const { showAlert } = useAlert();

  const handleAppointmentAction = async (appointment: Appointment, action: 'confirm' | 'cancel' | 'complete' | 'no_show') => {
    try {
      log.userAction('Appointment action', {
        appointmentId: appointment.id,
        action,
        status: appointment.status,
        screen: 'Appointments'
      });

      let newStatus: 'confirmed' | 'cancelled' | 'done' | 'no_show';
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
        case 'no_show':
          newStatus = 'no_show';
          break;
      }

      await BookingService.updateAppointmentStatus(appointment.id, newStatus);

      // Recargar citas
      await loadAppointments();

      showAlert(
        'Éxito',
        `Cita ${action === 'confirm' ? 'confirmada' : action === 'cancel' ? 'cancelada' : 'completada'} exitosamente`
      );
    } catch (error) {
      log.error(LogCategory.ERROR, 'Error updating appointment status', error);
      showAlert('Error', 'No se pudo actualizar el estado de la cita');
    }
  }


  const handlePaymentAction = (appointment: Appointment) => {
    showAlert(
      'Registrar Pago',
      'Selecciona el método de pago:',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: '💵 Efectivo',
          onPress: () => updatePayment(appointment.id, 'paid', 'cash')
        },
        {
          text: '📱 Pago Móvil',
          onPress: () => updatePayment(appointment.id, 'paid', 'pago_movil')
        },
        {
          text: '🇺🇸 Zelle',
          onPress: () => updatePayment(appointment.id, 'paid', 'zelle')
        },
        {
          text: '💳 Tarjeta / Otro',
          onPress: () => updatePayment(appointment.id, 'paid', 'card')
        }
      ]
    );
  };

  const updatePayment = async (id: string, status: 'paid' | 'pending', method: any) => {
    try {
      await BookingService.updateAppointmentPayment(id, status, method);
      await loadAppointments();
      showAlert('Éxito', 'Pago registrado correctamente');
    } catch (error) {
      log.error(LogCategory.ERROR, 'Error updating payment', error);
      showAlert('Error', 'No se pudo registrar el pago');
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
      case 'no_show':
        return Colors.light.error;
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
      case 'no_show':
        return 'No Asistió';
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
            {(appointment as any).profiles?.display_name || appointment.client_name || 'Cliente sin nombre'}
          </ThemedText>
          <ThemedText style={styles.serviceName}>
            {appointment.service?.name || appointment.services?.name || 'Servicio'}
          </ThemedText>
          <ThemedText style={styles.appointmentDate}>
            {new Date(appointment.appointment_date).toLocaleDateString('es-VE')}
          </ThemedText>
        </View>
        <View style={styles.statusContainer}>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(appointment.status) }]}>
            <ThemedText style={styles.statusText}>
              {getStatusText(appointment.status)}
            </ThemedText>
          </View>
          {appointment.payment_status === 'paid' && (
            <View style={styles.paidBadge}>
              <ThemedText style={styles.paidText}>
                PAGADO {appointment.payment_method === 'pago_movil' ? '📱' : appointment.payment_method === 'zelle' ? '🇺🇸' : '💵'}
              </ThemedText>
            </View>
          )}
          {/* Warning Badge for Frequent No-Shows */}
          {appointment.no_show_count && appointment.no_show_count > 0 ? (
            <View style={[styles.statusBadge, { backgroundColor: Colors.light.warning + '20', borderWidth: 1, borderColor: Colors.light.warning, marginTop: 4 }]}>
              <ThemedText style={[styles.statusText, { color: Colors.light.warning, fontSize: 10 }]}>
                ⚠️ {appointment.no_show_count} No Shows
              </ThemedText>
            </View>
          ) : null}
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
            {(appointment.service?.duration_minutes || appointment.services?.duration_minutes) ? `${appointment.service?.duration_minutes || appointment.services?.duration_minutes} min` : 'N/A'}
          </ThemedText>
        </View>
        <View style={styles.detailItem}>
          <IconSymbol name="dollarsign.circle" size={16} color={Colors.light.textSecondary} />
          <ThemedText style={styles.detailText}>
            {(appointment.service?.price_amount || appointment.services?.price_amount) ? `$${appointment.service?.price_amount || appointment.services?.price_amount} ${appointment.service?.price_currency || appointment.services?.price_currency}` : 'N/A'}
          </ThemedText>
        </View>
      </View>

      {/* Contact Info (Profile or Manual) */}
      {
        ((appointment as any).profiles?.phone || appointment.client_phone) && (
          <View style={styles.contactInfo}>
            <IconSymbol name="phone" size={16} color={Colors.light.textSecondary} />
            <ThemedText style={styles.phoneText}>
              {(appointment as any).profiles?.phone || appointment.client_phone}
            </ThemedText>
          </View>
        )
      }

      {
        appointment.notes && (
          <View style={styles.notesContainer}>
            <ThemedText style={styles.notesLabel}>Notas:</ThemedText>
            <ThemedText style={styles.notesText}>{appointment.notes}</ThemedText>
          </View>
        )
      }

      {
        appointment.status === 'pending' && (
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
        )
      }

      {
        (appointment.status === 'confirmed' || appointment.status === 'done') && (
          <View style={styles.appointmentActions}>
            {appointment.status === 'confirmed' && (
              <>
                <Button
                  title="Completar"
                  variant="primary"
                  size="small"
                  onPress={() => handleAppointmentAction(appointment, 'complete')}
                  style={[styles.actionButton, { backgroundColor: Colors.light.success }]}
                />
                <Button
                  title="No Show"
                  variant="outline"
                  size="small"
                  onPress={() => {
                    showAlert(
                      'Marcar como No Show',
                      '¿Estás seguro de que el cliente no asistió? Esto afectará sus estadísticas.',
                      [
                        { text: 'Cancelar', style: 'cancel' },
                        {
                          text: 'Marcar No Show',
                          style: 'destructive',
                          onPress: () => handleAppointmentAction(appointment, 'no_show')
                        }
                      ]
                    );
                  }}
                  style={[styles.actionButton, { borderColor: Colors.light.error }]}
                  textStyle={{ color: Colors.light.error }}
                />
              </>
            )}

            <Button
              title="Recordar"
              variant="outline"
              size="small"
              icon={<IconSymbol name="message" size={16} color={Colors.light.primary} />}
              onPress={() => {
                const phone = (appointment as any).profiles?.phone || appointment.client_phone;
                const name = (appointment as any).profiles?.full_name || appointment.client_name || 'Cliente';

                if (phone) {
                  // Sanitize phone number: remove all non-numeric characters
                  const cleanPhone = phone.replace(/\D/g, '');
                  const message = `Hola ${name}, recordatorio de tu cita mañana a las ${appointment.appointment_time} en MiCita.`;
                  const url = `whatsapp://send?phone=${cleanPhone}&text=${encodeURIComponent(message)}`;
                  Linking.openURL(url).catch(() => {
                    showAlert('Error', 'No se pudo abrir WhatsApp');
                  });
                } else {
                  showAlert('Error', 'El cliente no tiene número de teléfono registrado');
                }
              }}
              style={styles.actionButton}
            />
          </View>
        )
      }

      {/* Botón de Pago para citas confirmadas o completadas que no están pagadas */}
      {
        (appointment.status === 'confirmed' || appointment.status === 'done') && appointment.payment_status !== 'paid' && (
          <View style={styles.paymentActionContainer}>
            <Button
              title="Registrar Pago"
              variant="outline"
              size="small"
              icon={<IconSymbol name="dollarsign.circle" size={16} color={Colors.light.success} />}
              onPress={() => handlePaymentAction(appointment)}
              style={[styles.actionButton, styles.paymentButton]}
            />
          </View>
        )
      }
    </Card >
  );

  const currentAppointments = selectedTab === 'today' ? todayAppointments : upcomingAppointments;

  return (
    <TabSafeAreaView style={styles.container}>
      {/* Header */}
      <ThemedView style={styles.header}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <ThemedText type="title" style={styles.title}>
            Mis Citas
          </ThemedText>
          <NotificationBell />
        </View>
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
            <Skeleton width="100%" height={180} borderRadius={DesignTokens.radius.xl} style={styles.skeletonItem} />
            <Skeleton width="100%" height={180} borderRadius={DesignTokens.radius.xl} style={styles.skeletonItem} />
            <Skeleton width="100%" height={180} borderRadius={DesignTokens.radius.xl} style={styles.skeletonItem} />
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
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 20 : 12,
    paddingBottom: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.light.primary,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.light.text,
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
    color: Colors.light.text,
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
    color: Colors.light.text,
    marginBottom: 2,
  },
  appointmentDate: {
    fontSize: 12,
    color: Colors.light.text,
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
    color: Colors.light.text,
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
    color: Colors.light.text,
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
    color: Colors.light.text,
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
    flexWrap: 'wrap',
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
    fontSize: DesignTokens.typography.fontSizes.md,
    color: Colors.light.text,
    textAlign: 'center',
  },
  statusContainer: {
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: DesignTokens.spacing.xs,
  },
  paidBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    backgroundColor: Colors.light.success + '20',
    borderWidth: 1,
    borderColor: Colors.light.success,
  },
  paidText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.light.success,
  },
  paymentActionContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: DesignTokens.spacing.sm,
    paddingTop: DesignTokens.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
  },
  paymentButton: {
    borderColor: Colors.light.success,
    width: '100%',
  },
  skeletonItem: {
    marginBottom: DesignTokens.spacing.lg,
  },
});
