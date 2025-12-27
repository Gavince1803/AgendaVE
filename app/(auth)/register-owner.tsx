import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { CategorySelector } from '@/components/ui/CategorySelector';
import { ScrollableInputView } from '@/components/ui/ScrollableInputView';
import { SimpleInput } from '@/components/ui/SimpleInput';
import { BUSINESS_CATEGORIES } from '@/constants/BusinessCategories';
import { Colors, DesignTokens } from '@/constants/Colors';
import { useAuth } from '@/contexts/AuthContext';
import { useAlert } from '@/contexts/GlobalAlertContext';
import { Link, router } from 'expo-router';
import { useState } from 'react';
import {
  Platform,
  StyleSheet,
  View
} from 'react-native';

type OwnerField =
  | 'fullName'
  | 'cedula'
  | 'email'
  | 'phone'
  | 'businessName'
  | 'businessType'
  | 'address'
  | 'password'
  | 'confirmPassword';

type OwnerErrors = Partial<Record<OwnerField, string>>;

export default function RegisterOwnerScreen() {
  const [fullName, setFullName] = useState('');
  const [cedula, setCedula] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [businessType, setBusinessType] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<OwnerErrors>({});
  const { signUp } = useAuth();
  const { showAlert } = useAlert();

  const validateFields = () => {
    const nextErrors: OwnerErrors = {};

    if (!fullName.trim()) {
      nextErrors.fullName = 'Ingresa el nombre del propietario.';
    }
    if (!cedula.trim()) {
      nextErrors.cedula = 'Ingresa tu cédula.';
    } else if (cedula.length < 5) {
      nextErrors.cedula = 'Cédula inválida.';
    }
    if (!email.trim() || !email.includes('@')) {
      nextErrors.email = 'Ingresa un correo válido.';
    }
    if (!phone.trim()) {
      nextErrors.phone = 'Ingresa un teléfono de contacto.';
    }
    if (!businessName.trim()) {
      nextErrors.businessName = 'Ingresa el nombre del negocio.';
    }
    if (!businessType.trim()) {
      nextErrors.businessType = 'Describe el tipo de negocio.';
    }
    if (password.length < 6) {
      nextErrors.password = 'Debe tener al menos 6 caracteres.';
    }
    if (password !== confirmPassword) {
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
      // Crear el usuario con rol provider y información del negocio
      await signUp(email, password, fullName, 'provider', phone, {
        businessName: businessName,
        businessType: businessType,
        address: address
      }, cedula);

      // Mostrar mensaje de éxito
      showAlert(
        '¡Negocio registrado exitosamente! 🎉',
        'Tu cuenta de negocio ha sido creada correctamente. Bienvenido.',
        [
          {
            text: 'Continuar',
            onPress: () => {
              // Redirigir al inicio, el auth context manejará la navegación
              router.replace('/');
            }
          }
        ]
      );
    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error('Error al registrarse');
      showAlert('Error', err.message || 'Error al registrarse');
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
              Registra tu Negocio
            </ThemedText>
            <ThemedText style={styles.subtitle}>
              Únete como proveedor y comienza a recibir clientes
            </ThemedText>
          </View>

          {/* Formulario en card */}
          <Card variant="elevated" style={styles.formCard}>
            <ThemedText style={styles.formTitle}>
              Información del Negocio
            </ThemedText>

            <View style={styles.ownerBadge}>
              <ThemedText style={styles.ownerBadgeText}>
                🏪 Cuenta de Propietario
              </ThemedText>
            </View>

            {/* Información personal */}
            <View style={styles.section}>
              <ThemedText style={styles.sectionTitle}>Información Personal</ThemedText>

              <SimpleInput
                label="Nombre Completo *"
                value={fullName}
                onChangeText={(text) => {
                  setFullName(text);
                  setErrors((prev) => ({ ...prev, fullName: undefined }));
                }}
                onBlur={() => {
                  if (!fullName.trim()) setErrors(prev => ({ ...prev, fullName: 'Ingresa el nombre del propietario.' }));
                }}
                placeholder="Tu nombre completo"
                autoCapitalize="words"
                error={errors.fullName}
              />

              <SimpleInput
                label="Cédula de Identidad *"
                value={cedula}
                onChangeText={(text) => {
                  setCedula(text.replace(/\D/g, ''));
                  setErrors((prev) => ({ ...prev, cedula: undefined }));
                }}
                onBlur={() => {
                  if (!cedula.trim()) {
                    setErrors(prev => ({ ...prev, cedula: 'Ingresa tu cédula.' }));
                  } else if (cedula.length < 5) {
                    setErrors(prev => ({ ...prev, cedula: 'Cédula inválida (mínimo 5 números).' }));
                  }
                }}
                placeholder="Ej: 12345678"
                keyboardType="numeric"
                autoCapitalize="none"
                error={errors.cedula}
              />

              <SimpleInput
                label="Email *"
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
                label="Teléfono *"
                value={phone}
                onChangeText={(text) => {
                  setPhone(text);
                  setErrors((prev) => ({ ...prev, phone: undefined }));
                }}
                onBlur={() => {
                  const cleanPhone = phone.replace(/\D/g, '');
                  const phoneRegex = /^(0414|0424|0412|0416|0426)\d{7}$/;
                  if (!phone.trim()) {
                    setErrors(prev => ({ ...prev, phone: 'Ingresa un teléfono de contacto.' }));
                  } else if (!phoneRegex.test(cleanPhone)) {
                    setErrors(prev => ({ ...prev, phone: 'El formato debe ser 04xx + 7 dígitos.' }));
                  }
                }}
                placeholder="+58 412 123 4567"
                keyboardType="numeric"
                autoCapitalize="none"
                autoCorrect={false}
                error={errors.phone}
              />
            </View>

            {/* Información del negocio */}
            <View style={styles.section}>
              <ThemedText style={styles.sectionTitle}>Información del Negocio</ThemedText>

              <SimpleInput
                label="Nombre del Negocio *"
                value={businessName}
                onChangeText={(text) => {
                  setBusinessName(text);
                  setErrors((prev) => ({ ...prev, businessName: undefined }));
                }}
                onBlur={() => {
                  if (!businessName.trim()) setErrors(prev => ({ ...prev, businessName: 'Ingresa el nombre del negocio.' }));
                }}
                placeholder="Mi Peluquería"
                autoCapitalize="words"
                autoCorrect={false}
                error={errors.businessName}
              />

              <View style={{ marginBottom: 24 }}>
                <ThemedText style={{
                  fontSize: 16,
                  fontWeight: '600',
                  color: Colors.light.text,
                  marginBottom: 8
                }}>
                  Categoría del Negocio *
                </ThemedText>
                <CategorySelector
                  selectedCategory={businessType}
                  onCategoryChange={(cat) => {
                    setBusinessType(cat);
                    setErrors((prev) => ({ ...prev, businessType: undefined }));
                  }}
                  categories={BUSINESS_CATEGORIES}
                />
                {errors.businessType && (
                  <ThemedText style={{ color: Colors.light.error, fontSize: 12, marginTop: 4 }}>
                    {errors.businessType}
                  </ThemedText>
                )}
              </View>

              <SimpleInput
                label="Dirección"
                value={address}
                onChangeText={setAddress}
                placeholder="Av. Principal, Caracas"
                autoCapitalize="words"
              />
            </View>

            {/* Contraseña */}
            <View style={styles.section}>
              <ThemedText style={styles.sectionTitle}>Seguridad</ThemedText>

              <SimpleInput
                label="Contraseña *"
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  setErrors((prev) => ({ ...prev, password: undefined }));
                }}
                onBlur={() => {
                  if (password.length < 6) setErrors(prev => ({ ...prev, password: 'La contraseña debe tener al menos 6 caracteres.' }));
                }}
                placeholder="Mínimo 6 caracteres"
                secureTextEntry
                autoCapitalize="none"
                error={errors.password}
              />

              <SimpleInput
                label="Confirmar Contraseña *"
                value={confirmPassword}
                onChangeText={(text) => {
                  setConfirmPassword(text);
                  setErrors((prev) => ({ ...prev, confirmPassword: undefined }));
                }}
                onBlur={() => {
                  if (confirmPassword !== password) setErrors(prev => ({ ...prev, confirmPassword: 'Las contraseñas no coinciden.' }));
                }}
                placeholder="Repite tu contraseña"
                secureTextEntry
                autoCapitalize="none"
                error={errors.confirmPassword}
              />
            </View>

            <Button
              title={loading ? 'Registrando negocio...' : 'Registrar Negocio'}
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

            <View style={styles.clientSection}>
              <ThemedText style={styles.clientText}>
                ¿Solo quieres reservar servicios?
              </ThemedText>
              <Link href="/(auth)/register" asChild>
                <Button
                  title="Regístrate como cliente"
                  variant="outline"
                  size="small"
                  style={styles.clientButton}
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
  ownerBadge: {
    backgroundColor: Colors.light.success + '20',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: 'center',
    marginBottom: 20,
  },
  ownerBadgeText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.success,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 16,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.borderLight,
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
    marginBottom: 16,
  },
  footerText: {
    fontSize: 16,
    color: Colors.light.textSecondary,
    marginRight: 4,
  },
  clientSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.light.borderLight,
    alignItems: 'center',
  },
  clientText: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    marginBottom: 8,
    textAlign: 'center',
  },
  clientButton: {
    borderColor: Colors.light.primary,
    borderWidth: 1,
  },
});
