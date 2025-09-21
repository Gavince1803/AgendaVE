import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Colors, DesignTokens } from '@/constants/Colors';
import React, { useState } from 'react';
import {
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    View
} from 'react-native';
import { Button } from './Button';
import { IconSymbol } from './IconSymbol';

export interface FilterOptions {
  priceRange: {
    min: number;
    max: number;
  };
  rating: number;
  distance: number;
  availability: 'all' | 'now' | 'today' | 'week';
  sortBy: 'distance' | 'rating' | 'price' | 'name';
}

interface FiltersModalProps {
  visible: boolean;
  onClose: () => void;
  onApplyFilters: (filters: FilterOptions) => void;
  currentFilters: FilterOptions;
}

const defaultFilters: FilterOptions = {
  priceRange: { min: 0, max: 200 },
  rating: 0,
  distance: 50,
  availability: 'all',
  sortBy: 'distance',
};

export function FiltersModal({ 
  visible, 
  onClose, 
  onApplyFilters, 
  currentFilters 
}: FiltersModalProps) {
  const [filters, setFilters] = useState<FilterOptions>(currentFilters);

  const handleReset = () => {
    setFilters(defaultFilters);
  };

  const handleApply = () => {
    onApplyFilters(filters);
    onClose();
  };

  const priceRanges = [
    { label: '$0 - $25', min: 0, max: 25 },
    { label: '$25 - $50', min: 25, max: 50 },
    { label: '$50 - $100', min: 50, max: 100 },
    { label: '$100 - $200', min: 100, max: 200 },
    { label: '$200+', min: 200, max: 1000 },
  ];

  const distanceOptions = [
    { label: '5 km', value: 5 },
    { label: '10 km', value: 10 },
    { label: '25 km', value: 25 },
    { label: '50 km', value: 50 },
    { label: 'Sin límite', value: 1000 },
  ];

  const availabilityOptions = [
    { label: 'Cualquier momento', value: 'all' },
    { label: 'Disponible ahora', value: 'now' },
    { label: 'Disponible hoy', value: 'today' },
    { label: 'Esta semana', value: 'week' },
  ];

  const sortOptions = [
    { label: 'Por distancia', value: 'distance', icon: 'location' },
    { label: 'Por calificación', value: 'rating', icon: 'star.fill' },
    { label: 'Por precio', value: 'price', icon: 'dollarsign.circle' },
    { label: 'Por nombre', value: 'name', icon: 'textformat.abc' },
  ];

  const renderOptionButton = (
    options: any[], 
    currentValue: any, 
    onSelect: (value: any) => void,
    getLabel: (option: any) => string,
    getValue: (option: any) => any
  ) => {
    return options.map((option, index) => {
      const isSelected = currentValue === getValue(option);
      return (
        <TouchableOpacity
          key={index}
          style={[
            styles.optionButton,
            isSelected && styles.optionButtonSelected,
          ]}
          onPress={() => onSelect(getValue(option))}
        >
          <ThemedText style={[
            styles.optionButtonText,
            isSelected && styles.optionButtonTextSelected,
          ]}>
            {getLabel(option)}
          </ThemedText>
        </TouchableOpacity>
      );
    });
  };

  const renderRatingButtons = () => {
    return [1, 2, 3, 4, 5].map(rating => {
      const isSelected = filters.rating >= rating;
      return (
        <TouchableOpacity
          key={rating}
          style={styles.ratingButton}
          onPress={() => setFilters({ ...filters, rating: rating === filters.rating ? 0 : rating })}
        >
          <IconSymbol
            name="star.fill"
            size={24}
            color={isSelected ? Colors.light.secondary : Colors.light.borderMedium}
          />
        </TouchableOpacity>
      );
    });
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <ThemedView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <IconSymbol name="xmark" size={24} color={Colors.light.text} />
          </TouchableOpacity>
          <ThemedText type="title" style={styles.title}>
            Filtros
          </ThemedText>
          <TouchableOpacity style={styles.resetButton} onPress={handleReset}>
            <ThemedText style={styles.resetButtonText}>Limpiar</ThemedText>
          </TouchableOpacity>
        </View>

        {/* Content */}
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Price Range */}
          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>Rango de Precio</ThemedText>
            <View style={styles.optionsGrid}>
              {renderOptionButton(
                priceRanges,
                `${filters.priceRange.min}-${filters.priceRange.max}`,
                (value) => {
                  const range = priceRanges.find(r => `${r.min}-${r.max}` === value);
                  if (range) {
                    setFilters({ ...filters, priceRange: { min: range.min, max: range.max } });
                  }
                },
                (option) => option.label,
                (option) => `${option.min}-${option.max}`
              )}
            </View>
          </View>

          {/* Rating */}
          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>Calificación Mínima</ThemedText>
            <View style={styles.ratingContainer}>
              {renderRatingButtons()}
              <ThemedText style={styles.ratingText}>
                {filters.rating > 0 ? `${filters.rating}+ estrellas` : 'Cualquier calificación'}
              </ThemedText>
            </View>
          </View>

          {/* Distance */}
          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>Distancia Máxima</ThemedText>
            <View style={styles.optionsGrid}>
              {renderOptionButton(
                distanceOptions,
                filters.distance,
                (value) => setFilters({ ...filters, distance: value }),
                (option) => option.label,
                (option) => option.value
              )}
            </View>
          </View>

          {/* Availability */}
          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>Disponibilidad</ThemedText>
            <View style={styles.optionsGrid}>
              {renderOptionButton(
                availabilityOptions,
                filters.availability,
                (value) => setFilters({ ...filters, availability: value }),
                (option) => option.label,
                (option) => option.value
              )}
            </View>
          </View>

          {/* Sort By */}
          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>Ordenar Por</ThemedText>
            <View style={styles.sortOptions}>
              {sortOptions.map((option) => {
                const isSelected = filters.sortBy === option.value;
                return (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.sortOption,
                      isSelected && styles.sortOptionSelected,
                    ]}
                    onPress={() => setFilters({ ...filters, sortBy: option.value as any })}
                  >
                    <IconSymbol
                      name={option.icon}
                      size={20}
                      color={isSelected ? Colors.light.primary : Colors.light.textSecondary}
                    />
                    <ThemedText style={[
                      styles.sortOptionText,
                      isSelected && styles.sortOptionTextSelected,
                    ]}>
                      {option.label}
                    </ThemedText>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Bottom Spacing */}
          <View style={styles.bottomSpacing} />
        </ScrollView>

        {/* Footer */}
        <View style={styles.footer}>
          <Button
            title="Cancelar"
            variant="outline"
            onPress={onClose}
            style={styles.cancelButton}
          />
          <Button
            title="Aplicar Filtros"
            onPress={handleApply}
            style={styles.applyButton}
          />
        </View>
      </ThemedView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: DesignTokens.spacing.xl,
    paddingVertical: DesignTokens.spacing.lg,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  closeButton: {
    padding: DesignTokens.spacing.sm,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.light.text,
  },
  resetButton: {
    padding: DesignTokens.spacing.sm,
  },
  resetButtonText: {
    fontSize: 16,
    color: Colors.light.primary,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    paddingHorizontal: DesignTokens.spacing.xl,
  },
  section: {
    marginBottom: DesignTokens.spacing['2xl'],
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: DesignTokens.spacing.lg,
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: DesignTokens.spacing.sm,
  },
  optionButton: {
    paddingHorizontal: DesignTokens.spacing.lg,
    paddingVertical: DesignTokens.spacing.md,
    borderRadius: DesignTokens.radius.lg,
    borderWidth: 1,
    borderColor: Colors.light.border,
    backgroundColor: Colors.light.surface,
  },
  optionButtonSelected: {
    borderColor: Colors.light.primary,
    backgroundColor: Colors.light.primary,
  },
  optionButtonText: {
    fontSize: 14,
    color: Colors.light.text,
    fontWeight: '500',
  },
  optionButtonTextSelected: {
    color: Colors.light.textOnPrimary,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DesignTokens.spacing.sm,
  },
  ratingButton: {
    padding: DesignTokens.spacing.xs,
  },
  ratingText: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    marginLeft: DesignTokens.spacing.md,
  },
  sortOptions: {
    gap: DesignTokens.spacing.sm,
  },
  sortOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: DesignTokens.spacing.lg,
    paddingVertical: DesignTokens.spacing.md,
    borderRadius: DesignTokens.radius.lg,
    borderWidth: 1,
    borderColor: Colors.light.border,
    backgroundColor: Colors.light.surface,
  },
  sortOptionSelected: {
    borderColor: Colors.light.primary,
    backgroundColor: Colors.light.primary + '10',
  },
  sortOptionText: {
    fontSize: 16,
    color: Colors.light.text,
    marginLeft: DesignTokens.spacing.md,
    fontWeight: '500',
  },
  sortOptionTextSelected: {
    color: Colors.light.primary,
    fontWeight: '600',
  },
  bottomSpacing: {
    height: DesignTokens.spacing['4xl'],
  },
  footer: {
    flexDirection: 'row',
    paddingHorizontal: DesignTokens.spacing.xl,
    paddingVertical: DesignTokens.spacing.lg,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
    gap: DesignTokens.spacing.md,
  },
  cancelButton: {
    flex: 1,
  },
  applyButton: {
    flex: 2,
  },
});