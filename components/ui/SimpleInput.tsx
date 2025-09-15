import { Colors, DesignTokens } from '@/constants/Colors';
import React from 'react';
import {
    StyleSheet,
    Text,
    TextInput,
    TextInputProps,
    View,
} from 'react-native';

interface SimpleInputProps extends TextInputProps {
  label?: string;
  error?: string;
  containerStyle?: any;
}

export function SimpleInput({
  label,
  error,
  containerStyle,
  style,
  ...props
}: SimpleInputProps) {
  return (
    <View style={[styles.container, containerStyle]}>
      {label && <Text style={styles.label}>{label}</Text>}
      
      <TextInput
        style={[styles.input, error && styles.inputError, style]}
        placeholderTextColor={Colors.light.textSecondary}
        {...props}
      />
      
      {error && (
        <Text style={styles.errorText}>
          {error}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: DesignTokens.spacing.lg,
  },
  
  label: {
    fontSize: DesignTokens.typography.fontSizes.sm,
    fontWeight: DesignTokens.typography.fontWeights.semibold as any,
    color: Colors.light.text,
    marginBottom: DesignTokens.spacing.sm,
  },
  
  input: {
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: DesignTokens.radius.lg,
    paddingHorizontal: DesignTokens.spacing.lg,
    paddingVertical: DesignTokens.spacing.md,
    fontSize: DesignTokens.typography.fontSizes.base,
    color: Colors.light.text,
    backgroundColor: Colors.light.surface,
    minHeight: 48,
  },
  
  inputError: {
    borderColor: Colors.light.error,
  },
  
  errorText: {
    fontSize: DesignTokens.typography.fontSizes.xs,
    color: Colors.light.error,
    marginTop: DesignTokens.spacing.xs,
  },
});
