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

export default function AppointmentsScreen() {
  const [selectedTab, setSelectedTab] = useState('today');
  const [refreshing, setRefreshing] = useState(false);

  const todayAppointments = [
    {
      id: 1,
      clientName: 'María González',
      serviceName: 'Corte de Cabello',
      time: '10:30 AM',
      status: 'confirmed',
      phone: '+58 412-123-4567',
      notes: 'Corte corto, estilo moderno',
      duration: '45 min',
      price: '$15',
    },
    {
      id: 2,
      clientName: 'Carlos Pérez',
      serviceName: 'Peinado',
      time: '2:00 PM',
      status: 'pending',
      phone: '+58 414-987-6543',
      notes: null,
      duration: '30 min',
      price: '$12',
    },
    {
      id: 3,
      clientName: 'Laura Martínez',
      serviceName: 'Manicure',
      time: '4:00 PM',
      status: 'confirmed',
      phone: '+58 424-111-2222',
      notes: 'Manicure francesa',
      duration: '60 min',
      price: '$20',
    },
  ];

  const upcomingAppointments = [
    {
      id: 4,
      clientName: 'Ana Rodríguez',
      serviceName: 'Tinte',
      date: '2024-01-16',
      time: '11:00 AM',
      status: 'confirmed',
      phone: '+58 416-555-1234',
      notes: 'Tinte rubio, raíces',
      duration: '90 min',
      price: '$35',
    },
    {
      id: 5,
      clientName: 'Pedro Silva',
      serviceName: 'Corte + Barba',
      date: '2024-01-17',
      time: '3:00 PM',
      status: 'pending',
      phone: '+58 426-777-8888',
      notes: null,
      duration: '45 min',
      price: '$18',
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

  const renderAppointmentCard = (appointment: any) => (
    <Card variant="elevated" style={styles.appointmentCard}>
      <View style={styles.appointmentHeader}>
        <View style={styles.clientAvatar}>
          <IconSymbol name="person.circle" size={24} color={Colors.light.primary} />
        </View>
        <View style={styles.clientInfo}>
          <ThemedText style={styles.clientName}>{appointment.clientName}</ThemedText>
          <ThemedText style={styles.serviceName}>{appointment.serviceName}</ThemedText>
          {appointment.date && (
            <ThemedText style={styles.appointmentDate}>{appointment.date}</ThemedText>
          )}
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
          <ThemedText style={styles.detailText}>{appointment.time}</ThemedText>
        </View>
        <View style={styles.detailItem}>
          <IconSymbol name="timer" size={16} color={Colors.light.textSecondary} />
          <ThemedText style={styles.detailText}>{appointment.duration}</ThemedText>
        </View>
        <View style={styles.detailItem}>
          <IconSymbol name="dollarsign.circle" size={16} color={Colors.light.textSecondary} />
          <ThemedText style={styles.detailText}>{appointment.price}</ThemedText>
        </View>
      </View>

      <View style={styles.contactInfo}>
        <IconSymbol name="phone" size={16} color={Colors.light.textSecondary} />
        <ThemedText style={styles.phoneText}>{appointment.phone}</ThemedText>
      </View>

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
            onPress={() => {
              // Lógica para confirmar cita
              console.log('Confirmar cita:', appointment.id);
            }}
            style={[styles.actionButton, { backgroundColor: Colors.light.success }]}
          />
          <Button
            title="Cancelar"
            variant="outline"
            size="small"
            onPress={() => {
              // Lógica para cancelar cita
              console.log('Cancelar cita:', appointment.id);
            }}
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
            onPress={() => {
              // Lógica para completar cita
              console.log('Completar cita:', appointment.id);
            }}
            style={[styles.actionButton, { backgroundColor: Colors.light.success }]}
          />
          <Button
            title="Reprogramar"
            variant="outline"
            size="small"
            onPress={() => {
              // Lógica para reprogramar cita
              console.log('Reprogramar cita:', appointment.id);
            }}
            style={styles.actionButton}
          />
        </View>
      )}
    </Card>
  );

  const currentAppointments = selectedTab === 'today' ? todayAppointments : upcomingAppointments;

  return (
    <View style={styles.container}>
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
        {currentAppointments.length === 0 ? (
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
});

