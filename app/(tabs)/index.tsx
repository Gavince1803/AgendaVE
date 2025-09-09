import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useAuth } from '@/contexts/AuthContext';
import React from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';

export default function HomeScreen() {
  const { user } = useAuth();
  const isProvider = user?.profile?.role === 'provider';
  const isClient = user?.profile?.role === 'client';

  if (isClient) {
    return <ClientHomeScreen />;
  }

  if (isProvider) {
    return <ProviderHomeScreen />;
  }

  return (
    <ThemedView style={styles.container}>
      <ThemedText>Loading...</ThemedText>
    </ThemedView>
  );
}

function ClientHomeScreen() {
  return (
    <ScrollView style={styles.container}>
      <ThemedView style={styles.header}>
        <ThemedText type="title" style={styles.welcomeText}>
          ¡Bienvenido a AgendaVE!
        </ThemedText>
        <ThemedText style={styles.subtitle}>
          Encuentra y reserva los mejores servicios en Venezuela
        </ThemedText>
      </ThemedView>

      <ThemedView style={styles.section}>
        <ThemedText type="subtitle" style={styles.sectionTitle}>
          Categorías Populares
        </ThemedText>
        <View style={styles.categoriesGrid}>
          {[
            { name: 'Peluquería', icon: 'scissors', color: '#ef4444' },
            { name: 'Estética', icon: 'sparkles', color: '#f59e0b' },
            { name: 'Salud', icon: 'cross.case', color: '#10b981' },
            { name: 'Bienestar', icon: 'leaf', color: '#8b5cf6' },
          ].map((category, index) => (
            <TouchableOpacity key={index} style={styles.categoryCard}>
              <View style={[styles.categoryIcon, { backgroundColor: category.color }]}>
                <IconSymbol name={category.icon} size={24} color="white" />
              </View>
              <ThemedText style={styles.categoryName}>{category.name}</ThemedText>
            </TouchableOpacity>
          ))}
        </View>
      </ThemedView>

      <ThemedView style={styles.section}>
        <ThemedText type="subtitle" style={styles.sectionTitle}>
          Proveedores Destacados
        </ThemedText>
        <View style={styles.providersList}>
          {[1, 2, 3].map((item) => (
            <TouchableOpacity key={item} style={styles.providerCard}>
              <View style={styles.providerInfo}>
                <ThemedText style={styles.providerName}>Proveedor {item}</ThemedText>
                <ThemedText style={styles.providerCategory}>Peluquería</ThemedText>
                <View style={styles.rating}>
                  <IconSymbol name="star.fill" size={16} color="#fbbf24" />
                  <ThemedText style={styles.ratingText}>4.8</ThemedText>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ThemedView>
    </ScrollView>
  );
}

function ProviderHomeScreen() {
  return (
    <ScrollView style={styles.container}>
      <ThemedView style={styles.header}>
        <ThemedText type="title" style={styles.welcomeText}>
          Dashboard
        </ThemedText>
        <ThemedText style={styles.subtitle}>
          Gestiona tu negocio y citas
        </ThemedText>
      </ThemedView>

      <ThemedView style={styles.section}>
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <ThemedText style={styles.statNumber}>12</ThemedText>
            <ThemedText style={styles.statLabel}>Citas Hoy</ThemedText>
          </View>
          <View style={styles.statCard}>
            <ThemedText style={styles.statNumber}>48</ThemedText>
            <ThemedText style={styles.statLabel}>Esta Semana</ThemedText>
          </View>
          <View style={styles.statCard}>
            <ThemedText style={styles.statNumber}>4.8</ThemedText>
            <ThemedText style={styles.statLabel}>Calificación</ThemedText>
          </View>
        </View>
      </ThemedView>

      <ThemedView style={styles.section}>
        <ThemedText type="subtitle" style={styles.sectionTitle}>
          Próximas Citas
        </ThemedText>
        <View style={styles.appointmentsList}>
          {[1, 2, 3].map((item) => (
            <View key={item} style={styles.appointmentCard}>
              <View style={styles.appointmentTime}>
                <ThemedText style={styles.timeText}>10:30 AM</ThemedText>
              </View>
              <View style={styles.appointmentInfo}>
                <ThemedText style={styles.clientName}>Cliente {item}</ThemedText>
                <ThemedText style={styles.serviceName}>Corte de Cabello</ThemedText>
              </View>
              <TouchableOpacity style={styles.statusButton}>
                <ThemedText style={styles.statusText}>Confirmar</ThemedText>
              </TouchableOpacity>
            </View>
          ))}
        </View>
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
  welcomeText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2563eb',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
  },
  section: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
    color: '#374151',
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  categoryCard: {
    width: '45%',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  categoryIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  categoryName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    textAlign: 'center',
  },
  providersList: {
    gap: 12,
  },
  providerCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  providerInfo: {
    flex: 1,
  },
  providerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  providerCategory: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 8,
  },
  rating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2563eb',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
  },
  appointmentsList: {
    gap: 12,
  },
  appointmentCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  appointmentTime: {
    width: 60,
    alignItems: 'center',
  },
  timeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2563eb',
  },
  appointmentInfo: {
    flex: 1,
    marginLeft: 16,
  },
  clientName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  serviceName: {
    fontSize: 14,
    color: '#6b7280',
  },
  statusButton: {
    backgroundColor: '#10b981',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  statusText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
});
