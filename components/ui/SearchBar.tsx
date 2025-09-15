import { Colors, DesignTokens } from '@/constants/Colors';
import React, { useState } from 'react';
import {
    Animated,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
    ViewStyle,
} from 'react-native';
import { IconSymbol } from './IconSymbol';

interface SearchBarProps {
  placeholder?: string;
  value: string;
  onChangeText: (text: string) => void;
  onSearch?: (text: string) => void;
  onClear?: () => void;
  suggestions?: string[];
  onSuggestionPress?: (suggestion: string) => void;
  style?: ViewStyle;
}

export function SearchBar({
  placeholder = 'Buscar...',
  value,
  onChangeText,
  onSearch,
  onClear,
  suggestions = [],
  onSuggestionPress,
  style,
}: SearchBarProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const scaleValue = React.useRef(new Animated.Value(1)).current;

  const handleFocus = () => {
    setIsFocused(true);
    setShowSuggestions(suggestions.length > 0);
    
    // Animación de escala
    Animated.spring(scaleValue, {
      toValue: 1.02,
      useNativeDriver: true,
    }).start();
  };

  const handleBlur = () => {
    setIsFocused(false);
    setTimeout(() => setShowSuggestions(false), 200);
    
    // Animación de escala
    Animated.spring(scaleValue, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  const handleSearch = () => {
    onSearch?.(value);
    setShowSuggestions(false);
  };

  const handleClear = () => {
    onChangeText('');
    onClear?.();
    setShowSuggestions(false);
  };

  const handleSuggestionPress = (suggestion: string) => {
    onChangeText(suggestion);
    onSuggestionPress?.(suggestion);
    setShowSuggestions(false);
  };

  return (
    <View style={[styles.container, style]}>
      <Animated.View
        style={[
          styles.searchContainer,
          isFocused && styles.searchContainerFocused,
          { transform: [{ scale: scaleValue }] },
        ]}
      >
        <IconSymbol
          name="magnifyingglass"
          size={20}
          color={isFocused ? Colors.light.primary : Colors.light.textSecondary}
          style={styles.searchIcon}
        />
        
        <TextInput
          style={styles.input}
          placeholder={placeholder}
          placeholderTextColor={Colors.light.textTertiary}
          value={value}
          onChangeText={onChangeText}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onSubmitEditing={handleSearch}
          returnKeyType="search"
        />
        
        {value.length > 0 && (
          <TouchableOpacity onPress={handleClear} style={styles.clearButton}>
            <IconSymbol
              name="xmark.circle.fill"
              size={18}
              color={Colors.light.textTertiary}
            />
          </TouchableOpacity>
        )}
        
        {onSearch && (
          <TouchableOpacity onPress={handleSearch} style={styles.searchButton}>
            <IconSymbol
              name="arrow.right.circle.fill"
              size={20}
              color={Colors.light.primary}
            />
          </TouchableOpacity>
        )}
      </Animated.View>

      {/* Sugerencias */}
      {showSuggestions && suggestions.length > 0 && (
        <View style={styles.suggestionsContainer}>
          {suggestions.slice(0, 5).map((suggestion, index) => (
            <TouchableOpacity
              key={index}
              style={styles.suggestionItem}
              onPress={() => handleSuggestionPress(suggestion)}
            >
              <IconSymbol
                name="magnifyingglass"
                size={16}
                color={Colors.light.textSecondary}
                style={styles.suggestionIcon}
              />
              <Text style={styles.suggestionText}>{suggestion}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.background,
    borderRadius: DesignTokens.radius.xl,
    borderWidth: 1,
    borderColor: Colors.light.border,
    paddingHorizontal: DesignTokens.spacing.lg,
    paddingVertical: DesignTokens.spacing.md,
    ...DesignTokens.elevation.sm,
  },
  searchContainerFocused: {
    borderColor: Colors.light.primary,
    ...DesignTokens.elevation.md,
  },
  searchIcon: {
    marginRight: DesignTokens.spacing.sm,
  },
  input: {
    flex: 1,
    fontSize: DesignTokens.typography.fontSizes.base,
    color: Colors.light.text,
    fontWeight: DesignTokens.typography.fontWeights.normal as any,
  },
  clearButton: {
    marginLeft: DesignTokens.spacing.sm,
    padding: DesignTokens.spacing.xs,
  },
  searchButton: {
    marginLeft: DesignTokens.spacing.sm,
    padding: DesignTokens.spacing.xs,
  },
  suggestionsContainer: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: Colors.light.background,
    borderRadius: DesignTokens.radius.lg,
    borderWidth: 1,
    borderColor: Colors.light.border,
    marginTop: DesignTokens.spacing.xs,
    ...DesignTokens.elevation.lg,
    zIndex: 1000,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: DesignTokens.spacing.lg,
    paddingVertical: DesignTokens.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.borderLight,
  },
  suggestionIcon: {
    marginRight: DesignTokens.spacing.sm,
  },
  suggestionText: {
    fontSize: DesignTokens.typography.fontSizes.sm,
    color: Colors.light.text,
    fontWeight: DesignTokens.typography.fontWeights.normal as any,
  },
});
