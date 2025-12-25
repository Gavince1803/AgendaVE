// Edit Service Screen - Allows provider to edit existing service details
// This screen is accessed via navigation from my-business.tsx when editing a service

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Input } from '@/components/ui/Input';
import { TabSafeAreaView } from '@/components/ui/SafeAreaView';
import { Colors, DesignTokens } from '@/constants/Colors';
import { useAuth } from '@/contexts/AuthContext';
import { useAlert } from '@/contexts/GlobalAlertContext';
import { BookingService, Service } from '@/lib/booking-service';
import { LogCategory, useLogger } from '@/lib/logger';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';

interface ServiceFormData {
  name: string;
  description: string;
  price_amount: string;
  price_currency: string;
  duration_minutes: string;
  is_active: boolean;
}

export default function EditServiceScreen() {
  const { user } = useAuth();
  const log = useLogger();
  const { showAlert } = useAlert();
  const { serviceId } = useLocalSearchParams<{ serviceId: string }>();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [service, setService] = useState<Service | null>(null);

  const [formData, setFormData] = useState<ServiceFormData>({
    name: '',
    description: '',
    price_amount: '',
    price_currency: 'USD',
    duration_minutes: '',
    is_active: true,
  });

  useEffect(() => {
    if (serviceId) {
      loadServiceData();
    }
  }, [serviceId]);

  const loadServiceData = async () => {
    if (!user || !serviceId) return;

    try {
      setLoading(true);
      console.log('🔴 [EDIT SERVICE] Loading service data for serviceId:', serviceId);

      // Get provider first
      const provider = await BookingService.getProviderById(user.id);
      if (!provider) {
        throw new Error('Provider not found');
      }

      // Get all services (active and inactive) and find the one we want to edit
      const services = await BookingService.getAllProviderServices(provider.id);
      const serviceToEdit = services.find(s => s.id === serviceId);

      if (!serviceToEdit) {
        throw new Error('Service not found');
      }

      setService(serviceToEdit);
      setFormData({
        name: serviceToEdit.name,
        description: serviceToEdit.description || '',
        price_amount: serviceToEdit.price_amount.toString(),
        price_currency: serviceToEdit.price_currency,
        duration_minutes: serviceToEdit.duration_minutes.toString(),
        is_active: serviceToEdit.is_active,
      });

      console.log('🔴 [EDIT SERVICE] Service data loaded:', serviceToEdit);
    } catch (error) {
      console.error('🔴 [EDIT SERVICE] Error loading service data:', error);
      log.error(LogCategory.SERVICE, 'Error loading service data', { error: error instanceof Error ? error.message : String(error) });
      showAlert('Error', 'No se pudo cargar la información del servicio');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user || !service) return;

    // Validation
    if (!formData.name.trim()) {
      showAlert('Error', 'El nombre del servicio es obligatorio');
      return;
    }

    const priceAmount = parseFloat(formData.price_amount);
    if (isNaN(priceAmount) || priceAmount <= 0) {
      showAlert('Error', 'El precio debe ser un número mayor a 0');
      return;
    }

    const durationMinutes = parseInt(formData.duration_minutes);
    if (isNaN(durationMinutes) || durationMinutes <= 0) {
      showAlert('Error', 'La duración debe ser un número mayor a 0');
      return;
    }

    // Confirmation dialog
    const changes = [];
    if (formData.name !== service.name) changes.push(`Nombre: "${service.name}" → "${formData.name}"`);
    if (formData.description !== (service.description || '')) changes.push(`Descripción: "${service.description || 'Sin descripción'}" → "${formData.description}"`);
    if (parseFloat(formData.price_amount) !== service.price_amount) changes.push(`Precio: $${service.price_amount} → $${formData.price_amount}`);
    if (parseInt(formData.duration_minutes) !== service.duration_minutes) changes.push(`Duración: ${service.duration_minutes} min → ${formData.duration_minutes} min`);
    if (formData.is_active !== service.is_active) changes.push(`Estado: ${service.is_active ? 'Activo' : 'Inactivo'} → ${formData.is_active ? 'Activo' : 'Inactivo'}`);

    if (changes.length === 0) {
      showAlert('Información', 'No hay cambios para guardar');
      return;
    }

    const changesText = changes.join('\n');

    showAlert(
      'Confirmar Cambios',
      `¿Estás seguro de que quieres actualizar este servicio?\n\nCambios a realizar:\n${changesText}`,
      [
        {
          text: 'Cancelar',
          style: 'cancel'
        },
        {
          text: 'Actualizar Servicio',
          style: 'default',
          onPress: saveService
        }
      ]
    );
  };

  const saveService = async () => {
    try {
      setSaving(true);
      console.log('🔴 [EDIT SERVICE] Updating service with data:', formData);

      log.userAction('Update service', {
        serviceId,
        providerId: user!.id,
        changes: formData
      });

      const updateData = {
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        price_amount: parseFloat(formData.price_amount),
        price_currency: formData.price_currency,
        duration_minutes: parseInt(formData.duration_minutes),
        is_active: formData.is_active,
      };

      await BookingService.updateService(serviceId!, updateData);

      console.log('🔴 [EDIT SERVICE] ✅ Service updated successfully');

      showAlert(
        'Éxito',
        'Servicio actualizado exitosamente',
        [
          {
            text: 'OK',
            onPress: () => router.push('/(provider)/my-business')
          }
        ]
      );
    } catch (error) {
      console.error('🔴 [EDIT SERVICE] Error updating service:', error);
      log.error(LogCategory.SERVICE, 'Error updating service', { error: error instanceof Error ? error.message : String(error) });

      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      showAlert('Error al Actualizar Servicio', errorMessage);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <TabSafeAreaView style={styles.container}>
        <ThemedView style={styles.loadingContainer}>
          <ThemedText style={styles.loadingText}>Cargando servicio...</ThemedText>
        </ThemedView>
      </TabSafeAreaView>
    );
  }

  if (!service) {
    return (
      <TabSafeAreaView style={styles.container}>
        <ThemedView style={styles.errorContainer}>
          <ThemedText style={styles.errorText}>Servicio no encontrado</ThemedText>
          <Button
            title="Volver"
            onPress={() => router.push('/(provider)/my-business')}
            style={styles.backButton}
          />
        </ThemedView>
      </TabSafeAreaView>
    );
  }

  return (
    <TabSafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <ThemedView style={styles.header}>
          <TouchableOpacity
            style={styles.backButtonHeader}
            onPress={() => router.push('/(provider)/my-business')}
          >
            <IconSymbol name="chevron.left" size={24} color={Colors.light.text} />
          </TouchableOpacity>
          <ThemedText type="title" style={styles.title}>
            Editar Servicio
          </ThemedText>
          <View style={styles.placeholder} />
        </ThemedView>

        {/* Form */}
        <Card variant="elevated" style={styles.formCard}>
          <ThemedText type="subtitle" style={styles.formTitle}>
            Información del Servicio
          </ThemedText>

          <Input
            label="Nombre del Servicio *"
            value={formData.name}
            onChangeText={(text) => setFormData({ ...formData, name: text })}
            placeholder="Ej: Corte de cabello"
            autoCapitalize="words"
          />

          <Input
            label="Descripción"
            value={formData.description}
            onChangeText={(text) => setFormData({ ...formData, description: text })}
            placeholder="Describe tu servicio (opcional)"
            multiline
            numberOfLines={3}
            style={styles.textArea}
          />

          <Input
            label="Precio (USD) *"
            value={formData.price_amount}
            onChangeText={(text) => setFormData({ ...formData, price_amount: text })}
            placeholder="0.00"
            keyboardType="numeric"
            leftIcon={<ThemedText style={styles.currencySymbol}>$</ThemedText>}
          />

          <Input
            label="Duración (minutos) *"
            value={formData.duration_minutes}
            onChangeText={(text) => setFormData({ ...formData, duration_minutes: text })}
            placeholder="30"
            keyboardType="numeric"
            rightIcon={<ThemedText style={styles.unitLabel}>min</ThemedText>}
          />

          {/* Service Status Toggle */}
          <View style={styles.statusSection}>
            <ThemedText style={styles.statusLabel}>Estado del Servicio</ThemedText>
            <View style={styles.statusToggle}>
              <TouchableOpacity
                style={[
                  styles.statusButton,
                  formData.is_active && styles.statusButtonActive
                ]}
                onPress={() => setFormData({ ...formData, is_active: true })}
              >
                <ThemedText style={[
                  styles.statusButtonText,
                  formData.is_active && styles.statusButtonTextActive
                ]}>
                  Activo
                </ThemedText>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.statusButton,
                  !formData.is_active && styles.statusButtonInactive
                ]}
                onPress={() => setFormData({ ...formData, is_active: false })}
              >
                <ThemedText style={[
                  styles.statusButtonText,
                  !formData.is_active && styles.statusButtonTextInactive
                ]}>
                  Inactivo
                </ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        </Card>

        {/* Preview */}
        <Card variant="elevated" style={styles.previewCard}>
          <ThemedText type="subtitle" style={styles.previewTitle}>
            Vista Previa
          </ThemedText>
          <View style={styles.previewContent}>
            <View style={styles.previewHeader}>
              <ThemedText style={styles.previewServiceName}>
                {formData.name || 'Nombre del servicio'}
              </ThemedText>
              <View style={[
                styles.previewStatus,
                { backgroundColor: formData.is_active ? Colors.light.success : Colors.light.error }
              ]}>
                <ThemedText style={styles.previewStatusText}>
                  {formData.is_active ? 'Activo' : 'Inactivo'}
                </ThemedText>
              </View>
            </View>
            <ThemedText style={styles.previewDescription}>
              {formData.description || 'Sin descripción'}
            </ThemedText>
            <View style={styles.previewDetails}>
              <ThemedText style={styles.previewPrice}>
                ${formData.price_amount || '0.00'}
              </ThemedText>
              <ThemedText style={styles.previewDuration}>
                {formData.duration_minutes || '0'} min
              </ThemedText>
            </View>
          </View>
        </Card>

        {/* Action Buttons */}
        <ThemedView style={styles.actions}>
          <Button
            title="Cancelar"
            variant="outline"
            onPress={() => router.push('/(provider)/my-business')}
            style={styles.cancelButton}
          />
          <Button
            title={saving ? "Actualizando..." : "Actualizar Servicio"}
            onPress={handleSave}
            loading={saving}
            disabled={saving}
            style={styles.saveButton}
          />
        </ThemedView>

        {/* Bottom Spacing */}
        <View style={styles.bottomSpacing} />
      </ScrollView>
    </TabSafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: DesignTokens.typography.fontSizes.lg,
    color: Colors.light.textSecondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: DesignTokens.spacing.xl,
  },
  errorText: {
    fontSize: DesignTokens.typography.fontSizes.lg,
    color: Colors.light.textSecondary,
    marginBottom: DesignTokens.spacing.lg,
    textAlign: 'center',
  },
  backButton: {
    marginTop: DesignTokens.spacing.md,
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
  backButtonHeader: {
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
  formCard: {
    margin: DesignTokens.spacing.lg,
    marginBottom: DesignTokens.spacing.md,
  },
  formTitle: {
    marginBottom: DesignTokens.spacing.lg,
  },
  textArea: {
    minHeight: 80,
  },
  currencySymbol: {
    fontSize: DesignTokens.typography.fontSizes.base,
    color: Colors.light.textSecondary,
    marginRight: DesignTokens.spacing.sm,
  },
  unitLabel: {
    fontSize: DesignTokens.typography.fontSizes.base,
    color: Colors.light.textSecondary,
    marginLeft: DesignTokens.spacing.sm,
  },
  statusSection: {
    marginTop: DesignTokens.spacing.md,
  },
  statusLabel: {
    fontSize: DesignTokens.typography.fontSizes.base,
    fontWeight: DesignTokens.typography.fontWeights.medium as any,
    color: Colors.light.text,
    marginBottom: DesignTokens.spacing.sm,
  },
  statusToggle: {
    flexDirection: 'row',
    borderRadius: DesignTokens.radius.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  statusButton: {
    flex: 1,
    paddingVertical: DesignTokens.spacing.md,
    alignItems: 'center',
    backgroundColor: Colors.light.surface,
  },
  statusButtonActive: {
    backgroundColor: Colors.light.success,
  },
  statusButtonInactive: {
    backgroundColor: Colors.light.error,
  },
  statusButtonText: {
    fontSize: DesignTokens.typography.fontSizes.base,
    fontWeight: DesignTokens.typography.fontWeights.medium as any,
    color: Colors.light.text,
  },
  statusButtonTextActive: {
    color: Colors.light.surface,
  },
  statusButtonTextInactive: {
    color: Colors.light.surface,
  },
  previewCard: {
    margin: DesignTokens.spacing.lg,
    marginBottom: DesignTokens.spacing.md,
  },
  previewTitle: {
    marginBottom: DesignTokens.spacing.lg,
  },
  previewContent: {
    gap: DesignTokens.spacing.sm,
  },
  previewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  previewServiceName: {
    fontSize: DesignTokens.typography.fontSizes.lg,
    fontWeight: DesignTokens.typography.fontWeights.bold as any,
    color: Colors.light.text,
    flex: 1,
  },
  previewStatus: {
    paddingHorizontal: DesignTokens.spacing.sm,
    paddingVertical: DesignTokens.spacing.xs,
    borderRadius: DesignTokens.radius.sm,
    marginLeft: DesignTokens.spacing.md,
  },
  previewStatusText: {
    fontSize: DesignTokens.typography.fontSizes.xs,
    fontWeight: DesignTokens.typography.fontWeights.medium as any,
    color: Colors.light.surface,
  },
  previewDescription: {
    fontSize: DesignTokens.typography.fontSizes.base,
    color: Colors.light.textSecondary,
    lineHeight: 22,
  },
  previewDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  previewPrice: {
    fontSize: DesignTokens.typography.fontSizes.xl,
    fontWeight: DesignTokens.typography.fontWeights.bold as any,
    color: Colors.light.primary,
  },
  previewDuration: {
    fontSize: DesignTokens.typography.fontSizes.base,
    color: Colors.light.textSecondary,
  },
  actions: {
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
});