// 🎨 Enhanced UI Components for Modern Mobile Experience
// Beautiful, accessible, and delightful components for AgendaVE

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  StyleSheet,
  Animated,
  Platform,
  Pressable,
  Dimensions,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { Colors, DesignTokens } from '../../constants/Colors';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// ===== ENHANCED BUTTON COMPONENT =====
interface EnhancedButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  icon?: keyof typeof Ionicons.glyphMap;
  iconPosition?: 'left' | 'right';
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  style?: ViewStyle;
}

export const EnhancedButton: React.FC<EnhancedButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  icon,
  iconPosition = 'left',
  loading = false,
  disabled = false,
  fullWidth = false,
  style,
}) => {
  const [pressed, setPressed] = useState(false);
  const animatedValue = new Animated.Value(1);

  const handlePressIn = () => {
    setPressed(true);
    Animated.spring(animatedValue, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    setPressed(false);
    Animated.spring(animatedValue, {
      toValue: 1,
      friction: 4,
      useNativeDriver: true,
    }).start();
  };

  const buttonStyles = getButtonStyles(variant, size, fullWidth, disabled, pressed);
  const textStyles = getButtonTextStyles(variant, size, disabled);

  return (
    <Animated.View
      style={[
        { transform: [{ scale: animatedValue }] },
        style,
      ]}
    >
      <Pressable
        style={buttonStyles}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled || loading}
        android_ripple={{
          color: Colors.light.primary + '20',
          borderless: false,
        }}
      >
        {loading ? (
          <ActivityIndicator 
            size="small" 
            color={variant === 'primary' ? Colors.light.textOnPrimary : Colors.light.primary} 
          />
        ) : (
          <View style={styles.buttonContent}>
            {icon && iconPosition === 'left' && (
              <Ionicons
                name={icon}
                size={getIconSize(size)}
                color={getButtonIconColor(variant, disabled)}
                style={styles.buttonIconLeft}
              />
            )}
            <Text style={textStyles}>{title}</Text>
            {icon && iconPosition === 'right' && (
              <Ionicons
                name={icon}
                size={getIconSize(size)}
                color={getButtonIconColor(variant, disabled)}
                style={styles.buttonIconRight}
              />
            )}
          </View>
        )}
      </Pressable>
    </Animated.View>
  );
};

// ===== ENHANCED INPUT COMPONENT =====
interface EnhancedInputProps {
  label?: string;
  placeholder: string;
  value: string;
  onChangeText: (text: string) => void;
  icon?: keyof typeof Ionicons.glyphMap;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad';
  error?: string;
  multiline?: boolean;
  numberOfLines?: number;
  disabled?: boolean;
  style?: ViewStyle;
}

export const EnhancedInput: React.FC<EnhancedInputProps> = ({
  label,
  placeholder,
  value,
  onChangeText,
  icon,
  secureTextEntry = false,
  keyboardType = 'default',
  error,
  multiline = false,
  numberOfLines = 1,
  disabled = false,
  style,
}) => {
  const [focused, setFocused] = useState(false);
  const animatedValue = new Animated.Value(0);

  useEffect(() => {
    Animated.timing(animatedValue, {
      toValue: focused ? 1 : 0,
      duration: DesignTokens.transitions.fast,
      useNativeDriver: false,
    }).start();
  }, [focused]);

  const borderColor = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [Colors.light.border, Colors.light.primary],
  });

  return (
    <View style={[styles.inputContainer, style]}>
      {label && <Text style={styles.inputLabel}>{label}</Text>}
      
      <Animated.View
        style={[
          styles.inputWrapper,
          { borderColor },
          error && styles.inputError,
          disabled && styles.inputDisabled,
        ]}
      >
        {icon && (
          <Ionicons
            name={icon}
            size={20}
            color={focused ? Colors.light.primary : Colors.light.icon}
            style={styles.inputIcon}
          />
        )}
        
        <TextInput
          style={[
            styles.textInput,
            multiline && styles.textInputMultiline,
            icon && styles.textInputWithIcon,
          ]}
          placeholder={placeholder}
          placeholderTextColor={Colors.light.textTertiary}
          value={value}
          onChangeText={onChangeText}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          multiline={multiline}
          numberOfLines={numberOfLines}
          editable={!disabled}
          selectTextOnFocus={!disabled}
        />
      </Animated.View>
      
      {error && (
        <Text style={styles.inputErrorText}>
          <Ionicons name="alert-circle" size={14} color={Colors.light.error} />
          {' '}{error}
        </Text>
      )}
    </View>
  );
};

