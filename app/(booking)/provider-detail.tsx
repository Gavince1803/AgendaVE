// 📱 Pantalla de Detalles del Proveedor
// Muestra información completa del proveedor, servicios, horarios y permite hacer reservas

import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  Linking,
  RefreshControl,
  ScrollView,
  Share,
  StyleSheet,
  TouchableOpacity,
  View,
  type TextStyle,
} from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { IconSymbol, type IconSymbolName } from '@/components/ui/IconSymbol';
import { MediaGallerySkeleton, ProviderProfileSkeleton } from '@/components/ui/LoadingStates';
import { MotionFadeIn } from '@/components/ui/MotionFadeIn';
import { OptimizedImage } from '@/components/ui/OptimizedImage';
import { BookingSafeAreaView } from '@/components/ui/SafeAreaView';
import { Colors, DesignTokens } from '@/constants/Colors';
import { useAuth } from '@/contexts/AuthContext';
import {
  Availability,
  BookingService,
  Provider,
  ProviderHighlight,
  ProviderLoyaltySummary,
  ProviderMedia,
  ProviderTeamMember,
  Review,
  Service
} from '@/lib/booking-service';
import { LogCategory, useLogger } from '@/lib/logger';

export default function ProviderDetailScreen() {
  const { providerId } = useLocalSearchParams<{ providerId: string }>();
  const { user } = useAuth();
  const isClient = user?.profile?.role === 'client';
  const [provider, setProvider] = useState<Provider | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [availability, setAvailability] = useState<Availability[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [media, setMedia] = useState<ProviderMedia[]>([]);
  const [teamMembers, setTeamMembers] = useState<ProviderTeamMember[]>([]);
  const [highlights, setHighlights] = useState<ProviderHighlight[]>([]);
  const [loyaltySummary, setLoyaltySummary] = useState<ProviderLoyaltySummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [favoriteLoading, setFavoriteLoading] = useState(false);
  const log = useLogger();
  const logRef = useRef(log);

  useEffect(() => {
    logRef.current = log;
  }, [log]);

  const loadFavoriteStatus = useCallback(async () => {
    if (!providerId) return;

    try {
      const favoriteStatus = await BookingService.isProviderFavorite(providerId);
      setIsFavorite(favoriteStatus);
    } catch (error) {
      logRef.current.error(LogCategory.SERVICE, 'Error loading favorite status', error);
    }
  }, [providerId]);

  const loadProviderData = useCallback(async () => {
    if (!providerId) return;

    try {
      setLoading(true);
      logRef.current.info(LogCategory.DATABASE, 'Loading provider data', { providerId });

      // Cargar datos en paralelo
      const loyaltyPromise = isClient
        ? BookingService.getProviderLoyaltySummary(providerId)
        : Promise.resolve(null);

      const [
        providerData,
        servicesData,
        availabilityData,
        reviewsData,
        mediaData,
        teamData,
        highlightsData,
        loyaltyData
      ] = await Promise.all([
        BookingService.getProviderDetails(providerId),
        BookingService.getProviderServices(providerId),
        BookingService.getProviderAvailability(providerId),
        BookingService.getProviderReviews(providerId),
        BookingService.getProviderMedia(providerId),
        BookingService.getProviderTeam(providerId),
        BookingService.getProviderHighlights(providerId),
        loyaltyPromise
      ]);

      setProvider(providerData);
      setServices(servicesData);
      setAvailability(availabilityData);
      setReviews(reviewsData);
      setMedia(mediaData);
      setTeamMembers(teamData);
      setHighlights(highlightsData);
      setLoyaltySummary(loyaltyData);

      // Load favorite status
      await loadFavoriteStatus();

      logRef.current.info(LogCategory.DATABASE, 'Provider data loaded successfully', {
        provider: providerData?.business_name,
        servicesCount: servicesData.length,
        availabilityCount: availabilityData.length,
        reviewsCount: reviewsData.length,
        mediaCount: mediaData.length,
        teamCount: teamData.length,
        highlightsCount: highlightsData.length,
        providerRating: providerData?.rating,
        totalReviews: providerData?.total_reviews
      });
    } catch (error) {
      logRef.current.error(LogCategory.SERVICE, 'Error loading provider data', error);
      Alert.alert('Error', 'No se pudo cargar la información del proveedor');
    } finally {
      setLoading(false);
    }
  }, [providerId, isClient, loadFavoriteStatus]);

  useEffect(() => {
    loadProviderData();
  }, [loadProviderData]);

  // Refresh data when screen gains focus (e.g., returning from rating screen)
  useFocusEffect(
    useCallback(() => {
      if (!providerId) {
        return;
      }

      logRef.current.info(LogCategory.DATABASE, 'Screen focused - refreshing provider data', { providerId });
      loadProviderData();
    }, [providerId, loadProviderData])
  );

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

  const handleCallProvider = () => {
    if (!provider?.phone) return;
    Linking.openURL(`tel:${provider.phone}`);
  };

  const handleOpenMaps = () => {
    if (!provider?.address) return;
    const encoded = encodeURIComponent(provider.address);
    const url = `https://www.google.com/maps/search/?api=1&query=${encoded}`;
    Linking.openURL(url);
  };

  const handleShareProvider = async () => {
    if (!provider) return;
    try {
      await Share.share({
        message: `Descubre ${provider.business_name} en AgendaVE. Reserva tu cita en ${provider.address || 'su local'}.`,
      });
    } catch (error) {
      log.error(LogCategory.SERVICE, 'Error sharing provider', error);
    }
  };

  const quickActions = [
    {
      id: 'call',
      label: 'Llamar',
      icon: 'phone' as IconSymbolName,
      onPress: handleCallProvider,
      disabled: !provider?.phone,
    },
    {
      id: 'directions',
      label: 'Cómo llegar',
      icon: 'location',
      onPress: handleOpenMaps,
      disabled: !provider?.address,
    },
    {
      id: 'share',
      label: 'Compartir',
      icon: 'square.and.arrow.up',
      onPress: handleShareProvider,
      disabled: false,
    },
  ];

  const handleHighlightPress = (highlight: ProviderHighlight) => {
    if (!highlight.description) {
      return;
    }

    Alert.alert(highlight.title, highlight.description);
  };

  const handleReportReview = (reviewId: string) => {
    Alert.alert(
      'Reportar Reseña',
      '¿Desea reportar este contenido como ofensivo o inapropiado?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Reportar',
          style: 'destructive',
          onPress: () => {
            // In a real app we would send this to backend
            Alert.alert('Gracias', 'Hemos recibido tu reporte. Revisaremos el contenido en breve.');
          }
        }
      ]
    );
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
      <BookingSafeAreaView style={styles.container}>
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          <ProviderProfileSkeleton />
        </ScrollView>
      </BookingSafeAreaView>
    );
  }

  if (!provider) {
    return (
      <BookingSafeAreaView style={styles.container}>
        <ThemedView style={styles.errorContainer}>
          <ThemedText style={styles.errorText}>Proveedor no encontrado</ThemedText>
          <Button
            title="Volver"
            onPress={() => router.back()}
            style={styles.backButton}
          />
        </ThemedView>
      </BookingSafeAreaView>
    );
  }

  const availabilitySlots = formatAvailability(availability);

  return (
    <BookingSafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {provider.hero_image_url && (
          <MotionFadeIn delay={40}>
            <OptimizedImage
              source={provider.hero_image_url}
              style={styles.heroImage}
              contentFit="cover"
            />
          </MotionFadeIn>
        )}

        {/* Header del Proveedor */}
        <Card variant="elevated" style={styles.headerCard}>
          <View style={styles.headerContent}>
            <View style={styles.providerMainSection}>
              <View style={styles.providerInfo}>
                <ThemedText style={styles.businessName}>{provider.business_name}</ThemedText>
                <ThemedText style={styles.category}>{provider.category}</ThemedText>
                {provider.tagline && (
                  <ThemedText style={styles.tagline}>{provider.tagline}</ThemedText>
                )}
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

            {provider.specialties && provider.specialties.length > 0 && (
              <View style={styles.specialtiesRow}>
                {provider.specialties.slice(0, 4).map((specialty, index) => (
                  <View key={`${specialty}-${index}`} style={styles.specialtyChip}>
                    <IconSymbol name="sparkles" size={12} color={Colors.light.primary} />
                    <ThemedText style={styles.specialtyText}>{specialty}</ThemedText>
                  </View>
                ))}
              </View>
            )}

            <View style={styles.quickActionsRow}>
              {quickActions.map((action) => (
                <TouchableOpacity
                  key={action.id}
                  style={[
                    styles.quickActionButton,
                    action.disabled && styles.quickActionDisabled,
                  ]}
                  onPress={action.onPress}
                  disabled={action.disabled}
                >
                  <IconSymbol
                    name={action.icon}
                    size={18}
                    color={action.disabled ? Colors.light.textSecondary : Colors.light.primary}
                  />
                  <ThemedText
                    style={[
                      styles.quickActionLabel,
                      action.disabled && styles.quickActionLabelDisabled,
                    ]}
                  >
                    {action.label}
                  </ThemedText>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {provider.bio && (
            <ThemedText style={styles.bio}>{provider.bio}</ThemedText>
          )}

          {provider.mission && (
            <ThemedText style={styles.mission}>{provider.mission}</ThemedText>
          )}
        </Card>

        {highlights.length > 0 && (
          <MotionFadeIn delay={80}>
            <ThemedView style={styles.section}>
              <ThemedText style={styles.sectionTitle}>Lo que nos distingue</ThemedText>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.highlightScroll}
              >
                {highlights.map((highlight) => (
                  <TouchableOpacity key={highlight.id} onPress={() => handleHighlightPress(highlight)} activeOpacity={0.9}>
                    <Card variant="elevated" style={styles.highlightCard}>
                      <View style={styles.highlightHeader}>
                        <View style={styles.highlightIconWrapper}>
                          <IconSymbol
                            name={(highlight.icon as IconSymbolName) || 'star'}
                            size={18}
                            color={Colors.light.primary}
                          />
                        </View>
                        {highlight.badge && (
                          <View style={styles.highlightBadge}>
                            <ThemedText style={styles.highlightBadgeText}>{highlight.badge}</ThemedText>
                          </View>
                        )}
                      </View>
                      <ThemedText style={styles.highlightTitle}>{highlight.title}</ThemedText>
                      {highlight.description && (
                        <ThemedText style={styles.highlightDescription}>{highlight.description}</ThemedText>
                      )}
                    </Card>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </ThemedView>
          </MotionFadeIn>
        )}

        {/* Servicios */}
        <ThemedView style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Servicios ({services.length})</ThemedText>
          {services.length > 0 ? (
            <View style={styles.sectionCard}>
              {services.map((service, index) => (
                <MotionFadeIn key={service.id} delay={index * 60}>
                  <View style={[styles.serviceRow, index !== services.length - 1 && styles.serviceRowDivider]}>
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
                  </View>
                </MotionFadeIn>
              ))}
            </View>
          ) : (
            <View style={styles.emptyServicesContainer}>
              <IconSymbol name="wrench.and.screwdriver" size={48} color={Colors.light.textSecondary} />
              <ThemedText style={styles.emptyServicesText}>Este proveedor aún no ha configurado servicios</ThemedText>
              <ThemedText style={styles.emptyServicesSubtext}>Contacta directamente para obtener más información</ThemedText>
            </View>
          )}
        </ThemedView>

        {(media.length > 0 || refreshing) && (
          <MotionFadeIn delay={100}>
            <ThemedView style={styles.section}>
              <ThemedText style={styles.sectionTitle}>Galería</ThemedText>
              {media.length > 0 ? (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.galleryScroll}
                >
                  {media.map((item) => (
                    <OptimizedImage
                      key={item.id}
                      source={item.thumbnail_url || item.url}
                      style={styles.galleryImage}
                      contentFit="cover"
                      transition={200}
                    />
                  ))}
                </ScrollView>
              ) : (
                <MediaGallerySkeleton />
              )}
            </ThemedView>
          </MotionFadeIn>
        )}

        {teamMembers.length > 0 && (
          <MotionFadeIn delay={120}>
            <ThemedView style={styles.section}>
              <ThemedText style={styles.sectionTitle}>Conoce al equipo</ThemedText>
              <View style={styles.teamGrid}>
                {teamMembers.map((member) => (
                  <Card key={member.id} variant="outlined" style={styles.teamCard}>
                    <View style={styles.teamHeader}>
                      <OptimizedImage
                        source={member.avatar_url || provider.logo_url || undefined}
                        style={styles.teamAvatar}
                        contentFit="cover"
                      />
                      <View style={styles.teamInfo}>
                        <ThemedText style={styles.teamName}>{member.full_name}</ThemedText>
                        {member.role && (
                          <ThemedText style={styles.teamRole}>{member.role}</ThemedText>
                        )}
                      </View>
                    </View>
                    {member.bio && (
                      <ThemedText style={styles.teamBio}>{member.bio}</ThemedText>
                    )}
                    {member.expertise && member.expertise.length > 0 && (
                      <View style={styles.teamTagRow}>
                        {member.expertise.slice(0, 3).map((tag, index) => (
                          <View key={`${member.id}-tag-${index}`} style={styles.teamTag}>
                            <ThemedText style={styles.teamTagText}>{tag}</ThemedText>
                          </View>
                        ))}
                      </View>
                    )}
                  </Card>
                ))}
              </View>
            </ThemedView>
          </MotionFadeIn>
        )}

        {/* {(provider.loyalty_enabled ?? true) && (
          <MotionFadeIn delay={140}>
            <ThemedView style={styles.section}>
              <Card variant="elevated" style={styles.loyaltyCard}>
                <View style={styles.loyaltyHeader}>
                  <View style={styles.loyaltyHeaderText}>
                    <ThemedText style={styles.sectionTitle}>Programa de Lealtad</ThemedText>
                    <ThemedText style={styles.loyaltySubtitle}>
                      Acumula puntos en cada visita para canjear beneficios exclusivos.
                    </ThemedText>
                  </View>
                  <IconSymbol name="rosette" size={28} color={Colors.light.primary} />
                </View>

                {isClient ? (
                  loyaltySummary ? (
                    <View style={styles.loyaltyStatsRow}>
                      <View style={styles.loyaltyStat}>
                        <ThemedText style={styles.loyaltyPoints}>{loyaltySummary.pointsBalance}</ThemedText>
                        <ThemedText style={styles.loyaltyLabel}>Puntos acumulados</ThemedText>
                      </View>
                      <View style={styles.loyaltyStat}>
                        <ThemedText style={styles.loyaltyTier}>{loyaltySummary.tier}</ThemedText>
                        <ThemedText style={styles.loyaltyLabel}>Tu nivel actual</ThemedText>
                      </View>
                      <View style={styles.loyaltyStat}>
                        <ThemedText style={styles.loyaltyPoints}>{loyaltySummary.pointsToNextReward}</ThemedText>
                        <ThemedText style={styles.loyaltyLabel}>Pts. para próxima recompensa</ThemedText>
                      </View>
                    </View>
                  ) : (
                    <View style={styles.loyaltyEmptyState}>
                      <ThemedText style={styles.loyaltyEmptyTitle}>Aún no tienes puntos</ThemedText>
                      <ThemedText style={styles.loyaltySubtitle}>
                        Reserva tu primera cita para comenzar a acumular recompensas.
                      </ThemedText>
                    </View>
                  )
                ) : user ? (
                  <View style={styles.loyaltyEmptyState}>
                    <ThemedText style={styles.loyaltyEmptyTitle}>Programa disponible para clientes</ThemedText>
                    <ThemedText style={styles.loyaltySubtitle}>
                      Pídele a tus clientes que inicien sesión para acumular puntos y canjear beneficios.
                    </ThemedText>
                  </View>
                ) : (
                  <View style={styles.loyaltyEmptyState}>
                    <ThemedText style={styles.loyaltyEmptyTitle}>Inicia sesión para sumar puntos</ThemedText>
                    <ThemedText style={styles.loyaltySubtitle}>
                      Crea una cuenta o inicia sesión para participar en el programa de lealtad.
                    </ThemedText>
                    <Button
                      title="Ingresar"
                      variant="outline"
                      onPress={() => router.push('/(auth)/login')}
                      style={styles.loyaltyButton}
                    />
                  </View>
                )}

                {loyaltySummary?.recentActivity?.length ? (
                  <View style={styles.loyaltyActivityList}>
                    {loyaltySummary.recentActivity.map((activity) => (
                      <View key={activity.id} style={styles.loyaltyActivityRow}>
                        <View>
                          <ThemedText style={styles.loyaltyActivityReason}>
                            {activity.reason || 'Movimiento de puntos'}
                          </ThemedText>
                          <ThemedText style={styles.loyaltyActivityDate}>
                            {new Date(activity.created_at).toLocaleDateString('es-VE', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </ThemedText>
                        </View>
                        <ThemedText
                          style={[
                            styles.loyaltyActivityPoints,
                            activity.points_change >= 0 ? styles.loyaltyPointsEarned : styles.loyaltyPointsRedeemed,
                          ]}
                        >
                          {activity.points_change >= 0 ? '+' : ''}{activity.points_change}
                        </ThemedText>
                      </View>
                    ))}
                  </View>
                ) : null}
              </Card>
            </ThemedView>
          </MotionFadeIn>
        )} */}

        {/* Horarios */}
        <ThemedView style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Horarios de Atención</ThemedText>
          <MotionFadeIn delay={120} offset={24}>
            <View style={[styles.sectionCard, { gap: DesignTokens.spacing.lg }]}>
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
            </View>
          </MotionFadeIn>
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
            <View style={styles.sectionCard}>
              {reviews.slice(0, 3).map((review, index) => (
                <View key={review.id} style={[styles.reviewRow, index !== reviews.slice(0, 3).length - 1 && styles.reviewRowDivider]}>
                  <ThemedView style={styles.reviewHeader}>
                    <View style={styles.reviewTitleRow}>
                      <ThemedText style={styles.reviewerName}>
                        {review.client?.display_name || 'Cliente'}
                      </ThemedText>
                      {review.is_verified && (
                        <View style={styles.verifiedBadge}>
                          <IconSymbol name="checkmark.seal" size={12} color={Colors.light.success} />
                          <ThemedText style={styles.verifiedText}>Verificado</ThemedText>
                        </View>
                      )}
                    </View>
                    <ThemedText style={styles.reviewDate}>
                      {new Date(review.created_at).toLocaleDateString('es-VE')}
                    </ThemedText>
                  </ThemedView>

                  <View style={styles.reviewRatingRow}>
                    <ThemedView style={styles.reviewStars}>
                      {renderStars(review.rating)}
                    </ThemedView>
                  </View>

                  {review.highlight && (
                    <ThemedText style={styles.reviewHighlight}>{review.highlight}</ThemedText>
                  )}
                  {review.comment && (
                    <ThemedText style={styles.reviewComment}>{review.comment}</ThemedText>
                  )}
                  {review.tags && review.tags.length > 0 && (
                    <View style={styles.reviewTagRow}>
                      {review.tags.slice(0, 4).map((tag, index) => (
                        <View key={`${review.id}-tag-${index}`} style={styles.reviewTag}>
                          <ThemedText style={styles.reviewTagText}>{tag}</ThemedText>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              ))}
            </View>
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
    </BookingSafeAreaView>
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
  heroImage: {
    marginHorizontal: DesignTokens.spacing.lg,
    marginBottom: DesignTokens.spacing.lg,
    height: 220,
    borderRadius: DesignTokens.radius['3xl'],
    overflow: 'hidden',
    backgroundColor: Colors.light.surfaceVariant,
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
    fontWeight: DesignTokens.typography.fontWeights.bold as TextStyle['fontWeight'],
    color: Colors.light.text,
  },
  tagline: {
    fontSize: DesignTokens.typography.fontSizes.base,
    color: Colors.light.textSecondary,
    lineHeight: 20,
  },
  category: {
    fontSize: DesignTokens.typography.fontSizes.base,
    color: Colors.light.primary,
    fontWeight: DesignTokens.typography.fontWeights.semibold as TextStyle['fontWeight'],
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
  specialtiesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: DesignTokens.spacing.sm,
    marginTop: DesignTokens.spacing.md,
  },

  specialtyChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DesignTokens.spacing.xs,
    paddingHorizontal: DesignTokens.spacing.md,
    paddingVertical: DesignTokens.spacing.xs,
    borderRadius: DesignTokens.radius.full,
    backgroundColor: Colors.light.surfaceVariant,
    borderWidth: 1,
    borderColor: Colors.light.borderLight,
  },
  specialtyText: {
    fontSize: DesignTokens.typography.fontSizes.xs,
    color: Colors.light.primaryDark,
    fontWeight: DesignTokens.typography.fontWeights.medium as TextStyle['fontWeight'],
  },
  bio: {
    fontSize: DesignTokens.typography.fontSizes.base,
    color: Colors.light.text,
    lineHeight: 22,
    marginTop: DesignTokens.spacing.md,
  },
  mission: {
    fontSize: DesignTokens.typography.fontSizes.sm,
    color: Colors.light.textSecondary,
    lineHeight: 20,
    marginTop: DesignTokens.spacing.sm,
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
  highlightScroll: {
    gap: DesignTokens.spacing.md,
    paddingRight: DesignTokens.spacing.lg,
  },
  highlightCard: {
    width: 220,
    padding: DesignTokens.spacing.lg,
    marginRight: DesignTokens.spacing.md,
    borderRadius: DesignTokens.radius['2xl'],
  },
  highlightHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: DesignTokens.spacing.sm,
  },
  highlightIconWrapper: {
    width: 36,
    height: 36,
    borderRadius: DesignTokens.radius.full,
    backgroundColor: Colors.light.surfaceVariant,
    justifyContent: 'center',
    alignItems: 'center',
  },
  highlightBadge: {
    paddingHorizontal: DesignTokens.spacing.sm,
    paddingVertical: DesignTokens.spacing.xs,
    borderRadius: DesignTokens.radius.full,
    backgroundColor: Colors.light.primary + '15',
  },
  highlightBadgeText: {
    fontSize: DesignTokens.typography.fontSizes.xs,
    color: Colors.light.primary,
    fontWeight: DesignTokens.typography.fontWeights.medium as TextStyle['fontWeight'],
  },
  highlightTitle: {
    fontSize: DesignTokens.typography.fontSizes.lg,
    fontWeight: DesignTokens.typography.fontWeights.semibold as TextStyle['fontWeight'],
    color: Colors.light.text,
    marginBottom: DesignTokens.spacing.xs,
  },
  highlightDescription: {
    fontSize: DesignTokens.typography.fontSizes.sm,
    color: Colors.light.textSecondary,
    lineHeight: 18,
  },
  galleryScroll: {
    gap: DesignTokens.spacing.md,
    paddingRight: DesignTokens.spacing.lg,
  },
  galleryImage: {
    width: 220,
    height: 160,
    borderRadius: DesignTokens.radius['2xl'],
    marginRight: DesignTokens.spacing.md,
    backgroundColor: Colors.light.surfaceVariant,
  },
  teamGrid: {
    gap: DesignTokens.spacing.lg,
  },
  teamCard: {
    padding: DesignTokens.spacing.lg,
    borderRadius: DesignTokens.radius['2xl'],
    gap: DesignTokens.spacing.md,
  },
  teamHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DesignTokens.spacing.md,
  },
  teamAvatar: {
    width: 60,
    height: 60,
    borderRadius: DesignTokens.radius.full,
    backgroundColor: Colors.light.surfaceVariant,
  },
  teamInfo: {
    flex: 1,
    gap: DesignTokens.spacing.xs,
  },
  teamName: {
    fontSize: DesignTokens.typography.fontSizes.md,
    fontWeight: DesignTokens.typography.fontWeights.semibold as TextStyle['fontWeight'],
    color: Colors.light.text,
  },
  teamRole: {
    fontSize: DesignTokens.typography.fontSizes.sm,
    color: Colors.light.primary,
  },
  teamBio: {
    fontSize: DesignTokens.typography.fontSizes.sm,
    color: Colors.light.textSecondary,
    lineHeight: 18,
  },
  teamTagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: DesignTokens.spacing.sm,
  },
  teamTag: {
    paddingHorizontal: DesignTokens.spacing.sm,
    paddingVertical: DesignTokens.spacing.xs,
    borderRadius: DesignTokens.radius.full,
    backgroundColor: Colors.light.surfaceVariant,
  },
  teamTagText: {
    fontSize: DesignTokens.typography.fontSizes.xs,
    color: Colors.light.textSecondary,
  },
  loyaltyCard: {
    padding: DesignTokens.spacing['2xl'],
    borderRadius: DesignTokens.radius['3xl'],
    gap: DesignTokens.spacing.lg,
  },
  loyaltyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: DesignTokens.spacing.md,
  },
  loyaltyHeaderText: {
    flex: 1,
    flexShrink: 1,
  },
  loyaltySubtitle: {
    fontSize: DesignTokens.typography.fontSizes.sm,
    color: Colors.light.textSecondary,
    lineHeight: 20,
    marginTop: DesignTokens.spacing.xs,
  },
  loyaltyStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: DesignTokens.spacing.lg,
  },
  loyaltyStat: {
    flex: 1,
    gap: DesignTokens.spacing.xs,
  },
  loyaltyPoints: {
    fontSize: DesignTokens.typography.fontSizes['2xl'],
    fontWeight: DesignTokens.typography.fontWeights.bold as TextStyle['fontWeight'],
    color: Colors.light.primary,
  },
  loyaltyTier: {
    fontSize: DesignTokens.typography.fontSizes['xl'],
    fontWeight: DesignTokens.typography.fontWeights.semibold as TextStyle['fontWeight'],
    color: Colors.light.accent,
  },
  loyaltyLabel: {
    fontSize: DesignTokens.typography.fontSizes.xs,
    color: Colors.light.textSecondary,
  },
  loyaltyEmptyState: {
    padding: DesignTokens.spacing.lg,
    borderRadius: DesignTokens.radius['2xl'],
    backgroundColor: Colors.light.surfaceVariant,
    gap: DesignTokens.spacing.sm,
  },
  loyaltyEmptyTitle: {
    fontSize: DesignTokens.typography.fontSizes.md,
    fontWeight: DesignTokens.typography.fontWeights.semibold as TextStyle['fontWeight'],
    color: Colors.light.text,
  },
  loyaltyButton: {
    alignSelf: 'flex-start',
  },
  loyaltyActivityList: {
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
    paddingTop: DesignTokens.spacing.lg,
    gap: DesignTokens.spacing.md,
  },
  loyaltyActivityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  loyaltyActivityReason: {
    fontSize: DesignTokens.typography.fontSizes.sm,
    color: Colors.light.text,
    fontWeight: DesignTokens.typography.fontWeights.medium as TextStyle['fontWeight'],
  },
  loyaltyActivityDate: {
    fontSize: DesignTokens.typography.fontSizes.xs,
    color: Colors.light.textSecondary,
  },
  loyaltyActivityPoints: {
    fontSize: DesignTokens.typography.fontSizes.md,
    fontWeight: DesignTokens.typography.fontWeights.semibold as TextStyle['fontWeight'],
  },
  loyaltyPointsEarned: {
    color: Colors.light.success,
  },
  loyaltyPointsRedeemed: {
    color: Colors.light.warning,
  },
  quickActionsRow: {
    flexDirection: 'row',
    gap: DesignTokens.spacing.sm,
    marginTop: DesignTokens.spacing.lg,
  },
  quickActionButton: {
    flex: 1,
    flexDirection: 'column', // Changed to column to stack icon and text
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4, // Reduced gap for vertical layout
    paddingVertical: DesignTokens.spacing.md,
    paddingHorizontal: DesignTokens.spacing.xs, // Reduced horizontal padding
    borderRadius: DesignTokens.radius.lg,
    backgroundColor: Colors.light.surface,
    borderWidth: 1,
    borderColor: Colors.light.border,
    ...DesignTokens.elevation.sm,
  },
  quickActionDisabled: {
    opacity: 0.5,
    backgroundColor: Colors.light.background,
    borderColor: Colors.light.borderLight,
    elevation: 0,
    shadowOpacity: 0,
  },
  quickActionLabel: {
    fontSize: DesignTokens.typography.fontSizes.sm, // Keep small or change to xs if needed
    fontWeight: DesignTokens.typography.fontWeights.medium as TextStyle['fontWeight'],
    color: Colors.light.text,
    textAlign: 'center', // Center the text
    lineHeight: 16,
  },
  quickActionLabelDisabled: {
    color: Colors.light.textSecondary,
  },
  sectionTitle: {
    fontSize: DesignTokens.typography.fontSizes.xl,
    fontWeight: DesignTokens.typography.fontWeights.bold as TextStyle['fontWeight'],
    color: Colors.light.text,
    marginBottom: DesignTokens.spacing.md,
  },
  viewAllContainer: {
    marginTop: DesignTokens.spacing.md,
    alignItems: 'center',
  },
  sectionCard: {
    backgroundColor: Colors.light.surface,
    borderRadius: DesignTokens.radius['2xl'],
    padding: DesignTokens.spacing.lg,
    borderWidth: 1,
    borderColor: Colors.light.border, // Light dark border as requested
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
    fontWeight: DesignTokens.typography.fontWeights.semibold as TextStyle['fontWeight'],
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
    fontWeight: DesignTokens.typography.fontWeights.medium as TextStyle['fontWeight'],
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
    borderWidth: 1,
    borderColor: Colors.light.borderLight,
  },
  availabilitySlot: {
    fontSize: DesignTokens.typography.fontSizes.sm,
    color: Colors.light.primaryDark,
    fontWeight: DesignTokens.typography.fontWeights.medium as TextStyle['fontWeight'],
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
  reviewRow: {
    paddingVertical: DesignTokens.spacing.lg,
  },
  reviewRowDivider: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.borderLight,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: DesignTokens.spacing.xs,
  },
  reviewRatingRow: {
    marginBottom: DesignTokens.spacing.sm,
  },
  reviewTitleRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: DesignTokens.spacing.sm,
  },
  reviewerName: {
    fontSize: DesignTokens.typography.fontSizes.base,
    fontWeight: DesignTokens.typography.fontWeights.semibold as TextStyle['fontWeight'],
    color: Colors.light.text,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DesignTokens.spacing.xs,
    paddingHorizontal: DesignTokens.spacing.sm,
    paddingVertical: DesignTokens.spacing.xs,
    borderRadius: DesignTokens.radius.full,
    backgroundColor: Colors.light.success + '15',
  },
  verifiedText: {
    fontSize: DesignTokens.typography.fontSizes.xs,
    color: Colors.light.successDark,
    fontWeight: DesignTokens.typography.fontWeights.medium as TextStyle['fontWeight'],
  },
  reviewStars: {
    flexDirection: 'row',
    gap: 2,
  },
  reviewHighlight: {
    fontSize: DesignTokens.typography.fontSizes.sm,
    color: Colors.light.primaryDark,
    fontWeight: DesignTokens.typography.fontWeights.medium as TextStyle['fontWeight'],
  },
  reviewComment: {
    fontSize: DesignTokens.typography.fontSizes.sm,
    color: Colors.light.text,
    lineHeight: 18,
    marginBottom: DesignTokens.spacing.sm,
  },
  reviewTagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: DesignTokens.spacing.sm,
    marginTop: DesignTokens.spacing.xs,
  },
  reviewTag: {
    paddingHorizontal: DesignTokens.spacing.sm,
    paddingVertical: DesignTokens.spacing.xs,
    borderRadius: DesignTokens.radius.full,
    backgroundColor: Colors.light.surfaceVariant,
  },
  reviewTagText: {
    fontSize: DesignTokens.typography.fontSizes.xs,
    color: Colors.light.textSecondary,
  },
  reviewDate: {
    fontSize: DesignTokens.typography.fontSizes.xs,
    color: Colors.light.text,
  },
  servicesList: {
    backgroundColor: Colors.light.surface,
  },
  serviceRow: {
    paddingVertical: DesignTokens.spacing.lg,
  },
  serviceRowDivider: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.borderLight,
  },
  serviceContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: DesignTokens.spacing.lg,
  },
  serviceInfo: {
    flex: 1,
    gap: DesignTokens.spacing.xs,
  },
  serviceName: {
    fontSize: DesignTokens.typography.fontSizes.lg,
    fontWeight: DesignTokens.typography.fontWeights.semibold as TextStyle['fontWeight'],
    color: Colors.light.text,
  },
  serviceDescription: {
    fontSize: DesignTokens.typography.fontSizes.sm,
    color: Colors.light.textSecondary,
    lineHeight: 18,
    marginBottom: DesignTokens.spacing.xs,
  },
  serviceDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DesignTokens.spacing.md,
    marginTop: DesignTokens.spacing.xs,
  },
  serviceMetaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DesignTokens.spacing.xs,
    backgroundColor: Colors.light.surfaceVariant,
    paddingHorizontal: DesignTokens.spacing.md,
    paddingVertical: 4,
    borderRadius: DesignTokens.radius.md,
    borderWidth: 1,
    borderColor: Colors.light.borderLight,
  },
  serviceMetaText: {
    fontSize: DesignTokens.typography.fontSizes.xs,
    color: Colors.light.textSecondary,
    fontWeight: DesignTokens.typography.fontWeights.medium as TextStyle['fontWeight'],
  },
  servicePrice: {
    fontSize: DesignTokens.typography.fontSizes.lg,
    fontWeight: DesignTokens.typography.fontWeights.bold as TextStyle['fontWeight'],
    color: Colors.light.text,
  },
  bookButton: {
    minWidth: 80,
  },


  emptyServicesContainer: {
    alignItems: 'center',
    paddingVertical: DesignTokens.spacing.xl,
    backgroundColor: Colors.light.surfaceVariant, // Keep light grey for empty state area
    borderRadius: DesignTokens.radius.lg,
    padding: DesignTokens.spacing.xl,
  },
  emptyServicesText: {
    fontSize: DesignTokens.typography.fontSizes.base,
    fontWeight: DesignTokens.typography.fontWeights.semibold as TextStyle['fontWeight'],
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
