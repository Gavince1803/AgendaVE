// 📱 Pantalla de Reseñas del Proveedor
// Muestra todas las reseñas de un proveedor específico

import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  TouchableOpacity
} from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Card } from '@/components/ui/Card';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { TabSafeAreaView } from '@/components/ui/SafeAreaView';
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
  const log = useLogger();

  useEffect(() => {
    if (providerId) {
      loadReviews();
    }
  }, [providerId]);

  const loadReviews = async () => {
    if (!providerId) return;
    
    try {
      setLoading(true);
      log.info(LogCategory.DATABASE, 'Loading provider reviews', { providerId });

      const reviewsData = await BookingService.getProviderReviews(providerId);
      setReviews(reviewsData);
      
      log.info(LogCategory.DATABASE, 'Reviews loaded successfully', {
        reviewsCount: reviewsData.length,
        providerId
      });
    } catch (error) {
      log.error(LogCategory.SERVICE, 'Error loading reviews', error);
      setReviews([]);
    } finally {
      setLoading(false);
    }
  };

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

  if (loading) {
    return (
      <TabSafeAreaView style={styles.container}>
        <ThemedView style={styles.loadingContainer}>
          <ThemedText style={styles.loadingText}>Cargando reseñas...</ThemedText>
        </ThemedView>
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

            {/* Reviews List */}
            <ThemedView style={styles.reviewsSection}>
              <ThemedText style={styles.reviewsTitle}>
                Todas las Reseñas ({reviews.length})
              </ThemedText>
              
              {reviews.map((review, index) => (
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
                      </ThemedView>
                    </ThemedView>
                    <ThemedView style={styles.reviewStars}>
                      {renderStars(review.rating)}
                    </ThemedView>
                  </ThemedView>
                  
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
              ))}
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
    fontWeight: DesignTokens.typography.fontWeights.bold as any,
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
    fontWeight: DesignTokens.typography.fontWeights.bold as any,
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
    fontWeight: DesignTokens.typography.fontWeights.bold as any,
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
    fontWeight: DesignTokens.typography.fontWeights.semibold as any,
    color: Colors.light.text,
    marginBottom: 2,
  },
  reviewDate: {
    fontSize: DesignTokens.typography.fontSizes.xs,
    color: Colors.light.textSecondary,
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: DesignTokens.spacing['4xl'],
  },
  emptyTitle: {
    fontSize: DesignTokens.typography.fontSizes.xl,
    fontWeight: DesignTokens.typography.fontWeights.semibold as any,
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
});