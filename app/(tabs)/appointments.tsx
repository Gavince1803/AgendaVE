import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';

export default function AppointmentsScreen() {
  const [selectedTab, setSelectedTab] = useState('today');

  const todayAppointments = [
    {
      id: 1,
      clientName: 'María González',
      serviceName: 'Corte de Cabello',
      time: '10:30 AM',
      status: 'confirmed',
      phone: '+58 412-123-4567',
      notes: 'Corte corto, estilo moderno',
    },
    {
      id: 2,
      clientName: 'Carlos Pérez',
      serviceName: 'Peinado',
      time: '2:00 PM',
      status: 'pending',
      phone: '+58 414-987-6543',
      notes: null,
    },
  ];

  const upcomingAppointments = [
    {
      id: 3,
      clientName: 'Ana Rodríguez',
      serviceName: 'Tinte',
      date: '2024-01-16',
      time: '11:00 AM',
      status: 'confirmed',
      phone: '+58 416-555-1234',
      notes: 'Tinte rubio, raíces',
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

  const currentAppointments = selectedTab === 'today' ? todayAppointments : upcomingAppointments;

  return (
    <ScrollView style={styles.container}>
      <ThemedView style={styles.header}>
        <ThemedText type="title" style={styles.title}>
          Mis Citas
        </ThemedText>
        <ThemedText style={styles.subtitle}>
          Gestiona las citas de tus clientes
        </ThemedText>
      </ThemedView>

      <ThemedView style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'today' && styles.activeTab]}
          onPress={() => setSelectedTab('today')}
        >
          <ThemedText style={[styles.tabText, selectedTab === 'today' && styles.activeTabText]}>
            Hoy
          </ThemedText>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'upcoming' && styles.activeTab]}
          onPress={() => setSelectedTab('upcoming')}
        >
          <ThemedText style={[styles.tabText, selectedTab === 'upcoming' && styles.activeTabText]}>
            Próximas
          </ThemedText>
        </TouchableOpacity>
      </ThemedView>

      <ThemedView style={styles.appointmentsSection}>
        {currentAppointments.length === 0 ? (
          <View style={styles.emptyState}>
            <IconSymbol name="calendar" size={64} color="#9ca3af" />
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
            {currentAppointments.map((appointment) => (
              <View key={appointment.id} style={styles.appointmentCard}>
                <View style={styles.appointmentHeader}>
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
                    <IconSymbol name="clock" size={16} color="#6b7280" />
                    <ThemedText style={styles.detailText}>{appointment.time}</ThemedText>
                  </View>
                  <View style={styles.detailItem}>
                    <IconSymbol name="phone" size={16} color="#6b7280" />
                    <ThemedText style={styles.detailText}>{appointment.phone}</ThemedText>
                  </View>
                </View>

                {appointment.notes && (
                  <View style={styles.notesContainer}>
                    <ThemedText style={styles.notesLabel}>Notas:</ThemedText>
                    <ThemedText style={styles.notesText}>{appointment.notes}</ThemedText>
                  </View>
                )}

                {appointment.status === 'pending' && (
                  <View style={styles.appointmentActions}>
                    <TouchableOpacity style={styles.confirmButton}>
                      <ThemedText style={styles.confirmButtonText}>Confirmar</ThemedText>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.cancelButton}>
                      <ThemedText style={styles.cancelButtonText}>Cancelar</ThemedText>
                    </TouchableOpacity>
                  </View>
                )}

                {appointment.status === 'confirmed' && (
                  <View style={styles.appointmentActions}>
                    <TouchableOpacity style={styles.completeButton}>
                      <ThemedText style={styles.completeButtonText}>Completar</ThemedText>
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
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
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
  appointmentsSection: {
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
  appointmentsList: {
    gap: 16,
  },
  appointmentCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  appointmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  clientInfo: {
    flex: 1,
  },
  clientName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  serviceName: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 2,
  },
  appointmentDate: {
    fontSize: 12,
    color: '#9ca3af',
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
  appointmentDetails: {
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
  notesContainer: {
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  notesLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 4,
  },
  notesText: {
    fontSize: 14,
    color: '#374151',
  },
  appointmentActions: {
    flexDirection: 'row',
    gap: 12,
  },
  confirmButton: {
    flex: 1,
    backgroundColor: '#10b981',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  confirmButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
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
  completeButton: {
    flex: 1,
    backgroundColor: '#059669',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  completeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
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

