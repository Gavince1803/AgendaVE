import { ThemedText } from '@/components/ThemedText';
import { CalendarView } from '@/components/ui/CalendarView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { TabSafeAreaView } from '@/components/ui/SafeAreaView';
import { Colors, DesignTokens } from '@/constants/Colors';
import { useAuth } from '@/contexts/AuthContext';
import { Appointment, BookingService } from '@/lib/booking-service';
import { LogCategory, useLogger } from '@/lib/logger';
import { OfflineStorage } from '@/lib/offline-storage';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';

export default function ProviderCalendarScreen() {
  const { user } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const log = useLogger(user?.id);

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
        Alert.alert('Error', 'No se pudieron cargar los datos del calendario');
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
    // Could navigate to appointment details screen
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
});
