import { Colors, DesignTokens } from '@/constants/Colors';
import React from 'react';
import {
    StyleSheet,
    Text,
    View,
    ViewStyle,
} from 'react-native';
import { IconSymbol } from './IconSymbol';

interface EmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
  style?: ViewStyle;
}

export function EmptyState({
  icon = 'questionmark.circle',
  title,
  description,
  action,
  style,
}: EmptyStateProps) {
  return (
    <View style={[styles.container, style]}>
      <View style={styles.iconContainer}>
        <IconSymbol 
          name={icon} 
          size={64} 
          color={Colors.light.iconSecondary} 
        />
      </View>
      
      <Text style={styles.title}>{title}</Text>
      
      {description && (
        <Text style={styles.description}>{description}</Text>
      )}
      
      {action && (
        <View style={styles.actionContainer}>
          {action}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: DesignTokens.spacing['3xl'],
    paddingVertical: DesignTokens.spacing['5xl'],
  },
  iconContainer: {
    marginBottom: DesignTokens.spacing['2xl'],
  },
  title: {
    fontSize: DesignTokens.typography.fontSizes.xl,
    fontWeight: DesignTokens.typography.fontWeights.semibold as any,
    color: Colors.light.text,
    textAlign: 'center',
    marginBottom: DesignTokens.spacing.md,
    letterSpacing: -0.2,
  },
  description: {
    fontSize: DesignTokens.typography.fontSizes.base,
    color: Colors.light.textSecondary,
    textAlign: 'center',
    lineHeight: DesignTokens.typography.lineHeights.relaxed * DesignTokens.typography.fontSizes.base,
    marginBottom: DesignTokens.spacing['2xl'],
  },
  actionContainer: {
    marginTop: DesignTokens.spacing.lg,
  },
});
