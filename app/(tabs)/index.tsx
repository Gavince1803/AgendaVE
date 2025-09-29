import { ThemedText } from '@/components/ThemedText';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { TabSafeAreaView } from '@/components/ui/SafeAreaView';
import { Colors, DesignTokens } from '@/constants/Colors';
import { useAuth } from '@/contexts/AuthContext';
import { Appointment, BookingService, Provider } from '@/lib/booking-service';
import { LogCategory, useLogger } from '@/lib/logger';
import { router } from 'expo-router';
import React from 'react';
import {
  Alert,
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
  const [featuredProviders, setFeaturedProviders] = React.useState<Provider[]>([]);
  const [loading, setLoading] = React.useState(true);
  const { user } = useAuth();
  const log = useLogger(user?.id);

  React.useEffect(() => {
    loadFeaturedProviders();
  }, []);

  const loadFeaturedProviders = async () => {
    try {
      setLoading(true);
      log.info(LogCategory.DATABASE, 'Loading featured providers', { screen: 'ClientHome' });
      
      const providers = await BookingService.getAllProviders();
      // Tomar los primeros 3 proveedores como destacados
      setFeaturedProviders(providers.slice(0, 3));
      
      log.info(LogCategory.DATABASE, 'Featured providers loaded', { 
        count: providers.slice(0, 3).length,
        screen: 'ClientHome' 
      });
    } catch (error) {
      log.error(LogCategory.SERVICE, 'Error loading featured providers', error);
      setFeaturedProviders([]);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    log.userAction('Refresh dashboard', { screen: 'ClientHome' });
    setRefreshing(true);
    await loadFeaturedProviders();
    setRefreshing(false);
    log.info(LogCategory.UI, 'Dashboard refresh completed', { screen: 'ClientHome' });
  };

  const categories = [
    { name: 'Peluquería', icon: 'scissors', color: Colors.light.primary },
    { name: 'Estética', icon: 'star', color: Colors.light.secondary },
    { name: 'Salud', icon: 'cross.case', color: Colors.light.success },
    { name: 'Bienestar', icon: 'heart', color: Colors.light.accent },
  ];


  return (
    <TabSafeAreaView style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
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
        {/* Header con saludo personalizado */}
        <View style={styles.header}>
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
            log.userAction('Navigate to explore', { screen: 'ClientHome' });
            log.navigation('ClientHome', 'Explore');
            router.push('/(tabs)/explore');
          }}
          style={styles.searchButton}
        />
      </View>

      {/* Categorías populares */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Categorías Populares
          </ThemedText>
          <Button
            title="Ver todas"
            variant="ghost"
            size="small"
            onPress={() => {
              log.userAction('Navigate to explore', { screen: 'ClientHome' });
              log.navigation('ClientHome', 'Explore');
              router.push('/(tabs)/explore');
            }}
          />
        </View>
        
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesScrollContent}
        >
          {categories.map((category, index) => (
            <Card
              key={index}
              variant="elevated"
              style={styles.categoryCard}
              onPress={() => {
                log.userAction('Select category', { category: category.name, screen: 'ClientHome' });
                log.navigation('ClientHome', 'Explore');
                router.push('/(tabs)/explore');
              }}
            >
              <View style={[styles.categoryIcon, { backgroundColor: category.color }]}>
                <IconSymbol name={category.icon as any} size={20} color="white" />
              </View>
              <ThemedText style={styles.categoryName}>{category.name}</ThemedText>
            </Card>
          ))}
        </ScrollView>
      </View>

      {/* Proveedores destacados */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Proveedores Destacados
          </ThemedText>
          <Button
            title="Ver todos"
            variant="ghost"
            size="small"
            onPress={() => {
              log.userAction('Navigate to explore', { screen: 'ClientHome' });
              log.navigation('ClientHome', 'Explore');
              router.push('/(tabs)/explore');
            }}
          />
        </View>
        
        <View style={styles.providersList}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ThemedText style={styles.loadingText}>Cargando proveedores...</ThemedText>
            </View>
          ) : featuredProviders.length > 0 ? (
            featuredProviders.map((provider) => (
              <Card
                key={provider.id}
                variant="elevated"
                style={styles.providerCard}
                onPress={() => {
                  log.userAction('Select provider', { providerId: provider.id, providerName: provider.business_name, screen: 'ClientHome' });
                  log.navigation('ClientHome', 'ProviderDetail');
                  router.push({
                    pathname: '/(booking)/provider-detail',
                    params: { providerId: provider.id }
                  });
                }}
              >
                <View style={styles.providerHeader}>
                  <View style={styles.providerImage}>
                    <IconSymbol name="building.2" size={24} color={Colors.light.primary} />
                  </View>
                  <View style={styles.providerInfo}>
                    <ThemedText style={styles.providerName}>{provider.business_name}</ThemedText>
                    <ThemedText style={styles.providerCategory}>{provider.category}</ThemedText>
                    <View style={styles.providerStatus}>
                      <View style={[
                        styles.statusIndicator, 
                        { backgroundColor: provider.is_active ? Colors.light.success : Colors.light.error }
                      ]} />
                      <ThemedText style={styles.statusText}>
                        {provider.is_active ? 'Abierto' : 'Cerrado'}
                      </ThemedText>
                    </View>
                  </View>
                  <View style={styles.providerRating}>
                    <View style={styles.ratingContainer}>
                      <IconSymbol name="star.fill" size={14} color={Colors.light.secondary} />
                      <ThemedText style={styles.ratingText}>{provider.rating.toFixed(1)}</ThemedText>
                    </View>
                  </View>
                </View>
                
                <View style={styles.providerFooter}>
                  <View style={styles.providerDetails}>
                    <ThemedText style={styles.distance} numberOfLines={1}>{provider.address || 'Ubicación no disponible'}</ThemedText>
                    <ThemedText style={styles.price}>Desde $25</ThemedText>
                  </View>
                  <View style={styles.reserveButtonContainer}>
                    <Button
                      title="Reservar"
                      size="small"
                      onPress={() => {
                        log.userAction('Start booking flow', { providerId: provider.id, providerName: provider.business_name, screen: 'ClientHome' });
                        log.navigation('ClientHome', 'ProviderDetail');
                        router.push({
                          pathname: '/(booking)/provider-detail',
                          params: { providerId: provider.id }
                        });
                      }}
                      style={styles.reserveButton}
                    />
                  </View>
                </View>
              </Card>
            ))
          ) : (
            <View style={styles.emptyContainer}>
              <ThemedText style={styles.emptyText}>
                No hay proveedores disponibles
              </ThemedText>
            </View>
          )}
        </View>
      </View>

      {/* Acciones rápidas */}
      <View style={styles.section}>
        <ThemedText type="subtitle" style={styles.sectionTitle}>
          Acciones Rápidas
        </ThemedText>
        
        <View style={styles.quickActionsGrid}>
          <Card
            variant="elevated"
            style={styles.quickActionCard}
            onPress={() => {
              log.userAction('Navigate to bookings', { screen: 'ClientHome' });
              log.navigation('ClientHome', 'Bookings');
              router.push('/(tabs)/bookings');
            }}
          >
            <View style={[styles.quickActionIcon, { backgroundColor: Colors.light.primary + '20' }]}>
              <IconSymbol name="calendar" size={24} color={Colors.light.primary} />
            </View>
            <ThemedText style={styles.quickActionTitle}>Mis Citas</ThemedText>
            <ThemedText style={styles.quickActionSubtitle}>Gestiona tus reservas</ThemedText>
          </Card>
          
          <Card
            variant="elevated"
            style={styles.quickActionCard}
            onPress={() => {
              log.userAction('Navigate to favorites', { screen: 'ClientHome' });
              router.push('/(tabs)/favorites');
            }}
          >
            <View style={[styles.quickActionIcon, { backgroundColor: Colors.light.accent + '20' }]}>
              <IconSymbol name="heart" size={24} color={Colors.light.accent} />
            </View>
            <ThemedText style={styles.quickActionTitle}>Favoritos</ThemedText>
            <ThemedText style={styles.quickActionSubtitle}>Servicios guardados</ThemedText>
          </Card>
        </View>
      </View>
      </ScrollView>
    </TabSafeAreaView>
  );
}

