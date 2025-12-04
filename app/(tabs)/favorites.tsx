import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { FavoritesSkeleton } from '@/components/ui/LoadingStates';
import { TabSafeAreaView } from '@/components/ui/SafeAreaView';
import { Colors, DesignTokens } from '@/constants/Colors';
import { BookingService, Provider } from '@/lib/booking-service';
import { LogCategory, useLogger } from '@/lib/logger';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View
} from 'react-native';

export default function FavoritesScreen() {
  const [refreshing, setRefreshing] = useState(false);
  const [favoriteProviders, setFavoriteProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const log = useLogger();

  useEffect(() => {
    loadFavorites();
  }, []);

  const loadFavorites = async () => {
    try {
      setLoading(true);
      log.info(LogCategory.DATA, 'Loading favorite providers', { screen: 'Favorites' });

      const favorites = await BookingService.getFavoriteProviders();
      setFavoriteProviders(favorites);

      log.info(LogCategory.DATA, 'Favorite providers loaded', {
        count: favorites.length,
        screen: 'Favorites'
      });
    } catch (error) {
      log.error(LogCategory.ERROR, 'Error loading favorite providers', error);
      setFavoriteProviders([]);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadFavorites();
    setRefreshing(false);
  };

  const handleRemoveFromFavorites = async (provider: Provider) => {
    try {
      log.userAction('Remove from favorites', {
        providerId: provider.id,
        providerName: provider.business_name,
        screen: 'Favorites'
      });

      const removeProvider = async () => {
        try {
          await BookingService.removeFromFavorites(provider.id);

          // Update local state
          setFavoriteProviders(prevFavorites =>
            prevFavorites.filter(fav => fav.id !== provider.id)
          );

          Alert.alert('Removido de Favoritos', `${provider.business_name} ha sido removido de tus favoritos`);
        } catch (error) {
          console.error('🔴 [FAVORITES] Error removing provider from favorites:', error);
          const errorMsg = 'No se pudo remover de favoritos';
          Alert.alert('Error', errorMsg);
        }
      };

      Alert.alert(
        'Remover de Favoritos',
        `¿Estás seguro de que quieres remover ${provider.business_name} de tus favoritos?`,
        [
          {
            text: 'Cancelar',
            style: 'cancel'
          },
          {
            text: 'Remover',
            style: 'destructive',
            onPress: removeProvider
          }
        ]
      );
    } catch (error) {
      log.error(LogCategory.ERROR, 'Error removing from favorites', error);
      const errorMsg = 'No se pudo remover de favoritos';
      Alert.alert('Error', errorMsg);
    }
  };

  const handleBookProvider = (provider: Provider) => {
    try {
      log.userAction('Book favorite provider', {
        providerId: provider.id,
        providerName: provider.business_name,
        screen: 'Favorites'
      });

      router.push({
        pathname: '/(booking)/provider-detail',
        params: { providerId: provider.id }
      });
    } catch (error) {
      log.error(LogCategory.ERROR, 'Error navigating to provider detail', error);
    }
  };

  const renderProviderCard = (provider: Provider) => (
    <Card key={provider.id} variant="elevated" style={styles.providerCard}>
      <TouchableOpacity
        onPress={() => handleBookProvider(provider)}
        style={styles.providerContent}
      >
        <View style={styles.providerHeader}>
          <View style={styles.providerImage}>
            <Image
              source={{ uri: provider.logo_url || `https://picsum.photos/seed/${provider.id}/200` }}
              style={{ width: '100%', height: '100%', borderRadius: 12 }}
              contentFit="cover"
              cachePolicy="memory-disk"
              transition={200}
            />
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
          <TouchableOpacity
            style={styles.favoriteButton}
            onPress={() => handleRemoveFromFavorites(provider)}
          >
            <IconSymbol name="heart.fill" size={20} color={Colors.light.accent} />
          </TouchableOpacity>
        </View>

        <View style={styles.providerDetails}>
          <View style={styles.ratingContainer}>
            <IconSymbol name="star.fill" size={14} color={Colors.light.secondary} />
            <ThemedText style={styles.ratingText}>{provider.rating.toFixed(1)}</ThemedText>
          </View>
          <ThemedText style={styles.distance}>{provider.address || 'Ubicación no disponible'}</ThemedText>
        </View>
      </TouchableOpacity>

      <View style={styles.providerActions}>
        <Button
          title="Ver Detalles"
          variant="outline"
          size="small"
          onPress={() => handleBookProvider(provider)}
          style={styles.actionButton}
        />
        <Button
          title="Reservar"
          variant="primary"
          size="small"
          onPress={() => handleBookProvider(provider)}
          style={styles.actionButton}
        />
      </View>
    </Card>
  );

  return (
    <TabSafeAreaView style={styles.container}>
      {/* Header */}
      <ThemedView style={styles.header}>
        <ThemedText type="title" style={styles.title}>
          Mis Favoritos
        </ThemedText>
        <ThemedText style={styles.subtitle}>
          Tus proveedores y servicios guardados
        </ThemedText>
      </ThemedView>

      {/* Favorites List */}
      <ScrollView
        style={styles.favoritesSection}
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
        {loading ? (
          <FavoritesSkeleton />
        ) : favoriteProviders.length === 0 ? (
          <View style={styles.emptyState}>
            <IconSymbol name="heart" size={64} color={Colors.light.textTertiary} />
            <ThemedText style={styles.emptyStateText}>
              No tienes favoritos guardados
            </ThemedText>
            <ThemedText style={styles.emptyStateSubtext}>
              Explora servicios y guarda tus proveedores favoritos
            </ThemedText>
            <Button
              title="Explorar Servicios"
              variant="primary"
              size="medium"
              onPress={() => {
                log.userAction('Navigate to explore from favorites', { screen: 'Favorites' });
                router.push('/(tabs)/explore');
              }}
              style={styles.exploreButton}
            />
          </View>
        ) : (
          <View style={styles.favoritesList}>
            {favoriteProviders.map((provider) => renderProviderCard(provider))}
          </View>
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
  header: {
    padding: DesignTokens.spacing.xl,
    paddingTop: DesignTokens.spacing.lg,
    paddingBottom: DesignTokens.spacing.lg,
  },
  title: {
    fontSize: DesignTokens.typography.fontSizes['3xl'],
    fontWeight: DesignTokens.typography.fontWeights.bold as any,
    color: Colors.light.primary,
    marginBottom: DesignTokens.spacing.sm,
  },
  subtitle: {
    fontSize: DesignTokens.typography.fontSizes.base,
    color: Colors.light.textSecondary,
    lineHeight: DesignTokens.typography.lineHeights.relaxed * DesignTokens.typography.fontSizes.base,
  },
  favoritesSection: {
    flex: 1,
    paddingHorizontal: DesignTokens.spacing.xl,
  },
  scrollContent: {
    paddingBottom: DesignTokens.spacing['6xl'], // Space for TabBar
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: DesignTokens.spacing['5xl'],
    paddingHorizontal: DesignTokens.spacing['2xl'],
  },
  emptyStateText: {
    fontSize: DesignTokens.typography.fontSizes.lg,
    fontWeight: DesignTokens.typography.fontWeights.semibold as any,
    color: Colors.light.text,
    marginTop: DesignTokens.spacing.lg,
    marginBottom: DesignTokens.spacing.sm,
    textAlign: 'center',
  },
  emptyStateSubtext: {
    fontSize: DesignTokens.typography.fontSizes.sm,
    color: Colors.light.textSecondary,
    textAlign: 'center',
    lineHeight: DesignTokens.typography.lineHeights.relaxed * DesignTokens.typography.fontSizes.sm,
    marginBottom: DesignTokens.spacing['2xl'],
  },
  exploreButton: {
    marginTop: 8,
  },
  favoritesList: {
    paddingBottom: 20,
  },
  providerCard: {
    marginBottom: DesignTokens.spacing.lg,
  },
  providerContent: {
    marginBottom: 16,
  },
  providerHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  providerImage: {
    width: 48,
    height: 48,
    borderRadius: DesignTokens.radius.lg,
    backgroundColor: Colors.light.surfaceVariant,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: DesignTokens.spacing.md,
  },
  providerInfo: {
    flex: 1,
  },
  providerName: {
    fontSize: DesignTokens.typography.fontSizes.lg,
    fontWeight: DesignTokens.typography.fontWeights.semibold as any,
    color: Colors.light.text,
    marginBottom: DesignTokens.spacing.xs,
  },
  providerCategory: {
    fontSize: DesignTokens.typography.fontSizes.sm,
    color: Colors.light.textSecondary,
    marginBottom: DesignTokens.spacing.sm,
  },
  providerStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIndicator: {
    width: 6,
    height: 6,
    borderRadius: DesignTokens.radius.xs,
    marginRight: DesignTokens.spacing.xs,
  },
  statusText: {
    fontSize: 12,
    color: Colors.light.textSecondary,
  },
  favoriteButton: {
    padding: 8,
  },
  providerDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.text,
  },
  distance: {
    fontSize: 13,
    color: Colors.light.textSecondary,
    flex: 1,
    textAlign: 'right',
  },
  providerActions: {
    flexDirection: 'row',
    gap: DesignTokens.spacing.md,
    marginTop: DesignTokens.spacing.md,
  },
  actionButton: {
    flex: 1,
  },
  loadingState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 16,
    color: Colors.light.textSecondary,
    textAlign: 'center',
  },
});