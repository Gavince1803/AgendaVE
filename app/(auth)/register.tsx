import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ScrollableInputView } from '@/components/ui/ScrollableInputView';
import { SimpleInput } from '@/components/ui/SimpleInput';
import { Colors, DesignTokens } from '@/constants/Colors';
import { useAuth } from '@/contexts/AuthContext';
import { Link, router } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert,
  Platform,
  StyleSheet,
  View
} from 'react-native';

type RegisterFieldErrors = Partial<Record<'fullName' | 'email' | 'phone' | 'password' | 'confirmPassword', string>>;

export default function RegisterScreen() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const role = 'client'; // Solo clientes se registran aquí
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<RegisterFieldErrors>({});
  const { signUp } = useAuth();

  const validateFields = () => {
    const nextErrors: RegisterFieldErrors = {};

    if (!fullName.trim()) {
      nextErrors.fullName = 'Ingresa tu nombre completo.';
    }
    if (!email.trim()) {
      nextErrors.email = 'Ingresa un correo válido.';
    } else if (!email.includes('@')) {
      nextErrors.email = 'El correo parece inválido.';
    }
    if (!phone.trim()) {
      nextErrors.phone = 'Ingresa tu teléfono.';
    }
    if (!password || password.length < 6) {
      nextErrors.password = 'La contraseña debe tener 6+ caracteres.';
    }
    if (confirmPassword !== password) {
      nextErrors.confirmPassword = 'Las contraseñas no coinciden.';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleRegister = async () => {
    if (!validateFields()) {
      return;
    }

    setLoading(true);
    try {
      await signUp(email, password, fullName, role, phone);
      
      // Mostrar mensaje de éxito con información sobre confirmación de email
      Alert.alert(
        '¡Cuenta creada exitosamente! 🎉',
        'Te hemos enviado un email de confirmación a ' + email + '. Por favor revisa tu bandeja de entrada y haz clic en el enlace para activar tu cuenta.\n\nUna vez confirmado, podrás iniciar sesión.',
        [
          {
            text: 'Entendido',
            onPress: () => {
              // Redirigir al login en lugar de a las tabs
              router.replace('/(auth)/login');
            }
          }
        ]
      );
    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error('Error al registrarse');
      Alert.alert('Error', err.message || 'Error al registrarse');
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
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <View style={styles.logo}>
                <ThemedText style={styles.logoText}>A</ThemedText>
              </View>
            </View>
            <ThemedText type="title" style={styles.title}>
              Crear Cuenta
            </ThemedText>
            <ThemedText style={styles.subtitle}>
              Únete como cliente y reserva tus servicios favoritos
            </ThemedText>
          </View>

          {/* Formulario en card */}
          <Card variant="elevated" style={styles.formCard}>
            <ThemedText style={styles.formTitle}>
              Información Personal
            </ThemedText>
            
            <View style={styles.clientBadge}>
              <ThemedText style={styles.clientBadgeText}>
                👤 Cuenta de Cliente
              </ThemedText>
            </View>
            
            <SimpleInput
              label="Nombre Completo"
              value={fullName}
              onChangeText={(text) => {
                setFullName(text);
                setErrors((prev) => ({ ...prev, fullName: undefined }));
              }}
              placeholder="Tu nombre completo"
              autoCapitalize="words"
              error={errors.fullName}
            />

            <SimpleInput
              label="Email"
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                setErrors((prev) => ({ ...prev, email: undefined }));
              }}
              placeholder="tu@email.com"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              error={errors.email}
            />

            <SimpleInput
              label="Teléfono"
              value={phone}
              onChangeText={(text) => {
                setPhone(text);
                setErrors((prev) => ({ ...prev, phone: undefined }));
              }}
              placeholder="+58 412 123 4567"
              keyboardType="numeric"
              autoCapitalize="none"
              autoCorrect={false}
              error={errors.phone}
            />

            <SimpleInput
              label="Contraseña"
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                setErrors((prev) => ({ ...prev, password: undefined }));
              }}
              placeholder="Mínimo 6 caracteres"
              secureTextEntry
              autoCapitalize="none"
              error={errors.password}
            />

            <SimpleInput
              label="Confirmar Contraseña"
              value={confirmPassword}
              onChangeText={(text) => {
                setConfirmPassword(text);
                setErrors((prev) => ({ ...prev, confirmPassword: undefined }));
              }}
              placeholder="Repite tu contraseña"
              secureTextEntry
              autoCapitalize="none"
              error={errors.confirmPassword}
            />


            <Button
              title={loading ? 'Creando cuenta...' : 'Crear Cuenta'}
              onPress={handleRegister}
              loading={loading}
              disabled={loading}
              fullWidth
              size="large"
              style={styles.registerButton}
            />

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <ThemedText style={styles.dividerText}>o</ThemedText>
              <View style={styles.dividerLine} />
            </View>

            <View style={styles.footer}>
              <ThemedText style={styles.footerText}>
                ¿Ya tienes cuenta?{' '}
              </ThemedText>
              <Link href="/(auth)/login" asChild>
                <Button
                  title="Inicia sesión"
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
    marginBottom: 24,
    paddingTop: 20,
  },
  logoContainer: {
    marginBottom: 16,
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.light.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.light.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  logoText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.light.primary,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: Colors.light.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 20,
  },
  formCard: {
    marginBottom: 20,
  },
  formTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.light.text,
    marginBottom: 16,
    textAlign: 'center',
  },
  clientBadge: {
    backgroundColor: Colors.light.primary + '20',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: 'center',
    marginBottom: 20,
  },
  clientBadgeText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.primary,
  },
  registerButton: {
    marginTop: 8,
    marginBottom: 16,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.light.border,
  },
  dividerText: {
    marginHorizontal: 16,
    color: Colors.light.textSecondary,
    fontSize: 14,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  footerText: {
    fontSize: 16,
    color: Colors.light.textSecondary,
    marginRight: 4,
  },
});
