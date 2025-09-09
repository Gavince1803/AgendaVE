import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors, ComponentColors } from '@/constants/Colors';
import React, { useState } from 'react';
import {
    Platform,
    RefreshControl,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    View,
} from 'react-native';

export default function BookingsScreen() {
  const [selectedTab, setSelectedTab] = useState('upcoming');
  const [refreshing, setRefreshing] = useState(false);

  const upcomingBookings = [
    {
      id: 1,
      providerName: 'Salón Bella Vista',
      serviceName: 'Corte de Cabello',
      date: '2024-01-15',
      time: '10:30 AM',
      status: 'confirmed',
      price: '$15',
      duration: '45 min',
      providerImage: null,
    },
    {
      id: 2,
      providerName: 'Spa Relax',
      serviceName: 'Facial Limpieza',
      date: '2024-01-18',
      time: '2:00 PM',
      status: 'pending',
      price: '$25',
      duration: '60 min',
      providerImage: null,
    },
    {
      id: 3,
      providerName: 'Barbería Moderna',
      serviceName: 'Corte + Barba',
      date: '2024-01-20',
      time: '4:00 PM',
      status: 'confirmed',
      price: '$20',
      duration: '30 min',
      providerImage: null,
    },
  ];

  const pastBookings = [
    {
      id: 4,
      providerName: 'Clínica Dental Smile',
      serviceName: 'Limpieza Dental',
      date: '2024-01-10',
      time: '9:00 AM',
      status: 'completed',
      price: '$30',
      duration: '60 min',
      providerImage: null,
    },
    {
      id: 5,
      providerName: 'Centro de Masajes Zen',
      serviceName: 'Masaje Relajante',
      date: '2024-01-08',
      time: '3:00 PM',
      status: 'completed',
      price: '$35',
      duration: '90 min',
      providerImage: null,
    },
  ];

  const onRefresh = () => {
    setRefreshing(true);
    // Simular carga de datos
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return ComponentColors.appointment.confirmed;
      case 'pending':
        return ComponentColors.appointment.pending;
      case 'cancelled':
        return ComponentColors.appointment.cancelled;
      case 'completed':
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
      case 'completed':
        return 'Completada';
      default:
        return status;
    }
  };

  const renderBookingCard = (booking: any) => (
    <Card variant="elevated" style={styles.bookingCard}>
      <View style={styles.bookingHeader}>
        <View style={styles.providerImage}>
          <IconSymbol name="building.2" size={24} color={Colors.light.primary} />
        </View>
        <View style={styles.providerInfo}>
          <ThemedText style={styles.providerName}>{booking.providerName}</ThemedText>
          <ThemedText style={styles.serviceName}>{booking.serviceName}</ThemedText>
          <ThemedText style={styles.duration}>{booking.duration}</ThemedText>
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
          <ThemedText style={styles.detailText}>{booking.date}</ThemedText>
        </View>
        <View style={styles.detailItem}>
          <IconSymbol name="clock" size={16} color={Colors.light.textSecondary} />
          <ThemedText style={styles.detailText}>{booking.time}</ThemedText>
        </View>
        <View style={styles.detailItem}>
          <IconSymbol name="dollarsign.circle" size={16} color={Colors.light.textSecondary} />
          <ThemedText style={styles.detailText}>{booking.price}</ThemedText>
        </View>
      </View>

      {selectedTab === 'upcoming' && booking.status !== 'cancelled' && (
        <View style={styles.bookingActions}>
          <Button
            title="Cancelar"
            variant="outline"
            size="small"
            onPress={() => {
              // Lógica para cancelar cita
              console.log('Cancelar cita:', booking.id);
            }}
            style={[styles.actionButton, { borderColor: Colors.light.error }]}
          />
          <Button
            title="Reprogramar"
            variant="primary"
            size="small"
            onPress={() => {
              // Lógica para reprogramar cita
              console.log('Reprogramar cita:', booking.id);
            }}
            style={styles.actionButton}
          />
        </View>
      )}

      {selectedTab === 'past' && booking.status === 'completed' && (
        <View style={styles.bookingActions}>
          <Button
            title="Calificar"
            variant="outline"
            size="small"
            onPress={() => {
              // Lógica para calificar servicio
              console.log('Calificar servicio:', booking.id);
            }}
            style={styles.actionButton}
          />
          <Button
            title="Reservar de nuevo"
            variant="primary"
            size="small"
            onPress={() => {
              // Lógica para reservar de nuevo
              console.log('Reservar de nuevo:', booking.id);
            }}
            style={styles.actionButton}
          />
        </View>
      )}
    </Card>
  );

  const currentBookings = selectedTab === 'upcoming' ? upcomingBookings : pastBookings;

  return (
    <View style={styles.container}>
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
        {currentBookings.length === 0 ? (
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
                  // Navegar a explorar
                  console.log('Navegar a explorar');
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
    </View>
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
    paddingHorizontal: 20,
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
});

