import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { SafeAreaView } from '@/components/ui/SafeAreaView';
import { Colors, DesignTokens } from '@/constants/Colors';
import { BookingService } from '@/lib/booking-service';
import { EmailService } from '@/lib/email-service';
import { LogCategory, useLogger } from '@/lib/logger';
import { useAuth } from '@/contexts/AuthContext';

export default function AddEmployeeScreen() {
  const { user } = useAuth();
  const log = useLogger();
  const [saving, setSaving] = useState(false);
  const insets = useSafeAreaInsets();
  
  const [formData, setFormData] = useState({
    name: '',
    position: '',
    bio: '',
    email: '',
    phone: '',
  });

  const [errors, setErrors] = useState<{[key: string]: string}>({});

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'El nombre es requerido';
    }
    
    if (!formData.position.trim()) {
      newErrors.position = 'El puesto es requerido';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'El email es requerido';
    } else if (!formData.email.includes('@')) {
      newErrors.email = 'Email inválido';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;
    if (!user?.id) {
      Alert.alert('Error', 'Usuario no válido');
      return;
    }

    try {
      setSaving(true);
      
      // Get provider info first
      const provider = await BookingService.getProviderById(user.id);
      if (!provider) {
        throw new Error('Proveedor no encontrado');
      }

<<<<<<< HEAD
      // Create employee
      const employee = await BookingService.createEmployee({
        provider_id: provider.id,
=======
      const invite = await BookingService.inviteEmployee({
>>>>>>> 4f028a25ab1f4ddd6bcf58b02d23bab2d9ec4dd4
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim() || undefined,
        position: formData.position.trim(),
        bio: formData.bio.trim(),
      });

      log.userAction('Create employee', {
        employeeName: formData.name,
        position: formData.position,
        providerId: provider.id,
        inviteToken: invite.inviteToken,
      });

<<<<<<< HEAD
      // Send invitation email if email provided
      if (formData.email && formData.email.trim()) {
        try {
          console.log('📧 Sending invitation email to employee...');
          const token = await EmailService.createInvitationToken(employee.id, provider.id);
          const invitationLink = EmailService.generateInvitationLink(employee.id, provider.id, token);
          
          await EmailService.sendEmployeeInvitation(
            formData.email.trim(),
            formData.name.trim(),
            provider.business_name || provider.name,
            invitationLink
          );
          
          console.log('📧 ✅ Invitation email sent successfully');
        } catch (emailError) {
          console.warn('⚠️ Could not send invitation email:', emailError);
          // Don't fail the employee creation if email fails
        }
      }

      Alert.alert(
        'Éxito',
        formData.email 
          ? `${formData.name} ha sido agregado al equipo. Se ha enviado un email de invitación a ${formData.email}`
          : `${formData.name} ha sido agregado al equipo correctamente`,
        [{ text: 'OK', onPress: () => router.back() }]
=======
      const inviteUrl = invite.inviteUrl;
      const inviteToken = invite.inviteToken;
      const inviteMessage = `Hola ${formData.name},\nTe invito a unirte al equipo ${provider.business_name || ''} en AgendaVE.\n\nEnlace: ${inviteUrl}\nCódigo: ${inviteToken}\n\nDescarga la app AgendaVE, inicia sesión o crea tu cuenta y usa el código para aceptar la invitación.`;

      Alert.alert(
        'Invitación creada',
        `Comparte este enlace con ${formData.name}:\n${inviteUrl}\n\nCódigo: ${inviteToken}`,
        [
          {
            text: 'Compartir',
            onPress: async () => {
              try {
                await Share.share({ message: inviteMessage });
              } catch (shareError) {
                console.warn('Error sharing invite:', shareError);
              }
            }
          },
          {
            text: 'Listo',
            style: 'default',
            onPress: () => router.back(),
          }
        ]
>>>>>>> 4f028a25ab1f4ddd6bcf58b02d23bab2d9ec4dd4
      );
    } catch (error) {
      log.error(LogCategory.SERVICE, 'Error creating employee', error);
      Alert.alert('Error', 'No se pudo agregar el empleado');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (formData.name || formData.position || formData.bio) {
      Alert.alert(
        'Descartar Cambios',
        '¿Estás seguro de que quieres descartar los cambios?',
        [
          { text: 'Continuar Editando', style: 'cancel' },
          { text: 'Descartar', style: 'destructive', onPress: () => router.back() }
        ]
      );
    } else {
      router.back();
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <View style={styles.container}>
        <KeyboardAvoidingView
          style={styles.flexContent}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? insets.top + 12 : 0}
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
              <Text style={styles.title}>Agregar Empleado</Text>
              <Text style={styles.subtitle}>
                Agrega un nuevo miembro a tu equipo de trabajo
              </Text>
            </View>
          </View>

          {/* Form */}
          <Card variant="elevated" style={styles.formCard}>
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
          </Card>

          {/* Information Card */}
          <Card variant="outlined" style={styles.infoCard}>
            <View style={styles.infoContent}>
              <IconSymbol name="info.circle" size={20} color={Colors.light.info} />
              <View style={styles.infoText}>
                <Text style={styles.infoTitle}>Información Importante</Text>
                <Text style={styles.infoDescription}>
                  • Los campos marcados con * son obligatorios{'\n'}
                  • El empleado recibirá un enlace para crear su cuenta{'\n'}
                  • Puedes configurar horarios personalizados más tarde
                </Text>
              </View>
            </View>
          </Card>
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
              title="Agregar Empleado"
              onPress={handleSave}
              variant="primary"
              size="large"
              loading={saving}
              disabled={saving}
              style={styles.saveButton}
              icon={<IconSymbol name="person.badge.plus" size={16} color="#ffffff" />}
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
  infoCard: {
    marginHorizontal: DesignTokens.spacing['2xl'],
    backgroundColor: Colors.light.info + '10',
    borderColor: Colors.light.info + '30',
  },
  infoContent: {
    flexDirection: 'row',
    padding: DesignTokens.spacing.lg,
  },
  infoText: {
    marginLeft: DesignTokens.spacing.md,
    flex: 1,
  },
  infoTitle: {
    fontSize: DesignTokens.typography.fontSizes.sm,
    fontWeight: DesignTokens.typography.fontWeights.semibold as any,
    color: Colors.light.text,
    marginBottom: DesignTokens.spacing.xs,
  },
  infoDescription: {
    fontSize: DesignTokens.typography.fontSizes.xs,
    color: Colors.light.textSecondary,
    lineHeight: 16,
  },
  bottomSpacing: {
    height: DesignTokens.spacing['2xl'],
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
