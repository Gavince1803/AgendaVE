// 🎭 Enhanced Loading States & UX Components
// Professional loading experiences that keep users engaged

import React from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Animated,
  Dimensions,
  RefreshControl,
} from 'react-native';
import { Colors, DesignTokens } from '@/constants/Colors';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Button } from '@/components/ui/Button';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// 🔄 Global Loading Component
interface LoadingSpinnerProps {
  size?: 'small' | 'large';
  color?: string;
  text?: string;
  overlay?: boolean;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'large',
  color = Colors.light.primary,
  text,
  overlay = false,
}) => {
  if (overlay) {
    return (
      <View style={styles.loadingOverlay}>
        <View style={styles.loadingCard}>
          <ActivityIndicator size={size} color={color} />
          {text && <ThemedText style={styles.loadingText}>{text}</ThemedText>}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size={size} color={color} />
      {text && <ThemedText style={styles.loadingText}>{text}</ThemedText>}
    </View>
  );
};

// 💀 Skeleton Loading Components
export const SkeletonBox: React.FC<{
  width: number | string;
  height: number;
  borderRadius?: number;
  style?: any;
}> = ({ width, height, borderRadius = 8, style }) => {
  const shimmerValue = new Animated.Value(0);

  React.useEffect(() => {
    const shimmerAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerValue, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    shimmerAnimation.start();
    return () => shimmerAnimation.stop();
  }, []);

  const opacity = shimmerValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <Animated.View
      style={[
        styles.skeleton,
        {
          width,
          height,
          borderRadius,
          opacity,
        },
        style,
      ]}
    />
  );
};

// 📋 Provider List Skeleton
export const ProviderListSkeleton: React.FC = () => (
  <View style={styles.skeletonContainer}>
    {[...Array(3)].map((_, index) => (
      <View key={index} style={styles.providerSkeletonCard}>
        <SkeletonBox width={60} height={60} borderRadius={30} />
        <View style={styles.providerSkeletonContent}>
          <SkeletonBox width="70%" height={20} borderRadius={4} />
          <SkeletonBox width="50%" height={16} borderRadius={4} style={{ marginTop: 8 }} />
          <View style={styles.providerSkeletonRow}>
            <SkeletonBox width={80} height={16} borderRadius={4} />
            <SkeletonBox width={100} height={16} borderRadius={4} />
          </View>
        </View>
      </View>
    ))}
  </View>
);

// 🗓️ Appointment List Skeleton
export const AppointmentListSkeleton: React.FC = () => (
  <View style={styles.skeletonContainer}>
    {[...Array(4)].map((_, index) => (
      <View key={index} style={styles.appointmentSkeletonCard}>
        <View style={styles.appointmentSkeletonHeader}>
          <SkeletonBox width="60%" height={18} borderRadius={4} />
          <SkeletonBox width={80} height={24} borderRadius={12} />
        </View>
        <SkeletonBox width="40%" height={16} borderRadius={4} style={{ marginTop: 8 }} />
        <SkeletonBox width="80%" height={16} borderRadius={4} style={{ marginTop: 6 }} />
        <View style={styles.appointmentSkeletonFooter}>
          <SkeletonBox width={60} height={20} borderRadius={4} />
          <SkeletonBox width={80} height={20} borderRadius={4} />
        </View>
      </View>
    ))}
  </View>
);

// 🏢 Service List Skeleton
export const ServiceListSkeleton: React.FC = () => (
  <View style={styles.skeletonContainer}>
    {[...Array(3)].map((_, index) => (
      <View key={index} style={styles.serviceSkeletonCard}>
        <View style={styles.serviceSkeletonContent}>
          <SkeletonBox width="80%" height={20} borderRadius={4} />
          <SkeletonBox width="100%" height={16} borderRadius={4} style={{ marginTop: 8 }} />
          <SkeletonBox width="60%" height={16} borderRadius={4} style={{ marginTop: 6 }} />
          <View style={styles.serviceSkeletonFooter}>
            <SkeletonBox width={60} height={16} borderRadius={4} />
            <SkeletonBox width={80} height={32} borderRadius={16} />
          </View>
        </View>
      </View>
    ))}
  </View>
);

// ❌ Error State Component
interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  retryText?: string;
  icon?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Algo salió mal',
  message = 'No se pudo cargar la información. Intenta de nuevo.',
  onRetry,
  retryText = 'Reintentar',
  icon = 'exclamationmark.triangle',
}) => (
  <View style={styles.errorContainer}>
    <IconSymbol name={icon} size={64} color={Colors.light.textSecondary} />
    <ThemedText style={styles.errorTitle}>{title}</ThemedText>
    <ThemedText style={styles.errorMessage}>{message}</ThemedText>
    {onRetry && (
      <Button
        title={retryText}
        onPress={onRetry}
        variant="outline"
        style={styles.retryButton}
        icon={<IconSymbol name="arrow.clockwise" size={16} color={Colors.light.primary} />}
      />
    )}
  </View>
);

