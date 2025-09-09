import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function ExploreScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

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
    },
  ];

  return (
    <ScrollView style={styles.container}>
      <ThemedView style={styles.header}>
        <ThemedText type="title" style={styles.title}>
          Explorar Servicios
        </ThemedText>
        
        <View style={styles.searchContainer}>
          <View style={styles.searchInputContainer}>
            <IconSymbol name="magnifyingglass" size={20} color="#6b7280" />
            <TextInput
              style={styles.searchInput}
              placeholder="Buscar servicios, proveedores..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor="#9ca3af"
            />
          </View>
        </View>
      </ThemedView>

      <ThemedView style={styles.section}>
        <ThemedText type="subtitle" style={styles.sectionTitle}>
          Categorías
        </ThemedText>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriesScroll}>
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
                color={selectedCategory === category.id ? '#ffffff' : '#6b7280'}
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

      <ThemedView style={styles.section}>
        <ThemedText type="subtitle" style={styles.sectionTitle}>
          Proveedores Cercanos
        </ThemedText>
        <View style={styles.providersList}>
          {providers.map((provider) => (
            <TouchableOpacity key={provider.id} style={styles.providerCard}>
              <View style={styles.providerImage}>
                <IconSymbol name="building.2" size={40} color="#9ca3af" />
              </View>
              <View style={styles.providerInfo}>
                <ThemedText style={styles.providerName}>{provider.name}</ThemedText>
                <ThemedText style={styles.providerCategory}>{provider.category}</ThemedText>
                
                <View style={styles.providerDetails}>
                  <View style={styles.rating}>
                    <IconSymbol name="star.fill" size={16} color="#fbbf24" />
                    <ThemedText style={styles.ratingText}>{provider.rating}</ThemedText>
                    <ThemedText style={styles.reviewsText}>({provider.reviews})</ThemedText>
                  </View>
                  <ThemedText style={styles.distance}>{provider.distance}</ThemedText>
                </View>

                <View style={styles.servicesContainer}>
                  {provider.services.slice(0, 3).map((service, index) => (
                    <View key={index} style={styles.serviceTag}>
                      <ThemedText style={styles.serviceTagText}>{service}</ThemedText>
                    </View>
                  ))}
                </View>

                <View style={styles.providerFooter}>
                  <ThemedText style={styles.price}>{provider.price}</ThemedText>
                  <TouchableOpacity style={styles.bookButton}>
                    <ThemedText style={styles.bookButtonText}>Reservar</ThemedText>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ThemedView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    padding: 24,
    paddingTop: 60,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2563eb',
    marginBottom: 20,
  },
  searchContainer: {
    marginBottom: 8,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: '#111827',
  },
  section: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
    color: '#374151',
  },
  categoriesScroll: {
    marginHorizontal: -24,
    paddingHorizontal: 24,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  categoryChipSelected: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
  },
  categoryChipText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
  },
  categoryChipTextSelected: {
    color: '#ffffff',
  },
  providersList: {
    gap: 16,
  },
  providerCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  providerImage: {
    width: 60,
    height: 60,
    borderRadius: 12,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  providerInfo: {
    flex: 1,
  },
  providerName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  providerCategory: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 8,
  },
  providerDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  rating: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginLeft: 4,
  },
  reviewsText: {
    fontSize: 14,
    color: '#6b7280',
    marginLeft: 4,
  },
  distance: {
    fontSize: 14,
    color: '#6b7280',
  },
  servicesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 12,
  },
  serviceTag: {
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  serviceTagText: {
    fontSize: 12,
    color: '#374151',
    fontWeight: '500',
  },
  providerFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  price: {
    fontSize: 16,
    fontWeight: '600',
    color: '#059669',
  },
  bookButton: {
    backgroundColor: '#2563eb',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  bookButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
});