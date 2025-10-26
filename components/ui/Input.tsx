import { Colors, ComponentColors, DesignTokens } from '@/constants/Colors';
import React, { useState } from 'react';
import {
    StyleSheet,
    Text,
    TextInput,
    TextInputProps,
    TouchableOpacity,
    View,
    StyleProp,
    ViewStyle,
    TextStyle,
} from 'react-native';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  onRightIconPress?: () => void;
  containerStyle?: StyleProp<ViewStyle>;
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

  const handleFocus = (e: Parameters<NonNullable<TextInputProps['onFocus']>>[0]) => {
    setIsFocused(true);
    if (props.onFocus) {
      props.onFocus(e);
    }
  };

  const handleBlur = (e: Parameters<NonNullable<TextInputProps['onBlur']>>[0]) => {
    setIsFocused(false);
    if (props.onBlur) {
      props.onBlur(e);
    }
  };

  const inputContainerStyle: StyleProp<ViewStyle> = [
    styles.inputContainer,
    styles[variant] as ViewStyle,
    styles[size] as ViewStyle,
    isFocused ? styles.inputContainerFocused : undefined,
    error ? styles.inputContainerError : undefined,
    leftIcon ? styles.inputContainerWithLeftIcon : undefined,
    rightIcon ? styles.inputContainerWithRightIcon : undefined,
  ];

  const inputStyle: StyleProp<TextStyle> = [
    styles.input,
    styles[`${size}Input`] as TextStyle,
    leftIcon ? styles.inputWithLeftIcon : undefined,
    rightIcon ? styles.inputWithRightIcon : undefined,
    style,
  ];

  const labelStyle: StyleProp<TextStyle> = [
    styles.label,
    styles[`${size}Label`] as TextStyle,
    error ? styles.errorLabel : undefined,
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

type InputStyles = {
  container: ViewStyle;
  label: TextStyle;
  smallLabel: TextStyle;
  mediumLabel: TextStyle;
  largeLabel: TextStyle;
  errorLabel: TextStyle;
  inputContainer: ViewStyle;
  default: ViewStyle;
  filled: ViewStyle;
  outlined: ViewStyle;
  small: ViewStyle;
  medium: ViewStyle;
  large: ViewStyle;
  inputContainerFocused: ViewStyle;
  inputContainerError: ViewStyle;
  inputContainerWithLeftIcon: ViewStyle;
  inputContainerWithRightIcon: ViewStyle;
  input: TextStyle;
  smallInput: TextStyle;
  mediumInput: TextStyle;
  largeInput: TextStyle;
  inputWithLeftIcon: TextStyle;
  inputWithRightIcon: TextStyle;
  leftIconContainer: ViewStyle;
  rightIconContainer: ViewStyle;
  helperText: TextStyle;
  errorText: TextStyle;
};

const styles = StyleSheet.create<InputStyles>({
  container: {
    marginBottom: DesignTokens.spacing.xl,
  },
  
  // Labels
  label: {
    fontSize: DesignTokens.typography.fontSizes.sm,
    fontWeight: DesignTokens.typography.fontWeights.semibold as TextStyle['fontWeight'],
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
    fontWeight: DesignTokens.typography.fontWeights.normal as TextStyle['fontWeight'],
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
    fontWeight: DesignTokens.typography.fontWeights.normal as TextStyle['fontWeight'],
  },
  errorText: {
    color: ComponentColors.button.error,
  },
});
