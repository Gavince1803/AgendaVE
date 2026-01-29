// Agregar Servicio - Pantalla para que el proveedor agregue nuevos servicios
// Permite configurar nombre, descripción, precio y duración del servicio

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Button } from '@/components/ui/Button';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { TabSafeAreaView } from '@/components/ui/SafeAreaView';
import { ScrollableInputView } from '@/components/ui/ScrollableInputView';
import { SimpleInput } from '@/components/ui/SimpleInput';
import { Colors, DesignTokens } from '@/constants/Colors';
import { useAuth } from '@/contexts/AuthContext';
import { useAlert } from '@/contexts/GlobalAlertContext';
import { BookingService } from '@/lib/booking-service';
import { LogCategory, useLogger } from '@/lib/logger';
import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

export default function AddServiceScreen() {
  const { user } = useAuth();
  const log = useLogger();
  const { showAlert } = useAlert();
  const [saving, setSaving] = useState(false);

  const [serviceData, setServiceData] = useState<{
    name: string;
    description: string;
    price_amount: string;
    duration_minutes: string;
    input_type: 'fixed' | 'range' | 'starting_at';
    price_max: string;
  }>({
    name: '',
    description: '',
    price_amount: '',
    duration_minutes: '',
    input_type: 'fixed',
    price_max: '',
  });

  const handleSave = async () => {
    console.log('🔴 [ADD-SERVICE] handleSave called');

    if (!user) {
      console.log('🔴 [ADD-SERVICE] No user found');
      return;
    }

    // Validaciones
    if (!serviceData.name.trim()) {
      showAlert('Error', 'El nombre del servicio es requerido');
      return;
    }

    if (!serviceData.price_amount.trim()) {
      showAlert('Error', 'El precio es requerido');
      return;
    }

    if (!serviceData.duration_minutes.trim()) {
      showAlert('Error', 'La duración es requerida');
      return;
    }

    const price = parseFloat(serviceData.price_amount);
    const duration = parseInt(serviceData.duration_minutes);

    if (isNaN(price) || price <= 0) {
      showAlert('Error', 'El precio debe ser un número válido mayor a 0');
      return;
    }

    if (serviceData.input_type === 'range') {
      const priceMax = parseFloat(serviceData.price_max || '0');
      if (isNaN(priceMax) || priceMax <= price) {
        showAlert('Error', 'El precio máximo debe ser mayor al precio base');
        return;
      }
    }

    if (isNaN(duration) || duration <= 0) {
      showAlert('Error', 'La duración debe ser un número válido mayor a 0');
      return;
    }

    // Confirmation dialog
    showAlert(
      'Confirmar Creación de Servicio',
      `¿Estás seguro de que quieres crear el servicio "${serviceData.name.trim()}"?`,
      [
        {
          text: 'Cancelar',
          style: 'cancel',
          onPress: () => console.log('🔴 [ADD-SERVICE] User cancelled')
        },
        {
          text: 'Crear Servicio',
          style: 'default',
          onPress: () => {
            console.log('🔴 [ADD-SERVICE] User confirmed, creating service');
            createService(price, duration);
          }
        }
      ]
    );
  };

  const createService = async (price: number, duration: number) => {
    try {
      if (!user) throw new Error('Usuario no autenticado');

      setSaving(true);

      log.userAction('Add new service', {
        providerId: user.id,
        serviceName: serviceData.name,
        price: price,
        duration: duration
      });

      await BookingService.createService(user.id, {
        name: serviceData.name,
        description: serviceData.description,
        price_amount: price,
        price_currency: 'USD',
        duration_minutes: duration,
        is_active: true,
        input_type: serviceData.input_type,
        price_max: serviceData.price_max ? parseFloat(serviceData.price_max) : undefined,
      });

      showAlert(
        '¡Servicio Creado! ✅',
        `El servicio "${serviceData.name}" ha sido creado exitosamente y estará disponible para tus clientes inmediatamente.`,
        [
          {
            text: 'Crear Otro',
            style: 'default',
            onPress: () => {
              // Reset form
              setServiceData({
                name: '',
                description: '',
                price_amount: '',
                duration_minutes: '',
                input_type: 'fixed',
                price_max: '',
              });
            }
          },
          {
            text: 'Ir a Mi Negocio',
            style: 'default',
            onPress: () => router.back()
          }
        ]
      );
    } catch (error) {
      console.error(error);
      log.error(LogCategory.SERVICE, 'Error creating service', { error: error instanceof Error ? error.message : String(error) });
      showAlert('Error', 'No se pudo crear el servicio');
    } finally {
      setSaving(false);
    }
  };

  return (
    <TabSafeAreaView style={{ flex: 1 }}>
      <ScrollableInputView style={styles.container} contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <ThemedView style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <IconSymbol name="chevron.left" size={24} color={Colors.light.text} />
          </TouchableOpacity>
          <ThemedText type="title" style={styles.title}>
            Agregar Servicio
          </ThemedText>
          <View style={styles.placeholder} />
        </ThemedView>

        {/* Formulario */}
        <ThemedView style={styles.form}>
          <SimpleInput
            label="Nombre del Servicio *"
            value={serviceData.name}
            onChangeText={(text) => setServiceData({ ...serviceData, name: text })}
            placeholder="Ej: Corte de Cabello"
            autoCapitalize="words"
            returnKeyType="next"
          />

          <SimpleInput
            label="Descripción"
            value={serviceData.description}
            onChangeText={(text) => setServiceData({ ...serviceData, description: text })}
            placeholder="Describe el servicio..."
            multiline
            numberOfLines={4}
            returnKeyType="default"
          />

          {/* Price Type Selector */}
          <View style={styles.inputGroup}>
            <ThemedText style={styles.label}>Tipo de Precio</ThemedText>
            <View style={styles.segmentControl}>
              {(['fixed', 'range', 'starting_at'] as const).map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.segmentButton,
                    serviceData.input_type === type && styles.segmentButtonActive
                  ]}
                  onPress={() => setServiceData({ ...serviceData, input_type: type })}
                >
                  <ThemedText style={[
                    styles.segmentText,
                    serviceData.input_type === type && styles.segmentTextActive
                  ]}>
                    {type === 'fixed' ? 'Fijo' : type === 'range' ? 'Rango' : 'Desde'}
                  </ThemedText>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.row}>
            <View style={styles.halfWidth}>
              <SimpleInput
                label={serviceData.input_type === 'range' ? "Precio Mínimo *" : serviceData.input_type === 'starting_at' ? "Precio Inicial *" : "Precio ($) *"}
                value={serviceData.price_amount}
                onChangeText={(text) => setServiceData({ ...serviceData, price_amount: text })}
                placeholder="0.00"
                keyboardType="numeric"
                returnKeyType="next"
              />
            </View>

            {serviceData.input_type === 'range' && (
              <View style={styles.halfWidth}>
                <SimpleInput
                  label="Precio Máximo *"
                  value={serviceData.price_max}
                  onChangeText={(text) => setServiceData({ ...serviceData, price_max: text })}
                  placeholder="0.00"
                  keyboardType="numeric"
                  returnKeyType="next"
                />
              </View>
            )}
          </View>

          <SimpleInput
            label="Duración (min) *"
            value={serviceData.duration_minutes}
            onChangeText={(text) => setServiceData({ ...serviceData, duration_minutes: text })}
            placeholder="30"
            keyboardType="numeric"
            returnKeyType="done"
          />

          {/* Información adicional */}
          <ThemedView style={styles.infoCard}>
            <IconSymbol name="info.circle" size={20} color={Colors.light.primary} />
            <View style={styles.infoText}>
              <ThemedText style={styles.infoTitle}>
                Información importante
              </ThemedText>
              <ThemedText style={styles.infoDescription}>
                • El servicio se creará como activo por defecto{'\n'}
                {'• Puedes editarlo o desactivarlo desde "Mi Negocio"'}{'\n'}
                • Los clientes podrán reservar este servicio inmediatamente
              </ThemedText>
            </View>
          </ThemedView>
        </ThemedView>

        {/* Botones */}
        <ThemedView style={styles.buttons}>
          <Button
            title="Cancelar"
            variant="outline"
            onPress={() => router.back()}
            style={styles.cancelButton}
          />
          <Button
            title="Crear Servicio"
            onPress={handleSave}
            loading={saving}
            style={styles.saveButton}
          />
        </ThemedView>

        {/* Espacio adicional */}
        <View style={styles.bottomSpacing} />
      </ScrollableInputView>
    </TabSafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  scrollContent: {
    paddingBottom: DesignTokens.spacing['3xl'],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: DesignTokens.spacing.lg,
    paddingVertical: DesignTokens.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  backButton: {
    padding: DesignTokens.spacing.sm,
  },
  title: {
    flex: 1,
    textAlign: 'center',
    marginHorizontal: DesignTokens.spacing.md,
  },
  placeholder: {
    width: 40,
  },
  form: {
    padding: DesignTokens.spacing.lg,
    gap: DesignTokens.spacing.lg,
  },
  row: {
    flexDirection: 'row',
    gap: DesignTokens.spacing.md,
  },
  halfWidth: {
    flex: 1,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: DesignTokens.spacing.lg,
    backgroundColor: Colors.light.surfaceVariant,
    borderRadius: DesignTokens.radius.md,
    marginTop: DesignTokens.spacing.md,
  },
  infoText: {
    marginLeft: DesignTokens.spacing.md,
    flex: 1,
  },
  infoTitle: {
    fontSize: DesignTokens.typography.fontSizes.base,
    fontWeight: DesignTokens.typography.fontWeights.medium as any,
    marginBottom: DesignTokens.spacing.sm,
  },
  infoDescription: {
    fontSize: DesignTokens.typography.fontSizes.sm,
    color: Colors.light.textSecondary,
    lineHeight: 20,
  },
  buttons: {
    flexDirection: 'row',
    paddingHorizontal: DesignTokens.spacing.lg,
    gap: DesignTokens.spacing.md,
  },
  cancelButton: {
    flex: 1,
  },
  saveButton: {
    flex: 2,
  },
  bottomSpacing: {
    height: DesignTokens.spacing.xl,
  },
  inputGroup: {
    marginBottom: DesignTokens.spacing.md,
  },
  label: {
    fontSize: DesignTokens.typography.fontSizes.sm,
    marginBottom: DesignTokens.spacing.xs,
    color: Colors.light.textSecondary,
    marginLeft: 4,
  },
  segmentControl: {
    flexDirection: 'row',
    backgroundColor: Colors.light.surfaceVariant,
    borderRadius: DesignTokens.radius.md,
    padding: 2,
  },
  segmentButton: {
    flex: 1,
    paddingVertical: DesignTokens.spacing.sm,
    alignItems: 'center',
    borderRadius: DesignTokens.radius.sm,
  },
  segmentButtonActive: {
    backgroundColor: Colors.light.background,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 2,
  },
  segmentText: {
    fontSize: DesignTokens.typography.fontSizes.sm,
    color: Colors.light.textSecondary,
  },
  segmentTextActive: {
    color: Colors.light.primary,
    fontWeight: DesignTokens.typography.fontWeights.semibold as any,
  },
});
