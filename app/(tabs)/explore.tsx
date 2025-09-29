import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { FilterOptions, FiltersModal } from '@/components/ui/FiltersModal';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Input } from '@/components/ui/Input';
import {
  createRefreshControl,
  EmptyState,
  ProviderListSkeleton,
  ScreenLoading
} from '@/components/ui/LoadingStates';
import { Colors, DesignTokens } from '@/constants/Colors';
import { BookingService, Provider } from '@/lib/booking-service';
import { LogCategory, useLogger } from '@/lib/logger';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

export default function ExploreScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [refreshing, setRefreshing] = useState(false);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [filteredProviders, setFilteredProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showFiltersModal, setShowFiltersModal] = useState(false);
  const [favoriteStatuses, setFavoriteStatuses] = useState<Record<string, boolean>>({});
  const [filters, setFilters] = useState<FilterOptions>({
    priceRange: { min: 0, max: 1000 },
    rating: 0,
    distance: 50,
    availability: 'all',
    sortBy: 'distance',
  });
  const log = useLogger();
  
  // Colores fijos para modo claro
  const backgroundColor = Colors.light.background;
  const surfaceColor = Colors.light.surface;
  const textColor = Colors.light.text;
  const textSecondaryColor = Colors.light.textSecondary;
  const borderColor = Colors.light.border;
  const primaryColor = Colors.light.primary;

  const categories = [
    { id: 'all', name: 'Todos', icon: 'grid' },
    { id: 'hair', name: 'Peluquería', icon: 'scissors', keywords: ['peluqueria', 'peluquero', 'barberia', 'barbero', 'corte', 'peinado'] },
    { id: 'beauty', name: 'Estética', icon: 'sparkles', keywords: ['estetica', 'belleza', 'facial', 'manicure', 'pedicure'] },
    { id: 'health', name: 'Salud', icon: 'cross.case', keywords: ['salud', 'medico', 'doctor', 'clinica', 'dental'] },
    { id: 'wellness', name: 'Bienestar', icon: 'leaf', keywords: ['bienestar', 'spa', 'masaje', 'relajacion', 'yoga'] },
  ];

  useEffect(() => {
    loadProviders();
  }, [selectedCategory, searchQuery]);

  useEffect(() => {
    applyFiltersAndSort();
  }, [providers, filters]);

  useEffect(() => {
    loadFavoriteStatuses();
  }, [filteredProviders]);

  const loadProviders = async () => {
    try {
      setLoading(true);
      setError(null);
      log.info(LogCategory.DATA, 'Loading providers', { category: selectedCategory, searchQuery });

      let providersData: Provider[];
      if (selectedCategory === 'all') {
        providersData = await BookingService.getAllProviders();
      } else {
        providersData = await BookingService.getProvidersByCategory(selectedCategory);
      }

      // Filtrar por búsqueda si hay query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        providersData = providersData.filter(provider => {
          const businessName = (provider.business_name || '').toLowerCase();
          const providerName = (provider.name || '').toLowerCase();
          const category = (provider.category || '').toLowerCase();
          const address = (provider.address || '').toLowerCase();
          
          // Búsqueda directa
          if (businessName.includes(query) || providerName.includes(query) || 
              category.includes(query) || address.includes(query)) {
            return true;
          }
          
          // Búsqueda por palabras clave de categorías
          const selectedCat = categories.find(cat => cat.id === selectedCategory);
          if (selectedCat && selectedCat.keywords) {
            return selectedCat.keywords.some(keyword => 
              businessName.includes(keyword) || category.includes(keyword)
            );
          }
          
          return false;
        });
      }

      setProviders(providersData);
      log.info(LogCategory.DATA, 'Providers loaded successfully', { count: providersData.length });
    } catch (error) {
      log.error(LogCategory.ERROR, 'Error loading providers', error);
      setError('No se pudieron cargar los proveedores. Verifica tu conexión a internet.');
      setProviders([]);
    } finally {
      setLoading(false);
    }
  };

  const applyFiltersAndSort = () => {
    let filtered = [...providers];

    // Apply rating filter
    if (filters.rating > 0) {
      filtered = filtered.filter(provider => provider.rating >= filters.rating);
    }

    // Apply availability filter (simulated for now)
    if (filters.availability !== 'all') {
      // In a real app, this would filter based on actual availability data
      filtered = filtered.filter(provider => provider.is_active);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (filters.sortBy) {
        case 'rating':
          return b.rating - a.rating;
        case 'name':
          return (a.business_name || '').localeCompare(b.business_name || '');
        case 'price':
          // In a real app, this would sort by actual service prices
          return (a.business_name || '').localeCompare(b.business_name || ''); // Placeholder
        case 'distance':
        default:
          // In a real app, this would sort by actual distance
          return (a.business_name || '').localeCompare(b.business_name || ''); // Placeholder
      }
    });

    setFilteredProviders(filtered);
    log.info(LogCategory.DATA, 'Filters applied', { 
      originalCount: providers.length,
      filteredCount: filtered.length,
      filters 
    });
  };

  const handleApplyFilters = (newFilters: FilterOptions) => {
    setFilters(newFilters);
    log.userAction('Apply filters', { filters: newFilters });
  };

  const handleShowFilters = () => {
    setShowFiltersModal(true);
    log.userAction('Open filters modal', { screen: 'Explore' });
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadProviders();
    setRefreshing(false);
  };

  const handleRetry = () => {
    log.userAction('Retry loading providers', { screen: 'Explore' });
    loadProviders();
  };

  const loadFavoriteStatuses = async () => {
    try {
      if (filteredProviders.length === 0) return;
      
      const providerIds = filteredProviders.map(p => p.id);
      const statuses = await BookingService.getFavoriteStatuses(providerIds);
      setFavoriteStatuses(statuses);
    } catch (error) {
      log.error(LogCategory.ERROR, 'Error loading favorite statuses', error);
    }
  };

  const handleToggleFavorite = async (provider: Provider) => {
    try {
      const isFavorite = favoriteStatuses[provider.id] || false;
      
      if (isFavorite) {
        await BookingService.removeFromFavorites(provider.id);
        log.userAction('Remove from favorites', { 
          providerId: provider.id, 
          providerName: provider.business_name,
          screen: 'Explore'
        });
      } else {
        await BookingService.addToFavorites(provider.id);
        log.userAction('Add to favorites', { 
          providerId: provider.id, 
          providerName: provider.business_name,
          screen: 'Explore'
        });
      }
      
      // Update local state
      setFavoriteStatuses(prev => ({
        ...prev,
        [provider.id]: !isFavorite
      }));
    } catch (error) {
      log.error(LogCategory.ERROR, 'Error toggling favorite', error);
      // You might want to show a toast or alert here
    }
  };


  const renderProviderCard = (provider: Provider) => (
    <Card key={provider.id} variant="elevated" style={styles.providerCard}>
      <TouchableOpacity
        onPress={() => {
          log.userAction('View provider details', { providerId: provider.id, providerName: provider.business_name });
          router.push({
            pathname: '/(booking)/provider-detail',
            params: { providerId: provider.id }
          });
        }}
        style={styles.providerCardContent}
      >
        <View style={styles.providerHeader}>
          <View style={[styles.providerImage, { backgroundColor: surfaceColor }] }>
            {provider.logo_url ? (
              <Image
                source={{ uri: provider.logo_url! }}
                style={{ width: '100%', height: '100%', borderRadius: 12 }}
                contentFit="cover"
                cachePolicy="memory-disk"
              />
            ) : (
              <IconSymbol name="building.2" size={32} color={primaryColor} />
            )}
          </View>
          <View style={styles.providerMainInfo}>
            <ThemedText style={styles.providerName} numberOfLines={1}>
              {provider.business_name}
            </ThemedText>
            <ThemedText style={styles.providerCategory} numberOfLines={1}>
              {provider.category}
            </ThemedText>
            <View style={styles.providerStatus}>
              <View style={[
                styles.statusIndicator, 
                { backgroundColor: provider.is_active ? Colors.light.success : Colors.light.error }
              ]} />
              <ThemedText style={styles.statusText}>
                {provider.is_active ? 'Disponible' : 'No disponible'}
              </ThemedText>
            </View>
          </View>
          <View style={styles.providerRating}>
            <View style={styles.ratingContainer}>
              <IconSymbol name="star.fill" size={16} color={Colors.light.secondary} />
              <ThemedText style={styles.ratingText}>{provider.rating.toFixed(1)}</ThemedText>
            </View>
            <ThemedText style={styles.reviewsText}>({provider.total_reviews})</ThemedText>
            <TouchableOpacity
              style={styles.favoriteButton}
              onPress={() => handleToggleFavorite(provider)}
            >
              <IconSymbol
                name={favoriteStatuses[provider.id] ? "heart.fill" : "heart"}
                size={20}
                color={favoriteStatuses[provider.id] ? Colors.light.accent : Colors.light.textSecondary}
              />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.providerInfo}>
          {provider.address && (
            <View style={styles.infoRow}>
              <IconSymbol name="location" size={14} color={textColor} />
              <ThemedText style={styles.infoText} numberOfLines={1}>
                {provider.address}
              </ThemedText>
            </View>
          )}
          {provider.phone && (
            <View style={styles.infoRow}>
              <IconSymbol name="phone" size={14} color={textColor} />
              <ThemedText style={styles.infoText} numberOfLines={1}>
                {provider.phone}
              </ThemedText>
            </View>
          )}
        </View>
      </TouchableOpacity>
      
      <View style={styles.providerActions}>
        <Button
          title="Ver Detalles"
          size="small"
          variant="primary"
          onPress={() => {
            log.userAction('View provider details', { providerId: provider.id, providerName: provider.business_name });
            router.push({
              pathname: '/(booking)/provider-detail',
              params: { providerId: provider.id }
            });
          }}
        />
      </View>
    </Card>
  );

  return (
    <View style={[styles.container, { backgroundColor }]}>
      {/* Header fijo */}
      <ThemedView style={[styles.header, { backgroundColor: surfaceColor, borderBottomColor: borderColor }]}>
        <ThemedText type="title" style={[styles.title, { color: primaryColor }]}>
          Explorar Servicios
        </ThemedText>
        
        <Input
          placeholder="Buscar servicios, proveedores..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          leftIcon={<IconSymbol name="magnifyingglass" size={20} color={textSecondaryColor} />}
        />
      </ThemedView>

      {/* Contenido scrolleable */}
      <ScrollView 
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={createRefreshControl(refreshing, handleRefresh)}
      >
        {/* Categorías */}
        <ThemedView style={[styles.section, { paddingTop: DesignTokens.spacing['2xl'], paddingBottom: DesignTokens.spacing.xs }]}> 
          <ThemedText type="subtitle" style={[styles.sectionTitle, { color: textColor, marginBottom: DesignTokens.spacing.xl }] } >
            Categorías
          </ThemedText>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false} 
            style={styles.categoriesScroll}
            contentContainerStyle={styles.categoriesContent}
          >
            {categories.map((category) => (
              <TouchableOpacity
                key={category.id}
                style={[
                  styles.categoryChip,
                  { 
                    backgroundColor: selectedCategory === category.id ? primaryColor : surfaceColor,
                    borderColor: selectedCategory === category.id ? primaryColor : borderColor,
                    borderWidth: 1,
                  },
                  selectedCategory === category.id && styles.categoryChipSelected,
                ]}
                onPress={() => setSelectedCategory(category.id)}
              >
                <IconSymbol
                  name={category.icon}
                  size={20}
                  color={selectedCategory === category.id ? '#ffffff' : textColor}
                />
                <Text
                  style={[
                    styles.categoryChipText,
                    { color: selectedCategory === category.id ? '#ffffff' : textColor },
                    selectedCategory === category.id && styles.categoryChipTextSelected,
                  ]}
                >
                  {category.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </ThemedView>

        {/* Lista de proveedores */}
        <ThemedView style={styles.section}>
          <View style={styles.sectionHeader}>
            <ThemedText type="subtitle" style={[styles.sectionTitle, { color: textColor }]}>
              Proveedores Cercanos
            </ThemedText>
            <Button
              title="Filtros"
              variant="ghost"
              size="small"
              icon={<IconSymbol name="line.3.horizontal.decrease" size={16} color={primaryColor} />}
              onPress={handleShowFilters}
            />
          </View>
          
          <ScreenLoading
            loading={loading}
            skeleton={<ProviderListSkeleton />}
            error={error}
            onRetry={handleRetry}
          >
            {filteredProviders.length > 0 ? (
              filteredProviders.map((provider) => renderProviderCard(provider))
            ) : (
              <EmptyState
                title="No hay proveedores"
                message={
                  providers.length > 0 
                    ? 'No se encontraron proveedores con estos filtros. Intenta ajustar tus criterios de búsqueda.' 
                    : searchQuery.trim() 
                      ? `No se encontraron proveedores para "${searchQuery}". Intenta con otro término.`
                      : 'No hay proveedores disponibles en esta categoría por el momento.'
                }
                icon="magnifyingglass"
                actionText={providers.length > 0 ? "Limpiar filtros" : "Explorar todo"}
                onAction={() => {
                  if (providers.length > 0) {
                    setFilters({
                      priceRange: { min: 0, max: 1000 },
                      rating: 0,
                      distance: 50,
                      availability: 'all',
                      sortBy: 'distance',
                    });
                  } else {
                    setSelectedCategory('all');
                    setSearchQuery('');
                  }
                }}
              />
            )}
          </ScreenLoading>
        </ThemedView>

        {/* Espacio adicional al final */}
        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Filters Modal */}
      <FiltersModal
        visible={showFiltersModal}
        onClose={() => setShowFiltersModal(false)}
        onApplyFilters={handleApplyFilters}
        currentFilters={filters}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: DesignTokens.spacing.xl,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: DesignTokens.spacing.md,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: DesignTokens.typography.fontSizes['3xl'],
    fontWeight: DesignTokens.typography.fontWeights.bold as any,
    marginBottom: DesignTokens.spacing.lg,
    letterSpacing: -0.5,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: DesignTokens.spacing['6xl'], // Espacio extra para el TabBar
  },
  section: {
    paddingHorizontal: DesignTokens.spacing.xl,
    marginBottom: DesignTokens.spacing.lg,
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
    letterSpacing: -0.2,
  },
  categoriesScroll: {
    marginHorizontal: -DesignTokens.spacing.xl,
  },
  categoriesContent: {
    paddingHorizontal: DesignTokens.spacing.xl,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: DesignTokens.radius['2xl'],
    paddingHorizontal: DesignTokens.spacing.lg,
    paddingVertical: DesignTokens.spacing.sm,
    marginRight: DesignTokens.spacing.md,
    borderWidth: 1,
    ...DesignTokens.elevation.sm,
  },
  categoryChipSelected: {
    ...DesignTokens.elevation.md,
  },
  categoryChipText: {
    marginLeft: DesignTokens.spacing.sm,
    fontSize: DesignTokens.typography.fontSizes.sm,
    fontWeight: DesignTokens.typography.fontWeights.medium as any,
  },
  categoryChipTextSelected: {
    color: Colors.light.textOnPrimary,
  },
  bottomSpacer: {
    height: DesignTokens.spacing['4xl'],
  },
  loadingContainer: {
    padding: DesignTokens.spacing.xl,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: DesignTokens.typography.fontSizes.base,
  },
  emptyContainer: {
    padding: DesignTokens.spacing.xl,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: DesignTokens.typography.fontSizes.base,
    textAlign: 'center',
  },
  providerCard: {
    marginBottom: DesignTokens.spacing.lg,
    padding: DesignTokens.spacing.lg,
  },
  providerCardContent: {
    marginBottom: DesignTokens.spacing.md,
  },
  providerHeader: {
    flexDirection: 'row',
    marginBottom: DesignTokens.spacing.md,
  },
  providerImage: {
    width: 56,
    height: 56,
    borderRadius: DesignTokens.radius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: DesignTokens.spacing.md,
    ...DesignTokens.elevation.sm,
  },
  providerMainInfo: {
    flex: 1,
  },
  providerName: {
    fontSize: DesignTokens.typography.fontSizes.lg,
    fontWeight: DesignTokens.typography.fontWeights.semibold as any,
    marginBottom: DesignTokens.spacing.xs,
    letterSpacing: -0.1,
  },
  providerCategory: {
    fontSize: DesignTokens.typography.fontSizes.sm,
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
  },
  nextAvailable: {
    fontSize: DesignTokens.typography.fontSizes.xs,
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
    marginLeft: DesignTokens.spacing.xs,
  },
  reviewsText: {
    fontSize: DesignTokens.typography.fontSizes.xs,
  },
  servicesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: DesignTokens.spacing.sm,
    marginBottom: DesignTokens.spacing.lg,
  },
  serviceTag: {
    borderRadius: DesignTokens.radius.sm,
    paddingHorizontal: DesignTokens.spacing.sm,
    paddingVertical: DesignTokens.spacing.xs,
  },
  serviceTagText: {
    fontSize: DesignTokens.typography.fontSizes.xs,
    fontWeight: DesignTokens.typography.fontWeights.medium as any,
  },
  providerInfo: {
    gap: DesignTokens.spacing.sm,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DesignTokens.spacing.sm,
  },
  infoText: {
    fontSize: DesignTokens.typography.fontSizes.sm,
    flex: 1,
  },
  providerActions: {
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
    paddingTop: DesignTokens.spacing.md,
    alignItems: 'center',
  },
  favoriteButton: {
    padding: DesignTokens.spacing.xs,
    marginLeft: DesignTokens.spacing.sm,
  },
});