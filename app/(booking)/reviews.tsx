// 📱 Pantalla de Reseñas del Proveedor
// Muestra todas las reseñas de un proveedor específico

import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  type TextStyle,
} from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Card } from '@/components/ui/Card';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { TabSafeAreaView } from '@/components/ui/SafeAreaView';
import { ReviewListSkeleton } from '@/components/ui/LoadingStates';
import { Colors, DesignTokens } from '@/constants/Colors';
import { BookingService, Review } from '@/lib/booking-service';
import { LogCategory, useLogger } from '@/lib/logger';

export default function ReviewsScreen() {
  const { providerId, providerName } = useLocalSearchParams<{ 
    providerId: string; 
    providerName: string;
  }>();
  
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [ratingFilter, setRatingFilter] = useState<'all' | '5' | '4+' | '3-'>('all');
  const [highlightOnly, setHighlightOnly] = useState(false);
  const log = useLogger();
  const logRef = useRef(log);

  useEffect(() => {
    logRef.current = log;
  }, [log]);

  const ratingFilterOptions: { id: typeof ratingFilter; label: string }[] = [
    { id: 'all', label: 'Todas' },
    { id: '5', label: '5 ⭐' },
    { id: '4+', label: '4+ ⭐' },
    { id: '3-', label: '≤3 ⭐' },
  ];

  const loadReviews = useCallback(async () => {
    if (!providerId) return;
    
    try {
      setLoading(true);
      logRef.current.info(LogCategory.DATABASE, 'Loading provider reviews', { providerId });

      const reviewsData = await BookingService.getProviderReviews(providerId);
      setReviews(reviewsData);
      
      logRef.current.info(LogCategory.DATABASE, 'Reviews loaded successfully', {
        reviewsCount: reviewsData.length,
        providerId
      });
    } catch (error) {
      logRef.current.error(LogCategory.SERVICE, 'Error loading reviews', error);
      setReviews([]);
    } finally {
      setLoading(false);
    }
  }, [providerId]);

  useEffect(() => {
    if (providerId) {
      loadReviews();
    }
  }, [providerId, loadReviews]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadReviews();
    setRefreshing(false);
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

  const getAverageRating = () => {
    if (reviews.length === 0) return 0;
    const sum = reviews.reduce((acc, review) => acc + review.rating, 0);
    return sum / reviews.length;
  };

  const getRatingDistribution = () => {
    const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    reviews.forEach(review => {
      distribution[review.rating as keyof typeof distribution]++;
    });
    return distribution;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-VE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatRelativeTime = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays <= 0) {
      return 'Hoy';
    }
    if (diffDays === 1) {
      return 'Hace 1 día';
    }
    if (diffDays < 7) {
      return `Hace ${diffDays} días`;
    }
    const diffWeeks = Math.floor(diffDays / 7);
    if (diffWeeks < 4) {
      return `Hace ${diffWeeks} semana${diffWeeks > 1 ? 's' : ''}`;
    }
    const diffMonths = Math.floor(diffDays / 30);
    return `Hace ${diffMonths} mes${diffMonths !== 1 ? 'es' : ''}`;
  };

  const hasHighlights = useMemo(() => reviews.some(review => !!review.highlight), [reviews]);

  const filteredReviews = useMemo(() => {
    let list = [...reviews];

    if (ratingFilter === '5') {
      list = list.filter((review) => review.rating === 5);
    } else if (ratingFilter === '4+') {
      list = list.filter((review) => review.rating >= 4);
    } else if (ratingFilter === '3-') {
      list = list.filter((review) => review.rating <= 3);
    }

    if (highlightOnly) {
      list = list.filter((review) => !!review.highlight);
    }

    return list;
  }, [reviews, ratingFilter, highlightOnly]);

  const filtersActive = ratingFilter !== 'all' || highlightOnly;

  const clearFilters = () => {
    setRatingFilter('all');
    setHighlightOnly(false);
  };

  if (loading) {
    return (
      <TabSafeAreaView style={styles.container}>
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          <ReviewListSkeleton />
        </ScrollView>
      </TabSafeAreaView>
    );
  }

  const averageRating = getAverageRating();
  const distribution = getRatingDistribution();

  return (
    <TabSafeAreaView style={styles.container}>
      {/* Header */}
      <ThemedView style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <IconSymbol name="chevron.left" size={24} color={Colors.light.text} />
        </TouchableOpacity>
        <ThemedView style={styles.headerContent}>
          <ThemedText style={styles.title}>Reseñas</ThemedText>
          <ThemedText style={styles.subtitle}>{providerName}</ThemedText>
        </ThemedView>
        <ThemedView style={styles.placeholder} />
      </ThemedView>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {reviews.length > 0 ? (
          <>
            {/* Rating Summary */}
            <Card variant="elevated" style={styles.summaryCard}>
              <ThemedView style={styles.summaryHeader}>
                <ThemedView style={styles.ratingOverview}>
                  <ThemedText style={styles.averageRating}>
                    {averageRating.toFixed(1)}
                  </ThemedText>
                  <ThemedView style={styles.starsContainer}>
                    {renderStars(averageRating)}
                  </ThemedView>
                  <ThemedText style={styles.totalReviews}>
                    Basado en {reviews.length} reseña{reviews.length !== 1 ? 's' : ''}
                  </ThemedText>
                </ThemedView>
                
                <ThemedView style={styles.distributionContainer}>
                  {[5, 4, 3, 2, 1].map((rating) => (
                    <ThemedView key={rating} style={styles.distributionRow}>
                      <ThemedText style={styles.distributionRating}>{rating}</ThemedText>
                      <IconSymbol name="star.fill" size={12} color={Colors.light.accent} />
                      <ThemedView style={styles.distributionBar}>
                        <ThemedView 
                          style={[
                            styles.distributionFill,
                            { 
                              width: `${reviews.length > 0 ? (distribution[rating as keyof typeof distribution] / reviews.length) * 100 : 0}%` 
                            }
                          ]} 
                        />
                      </ThemedView>
                      <ThemedText style={styles.distributionCount}>
                        {distribution[rating as keyof typeof distribution]}
                      </ThemedText>
                    </ThemedView>
                  ))}
                </ThemedView>
              </ThemedView>
            </Card>

            {/* Filters */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filtersContainer}
            >
              {ratingFilterOptions.map((option) => (
                <TouchableOpacity
                  key={option.id}
                  style={[
                    styles.filterChip,
                    ratingFilter === option.id && styles.filterChipActive,
                  ]}
                  onPress={() => setRatingFilter(option.id)}
                >
                  <ThemedText
                    style={[
                      styles.filterChipText,
                      ratingFilter === option.id && styles.filterChipTextActive,
                    ]}
                  >
                    {option.label}
                  </ThemedText>
                </TouchableOpacity>
              ))}

              {hasHighlights && (
                <TouchableOpacity
                  style={[styles.filterChip, highlightOnly && styles.filterChipActive]}
                  onPress={() => setHighlightOnly((prev) => !prev)}
                >
                  <ThemedText
                    style={[
                      styles.filterChipText,
                      highlightOnly && styles.filterChipTextActive,
                    ]}
                  >
                    Con destacados
                  </ThemedText>
                </TouchableOpacity>
              )}

              {filtersActive && (
                <TouchableOpacity style={styles.clearFiltersButton} onPress={clearFilters}>
                  <ThemedText style={styles.clearFiltersText}>Limpiar filtros</ThemedText>
                </TouchableOpacity>
              )}
            </ScrollView>

            {/* Reviews List */}
            <ThemedView style={styles.reviewsSection}>
              <ThemedText style={styles.reviewsTitle}>
                Todas las Reseñas ({filteredReviews.length})
              </ThemedText>
              
              {filteredReviews.length > 0 ? (
                filteredReviews.map((review, index) => (
                  <Card key={review.id} variant="outlined" style={styles.reviewCard}>
                    <ThemedView style={styles.reviewHeader}>
                      <ThemedView style={styles.reviewerInfo}>
                        <ThemedView style={styles.reviewerAvatar}>
                          <IconSymbol name="person.circle" size={24} color={Colors.light.primary} />
                        </ThemedView>
                        <ThemedView style={styles.reviewerDetails}>
                          <ThemedText style={styles.reviewerName}>
                            {review.client?.display_name || `Cliente ${index + 1}`}
                          </ThemedText>
                          <ThemedText style={styles.reviewDate}>
                            {formatDate(review.created_at)}
                          </ThemedText>
                          <ThemedText style={styles.reviewRelative}>
                            {formatRelativeTime(review.created_at)}
                          </ThemedText>
                        </ThemedView>
                      </ThemedView>
                      <ThemedView style={styles.reviewStars}>
                        {renderStars(review.rating)}
                      </ThemedView>
                    </ThemedView>
                    
                    {review.highlight && (
                      <ThemedView style={styles.highlightPill}>
                        <IconSymbol name="sparkles" size={14} color={Colors.light.accent} />
                        <ThemedText style={styles.highlightText}>{review.highlight}</ThemedText>
                      </ThemedView>
                    )}
                    
                    {review.comment && (
                      <ThemedText style={styles.reviewComment}>
                        {review.comment}
                      </ThemedText>
                    )}
                    
                    {review.service && (
                      <ThemedView style={styles.serviceInfo}>
                        <IconSymbol name="scissors" size={14} color={Colors.light.textSecondary} />
                        <ThemedText style={styles.serviceName}>
                          {review.service.name}
                        </ThemedText>
                      </ThemedView>
                    )}
                  </Card>
                ))
              ) : (
                <Card variant="elevated" style={styles.filteredEmptyCard}>
                  <IconSymbol name="line.3.horizontal.decrease" size={28} color={Colors.light.textSecondary} />
                  <ThemedText style={styles.filteredEmptyTitle}>
                    No hay reseñas con estos filtros
                  </ThemedText>
                  <ThemedText style={styles.filteredEmptyCopy}>
                    Ajusta los filtros para ver más experiencias de clientes.
                  </ThemedText>
                  {filtersActive && (
                    <TouchableOpacity style={styles.clearFiltersButton} onPress={clearFilters}>
                      <ThemedText style={styles.clearFiltersText}>Limpiar filtros</ThemedText>
                    </TouchableOpacity>
                  )}
                </Card>
              )}
            </ThemedView>
          </>
        ) : (
          <ThemedView style={styles.emptyContainer}>
            <IconSymbol name="star" size={48} color={Colors.light.textSecondary} />
            <ThemedText style={styles.emptyTitle}>Sin reseñas aún</ThemedText>
            <ThemedText style={styles.emptyText}>
              Este proveedor aún no tiene reseñas. ¡Sé el primero en dejar una después de tu cita!
            </ThemedText>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: DesignTokens.typography.fontSizes.lg,
    color: Colors.light.textSecondary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: DesignTokens.spacing.lg,
    paddingVertical: DesignTokens.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  backButton: {
    padding: DesignTokens.spacing.sm,
  },
  headerContent: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: DesignTokens.spacing.md,
  },
  title: {
    fontSize: DesignTokens.typography.fontSizes.lg,
    fontWeight: DesignTokens.typography.fontWeights.bold as TextStyle['fontWeight'],
    color: Colors.light.text,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: DesignTokens.typography.fontSizes.sm,
    color: Colors.light.textSecondary,
    textAlign: 'center',
    marginTop: 2,
  },
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: DesignTokens.spacing['6xl'],
  },
  summaryCard: {
    margin: DesignTokens.spacing.lg,
    padding: DesignTokens.spacing.xl,
  },
  summaryHeader: {
    flexDirection: 'row',
    gap: DesignTokens.spacing.xl,
  },
  ratingOverview: {
    flex: 1,
    alignItems: 'center',
  },
  averageRating: {
    fontSize: DesignTokens.typography.fontSizes['4xl'],
    fontWeight: DesignTokens.typography.fontWeights.bold as TextStyle['fontWeight'],
    color: Colors.light.primary,
    marginBottom: DesignTokens.spacing.sm,
  },
  starsContainer: {
    flexDirection: 'row',
    gap: 2,
    marginBottom: DesignTokens.spacing.sm,
  },
  totalReviews: {
    fontSize: DesignTokens.typography.fontSizes.sm,
    color: Colors.light.textSecondary,
    textAlign: 'center',
  },
  distributionContainer: {
    flex: 1.5,
    gap: DesignTokens.spacing.xs,
  },
  distributionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DesignTokens.spacing.xs,
  },
  distributionRating: {
    fontSize: DesignTokens.typography.fontSizes.sm,
    color: Colors.light.text,
    minWidth: 12,
  },
  distributionBar: {
    flex: 1,
    height: 8,
    backgroundColor: Colors.light.surfaceVariant,
    borderRadius: 4,
    overflow: 'hidden',
  },
  distributionFill: {
    height: '100%',
    backgroundColor: Colors.light.accent,
  },
  distributionCount: {
    fontSize: DesignTokens.typography.fontSizes.sm,
    color: Colors.light.textSecondary,
    minWidth: 20,
    textAlign: 'right',
  },
  reviewsSection: {
    marginHorizontal: DesignTokens.spacing.lg,
    marginBottom: DesignTokens.spacing.xl,
  },
  reviewsTitle: {
    fontSize: DesignTokens.typography.fontSizes.xl,
    fontWeight: DesignTokens.typography.fontWeights.bold as TextStyle['fontWeight'],
    color: Colors.light.text,
    marginBottom: DesignTokens.spacing.lg,
  },
  reviewCard: {
    marginBottom: DesignTokens.spacing.md,
    padding: DesignTokens.spacing.lg,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: DesignTokens.spacing.md,
  },
  reviewerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  reviewerAvatar: {
    marginRight: DesignTokens.spacing.md,
  },
  reviewerDetails: {
    flex: 1,
  },
  reviewerName: {
    fontSize: DesignTokens.typography.fontSizes.base,
    fontWeight: DesignTokens.typography.fontWeights.semibold as TextStyle['fontWeight'],
    color: Colors.light.text,
    marginBottom: 2,
  },
  reviewDate: {
    fontSize: DesignTokens.typography.fontSizes.xs,
    color: Colors.light.textSecondary,
  },
  reviewRelative: {
    fontSize: DesignTokens.typography.fontSizes.xs,
    color: Colors.light.textTertiary,
  },
  reviewStars: {
    flexDirection: 'row',
    gap: 2,
  },
  reviewComment: {
    fontSize: DesignTokens.typography.fontSizes.sm,
    color: Colors.light.text,
    lineHeight: 20,
    marginBottom: DesignTokens.spacing.sm,
  },
  serviceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DesignTokens.spacing.xs,
    paddingTop: DesignTokens.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.light.borderLight,
  },
  serviceName: {
    fontSize: DesignTokens.typography.fontSizes.xs,
    color: Colors.light.textSecondary,
    fontStyle: 'italic',
  },
  highlightPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DesignTokens.spacing.xs,
    backgroundColor: Colors.light.surfaceVariant,
    paddingHorizontal: DesignTokens.spacing.sm,
    paddingVertical: DesignTokens.spacing.xs,
    borderRadius: DesignTokens.radius.lg,
    alignSelf: 'flex-start',
    marginBottom: DesignTokens.spacing.sm,
  },
  highlightText: {
    fontSize: DesignTokens.typography.fontSizes.xs,
    color: Colors.light.textSecondary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: DesignTokens.spacing['4xl'],
  },
  emptyTitle: {
    fontSize: DesignTokens.typography.fontSizes.xl,
    fontWeight: DesignTokens.typography.fontWeights.semibold as TextStyle['fontWeight'],
    color: Colors.light.text,
    marginTop: DesignTokens.spacing.lg,
    marginBottom: DesignTokens.spacing.md,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: DesignTokens.typography.fontSizes.base,
    color: Colors.light.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  filtersContainer: {
    paddingHorizontal: DesignTokens.spacing.lg,
    paddingBottom: DesignTokens.spacing.md,
    gap: DesignTokens.spacing.sm,
  },
  filterChip: {
    paddingHorizontal: DesignTokens.spacing.md,
    paddingVertical: DesignTokens.spacing.sm,
    borderRadius: DesignTokens.radius.full,
    borderWidth: 1,
    borderColor: Colors.light.border,
    marginRight: DesignTokens.spacing.sm,
  },
  filterChipActive: {
    backgroundColor: Colors.light.primary,
    borderColor: Colors.light.primary,
  },
  filterChipText: {
    fontSize: DesignTokens.typography.fontSizes.sm,
    color: Colors.light.textSecondary,
  },
  filterChipTextActive: {
    color: Colors.light.textOnPrimary,
  },
  clearFiltersButton: {
    justifyContent: 'center',
    paddingHorizontal: DesignTokens.spacing.md,
  },
  clearFiltersText: {
    fontSize: DesignTokens.typography.fontSizes.sm,
    color: Colors.light.primary,
    fontWeight: DesignTokens.typography.fontWeights.semibold as TextStyle['fontWeight'],
  },
  filteredEmptyCard: {
    alignItems: 'center',
    gap: DesignTokens.spacing.sm,
    paddingVertical: DesignTokens.spacing['2xl'],
  },
  filteredEmptyTitle: {
    fontSize: DesignTokens.typography.fontSizes.lg,
    fontWeight: DesignTokens.typography.fontWeights.semibold as TextStyle['fontWeight'],
    color: Colors.light.text,
  },
  filteredEmptyCopy: {
    fontSize: DesignTokens.typography.fontSizes.sm,
    color: Colors.light.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
});