function ProviderHomeScreen() {
  const [refreshing, setRefreshing] = React.useState(false);
  const [appointments, setAppointments] = React.useState<Appointment[]>([]);
  const [loading, setLoading] = React.useState(true);
  const { user } = useAuth();
  const log = useLogger(user?.id);

  React.useEffect(() => {
    loadAppointments();
  }, []);

  const loadAppointments = async () => {
    try {
      setLoading(true);
      log.info(LogCategory.DATABASE, 'Loading provider appointments', { screen: 'ProviderHome' });
      
      const appointmentsData = await BookingService.getProviderAppointments();
      setAppointments(appointmentsData);
      
      log.info(LogCategory.DATABASE, 'Provider appointments loaded', { 
        count: appointmentsData.length,
        screen: 'ProviderHome' 
      });
    } catch (error) {
      log.error(LogCategory.SERVICE, 'Error loading provider appointments', error);
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    log.userAction('Refresh dashboard', { screen: 'ProviderHome' });
    setRefreshing(true);
    await loadAppointments();
    setRefreshing(false);
    log.info(LogCategory.UI, 'Dashboard refresh completed', { screen: 'ProviderHome' });
  };

  // Calcular estadísticas reales
  const today = new Date().toISOString().split('T')[0];
  const todayAppointments = appointments.filter(apt => apt.appointment_date === today);
  const pendingAppointments = appointments.filter(apt => apt.status === 'pending');
  const confirmedAppointments = appointments.filter(apt => apt.status === 'confirmed');

  const stats = [
    { 
      number: todayAppointments.length.toString(), 
      label: 'Citas Hoy', 
      icon: 'calendar', 
      color: Colors.light.primary 
    },
    { 
      number: pendingAppointments.length.toString(), 
      label: 'Pendientes', 
      icon: 'clock', 
      color: Colors.light.warning 
    },
    { 
      number: confirmedAppointments.length.toString(), 
      label: 'Confirmadas', 
      icon: 'checkmark.circle', 
      color: Colors.light.success 
    },
  ];

  // Obtener próximas citas (máximo 3)
  const upcomingAppointments = appointments
    .filter(apt => apt.status === 'pending' || apt.status === 'confirmed')
    .sort((a, b) => {
      const dateA = new Date(`${a.appointment_date}T${a.appointment_time}`);
      const dateB = new Date(`${b.appointment_date}T${b.appointment_time}`);
      return dateA.getTime() - dateB.getTime();
    })
    .slice(0, 3);

  const handleAppointmentAction = async (appointment: Appointment, action: 'confirm' | 'cancel' | 'complete') => {
    try {
      log.userAction('Appointment action', { 
        appointmentId: appointment.id, 
        action,
        status: appointment.status,
        screen: 'ProviderHome' 
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
      log.error(LogCategory.SERVICE, 'Error updating appointment status', error);
      Alert.alert('Error', 'No se pudo actualizar el estado de la cita');
    }
  };

  return (
    <TabSafeAreaView style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
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
        {/* Header */}
        <View style={styles.header}>
        <View style={styles.welcomeSection}>
          <ThemedText type="title" style={styles.welcomeText}>
            Dashboard 📊
          </ThemedText>
          <ThemedText style={styles.subtitle}>
            Gestiona tu negocio y citas
          </ThemedText>
        </View>
        
        {/* Botón de Mi Negocio */}
        <Button
          title="Mi Negocio"
          variant="outline"
          size="medium"
          icon={<IconSymbol name="building.2" size={18} color={Colors.light.primary} />}
          onPress={() => {
            log.userAction('Navigate to my business', { screen: 'ProviderHome' });
            router.push('/(provider)/my-business');
          }}
          style={styles.searchButton}
        />
      </View>

      {/* Estadísticas */}
      <View style={styles.section}>
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
      </View>

      {/* Próximas citas */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Próximas Citas
          </ThemedText>
          <Button
            title="Ver todas"
            variant="ghost"
            size="small"
            onPress={() => {
              log.userAction('Navigate to all appointments', { screen: 'ProviderHome' });
              log.navigation('ProviderHome', 'Appointments');
              router.push('/(tabs)/appointments');
            }}
          />
        </View>
        
        <View style={styles.appointmentsList}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ThemedText style={styles.loadingText}>Cargando citas...</ThemedText>
            </View>
          ) : upcomingAppointments.length > 0 ? (
            upcomingAppointments.map((appointment) => (
              <Card
                key={appointment.id}
                variant="elevated"
                style={styles.appointmentCard}
              >
                <View style={styles.appointmentHeader}>
                  <View style={styles.appointmentTime}>
                    <ThemedText style={styles.timeText}>{appointment.appointment_time}</ThemedText>
                    <ThemedText style={styles.dateText}>
                      {new Date(appointment.appointment_date).toLocaleDateString('es-VE', {
                        day: 'numeric',
                        month: 'short'
                      })}
                    </ThemedText>
                  </View>
                  <View style={styles.appointmentInfo}>
                    <ThemedText style={styles.clientName}>
                      {appointment.profiles?.display_name || 'Cliente'}
                    </ThemedText>
                    <ThemedText style={styles.serviceName}>
                      {appointment.services?.name || 'Servicio'}
                    </ThemedText>
                    {appointment.profiles?.phone && (
                      <ThemedText style={styles.clientPhone}>
                        📞 {appointment.profiles.phone}
                      </ThemedText>
                    )}
                  </View>
                  <View style={[
                    styles.statusBadge,
                    { 
                      backgroundColor: appointment.status === 'confirmed' 
                        ? Colors.light.success 
                        : appointment.status === 'pending'
                        ? Colors.light.warning
                        : Colors.light.error
                    }
                  ]}>
                    <ThemedText style={styles.statusText}>
                      {appointment.status === 'confirmed' ? 'Confirmada' : 
                       appointment.status === 'pending' ? 'Pendiente' : 
                       appointment.status === 'cancelled' ? 'Cancelada' : 'Completada'}
                    </ThemedText>
                  </View>
                </View>
                
                <View style={styles.appointmentActions}>
                  {appointment.status === 'pending' && (
                    <>
                      <Button
                        title="Confirmar"
                        variant="primary"
                        size="small"
                        onPress={() => handleAppointmentAction(appointment, 'confirm')}
                        style={styles.actionButton}
                      />
                      <Button
                        title="Rechazar"
                        variant="outline"
                        size="small"
                        onPress={() => handleAppointmentAction(appointment, 'cancel')}
                        style={styles.actionButton}
                      />
                    </>
                  )}
                  {appointment.status === 'confirmed' && (
                    <Button
                      title="Completar"
                      variant="primary"
                      size="small"
                      onPress={() => handleAppointmentAction(appointment, 'complete')}
                      style={styles.actionButton}
                    />
                  )}
                </View>
              </Card>
            ))
          ) : (
            <View style={styles.emptyContainer}>
              <ThemedText style={styles.emptyText}>
                No tienes citas próximas
              </ThemedText>
            </View>
          )}
        </View>
      </View>

      {/* Acciones rápidas */}
      <View style={styles.section}>
        <ThemedText type="subtitle" style={styles.sectionTitle}>
          Acciones Rápidas
        </ThemedText>
        
        <View style={styles.quickActionsGrid}>
          <Button
            title="Mis Servicios"
            variant="outline"
            size="medium"
            icon={<IconSymbol name="wrench.and.screwdriver" size={18} color={Colors.light.primary} />}
            onPress={() => {
              log.userAction('Navigate to services', { screen: 'ProviderHome' });
              log.navigation('ProviderHome', 'Services');
              router.push('/(provider)/my-business');
            }}
            style={styles.quickActionButton}
          />
          <Button
            title="Horarios"
            variant="outline"
            size="medium"
            icon={<IconSymbol name="clock" size={18} color={Colors.light.primary} />}
            onPress={() => {
              log.userAction('Navigate to schedule', { screen: 'ProviderHome' });
              log.navigation('ProviderHome', 'Calendar');
              router.push('/(provider)/availability');
            }}
            style={styles.quickActionButton}
          />
        </View>
      </View>
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
    padding: DesignTokens.spacing.xl,
    paddingTop: DesignTokens.spacing.lg, // Safe Area ya maneja el padding superior
    paddingBottom: DesignTokens.spacing.lg,
  },
  welcomeSection: {
    marginBottom: DesignTokens.spacing.xl,
  },
  welcomeText: {
    fontSize: DesignTokens.typography.fontSizes['3xl'],
    fontWeight: DesignTokens.typography.fontWeights.bold as any,
    color: Colors.light.primary,
    marginBottom: DesignTokens.spacing.sm,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: DesignTokens.typography.fontSizes.base,
    color: Colors.light.text,
    lineHeight: DesignTokens.typography.lineHeights.relaxed * DesignTokens.typography.fontSizes.base,
  },
  searchButton: {
    marginTop: DesignTokens.spacing.sm,
  },
  section: {
    paddingHorizontal: DesignTokens.spacing.xl,
    marginBottom: DesignTokens.spacing['2xl'],
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: DesignTokens.spacing.lg,
  },
  sectionTitle: {
    fontSize: DesignTokens.typography.fontSizes.xl,
    fontWeight: DesignTokens.typography.fontWeights.semibold as any,
    color: Colors.light.text,
    letterSpacing: -0.2,
    marginBottom: DesignTokens.spacing.md,

  },
  
  // Categorías
  categoriesScrollContent: {
    paddingHorizontal: DesignTokens.spacing.xl,
    gap: DesignTokens.spacing.md,
  },
  categoryCard: {
    width: 100,
    alignItems: 'center',
    paddingVertical: DesignTokens.spacing.lg,
    paddingHorizontal: DesignTokens.spacing.sm,
    marginRight: DesignTokens.spacing.md,
  },
  categoryIcon: {
    width: 48,
    height: 48,
    borderRadius: DesignTokens.radius['2xl'],
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: DesignTokens.spacing.sm,
    ...DesignTokens.elevation.sm,
  },
  categoryName: {
    fontSize: DesignTokens.typography.fontSizes.xs,
    fontWeight: DesignTokens.typography.fontWeights.semibold as any,
    color: Colors.light.text,
    textAlign: 'center',
    letterSpacing: 0.1,
    lineHeight: 14,
  },
  
  // Proveedores
  providersList: {
    gap: DesignTokens.spacing.lg,
  },
  providerCard: {
    marginBottom: 0,
  },
  providerHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: DesignTokens.spacing.lg,
  },
  providerImage: {
    width: 56,
    height: 56,
    borderRadius: DesignTokens.radius.lg,
    backgroundColor: Colors.light.surfaceVariant,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: DesignTokens.spacing.md,
    ...DesignTokens.elevation.sm,
  },
  providerInfo: {
    flex: 1,
  },
  providerName: {
    fontSize: DesignTokens.typography.fontSizes.base,
    fontWeight: DesignTokens.typography.fontWeights.semibold as any,
    color: Colors.light.text,
    marginBottom: DesignTokens.spacing.xs,
    letterSpacing: -0.1,
  },
  providerCategory: {
    fontSize: DesignTokens.typography.fontSizes.sm,
    color: Colors.light.text,
    marginBottom: DesignTokens.spacing.sm,
  },
  providerStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: DesignTokens.radius.xs,
    marginRight: DesignTokens.spacing.xs,
  },
  statusText: {
    fontSize: DesignTokens.typography.fontSizes.xs,
    fontWeight: DesignTokens.typography.fontWeights.medium as any,
    color: Colors.light.text,
  },
  providerRating: {
    alignItems: 'flex-end',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: DesignTokens.spacing.xs,
  },
  ratingText: {
    fontSize: DesignTokens.typography.fontSizes.sm,
    fontWeight: DesignTokens.typography.fontWeights.semibold as any,
    color: Colors.light.text,
    marginLeft: DesignTokens.spacing.xs,
  },
  providerFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: DesignTokens.spacing.sm,
  },
  providerDetails: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: DesignTokens.spacing.xs,
    marginRight: DesignTokens.spacing.md,
  },
  reserveButtonContainer: {
    flexShrink: 0,
  },
  reserveButton: {
    minWidth: 80,
  },
  distance: {
    fontSize: DesignTokens.typography.fontSizes.sm,
    color: Colors.light.textSecondary,
  },
  price: {
    fontSize: DesignTokens.typography.fontSizes.base,
    fontWeight: DesignTokens.typography.fontWeights.semibold as any,
    color: Colors.light.success,
  },
  
  // Acciones rápidas
  quickActionsGrid: {
    flexDirection: 'row',
    gap: DesignTokens.spacing.md,
  },
  quickActionCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: DesignTokens.spacing.xl,
    paddingHorizontal: DesignTokens.spacing.md,
  },
  quickActionIcon: {
    width: 56,
    height: 56,
    borderRadius: DesignTokens.radius['2xl'],
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: DesignTokens.spacing.md,
  },
  quickActionTitle: {
    fontSize: DesignTokens.typography.fontSizes.sm,
    fontWeight: DesignTokens.typography.fontWeights.semibold as any,
    color: Colors.light.text,
    textAlign: 'center',
    marginBottom: DesignTokens.spacing.xs,
  },
  quickActionSubtitle: {
    fontSize: DesignTokens.typography.fontSizes.xs,
    color: Colors.light.textSecondary,
    textAlign: 'center',
    lineHeight: 14,
  },
  
  // Estadísticas del proveedor
  statsGrid: {
    flexDirection: 'row',
    gap: DesignTokens.spacing.md,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: DesignTokens.spacing.xl,
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: DesignTokens.radius['2xl'],
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: DesignTokens.spacing.md,
    ...DesignTokens.elevation.sm,
  },
  statNumber: {
    fontSize: DesignTokens.typography.fontSizes['2xl'],
    fontWeight: DesignTokens.typography.fontWeights.bold as any,
    color: Colors.light.primary,
    marginBottom: DesignTokens.spacing.xs,
    letterSpacing: -0.3,
  },
  statLabel: {
    fontSize: DesignTokens.typography.fontSizes.xs,
    color: Colors.light.textSecondary,
    textAlign: 'center',
    fontWeight: DesignTokens.typography.fontWeights.medium as any,
  },
  
  // Citas del proveedor
  appointmentsList: {
    gap: DesignTokens.spacing.lg,
  },
  appointmentCard: {
    marginBottom: 0,
  },
  appointmentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: DesignTokens.spacing.lg,
  },
  appointmentTime: {
    width: 64,
    alignItems: 'center',
    marginRight: DesignTokens.spacing.lg,
  },
  timeText: {
    fontSize: DesignTokens.typography.fontSizes.sm,
    fontWeight: DesignTokens.typography.fontWeights.semibold as any,
    color: Colors.light.primary,
  },
  appointmentInfo: {
    flex: 1,
  },
  clientName: {
    fontSize: DesignTokens.typography.fontSizes.base,
    fontWeight: DesignTokens.typography.fontWeights.semibold as any,
    color: Colors.light.text,
    marginBottom: DesignTokens.spacing.xs,
    letterSpacing: -0.1,
  },
  serviceName: {
    fontSize: DesignTokens.typography.fontSizes.sm,
    color: Colors.light.textSecondary,
  },
  statusBadge: {
    paddingHorizontal: DesignTokens.spacing.sm,
    paddingVertical: DesignTokens.spacing.xs,
    borderRadius: DesignTokens.radius.md,
  },
  appointmentStatusText: {
    fontSize: DesignTokens.typography.fontSizes.xs,
    fontWeight: DesignTokens.typography.fontWeights.semibold as any,
    color: '#ffffff',
  },
  appointmentActions: {
    flexDirection: 'row',
    gap: DesignTokens.spacing.md,
  },
  actionButton: {
    flex: 1,
  },
  loadingText: {
    fontSize: DesignTokens.typography.fontSizes.lg,
    color: Colors.light.textSecondary,
    textAlign: 'center',
    marginTop: DesignTokens.spacing['5xl'],
    fontWeight: DesignTokens.typography.fontWeights.medium as any,
  },
  errorText: {
    fontSize: DesignTokens.typography.fontSizes.lg,
    color: Colors.light.error,
    textAlign: 'center',
    marginTop: DesignTokens.spacing['5xl'],
    fontWeight: DesignTokens.typography.fontWeights.medium as any,
  },
  loadingContainer: {
    padding: DesignTokens.spacing.xl,
    alignItems: 'center',
  },
  emptyContainer: {
    padding: DesignTokens.spacing.xl,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: DesignTokens.typography.fontSizes.base,
    color: Colors.light.textSecondary,
    textAlign: 'center',
  },
  dateText: {
    fontSize: DesignTokens.typography.fontSizes.xs,
    color: Colors.light.textSecondary,
    marginTop: DesignTokens.spacing.xs,
  },
  clientPhone: {
    fontSize: DesignTokens.typography.fontSizes.xs,
    color: Colors.light.textSecondary,
    marginTop: DesignTokens.spacing.xs,
  },
  quickActionButton: {
    flex: 1,
    marginHorizontal: DesignTokens.spacing.xs,
  },
});