// ===== ENHANCED CARD COMPONENT =====
interface EnhancedCardProps {
  children: React.ReactNode;
  onPress?: () => void;
  variant?: 'default' | 'elevated' | 'outlined';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  style?: ViewStyle;
}

export const EnhancedCard: React.FC<EnhancedCardProps> = ({
  children,
  onPress,
  variant = 'default',
  padding = 'md',
  style,
}) => {
  const [pressed, setPressed] = useState(false);
  const animatedValue = new Animated.Value(1);

  const handlePressIn = () => {
    if (onPress) {
      setPressed(true);
      Animated.spring(animatedValue, {
        toValue: 0.98,
        useNativeDriver: true,
      }).start();
    }
  };

  const handlePressOut = () => {
    if (onPress) {
      setPressed(false);
      Animated.spring(animatedValue, {
        toValue: 1,
        friction: 4,
        useNativeDriver: true,
      }).start();
    }
  };

  const cardStyles = getCardStyles(variant, padding, pressed);

  const CardContent = (
    <Animated.View
      style={[
        cardStyles,
        { transform: onPress ? [{ scale: animatedValue }] : [] },
        style,
      ]}
    >
      {children}
    </Animated.View>
  );

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        android_ripple={{
          color: Colors.light.primary + '10',
          borderless: false,
        }}
      >
        {CardContent}
      </Pressable>
    );
  }

  return CardContent;
};

// ===== FLOATING ACTION BUTTON =====
interface FloatingActionButtonProps {
  onPress: () => void;
  icon: keyof typeof Ionicons.glyphMap;
  size?: 'sm' | 'md' | 'lg';
  position?: 'bottom-right' | 'bottom-left' | 'bottom-center';
  style?: ViewStyle;
}