// 📭 Empty State Component
interface EmptyStateProps {
  title: string;
  message: string;
  icon: string;
  actionText?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  message,
  icon,
  actionText,
  onAction,
}) => (
  <View style={styles.emptyContainer}>
    <IconSymbol name={icon} size={80} color={Colors.light.textSecondary} />
    <ThemedText style={styles.emptyTitle}>{title}</ThemedText>
    <ThemedText style={styles.emptyMessage}>{message}</ThemedText>
    {actionText && onAction && (
      <Button
        title={actionText}
        onPress={onAction}
        style={styles.emptyButton}
      />
    )}
  </View>
);

// 🔄 Enhanced Refresh Control
export const createRefreshControl = (
  refreshing: boolean,
  onRefresh: () => void,
  tintColor: string = Colors.light.primary
) => (
  <RefreshControl
    refreshing={refreshing}
    onRefresh={onRefresh}
    tintColor={tintColor}
    colors={[tintColor]}
    progressBackgroundColor={Colors.light.surface}
    title="Actualizando..."
    titleColor={Colors.light.textSecondary}
  />
);

// 🏠 Screen Loading Wrapper
interface ScreenLoadingProps {
  loading: boolean;
  skeleton?: React.ReactNode;
  error?: string;
  onRetry?: () => void;
  children: React.ReactNode;
}

export const ScreenLoading: React.FC<ScreenLoadingProps> = ({
  loading,
  skeleton,
  error,
  onRetry,
  children,
}) => {
  if (loading) {
    return skeleton ? (
      <>{skeleton}</>
    ) : (
      <LoadingSpinner text="Cargando..." />
    );
  }

  if (error) {
    return <ErrorState message={error} onRetry={onRetry} />;
  }

  return <>{children}</>;
};

const styles = StyleSheet.create({
  // Loading Spinner Styles
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  loadingCard: {
    backgroundColor: Colors.light.surface,
    padding: DesignTokens.spacing.xl,
    borderRadius: DesignTokens.radius.lg,
    alignItems: 'center',
    minWidth: 120,
    elevation: 8,
    shadowColor: Colors.light.text,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: DesignTokens.spacing.xl,
  },
  loadingText: {
    marginTop: DesignTokens.spacing.md,
    fontSize: DesignTokens.typography.fontSizes.base,
    color: Colors.light.textSecondary,
    textAlign: 'center',
  },

  // Skeleton Styles
  skeleton: {
    backgroundColor: Colors.light.border,
  },
  skeletonContainer: {
    padding: 16,
  },

  // Provider Skeleton
  providerSkeletonCard: {
    flexDirection: 'row',
    padding: 16,
    marginBottom: DesignTokens.spacing.md,
    backgroundColor: Colors.light.surface,
    borderRadius: DesignTokens.radius.lg,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  providerSkeletonContent: {
    flex: 1,
    marginLeft: DesignTokens.spacing.md,
    justifyContent: 'center',
  },
  providerSkeletonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },

  // Appointment Skeleton
  appointmentSkeletonCard: {
    padding: 16,
    marginBottom: DesignTokens.spacing.md,
    backgroundColor: Colors.light.surface,
    borderRadius: DesignTokens.radius.lg,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  appointmentSkeletonHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  appointmentSkeletonFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
  },

  // Service Skeleton
  serviceSkeletonCard: {
    padding: 16,
    marginBottom: DesignTokens.spacing.md,
    backgroundColor: Colors.light.surface,
    borderRadius: DesignTokens.radius.lg,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  serviceSkeletonContent: {
    flex: 1,
  },
  serviceSkeletonFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
  },

  // Error State Styles
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: DesignTokens.spacing['2xl'],
  },
  errorTitle: {
    fontSize: DesignTokens.typography.fontSizes.xl,
    fontWeight: DesignTokens.typography.fontWeights.bold as any,
    color: Colors.light.text,
    marginTop: 16,
    marginBottom: DesignTokens.spacing.sm,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: DesignTokens.typography.fontSizes.base,
    color: Colors.light.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: DesignTokens.spacing.xl,
  },
  retryButton: {
    minWidth: 120,
  },

  // Empty State Styles
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: DesignTokens.spacing['2xl'],
  },
  emptyTitle: {
    fontSize: DesignTokens.typography.fontSizes.xl,
    fontWeight: DesignTokens.typography.fontWeights.bold as any,
    color: Colors.light.text,
    marginTop: 16,
    marginBottom: DesignTokens.spacing.sm,
    textAlign: 'center',
  },
  emptyMessage: {
    fontSize: DesignTokens.typography.fontSizes.base,
    color: Colors.light.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: DesignTokens.spacing.xl,
  },
  emptyButton: {
    minWidth: 140,
  },
});