import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Button } from '@/components/ui/Button';
import { ScrollableInputView } from '@/components/ui/ScrollableInputView';
import { SimpleInput } from '@/components/ui/SimpleInput';
import { Colors, ComponentColors, DesignTokens } from '@/constants/Colors';
import { useAuth } from '@/contexts/AuthContext';
import { Image } from 'expo-image';
import { Href, Link, router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import {
  Alert,
  Platform,
  StyleSheet,
  View
} from 'react-native';

export default function LoginScreen() {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { returnUrl } = useLocalSearchParams();
  const { signInWithIdentifier } = useAuth();

  const handleLogin = async () => {
    if (!identifier || !password) {
      Alert.alert('Error', 'Por favor completa todos los campos');
      return;
    }

    setLoading(true);
    try {
      // Usar el nuevo método unificado que soporta Email, Cédula y Teléfono
      await signInWithIdentifier(identifier, password);

      // Check for returnUrl
      // Check for returnUrl
      if (returnUrl) {
        router.replace(returnUrl as Href);
      } else {
        router.replace('/(tabs)');
      }
    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error('Error al iniciar sesión');
      let errorMessage = err.message || 'Error al iniciar sesión';

      if (err.message?.includes('Invalid login credentials')) {
        errorMessage = 'Credenciales inválidas. Verifica tus datos y contraseña.';
      } else if (err.message?.includes('Email not confirmed')) {
        errorMessage = 'Tu email no ha sido confirmado. Por favor revisa tu bandeja de entrada.';
      } else if (err.message?.includes('Usuario no encontrado')) {
        errorMessage = 'No encontramos una cuenta con esos datos. Verifica tu Cédula, Teléfono o Email.';
      }

      Alert.alert('Error al iniciar sesión', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollableInputView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
      >
        <ThemedView style={styles.content}>
          {/* Header con logo */}
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <View style={styles.logo}>
                <Image
                  source={require('@/assets/images/icon-final.png')}
                  style={styles.logoImage}
                  contentFit="contain"
                />
              </View>
            </View>
            <ThemedText type="title" style={styles.title}>
              Bienvenido
            </ThemedText>
            <ThemedText style={styles.subtitle}>
              Ingresa para continuar con tu reserva
            </ThemedText>
          </View>

          {/* Formulario Limpio */}
          <View style={styles.formContainer}>
            <SimpleInput
              label="Usuario"
              value={identifier}
              onChangeText={setIdentifier}
              placeholder="Cédula, Teléfono o Email"
              placeholderTextColor={ComponentColors.input.placeholder}
              keyboardType="default"
              autoCapitalize="none"
              autoCorrect={false}
              containerStyle={{ marginBottom: 20 }}
            />

            <SimpleInput
              label="Contraseña"
              value={password}
              onChangeText={setPassword}
              placeholder="Ingresa tu contraseña"
              placeholderTextColor={ComponentColors.input.placeholder}
              secureTextEntry
              autoCapitalize="none"
              containerStyle={{ marginBottom: 12 }}
            />

            <Button
              title={loading ? 'Iniciando...' : 'Entrar'}
              onPress={handleLogin}
              loading={loading}
              disabled={loading}
              fullWidth
              size="large"
              style={styles.loginButton}
              variant="primary"
            />

            <View style={styles.footer}>
              <ThemedText style={styles.footerText}>
                ¿Primera vez aquí?{' '}
              </ThemedText>
              <Link href="/(auth)/register" asChild>
                <Button
                  title="Crear cuenta"
                  variant="ghost"
                  size="small"
                />
              </Link>
            </View>

            {/* Secondary Actions (Hidden/Subtle) */}
            <View style={styles.secondaryActions}>
              <Link href="/(auth)/register-owner" asChild>
                <Button
                  title="Soy un negocio"
                  variant="ghost"
                  size="small"
                />
              </Link>
            </View>
          </View>
        </ThemedView>
      </ScrollableInputView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background, // Clean background
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: DesignTokens.spacing.xl,
    justifyContent: 'center', // Center content vertically
  },
  content: {
    flex: 1,
    paddingHorizontal: DesignTokens.spacing['2xl'], // More horizontal breathing room
    paddingTop: Platform.OS === 'ios' ? 0 : 20,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: DesignTokens.spacing['3xl'],
  },
  logoContainer: {
    marginBottom: DesignTokens.spacing.lg,
    alignItems: 'center',
  },
  logo: {
    width: 140,
    height: 140,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoImage: {
    width: '100%',
    height: '100%',
  },
  logoText: {
    fontSize: 40,
    fontWeight: 'bold',
    color: Colors.light.textOnPrimary,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: Colors.light.text,
    marginBottom: 8,
    textAlign: 'center',
    letterSpacing: -1,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.light.textSecondary,
    textAlign: 'center',
    opacity: 0.8,
  },
  // Form styles - No Card
  formContainer: {
    width: '100%',
  },
  loginButton: {
    marginTop: DesignTokens.spacing.lg,
    marginBottom: DesignTokens.spacing.xl,
    height: 56, // Taller, easier to tap
    borderRadius: 16,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: DesignTokens.spacing.xl,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.light.borderLight,
  },
  dividerText: {
    marginHorizontal: DesignTokens.spacing.md,
    color: Colors.light.textTertiary,
    fontSize: 14,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 15,
    color: Colors.light.textSecondary,
  },
  secondaryActions: {
    marginTop: 40,
    alignItems: 'center',
    gap: 16,
  },
});
