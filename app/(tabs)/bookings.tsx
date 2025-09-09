import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';

export default function BookingsScreen() {
  const [selectedTab, setSelectedTab] = useState('upcoming');

  const upcomingBookings = [
    {
      id: 1,
      providerName: 'Salón Bella Vista',
      serviceName: 'Corte de Cabello',
      date: '2024-01-15',
      time: '10:30 AM',
      status: 'confirmed',
      price: '$15',
    },
    {
      id: 2,
      providerName: 'Spa Relax',
      serviceName: 'Facial Limpieza',
      date: '2024-01-18',
      time: '2:00 PM',
      status: 'pending',
      price: '$25',
    },
  ];

  const pastBookings = [
    {
      id: 3,
      providerName: 'Clínica Dental Smile',
      serviceName: 'Limpieza Dental',
      date: '2024-01-10',
      time: '9:00 AM',
      status: 'completed',
      price: '$30',
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return '#10b981';
      case 'pending':
        return '#f59e0b';
      case 'cancelled':
        return '#ef4444';
      case 'completed':
        return '#6b7280';
      default:
        return '#6b7280';
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

  const currentBookings = selectedTab === 'upcoming' ? upcomingBookings : pastBookings;

  return (
    <ScrollView style={styles.container}>
      <ThemedView style={styles.header}>
        <ThemedText type="title" style={styles.title}>
          Mis Citas
        </ThemedText>
      </ThemedView>

      <ThemedView style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'upcoming' && styles.activeTab]}
          onPress={() => setSelectedTab('upcoming')}
        >
          <ThemedText style={[styles.tabText, selectedTab === 'upcoming' && styles.activeTabText]}>
            Próximas
          </ThemedText>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'past' && styles.activeTab]}
          onPress={() => setSelectedTab('past')}
        >
          <ThemedText style={[styles.tabText, selectedTab === 'past' && styles.activeTabText]}>
            Historial
          </ThemedText>
        </TouchableOpacity>
      </ThemedView>

      <ThemedView style={styles.bookingsSection}>
        {currentBookings.length === 0 ? (
          <View style={styles.emptyState}>
            <IconSymbol name="calendar" size={64} color="#9ca3af" />
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
          </View>
        ) : (
          <View style={styles.bookingsList}>
            {currentBookings.map((booking) => (
              <View key={booking.id} style={styles.bookingCard}>
                <View style={styles.bookingHeader}>
                  <View style={styles.providerInfo}>
                    <ThemedText style={styles.providerName}>{booking.providerName}</ThemedText>
                    <ThemedText style={styles.serviceName}>{booking.serviceName}</ThemedText>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(booking.status) }]}>
                    <ThemedText style={styles.statusText}>
                      {getStatusText(booking.status)}
                    </ThemedText>
                  </View>
                </View>

                <View style={styles.bookingDetails}>
                  <View style={styles.detailItem}>
                    <IconSymbol name="calendar" size={16} color="#6b7280" />
                    <ThemedText style={styles.detailText}>{booking.date}</ThemedText>
                  </View>
                  <View style={styles.detailItem}>
                    <IconSymbol name="clock" size={16} color="#6b7280" />
                    <ThemedText style={styles.detailText}>{booking.time}</ThemedText>
                  </View>
                  <View style={styles.detailItem}>
                    <IconSymbol name="dollarsign.circle" size={16} color="#6b7280" />
                    <ThemedText style={styles.detailText}>{booking.price}</ThemedText>
                  </View>
                </View>

                {selectedTab === 'upcoming' && booking.status !== 'cancelled' && (
                  <View style={styles.bookingActions}>
                    <TouchableOpacity style={styles.cancelButton}>
                      <ThemedText style={styles.cancelButtonText}>Cancelar</ThemedText>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.rescheduleButton}>
                      <ThemedText style={styles.rescheduleButtonText}>Reprogramar</ThemedText>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            ))}
          </View>
        )}
      </ThemedView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    padding: 24,
    paddingTop: 60,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2563eb',
  },
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: 24,
    marginBottom: 24,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 4,
    shadowColor: '#000',
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
    backgroundColor: '#2563eb',
  },
  tabText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6b7280',
  },
  activeTabText: {
    color: '#ffffff',
  },
  bookingsSection: {
    paddingHorizontal: 24,
    marginBottom: 40,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
  bookingsList: {
    gap: 16,
  },
  bookingCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  bookingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  providerInfo: {
    flex: 1,
  },
  providerName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  serviceName: {
    fontSize: 14,
    color: '#6b7280',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ffffff',
  },
  bookingDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  detailText: {
    fontSize: 14,
    color: '#374151',
  },
  bookingActions: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ef4444',
  },
  rescheduleButton: {
    flex: 1,
    backgroundColor: '#2563eb',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  rescheduleButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
});

