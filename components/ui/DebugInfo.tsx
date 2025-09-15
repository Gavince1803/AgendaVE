import { Colors, DesignTokens } from '@/constants/Colors';
import React from 'react';
import {
    ScrollView,
    StyleSheet,
    Text,
    View,
    ViewStyle,
} from 'react-native';

interface DebugInfoProps {
  user: any;
  style?: ViewStyle;
}

export function DebugInfo({ user, style }: DebugInfoProps) {
  if (__DEV__) {
    return (
      <View style={[styles.container, style]}>
        <Text style={styles.title}>🐛 Debug Info</Text>
        <ScrollView style={styles.scrollContainer}>
          <Text style={styles.label}>Usuario:</Text>
          <Text style={styles.value}>{JSON.stringify(user, null, 2)}</Text>
          
          <Text style={styles.label}>Supabase URL:</Text>
          <Text style={styles.value}>{process.env.EXPO_PUBLIC_SUPABASE_URL || 'No configurado'}</Text>
          
          <Text style={styles.label}>Supabase Key:</Text>
          <Text style={styles.value}>
            {process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ? 
              `${process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY.substring(0, 20)}...` : 
              'No configurado'
            }
          </Text>
        </ScrollView>
      </View>
    );
  }
  
  return null;
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.light.surfaceVariant,
    borderRadius: DesignTokens.radius.lg,
    padding: DesignTokens.spacing.lg,
    margin: DesignTokens.spacing.lg,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  title: {
    fontSize: DesignTokens.typography.fontSizes.lg,
    fontWeight: DesignTokens.typography.fontWeights.bold as any,
    color: Colors.light.text,
    marginBottom: DesignTokens.spacing.md,
  },
  scrollContainer: {
    maxHeight: 200,
  },
  label: {
    fontSize: DesignTokens.typography.fontSizes.sm,
    fontWeight: DesignTokens.typography.fontWeights.semibold as any,
    color: Colors.light.textSecondary,
    marginTop: DesignTokens.spacing.sm,
    marginBottom: DesignTokens.spacing.xs,
  },
  value: {
    fontSize: DesignTokens.typography.fontSizes.xs,
    color: Colors.light.text,
    fontFamily: 'monospace',
    backgroundColor: Colors.light.background,
    padding: DesignTokens.spacing.sm,
    borderRadius: DesignTokens.radius.sm,
    marginBottom: DesignTokens.spacing.sm,
  },
});
