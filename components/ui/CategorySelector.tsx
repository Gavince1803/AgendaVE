import { ThemedText } from '@/components/ThemedText';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors, DesignTokens } from '@/constants/Colors';
import { useState } from 'react';
import { FlatList, Modal, StyleSheet, TouchableOpacity, View } from 'react-native';

interface Category {
  id: string;
  name: string;
  icon: string;
}

interface CategorySelectorProps {
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  categories: Category[];
}

export function CategorySelector({ selectedCategory, onCategoryChange, categories }: CategorySelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  
  const backgroundColor = Colors.light.background;
  const surfaceColor = Colors.light.surface;
  const textColor = Colors.light.text;
  const borderColor = Colors.light.border;
  const primaryColor = Colors.light.primary;

  const selectedCategoryData = categories.find(cat => cat.id === selectedCategory);

  const handleSelect = (categoryId: string) => {
    onCategoryChange(categoryId);
    setIsOpen(false);
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[
          styles.selector,
          { backgroundColor: surfaceColor, borderColor }
        ]}
        onPress={() => setIsOpen(true)}
      >
        <View style={styles.selectorContent}>
          <IconSymbol 
            name={selectedCategoryData?.icon || 'grid'} 
            size={20} 
            color={textColor}
          />
          <ThemedText style={[styles.selectorText, { color: textColor }]}>
            {selectedCategoryData?.name || 'Seleccionar categoría'}
          </ThemedText>
          <IconSymbol 
            name="chevron.down" 
            size={16} 
            color={textColor}
          />
        </View>
      </TouchableOpacity>

      <Modal
        visible={isOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsOpen(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setIsOpen(false)}
        >
          <View style={[styles.modalContent, { backgroundColor: surfaceColor }]}>
            <ThemedText style={[styles.modalTitle, { color: textColor }]}>
              Seleccionar Categoría
            </ThemedText>
            
            <FlatList
              data={categories}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.categoryItem,
                    { 
                      backgroundColor: item.id === selectedCategory ? primaryColor : 'transparent',
                      borderBottomColor: borderColor
                    }
                  ]}
                  onPress={() => handleSelect(item.id)}
                >
                  <IconSymbol 
                    name={item.icon} 
                    size={20} 
                    color={item.id === selectedCategory ? '#fff' : textColor}
                  />
                  <ThemedText 
                    style={[
                      styles.categoryText,
                      { 
                        color: item.id === selectedCategory ? '#fff' : textColor 
                      }
                    ]}
                  >
                    {item.name}
                  </ThemedText>
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  selector: {
    borderWidth: 1,
    borderRadius: DesignTokens.radius.md,
    padding: DesignTokens.spacing.md,
  },
  selectorContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DesignTokens.spacing.sm,
  },
  selectorText: {
    flex: 1,
    fontSize: DesignTokens.typography.fontSizes.base,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '80%',
    maxHeight: '60%',
    borderRadius: DesignTokens.radius.lg,
    padding: DesignTokens.spacing.lg,
  },
  modalTitle: {
    fontSize: DesignTokens.typography.fontSizes.lg,
    fontWeight: '600',
    marginBottom: DesignTokens.spacing.lg,
    textAlign: 'center',
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: DesignTokens.spacing.md,
    borderBottomWidth: 1,
    gap: DesignTokens.spacing.sm,
  },
  categoryText: {
    fontSize: DesignTokens.typography.fontSizes.base,
  },
});
