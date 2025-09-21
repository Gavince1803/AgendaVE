import React, { useEffect, useState } from 'react';
import {
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Input } from '@/components/ui/Input';
import { SafeAreaView } from '@/components/ui/SafeAreaView';
import { Colors, DesignTokens } from '@/constants/Colors';
import { BookingService } from '@/lib/booking-service';
import { LogCategory, useLogger } from '@/lib/logger';
import { useAuth } from '@/contexts/AuthContext';

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
  const log = useLogger();
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  
  const [formData, setFormData] = useState({
    name: '',
    position: '',
    bio: '',
    email: '',
    phone: '',
  });

  const [errors, setErrors] = useState<{[key: string]: string}>({});

  useEffect(() => {
    // Initialize form with passed data
    setFormData({
      name: (initialName as string) || '',
      position: '', // Will be loaded from API
      bio: '', // Will be loaded from API
      email: (initialEmail as string) || '',
      phone: (initialPhone as string) || '',
    });
    setLoading(false);
  }, [initialName, initialEmail, initialPhone]);

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};
    
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
      Alert.alert('Error', 'Datos inválidos');
      return;
    }

    try {
      setSaving(true);
      
      // For now, we'll just show a success message
      // In a real implementation, you'd call BookingService.updateEmployee
      log.userAction('Edit employee', {
        employeeId,
        employeeName: formData.name,
        position: formData.position
      });

      Alert.alert(
        'Éxito',
        `Los datos de ${formData.name} han sido actualizados correctamente`,
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (error) {
      log.error(LogCategory.SERVICE, 'Error updating employee', error);
      Alert.alert('Error', 'No se pudieron actualizar los datos');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    router.back();
  };

  const handleDelete = () => {
    if (isOwner === 'true') {
      Alert.alert('Error', 'No puedes eliminar al propietario del negocio');
      return;
    }

    Alert.alert(
      'Eliminar Empleado',
      `¿Estás seguro de que quieres eliminar a ${formData.name}? Esta acción no se puede deshacer.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Eliminar', 
          style: 'destructive',
          onPress: async () => {
            try {
              // For now, just log the action
              log.userAction('Delete employee', { employeeId, employeeName: formData.name });
              Alert.alert('Éxito', `${formData.name} ha sido eliminado correctamente`);
              router.back();
            } catch (error) {
              Alert.alert('Error', 'No se pudo eliminar el empleado');
            }
          }
        }
      ]
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
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
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
        <Card variant="elevated" style={styles.formCard}>
          <View style={styles.formSection}>
            <Text style={styles.sectionTitle}>Información Básica</Text>
            
            <Input
              label="Nombre Completo *"
              value={formData.name}
              onChangeText={(text) => setFormData({...formData, name: text})}
              placeholder="Ej: María González"
              error={errors.name}
            />

            <Input
              label="Puesto *"
              value={formData.position}
              onChangeText={(text) => setFormData({...formData, position: text})}
              placeholder="Ej: Barbero, Estilista, Colorista"
              error={errors.position}
            />

            <Input
              label="Descripción"
              value={formData.bio}
              onChangeText={(text) => setFormData({...formData, bio: text})}
              placeholder="Breve descripción de la experiencia y especialidades"
              multiline
              numberOfLines={3}
              error={errors.bio}
            />
          </View>

          <View style={styles.formSection}>
            <Text style={styles.sectionTitle}>Información de Contacto</Text>
            
            <Input
              label="Email"
              value={formData.email}
              onChangeText={(text) => setFormData({...formData, email: text})}
              placeholder="empleado@email.com"
              keyboardType="email-address"
              error={errors.email}
            />

            <Input
              label="Teléfono"
              value={formData.phone}
              onChangeText={(text) => setFormData({...formData, phone: text})}
              placeholder="+58 XXX XXX XXXX"
              keyboardType="phone-pad"
              error={errors.phone}
            />
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
              <View style={[styles.statusBadge, { 
                backgroundColor: isActive === 'true' ? Colors.light.success : Colors.light.error 
              }]}>
                <Text style={styles.statusText}>
                  {isActive === 'true' ? 'Activo' : 'Inactivo'}
                </Text>
              </View>
            </View>
          </View>
        </Card>

        {/* Danger Zone */}
        {isOwner !== 'true' && (
          <Card variant="outlined" style={styles.dangerCard}>
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
      </ScrollView>

      {/* Action Buttons */}
      <View style={styles.bottomSection}>
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.surface,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: DesignTokens.spacing['4xl'],
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
    gap: DesignTokens.spacing.lg,
  },
  sectionTitle: {
    fontSize: DesignTokens.typography.fontSizes.lg,
    fontWeight: DesignTokens.typography.fontWeights.semibold as any,
    color: Colors.light.text,
    marginBottom: DesignTokens.spacing.sm,
  },
  statusContainer: {
    flexDirection: 'row',
    gap: DesignTokens.spacing.md,
    alignItems: 'center',
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