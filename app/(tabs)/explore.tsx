import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Input } from '@/components/ui/Input';
import { Colors, DesignTokens } from '@/constants/Colors';
import { useThemeColor } from '@/hooks/useThemeColor';
import { BookingService, Provider } from '@/lib/booking-service';
import { LogCategory, useLogger } from '@/lib/logger';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
    Platform,
    RefreshControl,
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
  const [loading, setLoading] = useState(true);
  const log = useLogger();
  
  // Colores dinámicos para modo oscuro
  const backgroundColor = useThemeColor({}, 'background');
  const surfaceColor = useThemeColor({}, 'surface');
  const textColor = useThemeColor({}, 'text');
  const textSecondaryColor = useThemeColor({}, 'textSecondary');
  const borderColor = useThemeColor({}, 'border');
  const primaryColor = useThemeColor({}, 'primary');

  const categories = [
    { id: 'all', name: 'Todos', icon: 'grid' },
    { id: 'hair', name: 'Peluquería', icon: 'scissors' },
    { id: 'beauty', name: 'Estética', icon: 'sparkles' },
    { id: 'health', name: 'Salud', icon: 'cross.case' },
    { id: 'wellness', name: 'Bienestar', icon: 'leaf' },
  ];

  useEffect(() => {
    loadProviders();
  }, [selectedCategory]);

  const loadProviders = async () => {
    try {
      setLoading(true);
      log.info(LogCategory.DATA, 'Loading providers', { category: selectedCategory });

      let providersData: Provider[];
      if (selectedCategory === 'all') {
        providersData = await BookingService.getAllProviders();
      } else {
        providersData = await BookingService.getProvidersByCategory(selectedCategory);
      }

      setProviders(providersData);
      log.info(LogCategory.DATA, 'Providers loaded successfully', { count: providersData.length });
    } catch (error) {
      log.error(LogCategory.ERROR, 'Error loading providers', error);
      // Mantener datos de ejemplo en caso de error
      setProviders([]);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadProviders();
    setRefreshing(false);
  };

  const renderProviderCard = (provider: Provider) => (
    <Card variant="elevated" style={styles.providerCard}>
      <TouchableOpacity
        key={provider.id}
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
          <View style={[styles.providerImage, { backgroundColor: surfaceColor }]}>
            <IconSymbol name="building.2" size={32} color={primaryColor} />
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
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[Colors.light.primary]}
            tintColor={Colors.light.primary}
          />
        }
      >
        {/* Categorías */}
        <ThemedView style={styles.section}>
          <ThemedText type="subtitle" style={[styles.sectionTitle, { color: textColor }]}>
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
              onPress={() => {
                // Abrir filtros
                console.log('Abrir filtros');
              }}
            />
          </View>
          
          {loading ? (
            <ThemedView style={styles.loadingContainer}>
              <ThemedText style={[styles.loadingText, { color: textSecondaryColor }]}>Cargando proveedores...</ThemedText>
            </ThemedView>
          ) : providers.length > 0 ? (
            providers.map((provider) => renderProviderCard(provider))
          ) : (
            <ThemedView style={styles.emptyContainer}>
              <ThemedText style={[styles.emptyText, { color: textSecondaryColor }]}>
                No se encontraron proveedores en esta categoría
              </ThemedText>
            </ThemedView>
          )}
        </ThemedView>

        {/* Espacio adicional al final */}
        <View style={styles.bottomSpacer} />
      </ScrollView>
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
    color: Colors.light.textTertiary,
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
});