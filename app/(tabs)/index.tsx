import { ThemedText } from '@/components/ThemedText';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { HomeDashboardSkeleton } from '@/components/ui/LoadingStates';
import NotificationBell from '@/components/ui/NotificationBell';
import { TabSafeAreaView } from '@/components/ui/SafeAreaView';
import { Skeleton } from '@/components/ui/Skeleton';
import { Colors, DesignTokens } from '@/constants/Colors';
import { useAuth } from '@/contexts/AuthContext';
import { Appointment, BookingService, Provider, ProviderDashboardMetrics, Service } from '@/lib/booking-service';
import { CurrencyService } from '@/lib/currency-service';
import { LogCategory, useLogger } from '@/lib/logger';
import { Image as ExpoImage } from 'expo-image';
import { Href, router } from 'expo-router';
import React from 'react';
import {
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View
} from 'react-native';


const formatCurrency = (amount: number, currency?: string) => {
  const safeCurrency = currency || 'USD';
  try {
    return new Intl.NumberFormat('es-VE', {
      style: 'currency',
      currency: safeCurrency,
      maximumFractionDigits: 0,
    }).format(amount || 0);
  } catch {
    return `${safeCurrency} ${(amount || 0).toFixed(0)}`;
  }
};

const formatPercentage = (value?: number) =>
  Number.isFinite(value) ? `${(value ?? 0).toFixed(1)}%` : '0.0%';

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

  const role = user?.profile?.role as string | undefined;
  const isProvider = role === 'provider';
  const isClient = role === 'client';
  const isEmployee = role === 'employee';

  if (isClient) {
    return <ClientHomeScreen />;
  }

  if (isProvider) {
    return <ProviderHomeScreen />;
  }

  if (isEmployee) {
    return <EmployeeHomeScreen />;
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


  // Show skeleton while loading
  if (loading) {
    return (
      <TabSafeAreaView style={styles.container}>
        <HomeDashboardSkeleton />
      </TabSafeAreaView>
    );
  }

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
        <View style={[styles.header, { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }]}>
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
          <NotificationBell />
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
                variant="outlined"
                shadow="none"
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
                {[1, 2, 3].map((i) => (
                  <View key={i} style={styles.skeletonContainer}>
                    <Skeleton height={180} borderRadius={DesignTokens.radius.lg} />
                    <View style={styles.skeletonTextContainer}>
                      <Skeleton width="60%" height={20} />
                      <Skeleton width="40%" height={16} style={styles.skeletonSubtitle} />
                    </View>
                  </View>
                ))}
              </View>
            ) : featuredProviders.length > 0 ? (
              featuredProviders.map((provider) => (
                <Card
                  key={provider.id}
                  variant="outlined"
                  shadow="none"
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
                    <View style={styles.providerImageContainer}>
                      <ExpoImage
                        source={`https://picsum.photos/seed/${provider.id}/400/300`}
                        style={styles.providerImage}
                        contentFit="cover"
                        transition={200}
                      />
                      <View style={styles.providerOverlay} />
                    </View>
                    <View style={styles.providerInfo}>
                      <View style={styles.providerNameRow}>
                        <ThemedText style={styles.providerName}>{provider.business_name}</ThemedText>
                        <View style={styles.ratingContainer}>
                          <IconSymbol name="star.fill" size={14} color={Colors.light.secondary} />
                          <ThemedText style={styles.ratingText}>{provider.rating.toFixed(1)}</ThemedText>
                        </View>
                      </View>
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
              variant="outlined"
              shadow="none"
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
              variant="outlined"
              shadow="none"
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
      </ScrollView >
    </TabSafeAreaView >
  );
}


function ProviderHomeScreen() {
  const [refreshing, setRefreshing] = React.useState(false);
  const [appointments, setAppointments] = React.useState<Appointment[]>([]);
  const [metrics, setMetrics] = React.useState<ProviderDashboardMetrics | null>(null);
  const [metricsLoading, setMetricsLoading] = React.useState(true);
  const [exchangeRate, setExchangeRate] = React.useState<number | null>(null);
  const { user, employeeProfile } = useAuth();
  const [expiredCount, setExpiredCount] = React.useState(0);
  const [provider, setProvider] = React.useState<Provider | null>(null);
  const [services, setServices] = React.useState<Service[]>([]);

  const log = useLogger(user?.id);

  React.useEffect(() => {
    loadDashboardData();
    loadExchangeRate();
  }, []);

  const loadExchangeRate = async () => {
    const rate = await CurrencyService.getExchangeRate();
    if (rate) {
      setExchangeRate(rate.usd);
    }
  };

  const loadDashboardData = async () => {
    try {
      setMetricsLoading(true);
      log.info(LogCategory.DATABASE, 'Loading provider dashboard data', { screen: 'ProviderHome' });

      let providerId = employeeProfile?.provider_id;

      // If no employee profile, check if the user is the provider (owner)
      if (!providerId && user) {
        const provider = await BookingService.getProviderById(user.id);
        if (provider) {
          providerId = provider.id;
        }
      }

      if (!providerId) {
        log.warn(LogCategory.SERVICE, 'No provider ID found for dashboard', { userId: user?.id });
        return;
      }

      const [appointmentsData, metricsData, expiredData, providerData, servicesData] = await Promise.all([
        BookingService.getProviderAppointments(user?.id), // Pass user ID to ensure RLS works
        BookingService.getProviderDashboardMetrics(user?.id),
        BookingService.getExpiredPendingAppointments(providerId),
        BookingService.getProviderDetails(providerId),
        BookingService.getProviderServices(providerId)
      ]);
      setAppointments(appointmentsData);
      setMetrics(metricsData);
      setExpiredCount(expiredData.length);
      setProvider(providerData);
      setServices(servicesData);

      log.info(LogCategory.DATABASE, 'Provider dashboard data loaded', {
        count: appointmentsData.length,
        screen: 'ProviderHome',
        metrics: metricsData,
        expiredCount: expiredData.length
      });
    } catch (error) {
      log.error(LogCategory.SERVICE, 'Error loading provider dashboard', error);
      setAppointments([]);
      setMetrics(null);
    } finally {
      setMetricsLoading(false);
    }
  };

  const onRefresh = async () => {
    log.userAction('Refresh dashboard', { screen: 'ProviderHome' });
    setRefreshing(true);
    await Promise.all([loadDashboardData(), loadExchangeRate()]);
    setRefreshing(false);
    log.info(LogCategory.UI, 'Dashboard refresh completed', { screen: 'ProviderHome' });
  };

  // Calcular estadísticas reales
  const today = new Date().toISOString().split('T')[0];
  const todayAppointments = appointments.filter(apt => apt.appointment_date === today);
  const pendingAppointments = metrics?.pendingAppointments ?? appointments.filter(apt => apt.status === 'pending').length;
  const confirmedAppointments = appointments.filter(apt => {
    if (apt.status !== 'confirmed') return false;
    // Create date object from appointment date and time
    const aptDate = new Date(`${apt.appointment_date}T${apt.appointment_time}`);
    // Check if it's in the future (or today)
    const now = new Date();
    // Reset seconds/milliseconds for fair comparison
    now.setSeconds(0);
    now.setMilliseconds(0);
    return aptDate >= now;
  }).length;

  const performanceCards = [
    {
      label: 'Ingresos Mensuales',
      value: metricsLoading
        ? '...'
        : formatCurrency(metrics?.revenue.amount ?? 0, metrics?.revenue.currency),
      icon: 'dollarsign.circle.fill',
      color: Colors.light.success,
      helper: 'Este mes'
    },
    {
      label: 'Citas Pendientes',
      value: metricsLoading ? '...' : pendingAppointments.toString(),
      icon: 'clock.fill',
      color: Colors.light.warning,
      helper: 'Por confirmar'
    },
    {
      label: 'Citas Confirmadas',
      value: metricsLoading ? '...' : confirmedAppointments.toString(),
      icon: 'checkmark.circle.fill',
      color: Colors.light.primary,
      helper: 'Próximas'
    },
    {
      label: 'Total Clientes',
      value: metricsLoading ? '...' : (metrics?.totalClientsServed ?? 0).toString(),
      icon: 'person.2.fill',
      color: Colors.light.secondary,
      helper: 'Activos'
    }
  ];

  const operationalStats = [
    {
      label: 'Servicios Activos',
      number: metricsLoading ? '...' : services.filter(s => s.is_active).length.toString(),
      icon: 'scissors',
      color: Colors.light.primary
    },
    {
      label: 'Calificación',
      number: metricsLoading ? '...' : (provider?.rating ?? 0).toFixed(1),
      icon: 'star.fill',
      color: Colors.light.warning
    },
    {
      label: 'Reseñas',
      number: metricsLoading ? '...' : (provider?.total_reviews ?? 0).toString(),
      icon: 'text.bubble.fill',
      color: Colors.light.secondary
    }
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
        {/* Header */}
        {/* Header */}
        <View style={styles.header}>
          <ThemedText type="title" style={styles.welcomeText}>
            Dashboard 📊
          </ThemedText>

          <View style={styles.headerControls}>
            <Button
              title="Mi Negocio"
              variant="outline"
              size="medium"
              icon={<IconSymbol name="building.2" size={18} color={Colors.light.primary} />}
              onPress={() => {
                useLogger().userAction('Navigate to my business', { screen: 'ProviderHome' });
                router.push('/(provider)/my-business');
              }}
              style={styles.businessButton}
              textStyle={{ fontSize: 14 }}
            />
            <NotificationBell />
          </View>
        </View>





        {/* Citas Vencidas Warning */}
        {expiredCount > 0 && (
          <View style={styles.warningContainer}>
            <Card variant="outlined" shadow="none" style={styles.warningCard}>
              <View style={styles.warningHeader}>
                <IconSymbol name="exclamationmark.triangle.fill" size={24} color={Colors.light.warning} />
                <ThemedText style={styles.warningTitle}>
                  Atención Requerida
                </ThemedText>
              </View>
              <ThemedText style={styles.warningText}>
                Tienes {expiredCount} citas vencidas sin gestionar.
              </ThemedText>
              <Button
                title="Resolver Ahora"
                size="small"
                onPress={() => router.push('/(provider)/resolve-expired')}
                style={styles.warningButton}
              />
            </Card>
          </View>
        )}

        {/* Tasa del Día */}
        {exchangeRate && (
          <View style={styles.exchangeRateContainer}>
            <Card variant="outlined" shadow="none" style={styles.exchangeRateCard}>
              <View style={styles.exchangeRateIconContainer}>
                <Text style={styles.exchangeRateFlag}>🇻🇪</Text>
              </View>
              <View>
                <Text style={styles.exchangeRateLabel}>Tasa BCV del Día</Text>
                <Text style={styles.exchangeRateValue}>
                  {exchangeRate.toFixed(4)} Bs
                </Text>
              </View>
            </Card>
          </View>
        )}

        {/* Indicadores clave */}
        <View style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Indicadores Clave
          </ThemedText>

          <View style={styles.performanceGrid}>
            {performanceCards.map((card, index) => (
              <Card key={index} variant="outlined" shadow="none" style={styles.performanceCard}>
                <View style={styles.performanceHeader}>
                  <View style={[styles.statIcon, { backgroundColor: card.color }]}>
                    <IconSymbol name={card.icon as any} size={20} color="white" />
                  </View>
                  <ThemedText style={styles.performanceLabel}>{card.label}</ThemedText>
                </View>
                <ThemedText style={styles.performanceValue}>{card.value}</ThemedText>
                {card.helper ? (
                  <ThemedText style={styles.performanceHelper}>{card.helper}</ThemedText>
                ) : null}
              </Card>
            ))}
          </View>
        </View>

        {/* Estado operativo */}
        <View style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Estado Operativo
          </ThemedText>

          <View style={styles.statsGrid}>
            {operationalStats.map((stat, index) => (
              <Card
                key={index}
                variant="outlined"
                shadow="none"
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

        {/* Acciones rápidas */}
        <View style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Acciones Rápidas
          </ThemedText>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.quickActionsScrollContent}
          >
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
            <Button
              title="Clientes"
              variant="outline"
              size="medium"
              icon={<IconSymbol name="person.2" size={18} color={Colors.light.primary} />}
              onPress={() => {
                log.userAction('Navigate to clients', { screen: 'ProviderHome' });
                router.push('/(provider)/clients');
              }}
              style={styles.quickActionButton}
            />
            <Button
              title="Ajustes"
              variant="outline"
              size="medium"
              icon={<IconSymbol name="slider.horizontal.3" size={18} color={Colors.light.primary} />}
              onPress={() => {
                log.userAction('Navigate to provider settings', { screen: 'ProviderHome' });
                router.push('/(provider)/settings' as Href);
              }}
              style={styles.quickActionButton}
            />
          </ScrollView>
        </View>
      </ScrollView>
    </TabSafeAreaView>
  );
}

function EmployeeHomeScreen() {
  const [refreshing, setRefreshing] = React.useState(false);
  const [appointments, setAppointments] = React.useState<Appointment[]>([]);
  const [loading, setLoading] = React.useState(true);
  const log = useLogger();

  const loadAppointments = React.useCallback(async () => {
    try {
      setLoading(true);
      const data = await BookingService.getEmployeeAppointments();
      setAppointments(data);
    } catch (error) {
      log.error(LogCategory.SERVICE, 'Error loading employee appointments', error);
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  }, [log]);

  React.useEffect(() => {
    loadAppointments();
  }, [loadAppointments]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAppointments();
    setRefreshing(false);
  };

  const today = new Date().toISOString().split('T')[0];
  const todayAppointments = appointments.filter(apt => apt.appointment_date === today);
  const pendingAppointments = appointments.filter(apt => apt.status === 'pending');
  const confirmedAppointments = appointments.filter(apt => apt.status === 'confirmed');

  const upcomingAppointments = appointments
    .filter(apt => apt.status === 'pending' || apt.status === 'confirmed')
    .sort((a, b) => {
      const dateA = new Date(`${a.appointment_date}T${a.appointment_time}`);
      const dateB = new Date(`${b.appointment_date}T${b.appointment_time}`);
      return dateA.getTime() - dateB.getTime();
    });

  const formatDateLabel = (date: string) => {
    try {
      return new Date(date).toLocaleDateString('es-VE', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
      });
    } catch {
      return date;
    }
  };

  const handleUpdateStatus = async (appointment: Appointment, newStatus: 'confirmed' | 'cancelled' | 'done') => {
    try {
      log.userAction('Employee update appointment', {
        appointmentId: appointment.id,
        currentStatus: appointment.status,
        newStatus,
      });
      await BookingService.updateAppointmentStatus(appointment.id, newStatus);
      await loadAppointments();
      Alert.alert('Éxito',
        newStatus === 'confirmed'
          ? 'La cita fue confirmada.'
          : newStatus === 'cancelled'
            ? 'La cita fue cancelada.'
            : 'La cita fue marcada como completada.'
      );
    } catch (error) {
      log.error(LogCategory.SERVICE, 'Error updating appointment status', error);
      Alert.alert('Error', 'No se pudo actualizar la cita. Inténtalo nuevamente.');
    }
  };

  const confirmCancel = (appointment: Appointment) => {
    Alert.alert(
      'Cancelar cita',
      '¿Deseas cancelar esta cita? El cliente recibirá una notificación.',
      [
        { text: 'No', style: 'cancel' },
        { text: 'Sí, cancelar', style: 'destructive', onPress: () => handleUpdateStatus(appointment, 'cancelled') },
      ]
    );
  };

  const performanceCards = [
    {
      label: 'Citas Hoy',
      number: todayAppointments.length.toString(),
      icon: 'calendar',
      color: Colors.light.primary,
    },
    {
      label: 'Pendientes',
      number: pendingAppointments.length.toString(),
      icon: 'clock',
      color: Colors.light.warning,
    },
    {
      label: 'Confirmadas',
      number: confirmedAppointments.length.toString(),
      icon: 'checkmark.circle',
      color: Colors.light.success,
    },
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
        <View style={styles.header}>
          <View style={styles.welcomeSection}>
            <ThemedText type="title" style={styles.welcomeText}>
              Mi Agenda 👋
            </ThemedText>
            <ThemedText style={styles.subtitle}>
              Gestiona tus citas asignadas
            </ThemedText>
          </View>
        </View>

        <View style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Resumen
          </ThemedText>
          <View style={styles.statsGrid}>
            {performanceCards.map((card, index) => (
              <Card key={index} variant="outlined" shadow="none" style={styles.statCard}>
                <View style={[styles.statIcon, { backgroundColor: card.color }]}>
                  <IconSymbol name={card.icon as any} size={20} color="white" />
                </View>
                <ThemedText style={styles.statNumber}>{card.number}</ThemedText>
                <ThemedText style={styles.statLabel}>{card.label}</ThemedText>
              </Card>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Próximas citas
          </ThemedText>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ThemedText style={styles.loadingText}>Cargando citas...</ThemedText>
            </View>
          ) : upcomingAppointments.length === 0 ? (
            <View style={styles.emptyContainer}>
              <ThemedText style={styles.emptyText}>No tienes citas próximamente.</ThemedText>
            </View>
          ) : (
            <View style={styles.employeeAppointmentsList}>
              {upcomingAppointments.map((appointment) => (
                <Card key={appointment.id} variant="outlined" shadow="none" style={styles.employeeAppointmentCard}>
                  <View style={styles.employeeAppointmentHeader}>
                    <View>
                      <ThemedText style={styles.employeeAppointmentTime}>{appointment.appointment_time}</ThemedText>
                      <ThemedText style={styles.employeeAppointmentDate}>{formatDateLabel(appointment.appointment_date)}</ThemedText>
                    </View>
                    <View style={styles.employeeAppointmentMeta}>
                      <ThemedText style={styles.employeeAppointmentClient}>
                        {appointment.profiles?.display_name || 'Cliente'}
                      </ThemedText>
                      <ThemedText style={styles.employeeAppointmentService}>
                        {appointment.services?.name || 'Servicio'}
                      </ThemedText>
                    </View>
                    <View style={[styles.statusBadge, appointment.status === 'confirmed' ? styles.activeBadge : styles.pendingBadge]}>
                      <ThemedText style={[styles.statusBadgeText, appointment.status === 'confirmed' ? styles.activeText : styles.pendingText]}>
                        {appointment.status === 'confirmed' ? 'Confirmada' : 'Pendiente'}
                      </ThemedText>
                    </View>
                  </View>

                  <View style={styles.employeeAppointmentActions}>
                    {appointment.status === 'pending' && (
                      <Button
                        title="Confirmar"
                        variant="primary"
                        size="small"
                        onPress={() => handleUpdateStatus(appointment, 'confirmed')}
                        style={styles.employeeActionButton}
                      />
                    )}
                    <Button
                      title="Cancelar"
                      variant="outline"
                      size="small"
                      onPress={() => confirmCancel(appointment)}
                      style={styles.employeeActionButton}
                    />
                    {appointment.status === 'confirmed' && (
                      <Button
                        title="Completar"
                        variant="secondary"
                        size="small"
                        onPress={() => handleUpdateStatus(appointment, 'done')}
                        style={styles.employeeActionButton}
                      />
                    )}
                  </View>
                </Card>
              ))}
            </View>
          )}
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
  searchButton: {},
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
    width: '100%',
    marginBottom: DesignTokens.spacing.lg,
    padding: 0,
  },
  providerNameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: DesignTokens.spacing.xs,
  },
  providerName: {
    flex: 1,
    fontSize: DesignTokens.typography.fontSizes.base,
    fontWeight: DesignTokens.typography.fontWeights.semibold as any,
    color: Colors.light.text,
    marginRight: DesignTokens.spacing.sm,
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
  providerInfo: {
    paddingHorizontal: DesignTokens.spacing.lg,
    paddingTop: DesignTokens.spacing.md,
  },
  providerFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: DesignTokens.spacing.sm,
    paddingHorizontal: DesignTokens.spacing.lg,
    paddingBottom: DesignTokens.spacing.lg,
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
    flexWrap: 'wrap',
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
  performanceGrid: {
    gap: DesignTokens.spacing.md,
  },
  performanceCard: {
    padding: DesignTokens.spacing.lg,
  },
  performanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: DesignTokens.spacing.md,
    gap: DesignTokens.spacing.md,
  },
  performanceLabel: {
    fontSize: DesignTokens.typography.fontSizes.sm,
    color: Colors.light.textSecondary,
    fontWeight: DesignTokens.typography.fontWeights.medium as any,
  },
  performanceValue: {
    fontSize: DesignTokens.typography.fontSizes['2xl'],
    fontWeight: DesignTokens.typography.fontWeights.bold as any,
    color: Colors.light.primary,
    marginBottom: DesignTokens.spacing.xs,
    letterSpacing: -0.3,
  },
  performanceHelper: {
    fontSize: DesignTokens.typography.fontSizes.xs,
    color: Colors.light.textSecondary,
  },
  loadingText: {
    fontSize: DesignTokens.typography.fontSizes.lg,
    color: Colors.light.textSecondary,
    textAlign: 'center',
    marginTop: DesignTokens.spacing['5xl'],
    fontWeight: DesignTokens.typography.fontWeights.medium as any,
  },
  loadingContainer: {
    padding: DesignTokens.spacing.xl,
    alignItems: 'center',
  },
  errorText: {
    fontSize: DesignTokens.typography.fontSizes.lg,
    color: Colors.light.error,
    textAlign: 'center',
    marginTop: DesignTokens.spacing['5xl'],
    fontWeight: DesignTokens.typography.fontWeights.medium as any,
  },
  dateText: {
    fontSize: DesignTokens.typography.fontSizes.xs,
    color: Colors.light.textSecondary,
    marginTop: DesignTokens.spacing.xs,
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
  quickActionsScrollContent: {
    flexDirection: 'row',
    gap: DesignTokens.spacing.md,
    paddingRight: DesignTokens.spacing.xl,
  },
  quickActionButton: {
    minWidth: 180,
    marginRight: DesignTokens.spacing.sm,
  },
  statusBadge: {
    paddingHorizontal: DesignTokens.spacing.sm,
    paddingVertical: DesignTokens.spacing.xs,
    borderRadius: DesignTokens.radius.sm,
  },
  activeBadge: {
    backgroundColor: Colors.light.success + '20',
  },
  pendingBadge: {
    backgroundColor: Colors.light.warning + '20',
  },
  statusBadgeText: {
    fontSize: DesignTokens.typography.fontSizes.xs,
    fontWeight: DesignTokens.typography.fontWeights.medium as any,
  },
  activeText: {
    color: Colors.light.success,
  },
  pendingText: {
    color: Colors.light.warning,
  },
  employeeAppointmentsList: {
    gap: DesignTokens.spacing.md,
  },
  employeeAppointmentCard: {
    padding: DesignTokens.spacing.lg,
    borderRadius: DesignTokens.radius['2xl'],
    gap: DesignTokens.spacing.md,
  },
  employeeAppointmentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: DesignTokens.spacing.md,
  },
  employeeAppointmentMeta: {
    flex: 1,
  },
  employeeAppointmentTime: {
    fontSize: DesignTokens.typography.fontSizes.lg,
    fontWeight: DesignTokens.typography.fontWeights.semibold as any,
    color: Colors.light.primary,
  },
  employeeAppointmentDate: {
    fontSize: DesignTokens.typography.fontSizes.xs,
    color: Colors.light.textSecondary,
    textTransform: 'capitalize',
  },
  employeeAppointmentClient: {
    fontSize: DesignTokens.typography.fontSizes.sm,
    fontWeight: DesignTokens.typography.fontWeights.semibold as any,
    color: Colors.light.text,
  },
  employeeAppointmentService: {
    fontSize: DesignTokens.typography.fontSizes.xs,
    color: Colors.light.textSecondary,
  },
  employeeAppointmentActions: {
    flexDirection: 'row',
    gap: DesignTokens.spacing.sm,
  },
  employeeActionButton: {
    flex: 1,
  },

  providerImageContainer: {
    height: 150,
    width: '100%',
    position: 'relative',
  },
  providerImage: {
    width: '100%',
    height: '100%',
  },
  providerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  providerHeader: {
    // Removed flexDirection row since image is top
  },
  skeletonContainer: {
    marginBottom: DesignTokens.spacing.lg,
    width: 280,
    marginRight: DesignTokens.spacing.lg,
  },
  skeletonTextContainer: {
    marginTop: DesignTokens.spacing.md,
  },
  skeletonSubtitle: {
    marginTop: DesignTokens.spacing.sm,
  },
  warningContainer: {
    paddingHorizontal: DesignTokens.spacing.lg,
    marginBottom: DesignTokens.spacing.md,
  },
  warningCard: {
    padding: DesignTokens.spacing.md,
    backgroundColor: Colors.light.warning + '15',
    borderColor: Colors.light.warning,
    borderWidth: 1,
  },
  warningHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: DesignTokens.spacing.sm,
  },
  warningTitle: {
    marginLeft: DesignTokens.spacing.sm,
    fontWeight: 'bold',
    color: Colors.light.warning,
  },
  warningText: {
    marginBottom: DesignTokens.spacing.md,
    color: Colors.light.text,
  },
  warningButton: {
    backgroundColor: Colors.light.warning,
  },
  exchangeRateContainer: {
    paddingHorizontal: DesignTokens.spacing.lg,
    marginBottom: DesignTokens.spacing.md,
  },
  exchangeRateCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: DesignTokens.spacing.md,
    backgroundColor: Colors.light.surface,
  },
  exchangeRateIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.light.success + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: DesignTokens.spacing.md,
  },
  exchangeRateFlag: {
    fontSize: 20,
  },
  exchangeRateLabel: {
    fontSize: DesignTokens.typography.fontSizes.sm,
    color: Colors.light.textSecondary,
  },
  exchangeRateValue: {
    fontSize: DesignTokens.typography.fontSizes.xl,
    fontWeight: 'bold',
    color: Colors.light.text,
  },
  headerControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DesignTokens.spacing.sm,
    marginTop: DesignTokens.spacing.md,
    width: '100%',
  },
  businessButton: {
    flex: 1,
    height: 44,
  },
});
