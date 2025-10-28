import { ThemedText } from '@/components/ThemedText';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ScrollableInputView } from '@/components/ui/ScrollableInputView';
import { SimpleInput } from '@/components/ui/SimpleInput';
import { Colors, DesignTokens } from '@/constants/Colors';
import { useAuth } from '@/contexts/AuthContext';
import { BookingService } from '@/lib/booking-service';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, StyleSheet, View } from 'react-native';

export default function AcceptInviteScreen() {
  const { user } = useAuth();
  const params = useLocalSearchParams<{ token?: string }>();
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (typeof params.token === 'string' && params.token.length > 0) {
      setToken(params.token);
    }
  }, [params.token]);

  const handleAcceptInvite = async () => {
    const trimmedToken = token.trim();
    if (!trimmedToken) {
      Alert.alert('Código requerido', 'Ingresa el código de invitación recibido.');
      return;
    }

    if (!user) {
      Alert.alert(
        'Inicia sesión primero',
        'Debes iniciar sesión o crear una cuenta antes de aceptar la invitación.',
        [
          {
            text: 'Ir al inicio de sesión',
            onPress: () => router.push('/(auth)/login'),
          },
          { text: 'Cancelar', style: 'cancel' },
        ]
      );
      return;
    }

    try {
      setLoading(true);
      await BookingService.acceptEmployeeInvite(trimmedToken);
      Alert.alert(
        '¡Listo!',
        'Tu cuenta ahora está vinculada al negocio. Vuelve al inicio para ver tus citas.',
        [
          {
            text: 'Continuar',
            onPress: () => router.replace('/(tabs)'),
          },
        ]
      );
    } catch (error: any) {
      const message = error?.message || 'No se pudo validar la invitación. Verifica el código.';
      Alert.alert('Error', message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollableInputView
        style={styles.scroll}
        contentContainerStyle={styles.content}
      >
        <View style={styles.header}>
          <ThemedText type="title" style={styles.title}>Unirte al equipo</ThemedText>
          <ThemedText style={styles.subtitle}>
            Usa el código que recibiste del administrador para vincular tu cuenta como empleado.
          </ThemedText>
        </View>

        <Card variant="elevated" style={styles.card}>
          <SimpleInput
            label="Código de invitación"
            value={token}
            onChangeText={setToken}
            autoCapitalize="none"
            autoCorrect={false}
            placeholder="Pega el código aquí"
          />

          <Button
            title={loading ? 'Validando...' : 'Aceptar invitación'}
            onPress={handleAcceptInvite}
            loading={loading}
            disabled={loading}
            fullWidth
            style={styles.acceptButton}
          />

          {!user && (
            <View style={styles.noteBox}>
              <ThemedText style={styles.noteText}>
                Necesitas iniciar sesión antes de aceptar la invitación.
              </ThemedText>
              <Button
                title="Iniciar sesión"
                variant="outline"
                onPress={() => router.push('/(auth)/login')}
                style={styles.noteButton}
              />
            </View>
          )}
        </Card>
      </ScrollableInputView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.surface,
  },
  scroll: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: DesignTokens.spacing.xl,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: DesignTokens.spacing['3xl'],
  },
  header: {
    marginBottom: DesignTokens.spacing['2xl'],
  },
  title: {
    textAlign: 'center',
    fontSize: DesignTokens.typography.fontSizes['3xl'],
    marginBottom: DesignTokens.spacing.sm,
    color: Colors.light.primary,
  },
  subtitle: {
    textAlign: 'center',
    color: Colors.light.textSecondary,
    fontSize: DesignTokens.typography.fontSizes.sm,
    lineHeight: 20,
  },
  card: {
    padding: DesignTokens.spacing.xl,
    gap: DesignTokens.spacing.lg,
  },
  acceptButton: {
    marginTop: DesignTokens.spacing.sm,
  },
  noteBox: {
    marginTop: DesignTokens.spacing.lg,
    padding: DesignTokens.spacing.md,
    borderRadius: DesignTokens.radius.md,
    backgroundColor: Colors.light.surfaceVariant,
    gap: DesignTokens.spacing.sm,
  },
  noteText: {
    textAlign: 'center',
    color: Colors.light.textSecondary,
    fontSize: DesignTokens.typography.fontSizes.sm,
  },
  noteButton: {
    alignSelf: 'center',
  },
});
