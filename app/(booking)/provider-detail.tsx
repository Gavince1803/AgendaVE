// 📱 Pantalla de Detalles del Proveedor
// Muestra información completa del proveedor, servicios, horarios y permite hacer reservas

import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View
} from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { TabSafeAreaView } from '@/components/ui/SafeAreaView';
import { Colors, DesignTokens } from '@/constants/Colors';
import { Availability, BookingService, Provider, Review, Service } from '@/lib/booking-service';
import { LogCategory, useLogger } from '@/lib/logger';

export default function ProviderDetailScreen() {
  const { providerId } = useLocalSearchParams<{ providerId: string }>();
  const [provider, setProvider] = useState<Provider | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [availability, setAvailability] = useState<Availability[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [favoriteLoading, setFavoriteLoading] = useState(false);
  const log = useLogger();

  useEffect(() => {
    if (providerId) {
      loadProviderData();
    }
  }, [providerId]);

  // Refresh data when screen gains focus (e.g., returning from rating screen)
  useFocusEffect(
    useCallback(() => {
      if (providerId) {
        log.info(LogCategory.DATABASE, 'Screen focused - refreshing provider data', { providerId });
        loadProviderData();
      }
    }, [providerId])
  );


  const loadProviderData = async () => {
    if (!providerId) return;
    
    try {
      setLoading(true);
      log.info(LogCategory.DATABASE, 'Loading provider data', { providerId });

      // Cargar datos en paralelo
      const [providerData, servicesData, availabilityData, reviewsData] = await Promise.all([
        BookingService.getProviderDetails(providerId),
        BookingService.getProviderServices(providerId),
        BookingService.getProviderAvailability(providerId),
        BookingService.getProviderReviews(providerId)
      ]);

      setProvider(providerData);
      setServices(servicesData);
      setAvailability(availabilityData);
      setReviews(reviewsData);
      
      // Load favorite status
      await loadFavoriteStatus();

      log.info(LogCategory.DATABASE, 'Provider data loaded successfully', {
        provider: providerData?.business_name,
        servicesCount: servicesData.length,
        availabilityCount: availabilityData.length,
        reviewsCount: reviewsData.length,
        providerRating: providerData?.rating,
        totalReviews: providerData?.total_reviews
      });
    } catch (error) {
      log.error(LogCategory.SERVICE, 'Error loading provider data', error);
      Alert.alert('Error', 'No se pudo cargar la información del proveedor');
    } finally {
      setLoading(false);
    }
  };

  const loadFavoriteStatus = async () => {
    if (!providerId) return;
    
    try {
      const favoriteStatus = await BookingService.isProviderFavorite(providerId);
      setIsFavorite(favoriteStatus);
    } catch (error) {
      log.error(LogCategory.SERVICE, 'Error loading favorite status', error);
    }
  };

  const handleToggleFavorite = async () => {
    if (!providerId || !provider) return;
    
    try {
      setFavoriteLoading(true);
      
      if (isFavorite) {
        await BookingService.removeFromFavorites(providerId);
        log.userAction('Remove from favorites', { 
          providerId,
          providerName: provider.business_name,
          screen: 'ProviderDetail'
        });
      } else {
        await BookingService.addToFavorites(providerId);
        log.userAction('Add to favorites', { 
          providerId,
          providerName: provider.business_name,
          screen: 'ProviderDetail'
        });
      }
      
      setIsFavorite(!isFavorite);
    } catch (error) {
      log.error(LogCategory.SERVICE, 'Error toggling favorite', error);
    } finally {
      setFavoriteLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadProviderData();
    setRefreshing(false);
  };

  const handleBookService = (service: Service) => {
    log.userAction('Select service for booking', { 
      serviceId: service.id, 
      serviceName: service.name,
      providerId: providerId 
    });
    
    router.push({
      pathname: '/(booking)/service-selection',
      params: {
        providerId: providerId!,
        providerName: provider?.business_name || 'Proveedor',
        preselectedServiceId: service.id.toString(),
        preselectedServiceName: service.name,
        preselectedServicePrice: service.price_amount.toString(),
        preselectedServiceDuration: service.duration_minutes.toString()
      }
    });
  };

  const formatPrice = (price: number) => {
    return `$${price.toLocaleString('en-US')}`;
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}min` : `${hours}h`;
  };

  const formatAvailability = (availability: Availability[]) => {
    const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    return availability
      .slice()
      .sort((a, b) => a.weekday - b.weekday)
      .map(slot => ({
        id: slot.id,
        day: days[slot.weekday],
        range: `${slot.start_time.slice(0, 5)} - ${slot.end_time.slice(0, 5)}`,
      }));
  };

  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;

    for (let i = 0; i < fullStars; i++) {
      stars.push(
        <IconSymbol key={i} name="star.fill" size={16} color={Colors.light.accent} />
      );
    }

    if (hasHalfStar) {
      stars.push(
        <IconSymbol key="half" name="star.lefthalf.fill" size={16} color={Colors.light.accent} />
      );
    }

    const emptyStars = 5 - Math.ceil(rating);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(
        <IconSymbol key={`empty-${i}`} name="star" size={16} color={Colors.light.textSecondary} />
      );
    }

    return stars;
  };

  if (loading) {
    return (
      <TabSafeAreaView style={styles.container}>
        <ThemedView style={styles.loadingContainer}>
          <ThemedText style={styles.loadingText}>Cargando información...</ThemedText>
        </ThemedView>
      </TabSafeAreaView>
    );
  }

  if (!provider) {
    return (
      <TabSafeAreaView style={styles.container}>
        <ThemedView style={styles.errorContainer}>
          <ThemedText style={styles.errorText}>Proveedor no encontrado</ThemedText>
          <Button
            title="Volver"
            onPress={() => router.back()}
            style={styles.backButton}
          />
        </ThemedView>
      </TabSafeAreaView>
    );
  }

  const availabilitySlots = formatAvailability(availability);

  return (
    <TabSafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Header del Proveedor */}
        <Card variant="elevated" style={styles.headerCard}>
          <View style={styles.headerContent}>
            <View style={styles.providerMainSection}>
              <View style={styles.providerInfo}>
                <ThemedText style={styles.businessName}>{provider.business_name}</ThemedText>
                <ThemedText style={styles.category}>{provider.category}</ThemedText>
              </View>
              
              <Button
                title=""
                variant="ghost"
                size="small"
                onPress={handleToggleFavorite}
                loading={favoriteLoading}
                disabled={favoriteLoading}
                style={styles.favoriteButton}
                icon={
                  <IconSymbol
                    name={isFavorite ? "heart.fill" : "heart"}
                    size={24}
                    color={isFavorite ? Colors.light.accent : Colors.light.textSecondary}
                  />
                }
              />
            </View>
            
            {/* Rating */}
            <View style={styles.ratingContainer}>
              <View style={styles.starsContainer}>
                {renderStars(provider.rating)}
              </View>
              <ThemedText style={styles.ratingText}>
                {provider.rating.toFixed(1)} ({provider.total_reviews} reseñas)
              </ThemedText>
            </View>

            {/* Información de contacto */}
            {provider.address && (
              <View style={styles.contactInfo}>
                <IconSymbol name="location" size={16} color={Colors.light.textSecondary} />
                <ThemedText style={styles.contactText}>{provider.address}</ThemedText>
              </View>
            )}
            
            {provider.phone && (
              <View style={styles.contactInfo}>
                <IconSymbol name="phone" size={16} color={Colors.light.textSecondary} />
                <ThemedText style={styles.contactText}>{provider.phone}</ThemedText>
              </View>
            )}
          </View>

          {provider.bio && (
            <ThemedText style={styles.bio}>{provider.bio}</ThemedText>
          )}
        </Card>

        {/* Servicios */}
        <ThemedView style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Servicios ({services.length})</ThemedText>
          {services.length > 0 ? (
            services.map((service) => (
              <Card key={service.id} variant="default" style={styles.serviceCard}>
                <View style={styles.serviceContent}>
                  <View style={styles.serviceInfo}>
                    <ThemedText style={styles.serviceName}>{service.name}</ThemedText>
                    {service.description && (
                      <ThemedText style={styles.serviceDescription}>{service.description}</ThemedText>
                    )}
                    <View style={styles.serviceDetails}>
                      <View style={styles.serviceMetaChip}>
                        <IconSymbol name="clock" size={12} color={Colors.light.primary} />
                        <ThemedText style={styles.serviceMetaText}>{formatDuration(service.duration_minutes)}</ThemedText>
                      </View>
                      <ThemedText style={styles.servicePrice}>{formatPrice(service.price_amount)}</ThemedText>
                    </View>
                  </View>
                  <Button
                    title="Reservar"
                    onPress={() => handleBookService(service)}
                    style={styles.bookButton}
                    size="small"
                  />
                </View>
              </Card>
            ))
          ) : (
            <Card variant="outlined" style={styles.emptyServicesCard}>
              <View style={styles.emptyServicesContent}>
                <IconSymbol name="wrench.and.screwdriver" size={48} color={Colors.light.textSecondary} />
                <ThemedText style={styles.emptyServicesText}>Este proveedor aún no ha configurado servicios</ThemedText>
                <ThemedText style={styles.emptyServicesSubtext}>Contacta directamente para obtener más información</ThemedText>
              </View>
            </Card>
          )}
        </ThemedView>

        {/* Horarios */}
        <ThemedView style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Horarios de Atención</ThemedText>
          <Card variant="elevated" style={styles.availabilityCard}>
            <View style={styles.availabilityHeader}>
              <View style={styles.availabilityIcon}>
                <IconSymbol name="clock" size={18} color={Colors.light.primary} />
              </View>
              <View>
                <ThemedText style={styles.availabilityTitle}>Atención Personalizada</ThemedText>
                <ThemedText style={styles.availabilitySubtitle}>
                  Agenda dentro de los horarios disponibles
                </ThemedText>
              </View>
            </View>

            {availabilitySlots.length > 0 ? (
              <View style={styles.availabilityList}>
                {availabilitySlots.map((slot, index) => (
                  <View
                    key={slot.id}
                    style={[
                      styles.availabilityRow,
                      index === availabilitySlots.length - 1 && styles.availabilityRowLast,
                    ]}
                  >
                    <ThemedText style={styles.availabilityDay}>{slot.day}</ThemedText>
                    <View style={styles.availabilityPill}>
                      <IconSymbol name="clock" size={14} color={Colors.light.primary} />
                      <ThemedText style={styles.availabilitySlot}>{slot.range}</ThemedText>
                    </View>
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.emptyAvailability}>
                <IconSymbol name="calendar.badge.clock" size={20} color={Colors.light.textSecondary} />
                <ThemedText style={styles.emptyAvailabilityText}>
                  Este proveedor aún no ha configurado horarios públicos.
                </ThemedText>
              </View>
            )}
          </Card>
        </ThemedView>

        {/* Reseñas */}
        {reviews.length > 0 && (
          <ThemedView style={styles.section}>
            <ThemedView style={styles.sectionHeader}>
              <ThemedText style={styles.sectionTitle}>Reseñas ({reviews.length})</ThemedText>
              {reviews.length > 3 && (
                <Button
                  title="Ver todas"
                  variant="ghost"
                  size="small"
                  onPress={() => {
                    log.userAction('View all reviews', { 
                      providerId,
                      totalReviews: reviews.length,
                      screen: 'ProviderDetail'
                    });
                    router.push({
                      pathname: '/(booking)/reviews',
                      params: {
                        providerId: providerId!,
                        providerName: provider.business_name
                      }
                    });
                  }}
                />
              )}
            </ThemedView>
            {reviews.slice(0, 3).map((review) => (
              <Card key={review.id} variant="outlined" style={styles.reviewCard}>
                <ThemedView style={styles.reviewHeader}>
                  <ThemedText style={styles.reviewerName}>
                    {review.client?.display_name || 'Cliente'}
                  </ThemedText>
                  <ThemedView style={styles.reviewStars}>
                    {renderStars(review.rating)}
                  </ThemedView>
                </ThemedView>
                {review.comment && (
                  <ThemedText style={styles.reviewComment}>{review.comment}</ThemedText>
                )}
                <ThemedText style={styles.reviewDate}>
                  {new Date(review.created_at).toLocaleDateString('es-VE')}
                </ThemedText>
              </Card>
            ))}
            {reviews.length > 3 && (
              <ThemedView style={styles.viewAllContainer}>
                <Button
                  title={`Ver las ${reviews.length - 3} reseñas restantes`}
                  variant="outline"
                  size="medium"
                  onPress={() => {
                    log.userAction('View all reviews', { 
                      providerId,
                      totalReviews: reviews.length,
                      screen: 'ProviderDetail'
                    });
                    router.push({
                      pathname: '/(booking)/reviews',
                      params: {
                        providerId: providerId!,
                        providerName: provider.business_name
                      }
                    });
                  }}
                />
              </ThemedView>
            )}
          </ThemedView>
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
    paddingBottom: DesignTokens.spacing['6xl'],
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: DesignTokens.typography.fontSizes.lg,
    color: Colors.light.textSecondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: DesignTokens.spacing.xl,
  },
  errorText: {
    fontSize: DesignTokens.typography.fontSizes.lg,
    color: Colors.light.textSecondary,
    marginBottom: DesignTokens.spacing.lg,
    textAlign: 'center',
  },
  backButton: {
    marginTop: DesignTokens.spacing.md,
  },
  headerCard: {
    margin: DesignTokens.spacing.lg,
    padding: DesignTokens.spacing.xl,
  },
  headerContent: {
    marginBottom: DesignTokens.spacing.md,
  },
  providerMainSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: DesignTokens.spacing.md,
  },
  providerInfo: {
    flex: 1,
    gap: DesignTokens.spacing.sm,
  },
  favoriteButton: {
    marginLeft: DesignTokens.spacing.md,
    padding: DesignTokens.spacing.sm,
  },
  businessName: {
    fontSize: DesignTokens.typography.fontSizes['2xl'],
    fontWeight: DesignTokens.typography.fontWeights.bold as any,
    color: Colors.light.text,
  },
  category: {
    fontSize: DesignTokens.typography.fontSizes.base,
    color: Colors.light.primary,
    fontWeight: DesignTokens.typography.fontWeights.semibold as any,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DesignTokens.spacing.sm,
  },
  starsContainer: {
    flexDirection: 'row',
    gap: 2,
  },
  ratingText: {
    fontSize: DesignTokens.typography.fontSizes.sm,
    color: Colors.light.textSecondary,
  },
  contactInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DesignTokens.spacing.sm,
  },
  contactText: {
    fontSize: DesignTokens.typography.fontSizes.sm,
    color: Colors.light.text,
    flex: 1,
  },
  bio: {
    fontSize: DesignTokens.typography.fontSizes.base,
    color: Colors.light.text,
    lineHeight: 22,
    marginTop: DesignTokens.spacing.md,
  },
  section: {
    marginHorizontal: DesignTokens.spacing.lg,
    marginBottom: DesignTokens.spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: DesignTokens.spacing.md,
  },
  sectionTitle: {
    fontSize: DesignTokens.typography.fontSizes.xl,
    fontWeight: DesignTokens.typography.fontWeights.bold as any,
    color: Colors.light.text,
    marginBottom: DesignTokens.spacing.md,
  },
  viewAllContainer: {
    marginTop: DesignTokens.spacing.md,
    alignItems: 'center',
  },
  serviceCard: {
    marginBottom: DesignTokens.spacing.md,
    padding: DesignTokens.spacing['2xl'],
    borderRadius: DesignTokens.radius['2xl'],
    backgroundColor: Colors.light.surface,
    borderWidth: 1,
    borderColor: Colors.light.border,
    ...DesignTokens.elevation.sm,
  },
  serviceContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: DesignTokens.spacing.lg,
  },
  serviceInfo: {
    flex: 1,
    gap: DesignTokens.spacing.sm,
  },
  serviceName: {
    fontSize: DesignTokens.typography.fontSizes.lg,
    fontWeight: DesignTokens.typography.fontWeights.semibold as any,
    color: Colors.light.text,
    marginBottom: DesignTokens.spacing.xs,
  },
  serviceDescription: {
    fontSize: DesignTokens.typography.fontSizes.sm,
    color: Colors.light.textSecondary,
    lineHeight: 18,
  },
  serviceDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: DesignTokens.spacing.md,
  },
  serviceMetaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DesignTokens.spacing.xs,
    backgroundColor: Colors.light.surfaceVariant,
    paddingHorizontal: DesignTokens.spacing.md,
    paddingVertical: DesignTokens.spacing.xs,
    borderRadius: DesignTokens.radius.full,
  },
  serviceMetaText: {
    fontSize: DesignTokens.typography.fontSizes.xs,
    color: Colors.light.primaryDark,
    fontWeight: DesignTokens.typography.fontWeights.medium as any,
  },
  servicePrice: {
    fontSize: DesignTokens.typography.fontSizes.lg,
    fontWeight: DesignTokens.typography.fontWeights.bold as any,
    color: Colors.light.primary,
  },
  bookButton: {
    minWidth: 80,
  },
  availabilityCard: {
    padding: DesignTokens.spacing['2xl'],
    borderRadius: DesignTokens.radius['3xl'],
    backgroundColor: Colors.light.surface,
    borderWidth: 0,
    gap: DesignTokens.spacing.lg,
    ...DesignTokens.elevation.md,
  },
  availabilityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DesignTokens.spacing.md,
  },
  availabilityIcon: {
    width: 40,
    height: 40,
    borderRadius: DesignTokens.radius.full,
    backgroundColor: Colors.light.primaryBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  availabilityTitle: {
    fontSize: DesignTokens.typography.fontSizes.lg,
    fontWeight: DesignTokens.typography.fontWeights.semibold as any,
    color: Colors.light.text,
  },
  availabilitySubtitle: {
    fontSize: DesignTokens.typography.fontSizes.sm,
    color: Colors.light.textSecondary,
  },
  availabilityList: {
    gap: DesignTokens.spacing.sm,
  },
  availabilityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: DesignTokens.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.borderLight,
  },
  availabilityRowLast: {
    borderBottomWidth: 0,
  },
  availabilityDay: {
    fontSize: DesignTokens.typography.fontSizes.base,
    fontWeight: DesignTokens.typography.fontWeights.medium as any,
    color: Colors.light.text,
  },
  availabilityPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DesignTokens.spacing.xs,
    backgroundColor: Colors.light.surfaceVariant,
    borderRadius: DesignTokens.radius.full,
    paddingHorizontal: DesignTokens.spacing.md,
    paddingVertical: DesignTokens.spacing.xs,
  },
  availabilitySlot: {
    fontSize: DesignTokens.typography.fontSizes.sm,
    color: Colors.light.primaryDark,
    fontWeight: DesignTokens.typography.fontWeights.medium as any,
  },
  emptyAvailability: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: DesignTokens.spacing.sm,
    paddingVertical: DesignTokens.spacing.lg,
  },
  emptyAvailabilityText: {
    fontSize: DesignTokens.typography.fontSizes.sm,
    color: Colors.light.textSecondary,
    textAlign: 'center',
  },
  reviewCard: {
    marginBottom: DesignTokens.spacing.md,
    padding: DesignTokens.spacing.lg,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: DesignTokens.spacing.sm,
  },
  reviewerName: {
    fontSize: DesignTokens.typography.fontSizes.base,
    fontWeight: DesignTokens.typography.fontWeights.semibold as any,
    color: Colors.light.text,
  },
  reviewStars: {
    flexDirection: 'row',
    gap: 2,
  },
  reviewComment: {
    fontSize: DesignTokens.typography.fontSizes.sm,
    color: Colors.light.text,
    lineHeight: 18,
    marginBottom: DesignTokens.spacing.sm,
  },
  reviewDate: {
    fontSize: DesignTokens.typography.fontSizes.xs,
    color: Colors.light.text,
  },
  emptyServicesCard: {
    padding: DesignTokens.spacing.xl,
  },
  emptyServicesContent: {
    alignItems: 'center',
    paddingVertical: DesignTokens.spacing.lg,
  },
  emptyServicesText: {
    fontSize: DesignTokens.typography.fontSizes.base,
    fontWeight: DesignTokens.typography.fontWeights.semibold as any,
    color: Colors.light.text,
    textAlign: 'center',
    marginTop: DesignTokens.spacing.md,
    marginBottom: DesignTokens.spacing.sm,
  },
  emptyServicesSubtext: {
    fontSize: DesignTokens.typography.fontSizes.sm,
    color: Colors.light.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
  },
});
