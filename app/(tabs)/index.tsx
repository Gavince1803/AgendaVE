import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { useAuth } from '@/contexts/AuthContext';
import { router } from 'expo-router';
import React from 'react';
import {
    Platform,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    View
} from 'react-native';

export default function HomeScreen() {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Cargando...</Text>
      </View>
    );
  }

  if (!user) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>No hay usuario autenticado</Text>
      </View>
    );
  }

  const isProvider = user?.profile?.role === 'provider';
  const isClient = user?.profile?.role === 'client';

  if (isClient) {
    return <ClientHomeScreen />;
  }

  if (isProvider) {
    return <ProviderHomeScreen />;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.errorText}>Rol de usuario no reconocido</Text>
    </View>
  );
}

function ClientHomeScreen() {
  const [refreshing, setRefreshing] = React.useState(false);

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  };

  const categories = [
    { name: 'Peluquería', icon: 'scissors', color: Colors.light.primary },
    { name: 'Estética', icon: 'star', color: Colors.light.secondary },
    { name: 'Salud', icon: 'cross.case', color: Colors.light.success },
    { name: 'Bienestar', icon: 'heart', color: Colors.light.accent },
  ];

  const featuredProviders = [
    {
      id: 1,
      name: 'Salón Bella Vista',
      category: 'Peluquería',
      rating: 4.8,
      distance: '0.5 km',
      price: 'Desde $15',
      isOpen: true,
    },
    {
      id: 2,
      name: 'Spa Relax',
      category: 'Estética',
      rating: 4.9,
      distance: '1.2 km',
      price: 'Desde $25',
      isOpen: true,
    },
    {
      id: 3,
      name: 'Clínica Dental Smile',
      category: 'Salud',
      rating: 4.7,
      distance: '0.8 km',
      price: 'Desde $30',
      isOpen: false,
    },
  ];

  return (
    <ScrollView 
      style={styles.container}
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
      {/* Header con saludo personalizado */}
      <ThemedView style={styles.header}>
        <View style={styles.welcomeSection}>
          <ThemedText type="title" style={styles.welcomeText}>
            ¡Hola! 👋
          </ThemedText>
          <ThemedText style={styles.subtitle}>
            Encuentra y reserva los mejores servicios en Venezuela
          </ThemedText>
        </View>
        
        {/* Botón de búsqueda rápida */}
        <Button
          title="Buscar servicios"
          variant="outline"
          size="medium"
          icon={<IconSymbol name="magnifyingglass" size={18} color={Colors.light.primary} />}
          onPress={() => {
            // Navegar a explorar
            console.log('Navegar a explorar');
          }}
          style={styles.searchButton}
        />
      </ThemedView>

      {/* Categorías populares */}
      <ThemedView style={styles.section}>
        <View style={styles.sectionHeader}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Categorías Populares
          </ThemedText>
          <Button
            title="Ver todas"
            variant="ghost"
            size="small"
            onPress={() => {
              // Navegar a explorar con filtro
              console.log('Ver todas las categorías');
            }}
          />
        </View>
        
        <View style={styles.categoriesGrid}>
          {categories.map((category, index) => (
            <Card
              key={index}
              variant="elevated"
              style={styles.categoryCard}
              onPress={() => {
                // Navegar a categoría específica
                console.log('Categoría:', category.name);
              }}
            >
              <View style={[styles.categoryIcon, { backgroundColor: category.color }]}>
                <IconSymbol name={category.icon as any} size={24} color="white" />
              </View>
              <ThemedText style={styles.categoryName}>{category.name}</ThemedText>
            </Card>
          ))}
        </View>
      </ThemedView>

      {/* Proveedores destacados */}
      <ThemedView style={styles.section}>
        <View style={styles.sectionHeader}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Proveedores Destacados
          </ThemedText>
          <Button
            title="Ver todos"
            variant="ghost"
            size="small"
            onPress={() => {
              // Navegar a explorar
              console.log('Ver todos los proveedores');
            }}
          />
        </View>
        
        <View style={styles.providersList}>
          {featuredProviders.map((provider) => (
            <Card
              key={provider.id}
              variant="elevated"
              style={styles.providerCard}
              onPress={() => {
                // Navegar a detalles del proveedor
                console.log('Proveedor:', provider.name);
              }}
            >
              <View style={styles.providerHeader}>
                <View style={styles.providerImage}>
                  <IconSymbol name="building.2" size={24} color={Colors.light.primary} />
                </View>
                <View style={styles.providerInfo}>
                  <ThemedText style={styles.providerName}>{provider.name}</ThemedText>
                  <ThemedText style={styles.providerCategory}>{provider.category}</ThemedText>
                  <View style={styles.providerStatus}>
                    <View style={[
                      styles.statusIndicator, 
                      { backgroundColor: provider.isOpen ? Colors.light.success : Colors.light.error }
                    ]} />
                    <ThemedText style={styles.statusText}>
                      {provider.isOpen ? 'Abierto' : 'Cerrado'}
                    </ThemedText>
                  </View>
                </View>
                <View style={styles.providerRating}>
                  <View style={styles.ratingContainer}>
                    <IconSymbol name="star.fill" size={14} color={Colors.light.secondary} />
                    <ThemedText style={styles.ratingText}>{provider.rating}</ThemedText>
                  </View>
                </View>
              </View>
              
              <View style={styles.providerFooter}>
                <View style={styles.providerDetails}>
                  <ThemedText style={styles.distance}>{provider.distance}</ThemedText>
                  <ThemedText style={styles.price}>{provider.price}</ThemedText>
                </View>
                <Button
                  title="Reservar"
                  size="small"
                  onPress={() => {
                    // Navegar al flujo de booking
                    router.push({
                      pathname: '/(booking)/provider-detail',
                      params: { providerId: provider.id.toString() }
                    });
                  }}
                />
              </View>
            </Card>
          ))}
        </View>
      </ThemedView>

      {/* Acciones rápidas */}
      <ThemedView style={styles.section}>
        <ThemedText type="subtitle" style={styles.sectionTitle}>
          Acciones Rápidas
        </ThemedText>
        
        <View style={styles.quickActions}>
          <Button
            title="Mis Citas"
            variant="outline"
            size="medium"
            icon={<IconSymbol name="calendar" size={18} color={Colors.light.primary} />}
            onPress={() => {
              // Navegar a citas
              console.log('Ver mis citas');
            }}
            style={styles.quickActionButton}
          />
          <Button
            title="Favoritos"
            variant="outline"
            size="medium"
            icon={<IconSymbol name="heart" size={18} color={Colors.light.primary} />}
            onPress={() => {
              // Navegar a favoritos
              console.log('Ver favoritos');
            }}
            style={styles.quickActionButton}
          />
        </View>
      </ThemedView>
    </ScrollView>
  );
}

