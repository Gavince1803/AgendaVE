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
  ScrollView,
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

// 🧑‍🎨 Provider Profile Skeleton
export const ProviderProfileSkeleton: React.FC = () => (
  <View style={styles.skeletonContainer}>
    <SkeletonBox width="100%" height={200} borderRadius={24} style={styles.providerHeroSkeleton} />
    <View style={styles.providerProfileCard}>
      <SkeletonBox width="60%" height={28} borderRadius={8} />
      <SkeletonBox width="40%" height={18} borderRadius={8} style={{ marginTop: 12 }} />
      <SkeletonBox width="80%" height={16} borderRadius={8} style={{ marginTop: 8 }} />
      <View style={styles.providerActionsRow}>
        {[...Array(3)].map((_, index) => (
          <SkeletonBox key={index} width={100} height={44} borderRadius={24} />
        ))}
      </View>
      {[...Array(2)].map((_, index) => (
        <SkeletonBox key={index} width="100%" height={80} borderRadius={16} style={{ marginTop: 16 }} />
      ))}
    </View>
  </View>
);

// ⭐ Review List Skeleton
export const ReviewListSkeleton: React.FC = () => (
  <View style={styles.skeletonContainer}>
    {[...Array(3)].map((_, index) => (
      <View key={index} style={styles.reviewSkeletonCard}>
        <View style={styles.reviewSkeletonHeader}>
          <SkeletonBox width={48} height={48} borderRadius={24} />
          <View style={styles.reviewSkeletonInfo}>
            <SkeletonBox width={120} height={18} borderRadius={6} />
            <SkeletonBox width={80} height={14} borderRadius={6} style={{ marginTop: 6 }} />
          </View>
          <SkeletonBox width={80} height={20} borderRadius={10} />
        </View>
        <SkeletonBox width="100%" height={16} borderRadius={6} />
        <SkeletonBox width="85%" height={16} borderRadius={6} style={{ marginTop: 8 }} />
        <SkeletonBox width="70%" height={16} borderRadius={6} style={{ marginTop: 8 }} />
      </View>
    ))}
  </View>
);

// 📅 Calendar Skeleton
export const CalendarSkeleton: React.FC = () => (
  <View style={styles.calendarSkeleton}>
    <SkeletonBox width="60%" height={24} borderRadius={12} />
    <View style={styles.calendarSkeletonRow}>
      {[...Array(5)].map((_, index) => (
        <SkeletonBox key={index} width={60} height={52} borderRadius={16} />
      ))}
    </View>
  </View>
);

// ⏱️ Time Slots Skeleton
export const TimeSlotsSkeleton: React.FC = () => (
  <View style={styles.timeSlotsSkeleton}>
    <SkeletonBox width="40%" height={20} borderRadius={10} />
    <View style={styles.timeSlotsSkeletonGrid}>
      {[...Array(8)].map((_, index) => (
        <SkeletonBox key={index} width="30%" height={40} borderRadius={12} />
      ))}
    </View>
  </View>
);

// 👥 Employee Carousel Skeleton
export const EmployeeCarouselSkeleton: React.FC = () => (
  <View style={styles.employeeSkeletonSection}>
    <SkeletonBox width="50%" height={22} borderRadius={8} />
    <SkeletonBox width="60%" height={16} borderRadius={8} style={{ marginTop: 8 }} />
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.employeeSkeletonRow}
    >
      {[...Array(3)].map((_, index) => (
        <View key={index} style={styles.employeeSkeletonCard}>
          <SkeletonBox width={80} height={80} borderRadius={40} />
          <SkeletonBox width="90%" height={18} borderRadius={8} style={{ marginTop: 12 }} />
          <SkeletonBox width="70%" height={14} borderRadius={8} style={{ marginTop: 6 }} />
          <SkeletonBox width="100%" height={36} borderRadius={12} style={{ marginTop: 12 }} />
        </View>
      ))}
    </ScrollView>
  </View>
);

// 🖼️ Media Gallery Skeleton
export const MediaGallerySkeleton: React.FC = () => (
  <View style={styles.gallerySkeletonSection}>
    <SkeletonBox width="40%" height={22} borderRadius={10} />
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.gallerySkeletonRow}
    >
      {[...Array(4)].map((_, index) => (
        <SkeletonBox key={index} width={180} height={140} borderRadius={20} />
      ))}
    </ScrollView>
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
  providerHeroSkeleton: {
    marginBottom: DesignTokens.spacing.lg,
  },
  providerProfileCard: {
    backgroundColor: Colors.light.surface,
    borderRadius: DesignTokens.radius['2xl'],
    padding: DesignTokens.spacing.xl,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  providerActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: DesignTokens.spacing.lg,
    gap: DesignTokens.spacing.sm,
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

  // Review Skeleton
  reviewSkeletonCard: {
    padding: DesignTokens.spacing.lg,
    marginBottom: DesignTokens.spacing.md,
    backgroundColor: Colors.light.surface,
    borderRadius: DesignTokens.radius.lg,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  reviewSkeletonHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: DesignTokens.spacing.md,
    gap: DesignTokens.spacing.md,
  },
  reviewSkeletonInfo: {
    flex: 1,
  },

  // Calendar Skeleton
  calendarSkeleton: {
    paddingHorizontal: DesignTokens.spacing.lg,
    paddingVertical: DesignTokens.spacing.md,
    gap: DesignTokens.spacing.md,
  },
  calendarSkeletonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  // Time Slots Skeleton
  timeSlotsSkeleton: {
    paddingHorizontal: DesignTokens.spacing.lg,
    paddingVertical: DesignTokens.spacing.md,
    gap: DesignTokens.spacing.md,
  },
  timeSlotsSkeletonGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: DesignTokens.spacing.sm,
    justifyContent: 'space-between',
  },
  employeeSkeletonSection: {
    paddingHorizontal: DesignTokens.spacing['2xl'],
    paddingVertical: DesignTokens.spacing.lg,
    gap: DesignTokens.spacing.sm,
  },
  employeeSkeletonRow: {
    gap: DesignTokens.spacing.lg,
    paddingVertical: DesignTokens.spacing.sm,
  },
  employeeSkeletonCard: {
    width: 160,
    padding: DesignTokens.spacing.lg,
    borderRadius: DesignTokens.radius['2xl'],
    backgroundColor: Colors.light.surface,
    borderWidth: 1,
    borderColor: Colors.light.border,
    alignItems: 'center',
  },
  gallerySkeletonSection: {
    paddingHorizontal: DesignTokens.spacing.lg,
    paddingBottom: DesignTokens.spacing.md,
    gap: DesignTokens.spacing.sm,
  },
  gallerySkeletonRow: {
    gap: DesignTokens.spacing.md,
    paddingVertical: DesignTokens.spacing.sm,
    paddingRight: DesignTokens.spacing.lg,
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
