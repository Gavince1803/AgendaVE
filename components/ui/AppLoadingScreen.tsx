import { Colors, DesignTokens } from '@/constants/Colors';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

export function AppLoadingScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {/* App Logo */}
        <View style={styles.logoContainer}>
          <Text style={styles.logoText}>M</Text>
        </View>

        {/* Loading Spinner */}
        <ActivityIndicator
          size="large"
          color={Colors.light.primary}
          style={styles.spinner}
        />

        {/* Loading Text */}
        <Text style={styles.loadingText}>
          Cargando MiCita...
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.light.background,
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoContainer: {
    width: 96,
    height: 96,
    borderRadius: DesignTokens.radius['3xl'],
    backgroundColor: Colors.light.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: DesignTokens.spacing['2xl'],
    ...DesignTokens.elevation.lg,
  },
  logoText: {
    fontSize: DesignTokens.typography.fontSizes['4xl'],
    fontWeight: DesignTokens.typography.fontWeights.bold as any,
    color: Colors.light.textOnPrimary,
    letterSpacing: -1,
  },
  spinner: {
    marginVertical: DesignTokens.spacing.lg,
  },
  loadingText: {
    marginTop: DesignTokens.spacing.md,
    fontSize: DesignTokens.typography.fontSizes.base,
    color: Colors.light.textSecondary,
    fontWeight: DesignTokens.typography.fontWeights.medium as any,
  },
});
