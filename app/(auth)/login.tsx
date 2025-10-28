import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ScrollableInputView } from '@/components/ui/ScrollableInputView';
import { SimpleInput } from '@/components/ui/SimpleInput';
import { Colors, DesignTokens } from '@/constants/Colors';
import { useAuth } from '@/contexts/AuthContext';
import { Link, router, Href } from 'expo-router';
import React, { useState } from 'react';
import {
    Alert,
    Platform,
    StyleSheet,
    View
} from 'react-native';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Por favor completa todos los campos');
      return;
    }

    setLoading(true);
    try {
      await signIn(email, password);
      router.replace('/(tabs)');
    } catch (error: any) {
      // Mejorar el mensaje de error para casos específicos
      let errorMessage = error.message || 'Error al iniciar sesión';
      
      if (error.message?.includes('Invalid login credentials')) {
        errorMessage = 'Credenciales inválidas. Verifica tu email y contraseña.\n\nSi acabas de registrarte, asegúrate de confirmar tu email haciendo clic en el enlace que te enviamos.';
      } else if (error.message?.includes('Email not confirmed')) {
        errorMessage = 'Tu email no ha sido confirmado. Por favor revisa tu bandeja de entrada y haz clic en el enlace de confirmación.';
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
                <ThemedText style={styles.logoText}>A</ThemedText>
              </View>
            </View>
            <ThemedText type="title" style={styles.title}>
              AgendaVE
            </ThemedText>
            <ThemedText style={styles.subtitle}>
              Reserva tus servicios favoritos en Venezuela
            </ThemedText>
          </View>

          {/* Formulario en card */}
          <Card variant="elevated" style={styles.formCard}>
            <ThemedText style={styles.formTitle}>
              Iniciar Sesión
            </ThemedText>
            
            <SimpleInput
              label="Email"
              value={email}
              onChangeText={setEmail}
              placeholder="tu@email.com"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />

            <SimpleInput
              label="Contraseña"
              value={password}
              onChangeText={setPassword}
              placeholder="Tu contraseña"
              secureTextEntry
              autoCapitalize="none"
            />

            <Button
              title={loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
              onPress={handleLogin}
              loading={loading}
              disabled={loading}
              fullWidth
              size="large"
              style={styles.loginButton}
            />

            {/* Nota sobre confirmación de email */}
            <View style={styles.emailNote}>
              <ThemedText style={styles.emailNoteText}>
                💡 Si acabas de registrarte, revisa tu email para confirmar tu cuenta antes de iniciar sesión.
              </ThemedText>
            </View>

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <ThemedText style={styles.dividerText}>o</ThemedText>
              <View style={styles.dividerLine} />
            </View>

            <View style={styles.footer}>
              <ThemedText style={styles.footerText}>
                ¿No tienes cuenta?{' '}
              </ThemedText>
              <Link href="/(auth)/register" asChild>
                <Button
                  title="Regístrate"
                  variant="ghost"
                  size="small"
                />
              </Link>
            </View>

            <View style={styles.ownerSection}>
              <ThemedText style={styles.ownerText}>
                ¿Eres propietario de un negocio?
              </ThemedText>
              <Link href="/(auth)/register-owner" asChild>
                <Button
                  title="Registra tu negocio"
                  variant="outline"
                  size="medium"
                  style={styles.ownerButton}
                />
              </Link>
            </View>

            <View style={styles.inviteSection}>
              <ThemedText style={styles.inviteText}>¿Te invitaron como empleado?</ThemedText>
              <Link href={'/accept-invite' as Href} asChild>
                <Button
                  title="Ingresar código"
                  variant="ghost"
                  size="small"
                />
              </Link>
            </View>
          </Card>
        </ThemedView>
      </ScrollableInputView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.surface,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: DesignTokens.spacing.xl,
  },
  content: {
    flex: 1,
    paddingHorizontal: DesignTokens.spacing.xl,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: DesignTokens.spacing['3xl'],
    paddingTop: DesignTokens.spacing.xl,
  },
  logoContainer: {
    marginBottom: DesignTokens.spacing.lg,
  },
  logo: {
    width: 96,
    height: 96,
    borderRadius: DesignTokens.radius['3xl'],
    backgroundColor: Colors.light.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.light.primary,
    ...DesignTokens.elevation.lg,
  },
  logoText: {
    fontSize: DesignTokens.typography.fontSizes['4xl'],
    fontWeight: DesignTokens.typography.fontWeights.bold as any,
    color: Colors.light.textOnPrimary,
    letterSpacing: -1,
  },
  title: {
    fontSize: DesignTokens.typography.fontSizes['3xl'],
    fontWeight: DesignTokens.typography.fontWeights.bold as any,
    color: Colors.light.primary,
    marginBottom: DesignTokens.spacing.sm,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: DesignTokens.typography.fontSizes.base,
    color: Colors.light.textSecondary,
    textAlign: 'center',
    lineHeight: DesignTokens.typography.lineHeights.relaxed * DesignTokens.typography.fontSizes.base,
    paddingHorizontal: DesignTokens.spacing.xl,
  },
  formCard: {
    marginBottom: DesignTokens.spacing.xl,
  },
  formTitle: {
    fontSize: DesignTokens.typography.fontSizes['2xl'],
    fontWeight: DesignTokens.typography.fontWeights.bold as any,
    color: Colors.light.text,
    marginBottom: DesignTokens.spacing['2xl'],
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  loginButton: {
    marginTop: DesignTokens.spacing.sm,
    marginBottom: DesignTokens.spacing.md,
  },
  emailNote: {
    backgroundColor: Colors.light.primary + '10',
    paddingHorizontal: DesignTokens.spacing.md,
    paddingVertical: DesignTokens.spacing.sm,
    borderRadius: DesignTokens.radius.md,
    marginBottom: DesignTokens.spacing.lg,
    borderLeftWidth: 3,
    borderLeftColor: Colors.light.primary,
  },
  emailNoteText: {
    fontSize: DesignTokens.typography.fontSizes.sm,
    color: Colors.light.textSecondary,
    textAlign: 'center',
    lineHeight: DesignTokens.typography.lineHeights.relaxed * DesignTokens.typography.fontSizes.sm,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: DesignTokens.spacing.xl,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.light.border,
  },
  dividerText: {
    marginHorizontal: DesignTokens.spacing.lg,
    color: Colors.light.textSecondary,
    fontSize: DesignTokens.typography.fontSizes.sm,
    fontWeight: DesignTokens.typography.fontWeights.medium as any,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  footerText: {
    fontSize: DesignTokens.typography.fontSizes.base,
    color: Colors.light.textSecondary,
    marginRight: DesignTokens.spacing.xs,
  },
  ownerSection: {
    marginTop: DesignTokens.spacing['2xl'],
    paddingTop: DesignTokens.spacing.xl,
    borderTopWidth: 1,
    borderTopColor: Colors.light.borderLight,
    alignItems: 'center',
  },
  ownerText: {
    fontSize: DesignTokens.typography.fontSizes.base,
    color: Colors.light.textSecondary,
    marginBottom: DesignTokens.spacing.md,
    textAlign: 'center',
    lineHeight: DesignTokens.typography.lineHeights.relaxed * DesignTokens.typography.fontSizes.base,
  },
  ownerButton: {
    borderColor: Colors.light.primary,
    borderWidth: 2,
  },
  inviteSection: {
    marginTop: DesignTokens.spacing.lg,
    alignItems: 'center',
    gap: DesignTokens.spacing.xs,
  },
  inviteText: {
    fontSize: DesignTokens.typography.fontSizes.sm,
    color: Colors.light.textSecondary,
  },
});