export const FloatingActionButton: React.FC<FloatingActionButtonProps> = ({
  onPress,
  icon,
  size = 'md',
  position = 'bottom-right',
  style,
}) => {
  const [pressed, setPressed] = useState(false);
  const animatedValue = new Animated.Value(1);

  const handlePressIn = () => {
    setPressed(true);
    Animated.spring(animatedValue, {
      toValue: 0.9,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    setPressed(false);
    Animated.spring(animatedValue, {
      toValue: 1,
      friction: 4,
      useNativeDriver: true,
    }).start();
  };

  const fabStyles = getFabStyles(size, position);
  const iconSize = size === 'sm' ? 20 : size === 'md' ? 24 : 28;

  return (
    <Animated.View
      style={[
        fabStyles,
        { transform: [{ scale: animatedValue }] },
        style,
      ]}
    >
      <Pressable
        style={styles.fabPressable}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        android_ripple={{
          color: Colors.light.textOnPrimary + '30',
          borderless: true,
        }}
      >
        <Ionicons
          name={icon}
          size={iconSize}
          color={Colors.light.textOnPrimary}
        />
      </Pressable>
    </Animated.View>
  );
};

// ===== LOADING OVERLAY =====
interface LoadingOverlayProps {
  visible: boolean;
  message?: string;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  visible,
  message = 'Cargando...',
}) => {
  const [fadeAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    if (visible) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: DesignTokens.transitions.fast,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: DesignTokens.transitions.fast,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <Animated.View
      style={[styles.loadingOverlay, { opacity: fadeAnim }]}
      pointerEvents={visible ? 'auto' : 'none'}
    >
      <BlurView intensity={80} tint="dark" style={styles.blurOverlay}>
        <View style={styles.loadingContent}>
          <ActivityIndicator size="large" color={Colors.light.primary} />
          <Text style={styles.loadingText}>{message}</Text>
        </View>
      </BlurView>
    </Animated.View>
  );
};

// ===== STYLE HELPER FUNCTIONS =====
const getButtonStyles = (
  variant: string,
  size: string,
  fullWidth: boolean,
  disabled: boolean,
  pressed: boolean
): ViewStyle => {
  const baseStyle: ViewStyle = {
    borderRadius: DesignTokens.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  };

  // Size
  const sizeStyles = {
    sm: { paddingVertical: DesignTokens.spacing.sm, paddingHorizontal: DesignTokens.spacing.md },
    md: { paddingVertical: DesignTokens.spacing.md, paddingHorizontal: DesignTokens.spacing.lg },
    lg: { paddingVertical: DesignTokens.spacing.lg, paddingHorizontal: DesignTokens.spacing.xl },
  };

  // Variant
  const variantStyles = {
    primary: {
      backgroundColor: disabled ? Colors.light.primaryLight + '60' : Colors.light.primary,
    },
    secondary: {
      backgroundColor: disabled ? Colors.light.surfaceVariant : Colors.light.surface,
      borderWidth: 1,
      borderColor: disabled ? Colors.light.border : Colors.light.borderMedium,
    },
    outline: {
      backgroundColor: 'transparent',
      borderWidth: 1,
      borderColor: disabled ? Colors.light.border : Colors.light.primary,
    },
    ghost: {
      backgroundColor: pressed ? Colors.light.primaryBg : 'transparent',
    },
    danger: {
      backgroundColor: disabled ? Colors.light.errorLight + '60' : Colors.light.error,
    },
  };

  return StyleSheet.flatten([
    baseStyle,
    sizeStyles[size],
    variantStyles[variant],
    fullWidth && { width: '100%' },
    disabled && { opacity: 0.6 },
  ]);
};

const getButtonTextStyles = (variant: string, size: string, disabled: boolean): TextStyle => {
  const baseStyle: TextStyle = {
    fontWeight: DesignTokens.typography.fontWeights.semibold,
  };

  const sizeStyles = {
    sm: { fontSize: DesignTokens.typography.fontSizes.sm },
    md: { fontSize: DesignTokens.typography.fontSizes.base },
    lg: { fontSize: DesignTokens.typography.fontSizes.lg },
  };

  const variantStyles = {
    primary: { color: Colors.light.textOnPrimary },
    secondary: { color: Colors.light.text },
    outline: { color: disabled ? Colors.light.textTertiary : Colors.light.primary },
    ghost: { color: disabled ? Colors.light.textTertiary : Colors.light.primary },
    danger: { color: Colors.light.textOnPrimary },
  };

  return StyleSheet.flatten([
    baseStyle,
    sizeStyles[size],
    variantStyles[variant],
  ]);
};

const getButtonIconColor = (variant: string, disabled: boolean): string => {
  if (disabled) return Colors.light.textTertiary;

  const colorMap = {
    primary: Colors.light.textOnPrimary,
    secondary: Colors.light.text,
    outline: Colors.light.primary,
    ghost: Colors.light.primary,
    danger: Colors.light.textOnPrimary,
  };

  return colorMap[variant] || Colors.light.primary;
};

const getIconSize = (size: string): number => {
  const sizeMap = {
    sm: 16,
    md: 20,
    lg: 24,
  };
  return sizeMap[size] || 20;
};

const getCardStyles = (variant: string, padding: string, pressed: boolean): ViewStyle => {
  const baseStyle: ViewStyle = {
    backgroundColor: Colors.light.surface,
    borderRadius: DesignTokens.radius.lg,
  };

  const paddingStyles = {
    none: {},
    sm: { padding: DesignTokens.spacing.md },
    md: { padding: DesignTokens.spacing.lg },
    lg: { padding: DesignTokens.spacing.xl },
  };

  const variantStyles = {
    default: {},
    elevated: {
      ...DesignTokens.elevation.md,
      shadowColor: Colors.light.shadow,
    },
    outlined: {
      borderWidth: 1,
      borderColor: Colors.light.border,
    },
  };

  return StyleSheet.flatten([
    baseStyle,
    paddingStyles[padding],
    variantStyles[variant],
    pressed && { opacity: 0.8 },
  ]);
};

const getFabStyles = (size: string, position: string): ViewStyle => {
  const sizeStyles = {
    sm: { width: 48, height: 48 },
    md: { width: 56, height: 56 },
    lg: { width: 64, height: 64 },
  };

  const positionStyles = {
    'bottom-right': { bottom: DesignTokens.spacing['4xl'], right: DesignTokens.spacing.lg },
    'bottom-left': { bottom: DesignTokens.spacing['4xl'], left: DesignTokens.spacing.lg },
    'bottom-center': { bottom: DesignTokens.spacing['4xl'], alignSelf: 'center' },
  };

  return StyleSheet.flatten([
    {
      position: 'absolute',
      backgroundColor: Colors.light.primary,
      borderRadius: 100,
      ...DesignTokens.elevation.lg,
      shadowColor: Colors.light.shadowColored,
    },
    sizeStyles[size],
    positionStyles[position],
  ]);
};

// ===== STYLES =====
const styles = StyleSheet.create({
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonIconLeft: {
    marginRight: DesignTokens.spacing.sm,
  },
  buttonIconRight: {
    marginLeft: DesignTokens.spacing.sm,
  },
  inputContainer: {
    marginBottom: DesignTokens.spacing.md,
  },
  inputLabel: {
    fontSize: DesignTokens.typography.fontSizes.sm,
    fontWeight: DesignTokens.typography.fontWeights.medium,
    color: Colors.light.text,
    marginBottom: DesignTokens.spacing.xs,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: DesignTokens.radius.md,
    backgroundColor: Colors.light.surface,
    minHeight: 48,
  },
  inputError: {
    borderColor: Colors.light.error,
  },
  inputDisabled: {
    backgroundColor: Colors.light.surfaceVariant,
    opacity: 0.6,
  },
  inputIcon: {
    marginLeft: DesignTokens.spacing.md,
  },
  textInput: {
    flex: 1,
    paddingHorizontal: DesignTokens.spacing.md,
    paddingVertical: Platform.OS === 'ios' ? DesignTokens.spacing.md : DesignTokens.spacing.sm,
    fontSize: DesignTokens.typography.fontSizes.base,
    color: Colors.light.text,
  },
  textInputMultiline: {
    paddingTop: DesignTokens.spacing.md,
    textAlignVertical: 'top',
  },
  textInputWithIcon: {
    paddingLeft: DesignTokens.spacing.xs,
  },
  inputErrorText: {
    fontSize: DesignTokens.typography.fontSizes.xs,
    color: Colors.light.error,
    marginTop: DesignTokens.spacing.xs,
    flexDirection: 'row',
    alignItems: 'center',
  },
  fabPressable: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 100,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9999,
  },
  blurOverlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingContent: {
    alignItems: 'center',
    backgroundColor: Colors.light.surface + 'CC',
    padding: DesignTokens.spacing['2xl'],
    borderRadius: DesignTokens.radius.xl,
    ...DesignTokens.elevation.lg,
  },
  loadingText: {
    marginTop: DesignTokens.spacing.md,
    fontSize: DesignTokens.typography.fontSizes.base,
    color: Colors.light.text,
    fontWeight: DesignTokens.typography.fontWeights.medium,
  },
});

export default {
  EnhancedButton,
  EnhancedInput,
  EnhancedCard,
  FloatingActionButton,
  LoadingOverlay,
};