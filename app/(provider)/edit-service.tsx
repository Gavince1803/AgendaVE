// Edit Service Screen - Allows provider to edit existing service details
// This screen is accessed via navigation from my-business.tsx when editing a service

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { TabSafeAreaView } from '@/components/ui/SafeAreaView';
import { ScrollableInputView } from '@/components/ui/ScrollableInputView';
import { SimpleInput } from '@/components/ui/SimpleInput';
import { Colors, DesignTokens } from '@/constants/Colors';
import { useAuth } from '@/contexts/AuthContext';
import { useAlert } from '@/contexts/GlobalAlertContext';
import { BookingService, Employee, Service } from '@/lib/booking-service';
import { LogCategory, useLogger } from '@/lib/logger';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

interface ServiceFormData {
  name: string;
  description: string;
  price_amount: string;
  price_currency: string;
  duration_minutes: string;
  is_active: boolean;
  input_type: 'fixed' | 'range' | 'starting_at';
  price_max?: string;
}

export default function EditServiceScreen() {
  const { user } = useAuth();
  const log = useLogger();
  const { showAlert } = useAlert();
  const { serviceId } = useLocalSearchParams<{ serviceId: string }>();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [service, setService] = useState<Service | null>(null);

  // Data for Employee Pricing
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [employeePrices, setEmployeePrices] = useState<Record<string, string>>({}); // employeeId -> price string

  const [formData, setFormData] = useState<ServiceFormData>({
    name: '',
    description: '',
    price_amount: '',
    price_currency: 'USD',
    duration_minutes: '',
    is_active: true,
    input_type: 'fixed',
    price_max: '',
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

      // 1. Get Service Details
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
        input_type: serviceToEdit.input_type || 'fixed',
        price_max: serviceToEdit.price_max ? serviceToEdit.price_max.toString() : '',
      });

      // 2. Get Employees
      const fetchedEmployees = await BookingService.getProviderEmployees(provider.id);
      setEmployees(fetchedEmployees);

      // 3. Get Existing Employee Prices
      const prices = await BookingService.getServiceEmployeePrices(serviceId);
      const priceMap: Record<string, string> = {};
      prices.forEach(p => {
        priceMap[p.employee_id] = p.price.toString();
      });
      setEmployeePrices(priceMap);

      console.log('🔴 [EDIT SERVICE] Data loaded. Employees:', fetchedEmployees.length, 'Prices:', prices.length);
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

    if (formData.input_type === 'range') {
      const priceMax = parseFloat(formData.price_max || '0');
      if (isNaN(priceMax) || priceMax <= priceAmount) {
        showAlert('Error', 'El precio máximo debe ser mayor al precio base');
        return;
      }
    }

    const durationMinutes = parseInt(formData.duration_minutes);
    if (isNaN(durationMinutes) || durationMinutes <= 0) {
      showAlert('Error', 'La duración debe ser un número mayor a 0');
      return;
    }

    // Confirmation dialog
    // Simplified confirmation for now to include custom pricing note
    showAlert(
      'Confirmar Cambios',
      `¿Estás seguro de que quieres actualizar este servicio?`,
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

      // 1. Update Service Base Data
      const updateData = {
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        price_amount: parseFloat(formData.price_amount),
        price_currency: formData.price_currency,
        duration_minutes: parseInt(formData.duration_minutes),
        is_active: formData.is_active,
        input_type: formData.input_type,
        price_max: formData.price_max ? parseFloat(formData.price_max) : undefined,
      };

      await BookingService.updateService(serviceId!, updateData);

      // 2. Update Employee Prices
      const promises = employees.map(async (emp) => {
        const customPriceStr = employeePrices[emp.id];
        if (customPriceStr && customPriceStr.trim() !== '') {
          const price = parseFloat(customPriceStr);
          if (!isNaN(price)) {
            return BookingService.upsertServiceEmployeePrice(serviceId!, emp.id, price);
          }
        } else {
          // Check if we need to remove it (if it existed before)
          // Ideally we check if it was in initial load, but for now calling remove is safe/idempotent enough
          return BookingService.removeServiceEmployeePrice(serviceId!, emp.id);
        }
      });

      await Promise.all(promises);

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

  const updateEmployeePrice = (employeeId: string, text: string) => {
    setEmployeePrices(prev => ({
      ...prev,
      [employeeId]: text
    }));
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
      <ScrollableInputView style={styles.container} contentContainerStyle={styles.scrollContent}>
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

        {/* Basic Info Form */}
        <Card variant="elevated" style={styles.formCard}>
          <ThemedText type="subtitle" style={styles.formTitle}>
            Información del Servicio
          </ThemedText>

          <SimpleInput
            label="Nombre del Servicio *"
            value={formData.name}
            onChangeText={(text) => setFormData(prev => ({ ...prev, name: text }))}
            placeholder="Ej: Corte de cabello"
            autoCapitalize="words"
          />

          <SimpleInput
            label="Descripción"
            value={formData.description}
            onChangeText={(text) => setFormData(prev => ({ ...prev, description: text }))}
            placeholder="Describe tu servicio (opcional)"
            multiline
            numberOfLines={3}
            style={styles.textArea}
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
                    formData.input_type === type && styles.segmentButtonActive
                  ]}
                  onPress={() => setFormData(prev => ({ ...prev, input_type: type }))}
                >
                  <ThemedText style={[
                    styles.segmentText,
                    formData.input_type === type && styles.segmentTextActive
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
                label={formData.input_type === 'range' ? "Precio Mínimo *" : formData.input_type === 'starting_at' ? "Precio Inicial *" : "Precio ($) *"}
                value={formData.price_amount}
                onChangeText={(text) => setFormData(prev => ({ ...prev, price_amount: text }))}
                placeholder="0.00"
                keyboardType="numeric"
              />
            </View>

            {formData.input_type === 'range' && (
              <View style={styles.halfWidth}>
                <SimpleInput
                  label="Precio Máximo *"
                  value={formData.price_max || ''}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, price_max: text }))}
                  placeholder="0.00"
                  keyboardType="numeric"
                />
              </View>
            )}
          </View>

          <SimpleInput
            label="Duración (minutos) *"
            value={formData.duration_minutes}
            onChangeText={(text) => setFormData(prev => ({ ...prev, duration_minutes: text }))}
            placeholder="30"
            keyboardType="numeric"
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

        {/* Employee Pricing Section - HIDDEN ON REQUEST, MOVED TO EMPLOYEE SIDE */}
        {/* {employees.length > 0 && (
          <Card variant="elevated" style={styles.formCard}>
            <ThemedText type="subtitle" style={styles.formTitle}>
              Precios por Empleado
            </ThemedText>
            <ThemedText style={styles.sectionDescription}>
              Define un precio diferente si un empleado específico realiza este servicio. Deja en blanco para usar el precio base.
            </ThemedText>

            <View style={styles.employeeList}>
              {employees.map(emp => (
                <View key={emp.id} style={styles.employeeRow}>
                  <View style={styles.employeeInfo}>
                    <Avatar
                      name={emp.name}
                      source={emp.profile_image_url ? { uri: emp.profile_image_url } : undefined}
                      size="medium"
                    />
                    <ThemedText style={styles.employeeName} numberOfLines={1}>{emp.name}</ThemedText>
                  </View>
                  <View style={styles.employeeInputContainer}>
                    <SimpleInput
                      label=""
                      value={employeePrices[emp.id] || ''}
                      onChangeText={(text) => updateEmployeePrice(emp.id, text)}
                      placeholder={`Default ($${formData.price_amount || '0'})`}
                      keyboardType="numeric"
                      containerStyle={{ marginBottom: 0 }}
                    />
                  </View>
                </View>
              ))}
            </View>
          </Card>
        )} */}

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
    marginBottom: DesignTokens.spacing.sm,
  },
  sectionDescription: {
    fontSize: DesignTokens.typography.fontSizes.sm,
    color: Colors.light.textSecondary,
    marginBottom: DesignTokens.spacing.md,
  },
  textArea: {
    minHeight: 80,
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
  row: {
    flexDirection: 'row',
    gap: DesignTokens.spacing.md,
  },
  halfWidth: {
    flex: 1,
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
  employeeList: {
    gap: DesignTokens.spacing.md,
  },
  employeeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: DesignTokens.spacing.md,
  },
  employeeInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: DesignTokens.spacing.sm,
  },
  employeeName: {
    fontSize: DesignTokens.typography.fontSizes.base,
    fontWeight: DesignTokens.typography.fontWeights.medium as any,
    color: Colors.light.text,
    flexShrink: 1,
  },
  employeeInputContainer: {
    width: 100,
  }
});