function ProviderHomeScreen() {
  const [refreshing, setRefreshing] = React.useState(false);

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  };

  const stats = [
    { number: '12', label: 'Citas Hoy', icon: 'calendar', color: Colors.light.primary },
    { number: '48', label: 'Esta Semana', icon: 'calendar', color: Colors.light.secondary },
    { number: '4.8', label: 'Calificación', icon: 'star.fill', color: Colors.light.success },
  ];

  const upcomingAppointments = [
    {
      id: 1,
      clientName: 'María González',
      serviceName: 'Corte de Cabello',
      time: '10:30 AM',
      status: 'confirmed',
    },
    {
      id: 2,
      clientName: 'Carlos Pérez',
      serviceName: 'Peinado',
      time: '2:00 PM',
      status: 'pending',
    },
    {
      id: 3,
      clientName: 'Laura Martínez',
      serviceName: 'Manicure',
      time: '4:00 PM',
      status: 'confirmed',
    },
  ];

  return (
    <ScrollView 
      style={styles.container}
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
      {/* Header */}
      <ThemedView style={styles.header}>
        <View style={styles.welcomeSection}>
          <ThemedText type="title" style={styles.welcomeText}>
            Dashboard 📊
          </ThemedText>
          <ThemedText style={styles.subtitle}>
            Gestiona tu negocio y citas
          </ThemedText>
        </View>
        
        {/* Botón de configuración rápida */}
        <Button
          title="Configurar"
          variant="outline"
          size="medium"
          icon={<IconSymbol name="gearshape" size={18} color={Colors.light.primary} />}
          onPress={() => {
            // Navegar a configuración
            console.log('Configurar perfil');
          }}
          style={styles.searchButton}
        />
      </ThemedView>

      {/* Estadísticas */}
      <ThemedView style={styles.section}>
        <ThemedText type="subtitle" style={styles.sectionTitle}>
          Estadísticas
        </ThemedText>
        
        <View style={styles.statsGrid}>
          {stats.map((stat, index) => (
            <Card
              key={index}
              variant="elevated"
              style={styles.statCard}
            >
              <View style={[styles.statIcon, { backgroundColor: stat.color }]}>
                <IconSymbol name={stat.icon as any} size={20} color="white" />
              </View>
              <ThemedText style={styles.statNumber}>{stat.number}</ThemedText>
              <ThemedText style={styles.statLabel}>{stat.label}</ThemedText>
            </Card>
          ))}
        </View>
      </ThemedView>

      {/* Próximas citas */}
      <ThemedView style={styles.section}>
        <View style={styles.sectionHeader}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Próximas Citas
          </ThemedText>
          <Button
            title="Ver todas"
            variant="ghost"
            size="small"
            onPress={() => {
              // Navegar a citas
              console.log('Ver todas las citas');
            }}
          />
        </View>
        
        <View style={styles.appointmentsList}>
          {upcomingAppointments.map((appointment) => (
            <Card
              key={appointment.id}
              variant="elevated"
              style={styles.appointmentCard}
            >
              <View style={styles.appointmentHeader}>
                <View style={styles.appointmentTime}>
                  <ThemedText style={styles.timeText}>{appointment.time}</ThemedText>
                </View>
                <View style={styles.appointmentInfo}>
                  <ThemedText style={styles.clientName}>{appointment.clientName}</ThemedText>
                  <ThemedText style={styles.serviceName}>{appointment.serviceName}</ThemedText>
                </View>
                <View style={[
                  styles.statusBadge,
                  { backgroundColor: appointment.status === 'confirmed' ? Colors.light.success : Colors.light.warning }
                ]}>
                  <ThemedText style={styles.statusText}>
                    {appointment.status === 'confirmed' ? 'Confirmada' : 'Pendiente'}
                  </ThemedText>
                </View>
              </View>
              
              <View style={styles.appointmentActions}>
                <Button
                  title={appointment.status === 'confirmed' ? 'Completar' : 'Confirmar'}
                  variant="primary"
                  size="small"
                  onPress={() => {
                    // Acción según estado
                    console.log('Acción:', appointment.status);
                  }}
                  style={styles.actionButton}
                />
                <Button
                  title="Reprogramar"
                  variant="outline"
                  size="small"
                  onPress={() => {
                    // Reprogramar cita
                    console.log('Reprogramar cita:', appointment.id);
                  }}
                  style={styles.actionButton}
                />
              </View>
            </Card>
          ))}
        </View>
      </ThemedView>

      {/* Acciones rápidas */}
      <ThemedView style={styles.section}>
        <ThemedText type="subtitle" style={styles.sectionTitle}>
          Acciones Rápidas
        </ThemedText>
        
        <View style={styles.quickActions}>
          <Button
            title="Mis Servicios"
            variant="outline"
            size="medium"
            icon={<IconSymbol name="wrench.and.screwdriver" size={18} color={Colors.light.primary} />}
            onPress={() => {
              // Navegar a servicios
              console.log('Gestionar servicios');
            }}
            style={styles.quickActionButton}
          />
          <Button
            title="Horarios"
            variant="outline"
            size="medium"
            icon={<IconSymbol name="clock" size={18} color={Colors.light.primary} />}
            onPress={() => {
              // Navegar a horarios
              console.log('Gestionar horarios');
            }}
            style={styles.quickActionButton}
          />
        </View>
      </ThemedView>
    </ScrollView>
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
  welcomeSection: {
    marginBottom: 20,
  },
  welcomeText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.light.primary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.light.textSecondary,
    lineHeight: 22,
  },
  searchButton: {
    marginTop: 8,
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.light.text,
  },
  
  // Categorías
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  categoryCard: {
    width: '47%',
    alignItems: 'center',
    paddingVertical: 20,
  },
  categoryIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  categoryName: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.text,
    textAlign: 'center',
  },
  
  // Proveedores
  providersList: {
    gap: 16,
  },
  providerCard: {
    marginBottom: 0,
  },
  providerHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  providerImage: {
    width: 48,
    height: 48,
    borderRadius: 12,
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
  providerCategory: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    marginBottom: 8,
  },
  providerStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.light.textSecondary,
  },
  providerRating: {
    alignItems: 'flex-end',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  ratingText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.text,
    marginLeft: 4,
  },
  providerFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  providerDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  distance: {
    fontSize: 14,
    color: Colors.light.textSecondary,
  },
  price: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.success,
  },
  
  // Acciones rápidas
  quickActions: {
    flexDirection: 'row',
    gap: 12,
  },
  quickActionButton: {
    flex: 1,
  },
  
  // Estadísticas del proveedor
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 20,
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
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
  
  // Citas del proveedor
  appointmentsList: {
    gap: 16,
  },
  appointmentCard: {
    marginBottom: 0,
  },
  appointmentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  appointmentTime: {
    width: 60,
    alignItems: 'center',
    marginRight: 16,
  },
  timeText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.primary,
  },
  appointmentInfo: {
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
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  appointmentStatusText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#ffffff',
  },
  appointmentActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
  },
  loadingText: {
    fontSize: 18,
    color: Colors.light.textSecondary,
    textAlign: 'center',
    marginTop: 50,
  },
  errorText: {
    fontSize: 18,
    color: Colors.light.error,
    textAlign: 'center',
    marginTop: 50,
  },
});
