import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Input } from '@/components/ui/Input';
import { Colors } from '@/constants/Colors';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
    FlatList,
    Platform,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

export default function ExploreScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [refreshing, setRefreshing] = useState(false);

  const categories = [
    { id: 'all', name: 'Todos', icon: 'grid' },
    { id: 'hair', name: 'Peluquería', icon: 'scissors' },
    { id: 'beauty', name: 'Estética', icon: 'sparkles' },
    { id: 'health', name: 'Salud', icon: 'cross.case' },
    { id: 'wellness', name: 'Bienestar', icon: 'leaf' },
  ];

  const providers = [
    {
      id: 1,
      name: 'Salón Bella Vista',
      category: 'Peluquería',
      rating: 4.8,
      reviews: 124,
      distance: '0.5 km',
      price: 'Desde $15',
      image: null,
      services: ['Corte', 'Peinado', 'Tinte'],
      isOpen: true,
      nextAvailable: 'Hoy 2:00 PM',
    },
    {
      id: 2,
      name: 'Spa Relax',
      category: 'Estética',
      rating: 4.9,
      reviews: 89,
      distance: '1.2 km',
      price: 'Desde $25',
      image: null,
      services: ['Facial', 'Masaje', 'Manicure'],
      isOpen: true,
      nextAvailable: 'Hoy 3:30 PM',
    },
    {
      id: 3,
      name: 'Clínica Dental Smile',
      category: 'Salud',
      rating: 4.7,
      reviews: 156,
      distance: '0.8 km',
      price: 'Desde $30',
      image: null,
      services: ['Limpieza', 'Blanqueamiento', 'Ortodoncia'],
      isOpen: false,
      nextAvailable: 'Mañana 9:00 AM',
    },
    {
      id: 4,
      name: 'Barbería Moderna',
      category: 'Peluquería',
      rating: 4.6,
      reviews: 67,
      distance: '1.5 km',
      price: 'Desde $12',
      image: null,
      services: ['Corte', 'Barba', 'Afeitado'],
      isOpen: true,
      nextAvailable: 'Hoy 1:15 PM',
    },
    {
      id: 5,
      name: 'Centro de Masajes Zen',
      category: 'Bienestar',
      rating: 4.9,
      reviews: 203,
      distance: '2.1 km',
      price: 'Desde $35',
      image: null,
      services: ['Masaje Relajante', 'Masaje Deportivo', 'Reflexología'],
      isOpen: true,
      nextAvailable: 'Hoy 4:00 PM',
    },
  ];

  const onRefresh = () => {
    setRefreshing(true);
    // Simular carga de datos
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  };

  const renderProviderCard = ({ item: provider }) => (
    <Card variant="elevated" style={styles.providerCard}>
      <View style={styles.providerHeader}>
        <View style={styles.providerImage}>
          <IconSymbol name="building.2" size={32} color={Colors.light.primary} />
        </View>
        <View style={styles.providerMainInfo}>
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
            <ThemedText style={styles.nextAvailable}>
              • {provider.nextAvailable}
            </ThemedText>
          </View>
        </View>
        <View style={styles.providerRating}>
          <View style={styles.ratingContainer}>
            <IconSymbol name="star.fill" size={16} color={Colors.light.secondary} />
            <ThemedText style={styles.ratingText}>{provider.rating}</ThemedText>
          </View>
          <ThemedText style={styles.reviewsText}>({provider.reviews})</ThemedText>
        </View>
      </View>

      <View style={styles.servicesContainer}>
        {provider.services.slice(0, 3).map((service, index) => (
          <View key={index} style={styles.serviceTag}>
            <ThemedText style={styles.serviceTagText}>{service}</ThemedText>
          </View>
        ))}
        {provider.services.length > 3 && (
          <View style={styles.serviceTag}>
            <ThemedText style={styles.serviceTagText}>
              +{provider.services.length - 3} más
            </ThemedText>
          </View>
        )}
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
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <ThemedView style={styles.header}>
        <ThemedText type="title" style={styles.title}>
          Explorar Servicios
        </ThemedText>
        
        <Input
          placeholder="Buscar servicios, proveedores..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          leftIcon={<IconSymbol name="magnifyingglass" size={20} color={Colors.light.textSecondary} />}
        />
      </ThemedView>

      {/* Categorías */}
      <ThemedView style={styles.section}>
        <ThemedText type="subtitle" style={styles.sectionTitle}>
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
                selectedCategory === category.id && styles.categoryChipSelected,
              ]}
              onPress={() => setSelectedCategory(category.id)}
            >
              <IconSymbol
                name={category.icon}
                size={20}
                color={selectedCategory === category.id ? '#ffffff' : Colors.light.textSecondary}
              />
              <Text
                style={[
                  styles.categoryChipText,
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
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Proveedores Cercanos
          </ThemedText>
          <Button
            title="Filtros"
            variant="ghost"
            size="small"
            onPress={() => {
              // Abrir filtros
              console.log('Abrir filtros');
            }}
          />
        </View>
        
        <FlatList
          data={providers}
          renderItem={renderProviderCard}
          keyExtractor={(item) => item.id.toString()}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[Colors.light.primary]}
              tintColor={Colors.light.primary}
            />
          }
          contentContainerStyle={styles.providersList}
        />
      </ThemedView>
    </View>
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
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.light.primary,
    marginBottom: 20,
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 16,
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
  categoriesScroll: {
    marginHorizontal: -20,
  },
  categoriesContent: {
    paddingHorizontal: 20,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.background,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginRight: 12,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  categoryChipSelected: {
    backgroundColor: Colors.light.primary,
    borderColor: Colors.light.primary,
  },
  categoryChipText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '500',
    color: Colors.light.textSecondary,
  },
  categoryChipTextSelected: {
    color: '#ffffff',
  },
  providersList: {
    paddingBottom: 20,
  },
  providerCard: {
    marginBottom: 16,
  },
  providerHeader: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  providerImage: {
    width: 50,
    height: 50,
    borderRadius: 12,
    backgroundColor: Colors.light.surfaceVariant,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  providerMainInfo: {
    flex: 1,
  },
  providerName: {
    fontSize: 18,
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
  nextAvailable: {
    fontSize: 12,
    color: Colors.light.textTertiary,
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
  reviewsText: {
    fontSize: 12,
    color: Colors.light.textSecondary,
  },
  servicesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  serviceTag: {
    backgroundColor: Colors.light.surfaceVariant,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  serviceTagText: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    fontWeight: '500',
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
});