import { Colors, ComponentColors, DesignTokens } from '@/constants/Colors';
import React, { useState } from 'react';
import {
    Animated,
    StyleSheet,
    Text,
    TextInput,
    TextInputProps,
    TouchableOpacity,
    View,
} from 'react-native';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  onRightIconPress?: () => void;
  containerStyle?: any;
  variant?: 'default' | 'filled' | 'outlined';
  size?: 'small' | 'medium' | 'large';
}

export function Input({
  label,
  error,
  helperText,
  leftIcon,
  rightIcon,
  onRightIconPress,
  containerStyle,
  style,
  variant = 'default',
  size = 'medium',
  ...props
}: InputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [labelAnimation] = useState(new Animated.Value(props.value ? 1 : 0));

  const handleFocus = () => {
    setIsFocused(true);
    Animated.timing(labelAnimation, {
      toValue: 1,
      duration: DesignTokens.transitions.fast,
      useNativeDriver: false,
    }).start();
  };

  const handleBlur = () => {
    setIsFocused(false);
    if (!props.value) {
      Animated.timing(labelAnimation, {
        toValue: 0,
        duration: DesignTokens.transitions.fast,
        useNativeDriver: false,
      }).start();
    }
  };

  const inputContainerStyle = [
    styles.inputContainer,
    styles[variant],
    styles[size],
    isFocused && styles.inputContainerFocused,
    error && styles.inputContainerError,
    leftIcon && styles.inputContainerWithLeftIcon,
    rightIcon && styles.inputContainerWithRightIcon,
  ];

  const inputStyle = [
    styles.input,
    styles[`${size}Input`],
    leftIcon && styles.inputWithLeftIcon,
    rightIcon && styles.inputWithRightIcon,
    style,
  ];

  const labelStyle = [
    styles.label,
    styles[`${size}Label`],
    error && styles.errorLabel,
  ];

  return (
    <View style={[styles.container, containerStyle]}>
      {label && <Text style={labelStyle}>{label}</Text>}
      
      <View style={inputContainerStyle}>
        {leftIcon && (
          <View style={styles.leftIconContainer}>
            {leftIcon}
          </View>
        )}
        
        <TextInput
          style={inputStyle}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholderTextColor={ComponentColors.input.placeholder}
          {...props}
        />
        
        {rightIcon && (
          <TouchableOpacity
            style={styles.rightIconContainer}
            onPress={onRightIconPress}
            disabled={!onRightIconPress}
          >
            {rightIcon}
          </TouchableOpacity>
        )}
      </View>
      
      {(error || helperText) && (
        <Text style={[styles.helperText, error && styles.errorText]}>
          {error || helperText}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: DesignTokens.spacing.xl,
  },
  
  // Labels
  label: {
    fontSize: DesignTokens.typography.fontSizes.sm,
    fontWeight: DesignTokens.typography.fontWeights.semibold,
    color: Colors.light.text,
    marginBottom: DesignTokens.spacing.sm,
    letterSpacing: 0.2,
  },
  smallLabel: {
    fontSize: DesignTokens.typography.fontSizes.xs,
  },
  mediumLabel: {
    fontSize: DesignTokens.typography.fontSizes.sm,
  },
  largeLabel: {
    fontSize: DesignTokens.typography.fontSizes.base,
  },
  errorLabel: {
    color: ComponentColors.button.error,
  },
  
  // Input container
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: ComponentColors.input.background,
    borderWidth: 1,
    borderColor: ComponentColors.input.border,
    borderRadius: DesignTokens.radius.lg,
    transition: `border-color ${DesignTokens.transitions.fast}ms ease`,
  },
  
  // Variantes
  default: {
    backgroundColor: ComponentColors.input.background,
  },
  filled: {
    backgroundColor: Colors.light.surfaceVariant,
    borderColor: 'transparent',
  },
  outlined: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
  },
  
  // Tamaños
  small: {
    minHeight: 40,
    borderRadius: DesignTokens.radius.md,
  },
  medium: {
    minHeight: 48,
    borderRadius: DesignTokens.radius.lg,
  },
  large: {
    minHeight: 56,
    borderRadius: DesignTokens.radius.xl,
  },
  
  // Estados
  inputContainerFocused: {
    borderColor: ComponentColors.input.borderFocused,
    shadowColor: ComponentColors.input.borderFocused,
    ...DesignTokens.elevation.sm,
  },
  inputContainerError: {
    borderColor: ComponentColors.button.error,
    shadowColor: ComponentColors.button.error,
    ...DesignTokens.elevation.sm,
  },
  inputContainerWithLeftIcon: {
    paddingLeft: DesignTokens.spacing.md,
  },
  inputContainerWithRightIcon: {
    paddingRight: DesignTokens.spacing.md,
  },
  
  // Input text
  input: {
    flex: 1,
    paddingHorizontal: DesignTokens.spacing.lg,
    paddingVertical: DesignTokens.spacing.md,
    fontSize: DesignTokens.typography.fontSizes.base,
    color: Colors.light.text,
    fontWeight: DesignTokens.typography.fontWeights.normal,
  },
  smallInput: {
    paddingHorizontal: DesignTokens.spacing.md,
    paddingVertical: DesignTokens.spacing.sm,
    fontSize: DesignTokens.typography.fontSizes.sm,
  },
  mediumInput: {
    paddingHorizontal: DesignTokens.spacing.lg,
    paddingVertical: DesignTokens.spacing.md,
    fontSize: DesignTokens.typography.fontSizes.base,
  },
  largeInput: {
    paddingHorizontal: DesignTokens.spacing.xl,
    paddingVertical: DesignTokens.spacing.lg,
    fontSize: DesignTokens.typography.fontSizes.lg,
  },
  inputWithLeftIcon: {
    paddingLeft: DesignTokens.spacing.sm,
  },
  inputWithRightIcon: {
    paddingRight: DesignTokens.spacing.sm,
  },
  
  // Iconos
  leftIconContainer: {
    marginRight: DesignTokens.spacing.sm,
  },
  rightIconContainer: {
    marginLeft: DesignTokens.spacing.sm,
    padding: DesignTokens.spacing.xs,
    borderRadius: DesignTokens.radius.sm,
  },
  
  // Texto de ayuda
  helperText: {
    fontSize: DesignTokens.typography.fontSizes.xs,
    color: Colors.light.textSecondary,
    marginTop: DesignTokens.spacing.xs,
    fontWeight: DesignTokens.typography.fontWeights.normal,
  },
  errorText: {
    color: ComponentColors.button.error,
  },
});
