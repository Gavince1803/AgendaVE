import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Colors } from '@/constants/Colors';
import { useAuth } from '@/contexts/AuthContext';
import { Link, router } from 'expo-router';
import React, { useState } from 'react';
import {
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    View,
} from 'react-native';

export default function RegisterOwnerScreen() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [businessType, setBusinessType] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const { signUp } = useAuth();

  const businessTypes = [
    'Peluquería',
    'Barbería',
    'Spa',
    'Estética',
    'Masajes',
    'Uñas',
    'Otro'
  ];

  const handleRegister = async () => {
    if (!fullName || !email || !password || !confirmPassword || !businessName || !businessType || !phone) {
      Alert.alert('Error', 'Por favor completa todos los campos obligatorios');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Las contraseñas no coinciden');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Error', 'La contraseña debe tener al menos 6 caracteres');
      return;
    }

    setLoading(true);
    try {
      await signUp(email, password, fullName, 'provider');
      // Aquí podrías agregar lógica adicional para guardar la información del negocio
      router.replace('/(tabs)');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Error al registrarse');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
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
              
              <Input
                label="Nombre Completo *"
                value={fullName}
                onChangeText={setFullName}
                placeholder="Tu nombre completo"
                autoCapitalize="words"
              />

              <Input
                label="Email *"
                value={email}
                onChangeText={setEmail}
                placeholder="tu@email.com"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />

              <Input
                label="Teléfono *"
                value={phone}
                onChangeText={setPhone}
                placeholder="+58 412 123 4567"
                keyboardType="phone-pad"
              />
            </View>

            {/* Información del negocio */}
            <View style={styles.section}>
              <ThemedText style={styles.sectionTitle}>Información del Negocio</ThemedText>
              
              <Input
                label="Nombre del Negocio *"
                value={businessName}
                onChangeText={setBusinessName}
                placeholder="Mi Peluquería"
                autoCapitalize="words"
              />

              <Input
                label="Tipo de Negocio *"
                value={businessType}
                onChangeText={setBusinessType}
                placeholder="Peluquería, Barbería, Spa..."
                autoCapitalize="words"
              />

              <Input
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
              
              <Input
                label="Contraseña *"
                value={password}
                onChangeText={setPassword}
                placeholder="Mínimo 6 caracteres"
                secureTextEntry
                autoCapitalize="none"
              />

              <Input
                label="Confirmar Contraseña *"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Repite tu contraseña"
                secureTextEntry
                autoCapitalize="none"
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
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.surface,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
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
