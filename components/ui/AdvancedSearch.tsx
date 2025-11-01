import { ThemedText } from '@/components/ThemedText';
import { Card } from '@/components/ui/Card';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Input } from '@/components/ui/Input';
import { Colors, DesignTokens } from '@/constants/Colors';
import { OfflineStorage, SearchHistoryItem } from '@/lib/offline-storage';
import React, { useEffect, useState } from 'react';
import {
  Modal,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View
} from 'react-native';

export interface AdvancedSearchProps {
  value: string;
  onChangeText: (text: string) => void;
  onSearch?: (query: string) => void;
  onSelectSuggestion?: (suggestion: string) => void;
  placeholder?: string;
  category?: string;
  suggestions?: string[];
  showHistory?: boolean;
}

export function AdvancedSearch({
  value,
  onChangeText,
  onSearch,
  onSelectSuggestion,
  placeholder = 'Buscar...',
  category,
  suggestions = [],
  showHistory = true,
}: AdvancedSearchProps) {
  const [searchHistory, setSearchHistory] = useState<SearchHistoryItem[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    loadSearchHistory();
  }, []);

  const loadSearchHistory = async () => {
    const history = await OfflineStorage.getSearchHistory();
    setSearchHistory(history);
  };

  const handleSearch = async (query: string) => {
    if (!query.trim()) return;

    // Save to history
    await OfflineStorage.addSearchHistory(query, category);
    await loadSearchHistory();

    // Trigger search
    if (onSearch) {
      onSearch(query);
    }

    setShowSuggestions(false);
  };

  const handleSelectSuggestion = async (suggestion: string) => {
    onChangeText(suggestion);
    
    // Save to history
    await OfflineStorage.addSearchHistory(suggestion, category);
    await loadSearchHistory();

    if (onSelectSuggestion) {
      onSelectSuggestion(suggestion);
    } else if (onSearch) {
      onSearch(suggestion);
    }

    setShowSuggestions(false);
  };

  const handleClearHistory = async () => {
    await OfflineStorage.clearSearchHistory();
    await loadSearchHistory();
  };

  const handleFocus = () => {
    setShowSuggestions(true);
  };

  const handleBlur = () => {
    // Delay to allow click on suggestions
    setTimeout(() => setShowSuggestions(false), 200);
  };

  // Filter suggestions based on current input
  const filteredSuggestions = suggestions.filter(s =>
    s.toLowerCase().includes(value.toLowerCase()) && s !== value
  );

  // Get relevant history (last 5 items)
  const recentHistory = searchHistory
    .filter(item => {
      if (!value.trim()) return true;
      return item.query.toLowerCase().includes(value.toLowerCase());
    })
    .slice(0, 5);

  const showDropdown = showSuggestions && (filteredSuggestions.length > 0 || recentHistory.length > 0);

  return (
    <View style={styles.container}>
      <Input
        value={value}
        onChangeText={onChangeText}
        onSubmitEditing={() => handleSearch(value)}
        onFocus={handleFocus}
        onBlur={handleBlur}
        placeholder={placeholder}
        leftIcon={<IconSymbol name="magnifyingglass" size={20} color={Colors.light.textSecondary} />}
        rightIcon={
          value.length > 0 ? (
            <TouchableOpacity onPress={() => onChangeText('')}>
              <IconSymbol name="xmark.circle.fill" size={20} color={Colors.light.textSecondary} />
            </TouchableOpacity>
          ) : undefined
        }
        style={styles.searchInput}
      />

      {showDropdown && (
        <Card variant="elevated" style={styles.suggestionsDropdown}>
          <ScrollView
            style={styles.suggestionsList}
            keyboardShouldPersistTaps="handled"
            nestedScrollEnabled
          >
            {/* Search History */}
            {showHistory && recentHistory.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <ThemedText style={styles.sectionTitle}>Búsquedas recientes</ThemedText>
                  <TouchableOpacity onPress={handleClearHistory}>
                    <ThemedText style={styles.clearButton}>Limpiar</ThemedText>
                  </TouchableOpacity>
                </View>
                {recentHistory.map((item, index) => (
                  <TouchableOpacity
                    key={`history-${index}`}
                    style={styles.suggestionItem}
                    onPress={() => handleSelectSuggestion(item.query)}
                  >
                    <IconSymbol name="clock" size={16} color={Colors.light.textSecondary} />
                    <ThemedText style={styles.suggestionText} numberOfLines={1}>
                      {item.query}
                    </ThemedText>
                    {item.category && (
                      <View style={styles.categoryBadge}>
                        <ThemedText style={styles.categoryBadgeText}>
                          {item.category}
                        </ThemedText>
                      </View>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Suggestions */}
            {filteredSuggestions.length > 0 && (
              <View style={styles.section}>
                {recentHistory.length > 0 && (
                  <View style={styles.sectionHeader}>
                    <ThemedText style={styles.sectionTitle}>Sugerencias</ThemedText>
                  </View>
                )}
                {filteredSuggestions.map((suggestion, index) => (
                  <TouchableOpacity
                    key={`suggestion-${index}`}
                    style={styles.suggestionItem}
                    onPress={() => handleSelectSuggestion(suggestion)}
                  >
                    <IconSymbol name="magnifyingglass" size={16} color={Colors.light.textSecondary} />
                    <ThemedText style={styles.suggestionText} numberOfLines={1}>
                      {suggestion}
                    </ThemedText>
                    <IconSymbol name="arrow.up.left" size={14} color={Colors.light.textSecondary} />
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {recentHistory.length === 0 && filteredSuggestions.length === 0 && (
              <View style={styles.emptyState}>
                <ThemedText style={styles.emptyStateText}>
                  No hay sugerencias disponibles
                </ThemedText>
              </View>
            )}
          </ScrollView>
        </Card>
      )}
    </View>
  );
}

// Price range filter component
export interface PriceRangeFilterProps {
  minPrice: number;
  maxPrice: number;
  onChangeMin: (value: number) => void;
  onChangeMax: (value: number) => void;
  currency?: string;
}

export function PriceRangeFilter({
  minPrice,
  maxPrice,
  onChangeMin,
  onChangeMax,
  currency = 'USD',
}: PriceRangeFilterProps) {
  return (
    <View style={styles.priceRangeContainer}>
      <ThemedText style={styles.filterLabel}>Rango de precio</ThemedText>
      <View style={styles.priceInputs}>
        <View style={styles.priceInputWrapper}>
          <ThemedText style={styles.priceLabel}>Mínimo</ThemedText>
          <Input
            value={minPrice.toString()}
            onChangeText={(text) => {
              const num = parseInt(text) || 0;
              onChangeMin(num);
            }}
            keyboardType="numeric"
            placeholder="0"
            leftIcon={<ThemedText style={styles.currencySymbol}>{currency}</ThemedText>}
            style={styles.priceInput}
          />
        </View>
        <ThemedText style={styles.priceSeparator}>-</ThemedText>
        <View style={styles.priceInputWrapper}>
          <ThemedText style={styles.priceLabel}>Máximo</ThemedText>
          <Input
            value={maxPrice.toString()}
            onChangeText={(text) => {
              const num = parseInt(text) || 0;
              onChangeMax(num);
            }}
            keyboardType="numeric"
            placeholder="1000"
            leftIcon={<ThemedText style={styles.currencySymbol}>{currency}</ThemedText>}
            style={styles.priceInput}
          />
        </View>
      </View>
    </View>
  );
}

// Sort options component
export interface SortOption {
  value: string;
  label: string;
  icon?: string;
}

export interface SortSelectorProps {
  options: SortOption[];
  selected: string;
  onSelect: (value: string) => void;
}

export function SortSelector({ options, selected, onSelect }: SortSelectorProps) {
  const [showModal, setShowModal] = useState(false);

  const selectedOption = options.find(o => o.value === selected);

  return (
    <>
      <TouchableOpacity
        style={styles.sortButton}
        onPress={() => setShowModal(true)}
      >
        <IconSymbol name="arrow.up.arrow.down" size={16} color={Colors.light.primary} />
        <ThemedText style={styles.sortButtonText}>
          {selectedOption?.label || 'Ordenar'}
        </ThemedText>
        <IconSymbol name="chevron.down" size={14} color={Colors.light.textSecondary} />
      </TouchableOpacity>

      <Modal
        visible={showModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowModal(false)}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <ThemedText style={styles.modalTitle}>Ordenar por</ThemedText>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <IconSymbol name="xmark" size={24} color={Colors.light.text} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.sortOptions}>
              {options.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.sortOption,
                    selected === option.value && styles.sortOptionSelected,
                  ]}
                  onPress={() => {
                    onSelect(option.value);
                    setShowModal(false);
                  }}
                >
                  {option.icon && (
                    <IconSymbol
                      name={option.icon as any}
                      size={20}
                      color={selected === option.value ? Colors.light.primary : Colors.light.text}
                    />
                  )}
                  <ThemedText
                    style={[
                      styles.sortOptionText,
                      selected === option.value && styles.sortOptionTextSelected,
                    ]}
                  >
                    {option.label}
                  </ThemedText>
                  {selected === option.value && (
                    <IconSymbol name="checkmark" size={20} color={Colors.light.primary} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    zIndex: 1000,
  },
  searchInput: {
    marginBottom: 0,
  },
  suggestionsDropdown: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    marginTop: DesignTokens.spacing.xs,
    maxHeight: 300,
    zIndex: 1001,
    ...DesignTokens.elevation.lg,
  },
  suggestionsList: {
    flex: 1,
  },
  section: {
    paddingVertical: DesignTokens.spacing.sm,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: DesignTokens.spacing.md,
    paddingVertical: DesignTokens.spacing.sm,
  },
  sectionTitle: {
    fontSize: DesignTokens.typography.fontSizes.xs,
    fontWeight: DesignTokens.typography.fontWeights.semibold as any,
    color: Colors.light.textSecondary,
    textTransform: 'uppercase',
  },
  clearButton: {
    fontSize: DesignTokens.typography.fontSizes.xs,
    color: Colors.light.primary,
    fontWeight: DesignTokens.typography.fontWeights.medium as any,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: DesignTokens.spacing.md,
    paddingVertical: DesignTokens.spacing.md,
    gap: DesignTokens.spacing.md,
  },
  suggestionText: {
    flex: 1,
    fontSize: DesignTokens.typography.fontSizes.sm,
    color: Colors.light.text,
  },
  categoryBadge: {
    paddingHorizontal: DesignTokens.spacing.sm,
    paddingVertical: DesignTokens.spacing.xs,
    borderRadius: DesignTokens.radius.full,
    backgroundColor: Colors.light.primary + '15',
  },
  categoryBadgeText: {
    fontSize: DesignTokens.typography.fontSizes.xs,
    color: Colors.light.primary,
    fontWeight: DesignTokens.typography.fontWeights.medium as any,
  },
  emptyState: {
    padding: DesignTokens.spacing.xl,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: DesignTokens.typography.fontSizes.sm,
    color: Colors.light.textSecondary,
  },

  // Price range styles
  priceRangeContainer: {
    gap: DesignTokens.spacing.md,
  },
  filterLabel: {
    fontSize: DesignTokens.typography.fontSizes.sm,
    fontWeight: DesignTokens.typography.fontWeights.semibold as any,
    color: Colors.light.text,
  },
  priceInputs: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: DesignTokens.spacing.md,
  },
  priceInputWrapper: {
    flex: 1,
    gap: DesignTokens.spacing.xs,
  },
  priceLabel: {
    fontSize: DesignTokens.typography.fontSizes.xs,
    color: Colors.light.textSecondary,
  },
  priceInput: {
    marginBottom: 0,
  },
  currencySymbol: {
    fontSize: DesignTokens.typography.fontSizes.sm,
    color: Colors.light.textSecondary,
    fontWeight: DesignTokens.typography.fontWeights.medium as any,
  },
  priceSeparator: {
    fontSize: DesignTokens.typography.fontSizes.lg,
    color: Colors.light.textSecondary,
    marginBottom: DesignTokens.spacing.md,
  },

  // Sort selector styles
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: DesignTokens.spacing.md,
    paddingVertical: DesignTokens.spacing.sm,
    borderRadius: DesignTokens.radius.md,
    borderWidth: 1,
    borderColor: Colors.light.border,
    backgroundColor: Colors.light.surface,
    gap: DesignTokens.spacing.sm,
  },
  sortButtonText: {
    flex: 1,
    fontSize: DesignTokens.typography.fontSizes.sm,
    color: Colors.light.text,
    fontWeight: DesignTokens.typography.fontWeights.medium as any,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.light.surface,
    borderTopLeftRadius: DesignTokens.radius['2xl'],
    borderTopRightRadius: DesignTokens.radius['2xl'],
    maxHeight: '70%',
    ...DesignTokens.elevation.xl,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: DesignTokens.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  modalTitle: {
    fontSize: DesignTokens.typography.fontSizes.lg,
    fontWeight: DesignTokens.typography.fontWeights.semibold as any,
    color: Colors.light.text,
  },
  sortOptions: {
    padding: DesignTokens.spacing.md,
  },
  sortOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: DesignTokens.spacing.md,
    borderRadius: DesignTokens.radius.md,
    gap: DesignTokens.spacing.md,
    marginBottom: DesignTokens.spacing.xs,
  },
  sortOptionSelected: {
    backgroundColor: Colors.light.primary + '10',
  },
  sortOptionText: {
    flex: 1,
    fontSize: DesignTokens.typography.fontSizes.base,
    color: Colors.light.text,
  },
  sortOptionTextSelected: {
    color: Colors.light.primary,
    fontWeight: DesignTokens.typography.fontWeights.semibold as any,
  },
});
