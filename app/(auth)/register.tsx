import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ScrollableInputView } from '@/components/ui/ScrollableInputView';
import { SimpleInput } from '@/components/ui/SimpleInput';
import { Colors, DesignTokens } from '@/constants/Colors';
import { useAuth } from '@/contexts/AuthContext';
import { useAlert } from '@/contexts/GlobalAlertContext';
import { Link, router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import {
  Platform,
  StyleSheet,
  View
} from 'react-native';

type RegisterFieldErrors = Partial<Record<'fullName' | 'email' | 'phone' | 'password' | 'confirmPassword' | 'cedula', string>>;

export default function RegisterScreen() {
  const [fullName, setFullName] = useState('');
  const [cedula, setCedula] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const role = 'client'; // Solo clientes se registran aquí
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<RegisterFieldErrors>({});
  const { signUp } = useAuth();
  const { showAlert } = useAlert();
  const { returnUrl } = useLocalSearchParams();

  const validateFields = () => {
    const nextErrors: RegisterFieldErrors = {};

    // Nombre
    if (!fullName.trim() || fullName.trim().length < 3) {
      nextErrors.fullName = 'Ingresa tu nombre completo (mínimo 3 letras).';
    }

    // Cédula: solo números, longitud razonable (5-10 dígitos)
    const cedulaRegex = /^\d{5,10}$/;
    if (!cedula.trim()) {
      nextErrors.cedula = 'Ingresa tu cédula.';
    } else if (!cedulaRegex.test(cedula)) {
      nextErrors.cedula = 'Cédula inválida (solo números, 5-10 dígitos).';
    }

    // Email: Regex estricta
    // Estándar HTML5 para email
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!email.trim()) {
      nextErrors.email = 'Ingresa un correo válido.';
    } else if (!emailRegex.test(email)) {
      nextErrors.email = 'Formato de correo inválido (ej: usuario@dominio.com).';
    }

    // Teléfono: Celular venezolano (0414, 0424, 0412, 0416, 0426)
    // Acepta con o sin formato, pero validamos que tenga 11 dígitos y empiece por el prefijo
    const cleanPhone = phone.replace(/\D/g, ''); // Eliminar todo lo que no sea número
    const phoneRegex = /^(0414|0424|0412|0416|0426)\d{7}$/;

    if (!phone.trim()) {
      nextErrors.phone = 'Ingresa tu teléfono.';
    } else if (!phoneRegex.test(cleanPhone)) {
      nextErrors.phone = 'Teléfono inválido. Usa formato 0412/0414/0424 + 7 dígitos.';
    }

    // Password
    if (!password || password.length < 6) {
      nextErrors.password = 'La contraseña debe tener 6+ caracteres.';
    }

    // Confirm Password
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
      await signUp(email, password, fullName, role, phone, undefined, cedula);

      // Mostrar mensaje de éxito con información sobre confirmación de email
      // Redireccionar inmediatamente
      if (returnUrl) {
        router.replace(`/(auth)/login?returnUrl=${encodeURIComponent(returnUrl as string)}`);
      } else {
        // El AuthLayout o el AuthContext se encargarán de redirigir a (tabs)
        // Pero por seguridad podemos forzarlo si no hay redirección automática
        router.replace('/(tabs)');
      }
    } catch (error: unknown) {
      // ... (error handling)
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
                <ThemedText style={styles.logoText}>M</ThemedText>
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
              onBlur={() => {
                if (!fullName.trim() || fullName.trim().length < 3) {
                  setErrors(prev => ({ ...prev, fullName: 'Ingresa tu nombre completo (mínimo 3 letras).' }));
                }
              }}
              placeholder="Tu nombre completo"
              autoCapitalize="words"
              error={errors.fullName}
            />

            <SimpleInput
              label="Cédula de Identidad"
              value={cedula}
              onChangeText={(text) => {
                setCedula(text.replace(/\D/g, ''));
                setErrors((prev) => ({ ...prev, cedula: undefined }));
              }}
              onBlur={() => {
                const cedulaRegex = /^\d{5,10}$/;
                if (!cedula.trim()) {
                  setErrors(prev => ({ ...prev, cedula: 'Ingresa tu cédula.' }));
                } else if (!cedulaRegex.test(cedula)) {
                  setErrors(prev => ({ ...prev, cedula: 'Cédula inválida (solo números, 5-10 dígitos).' }));
                }
              }}
              placeholder="Ej: 12345678"
              keyboardType="numeric"
              autoCapitalize="none"
              error={errors.cedula}
            />

            <SimpleInput
              label="Email"
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                setErrors((prev) => ({ ...prev, email: undefined }));
              }}
              onBlur={() => {
                const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
                if (!email.trim()) {
                  setErrors(prev => ({ ...prev, email: 'Ingresa un correo válido.' }));
                } else if (!emailRegex.test(email)) {
                  setErrors(prev => ({ ...prev, email: 'Formato inválido. Ejemplo: usuario@gmail.com' }));
                }
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
              onBlur={() => {
                const cleanPhone = phone.replace(/\D/g, '');
                const phoneRegex = /^(0414|0424|0412|0416|0426)\d{7}$/;
                if (!phone.trim()) {
                  setErrors(prev => ({ ...prev, phone: 'Ingresa tu teléfono.' }));
                } else if (!phoneRegex.test(cleanPhone)) {
                  setErrors(prev => ({ ...prev, phone: 'El formato debe ser 04xx + 7 dígitos (ej: 04121234567).' }));
                }
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
              onBlur={() => {
                if (!password || password.length < 6) {
                  setErrors(prev => ({ ...prev, password: 'La contraseña debe tener al menos 6 caracteres.' }));
                }
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
              onBlur={() => {
                if (confirmPassword !== password) {
                  setErrors(prev => ({ ...prev, confirmPassword: 'Las contraseñas no coinciden.' }));
                }
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
