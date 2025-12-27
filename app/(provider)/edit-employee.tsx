import { BookingService } from '@/lib/booking-service';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,

  Switch,
  Text,
  TextInput,
  View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { SafeAreaView } from '@/components/ui/SafeAreaView';
import { Colors, DesignTokens } from '@/constants/Colors';
import { useAuth } from '@/contexts/AuthContext';
import { useAlert } from '@/contexts/GlobalAlertContext';
import { LogCategory, useLogger } from '@/lib/logger';

export default function EditEmployeeScreen() {
  const {
    employeeId,
    name: initialName,
    email: initialEmail,
    phone: initialPhone,
    isOwner,
    isActive
  } = useLocalSearchParams();

  const { user } = useAuth();
  const { showAlert } = useAlert();
  const log = useLogger();
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const insets = useSafeAreaInsets();

  const [formData, setFormData] = useState({
    name: '',
    position: '',
    bio: '',
    email: '',
    phone: '',
    isActive: true, // Default to true
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    // Initialize form with passed data
    setFormData({
      name: (initialName as string) || '',
      position: '', // Will be loaded from API
      bio: '', // Will be loaded from API
      email: (initialEmail as string) || '',
      phone: (initialPhone as string) || '',
      isActive: isActive === 'true', // Convert string to boolean
    });
    setLoading(false);
  }, [initialName, initialEmail, initialPhone, isActive]);

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.name.trim()) {
      newErrors.name = 'El nombre es requerido';
    }

    if (!formData.position.trim()) {
      newErrors.position = 'El puesto es requerido';
    }

    if (formData.email && !formData.email.includes('@')) {
      newErrors.email = 'Email inválido';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;
    if (!user?.id || !employeeId) {
      showAlert('Error', 'Datos inválidos');
      return;
    }

    try {
      setSaving(true);


      // In a real implementation, you'd call BookingService.updateEmployee
      log.userAction('Edit employee', {
        employeeId,
        employeeName: formData.name,
        position: formData.position
      });

      await BookingService.updateEmployee(employeeId as string, {
        name: formData.name,
        position: formData.position,
        bio: formData.bio,
        email: formData.email,
        phone: formData.phone,
        is_active: formData.isActive,
      });

      showAlert(
        'Éxito',
        `Los datos de ${formData.name} han sido actualizados correctamente`,
        undefined,
        () => router.back()
      );
    } catch (error) {
      log.error(LogCategory.SERVICE, 'Error updating employee', error);
      showAlert('Error', 'No se pudieron actualizar los datos');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    router.back();
  };

  const handleDelete = () => {
    if (isOwner === 'true') {
      showAlert('Error', 'No puedes eliminar al propietario del negocio');
      return;
    }

    showAlert(
      'Eliminar Empleado',
      `¿Estás seguro de que quieres eliminar a ${formData.name}? Esta acción no se puede deshacer.`,
      'confirm',
      async () => {
        try {
          // For now, just log the action
          log.userAction('Delete employee', { employeeId, employeeName: formData.name });
          await BookingService.deleteEmployee(employeeId as string);
          showAlert('Éxito', `${formData.name} ha sido eliminado correctamente`, undefined, () => router.back());
        } catch (error) {
          showAlert('Error', 'No se pudo eliminar el empleado');
        }
      }
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Cargando...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <View style={styles.container}>
        <KeyboardAvoidingView
          style={styles.flexContent}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? insets.top : 0}
        >
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="always"
            keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
            showsVerticalScrollIndicator={false}
          >
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.headerContent}>
                <Text style={styles.title}>Editar Empleado</Text>
                <Text style={styles.subtitle}>
                  Modifica los datos del miembro del equipo
                </Text>
              </View>
            </View>

            {/* Form */}
            <Card variant="outlined" shadow="none" style={styles.formCard}>
              <View style={styles.formSection}>
                <Text style={styles.sectionTitle}>Información Básica</Text>

                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>Nombre Completo *</Text>
                  <TextInput
                    style={[styles.textInput, errors.name ? styles.inputError : undefined]}
                    value={formData.name}
                    onChangeText={(text) => setFormData({ ...formData, name: text })}
                    placeholder="Ej: María González"
                    placeholderTextColor={Colors.light.textSecondary}
                    autoCapitalize="words"
                    textContentType="name"
                    returnKeyType="next"
                  />
                  {errors.name ? <Text style={styles.errorText}>{errors.name}</Text> : null}
                </View>

                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>Puesto *</Text>
                  <TextInput
                    style={[styles.textInput, errors.position ? styles.inputError : undefined]}
                    value={formData.position}
                    onChangeText={(text) => setFormData({ ...formData, position: text })}
                    placeholder="Ej: Barbero, Estilista, Colorista"
                    placeholderTextColor={Colors.light.textSecondary}
                    autoCapitalize="words"
                    returnKeyType="next"
                  />
                  {errors.position ? <Text style={styles.errorText}>{errors.position}</Text> : null}
                </View>

                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>Descripción</Text>
                  <TextInput
                    style={[styles.textInput, styles.textArea, errors.bio ? styles.inputError : undefined]}
                    value={formData.bio}
                    onChangeText={(text) => setFormData({ ...formData, bio: text })}
                    placeholder="Breve descripción de la experiencia y especialidades"
                    placeholderTextColor={Colors.light.textSecondary}
                    autoCapitalize="sentences"
                    multiline
                    numberOfLines={4}
                    textAlignVertical="top"
                    returnKeyType="default"
                  />
                  {errors.bio ? <Text style={styles.errorText}>{errors.bio}</Text> : null}
                </View>
              </View>

              <View style={styles.formSection}>
                <Text style={styles.sectionTitle}>Información de Contacto</Text>

                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>Email</Text>
                  <TextInput
                    style={[styles.textInput, errors.email ? styles.inputError : undefined]}
                    value={formData.email}
                    onChangeText={(text) => setFormData({ ...formData, email: text })}
                    placeholder="empleado@email.com"
                    placeholderTextColor={Colors.light.textSecondary}
                    keyboardType="email-address"
                    textContentType="emailAddress"
                    autoCapitalize="none"
                    autoCorrect={false}
                    returnKeyType="next"
                  />
                  {errors.email ? <Text style={styles.errorText}>{errors.email}</Text> : null}
                </View>

                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>Teléfono</Text>
                  <TextInput
                    style={[styles.textInput, errors.phone ? styles.inputError : undefined]}
                    value={formData.phone}
                    onChangeText={(text) => setFormData({ ...formData, phone: text })}
                    placeholder="+58 XXX XXX XXXX"
                    placeholderTextColor={Colors.light.textSecondary}
                    keyboardType="phone-pad"
                    textContentType="telephoneNumber"
                    returnKeyType="done"
                  />
                  {errors.phone ? <Text style={styles.errorText}>{errors.phone}</Text> : null}
                </View>
              </View>

              {/* Employee Status */}
              <View style={styles.formSection}>
                <Text style={styles.sectionTitle}>Estado</Text>
                <View style={styles.statusContainer}>
                  {isOwner === 'true' && (
                    <View style={styles.ownerBadge}>
                      <IconSymbol name="crown" size={16} color={Colors.light.warning} />
                      <Text style={styles.ownerText}>Propietario</Text>
                    </View>
                  )}

                  <View style={styles.switchContainer}>
                    <Text style={[styles.statusText, { color: formData.isActive ? Colors.light.success : Colors.light.textSecondary }]}>
                      {formData.isActive ? 'Activo (Visible)' : 'Inactivo (Oculto)'}
                    </Text>
                    <Switch
                      value={formData.isActive}
                      onValueChange={(value) => setFormData({ ...formData, isActive: value })}
                      trackColor={{ false: Colors.light.border, true: Colors.light.success }}
                      thumbColor="#ffffff"
                      ios_backgroundColor={Colors.light.border}
                    />
                  </View>
                </View>
              </View>
            </Card>

            {/* Danger Zone */}
            {isOwner !== 'true' && (
              <Card variant="outlined" shadow="none" style={styles.dangerCard}>
                <View style={styles.dangerContent}>
                  <IconSymbol name="exclamationmark.triangle" size={20} color={Colors.light.error} />
                  <View style={styles.dangerText}>
                    <Text style={styles.dangerTitle}>Zona Peligrosa</Text>
                    <Text style={styles.dangerDescription}>
                      Eliminar este empleado removerá todos sus datos y no se podrá deshacer.
                    </Text>
                    <Button
                      title="Eliminar Empleado"
                      onPress={handleDelete}
                      variant="outline"
                      size="small"
                      style={styles.deleteButton}
                      icon={<IconSymbol name="trash" size={16} color={Colors.light.error} />}
                    />
                  </View>
                </View>
              </Card>
            )}
            <View style={styles.bottomSpacing} />
          </ScrollView>
        </KeyboardAvoidingView>

        {/* Action Buttons */}
        <View style={[styles.bottomSection, { paddingBottom: DesignTokens.spacing['2xl'] + insets.bottom }]}>
          <View style={styles.buttonRow}>
            <Button
              title="Cancelar"
              onPress={handleCancel}
              variant="outline"
              size="large"
              style={styles.cancelButton}
            />
            <Button
              title="Guardar Cambios"
              onPress={handleSave}
              variant="primary"
              size="large"
              loading={saving}
              disabled={saving}
              style={styles.saveButton}
              icon={<IconSymbol name="checkmark" size={16} color="#ffffff" />}
            />
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.light.surface,
  },
  container: {
    flex: 1,
    backgroundColor: Colors.light.surface,
  },
  flexContent: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: DesignTokens.spacing['4xl'],
  },
  bottomSpacing: {
    height: DesignTokens.spacing['2xl'],
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: DesignTokens.typography.fontSizes.base,
    color: Colors.light.textSecondary,
  },
  header: {
    padding: DesignTokens.spacing['2xl'],
    paddingTop: DesignTokens.spacing.lg,
  },
  headerContent: {
    alignItems: 'center',
  },
  title: {
    fontSize: DesignTokens.typography.fontSizes['2xl'],
    fontWeight: DesignTokens.typography.fontWeights.bold as any,
    color: Colors.light.primary,
    marginBottom: DesignTokens.spacing.xs,
  },
  subtitle: {
    fontSize: DesignTokens.typography.fontSizes.base,
    color: Colors.light.textSecondary,
    textAlign: 'center',
  },
  formCard: {
    marginHorizontal: DesignTokens.spacing['2xl'],
    marginBottom: DesignTokens.spacing['2xl'],
  },
  formSection: {
    paddingVertical: DesignTokens.spacing.lg,
  },
  sectionTitle: {
    fontSize: DesignTokens.typography.fontSizes.lg,
    fontWeight: DesignTokens.typography.fontWeights.semibold as any,
    color: Colors.light.text,
    marginBottom: DesignTokens.spacing.sm,
  },
  fieldGroup: {
    marginBottom: DesignTokens.spacing.lg,
  },
  fieldLabel: {
    fontSize: DesignTokens.typography.fontSizes.sm,
    fontWeight: DesignTokens.typography.fontWeights.medium as any,
    color: Colors.light.text,
    marginBottom: DesignTokens.spacing.sm,
  },
  textInput: {
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: DesignTokens.radius.lg,
    paddingHorizontal: DesignTokens.spacing.lg,
    paddingVertical: DesignTokens.spacing.md,
    fontSize: DesignTokens.typography.fontSizes.base,
    color: Colors.light.text,
    backgroundColor: Colors.light.surface,
  },
  textArea: {
    minHeight: 112,
  },
  inputError: {
    borderColor: Colors.light.error,
  },
  errorText: {
    marginTop: DesignTokens.spacing.xs,
    fontSize: DesignTokens.typography.fontSizes.xs,
    color: Colors.light.error,
  },
  statusContainer: {
    flexDirection: 'row',
    gap: DesignTokens.spacing.md,
    alignItems: 'center',
    justifyContent: 'space-between', // Push switch to right
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DesignTokens.spacing.md,
  },
  ownerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.warning + '20',
    paddingHorizontal: DesignTokens.spacing.md,
    paddingVertical: DesignTokens.spacing.sm,
    borderRadius: DesignTokens.radius.md,
  },
  ownerText: {
    fontSize: DesignTokens.typography.fontSizes.sm,
    fontWeight: DesignTokens.typography.fontWeights.medium as any,
    color: Colors.light.warning,
    marginLeft: DesignTokens.spacing.xs,
  },
  statusBadge: {
    paddingHorizontal: DesignTokens.spacing.md,
    paddingVertical: DesignTokens.spacing.sm,
    borderRadius: DesignTokens.radius.md,
  },
  statusText: {
    fontSize: DesignTokens.typography.fontSizes.sm,
    color: Colors.light.surface,
    fontWeight: DesignTokens.typography.fontWeights.medium as any,
  },
  dangerCard: {
    marginHorizontal: DesignTokens.spacing['2xl'],
    borderColor: Colors.light.error + '50',
    backgroundColor: Colors.light.error + '05',
  },
  dangerContent: {
    flexDirection: 'row',
    padding: DesignTokens.spacing.lg,
  },
  dangerText: {
    marginLeft: DesignTokens.spacing.md,
    flex: 1,
  },
  dangerTitle: {
    fontSize: DesignTokens.typography.fontSizes.sm,
    fontWeight: DesignTokens.typography.fontWeights.semibold as any,
    color: Colors.light.error,
    marginBottom: DesignTokens.spacing.xs,
  },
  dangerDescription: {
    fontSize: DesignTokens.typography.fontSizes.xs,
    color: Colors.light.textSecondary,
    marginBottom: DesignTokens.spacing.md,
  },
  deleteButton: {
    borderColor: Colors.light.error,
    alignSelf: 'flex-start',
  },
  bottomSection: {
    padding: DesignTokens.spacing['2xl'],
    backgroundColor: Colors.light.background,
    borderTopWidth: 1,
    borderTopColor: Colors.light.borderLight,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: DesignTokens.spacing.md,
  },
  cancelButton: {
    flex: 1,
  },
  saveButton: {
    flex: 2,
  },
});
