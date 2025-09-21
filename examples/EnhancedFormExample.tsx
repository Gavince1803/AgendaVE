// 📝 Example: Enhanced Form with Validation
// This shows how to upgrade existing forms with modern UI and validation

import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, KeyboardAvoidingView, Platform, Text } from 'react-native';
import { EnhancedButton, EnhancedInput, EnhancedCard, LoadingOverlay } from '../components/ui/EnhancedComponents';
import { validateInput, serviceCreationSchema, ValidationError } from '../lib/validation';
import { handleError, withErrorHandling } from '../lib/errorHandling';
import { Colors, DesignTokens } from '../constants/Colors';

// ===== EXAMPLE: ENHANCED SERVICE CREATION FORM =====
interface ServiceFormData {
  name: string;
  description: string;
  priceAmount: string;
  durationMinutes: string;
}

export const EnhancedServiceCreationForm: React.FC<{
  onSubmit: (data: ServiceFormData) => Promise<void>;
  onCancel: () => void;
}> = ({ onSubmit, onCancel }) => {
  const [formData, setFormData] = useState<ServiceFormData>({
    name: '',
    description: '',
    priceAmount: '',
    durationMinutes: '',
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  // Real-time validation
  const validateField = (field: keyof ServiceFormData, value: string) => {
    try {
      switch (field) {
        case 'name':
          validateInput(serviceCreationSchema.shape.name, value);
          break;
        case 'description':
          if (value) validateInput(serviceCreationSchema.shape.description, value);
          break;
        case 'priceAmount':
          validateInput(serviceCreationSchema.shape.priceAmount, parseFloat(value) || 0);
          break;
        case 'durationMinutes':
          validateInput(serviceCreationSchema.shape.durationMinutes, parseInt(value) || 0);
          break;
      }
      // Clear error if validation passes
      setErrors(prev => ({ ...prev, [field]: '' }));
    } catch (error) {
      if (error instanceof ValidationError) {
        setErrors(prev => ({ ...prev, [field]: error.message }));
      }
    }
  };

  const handleFieldChange = (field: keyof ServiceFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Validate field after a short delay (debounced validation)
    setTimeout(() => validateField(field, value), 300);
  };

  const handleSubmit = async () => {
    setLoading(true);
    
    try {
      // Validate entire form
      const validatedData = validateInput(serviceCreationSchema, {
        name: formData.name,
        description: formData.description || undefined,
        priceAmount: parseFloat(formData.priceAmount),
        durationMinutes: parseInt(formData.durationMinutes),
      });

      // Submit with error handling
      await withErrorHandling(
        () => onSubmit(formData),
        { 
          action: 'create_service',
          additionalContext: { formData } 
        }
      );

    } catch (error) {
      if (error instanceof ValidationError) {
        setErrors({ [error.field || 'general']: error.message });
      } else {
        handleError(error, { action: 'service_creation_form' });
      }
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = () => {
    return formData.name.trim() && 
           formData.priceAmount.trim() && 
           formData.durationMinutes.trim() &&
           Object.values(errors).every(error => !error);
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <EnhancedCard variant="elevated" padding="lg" style={styles.formCard}>
          
          {/* Service Name */}
          <EnhancedInput
            label="Nombre del Servicio *"
            placeholder="Ej. Corte de cabello, Manicure"
            value={formData.name}
            onChangeText={(value) => handleFieldChange('name', value)}
            icon="cut-outline"
            error={errors.name}
          />

          {/* Description */}
          <EnhancedInput
            label="Descripción"
            placeholder="Describe tu servicio (opcional)"
            value={formData.description}
            onChangeText={(value) => handleFieldChange('description', value)}
            icon="document-text-outline"
            multiline
            numberOfLines={3}
            error={errors.description}
          />

          {/* Price */}
          <EnhancedInput
            label="Precio *"
            placeholder="0.00"
            value={formData.priceAmount}
            onChangeText={(value) => handleFieldChange('priceAmount', value)}
            icon="cash-outline"
            keyboardType="numeric"
            error={errors.priceAmount}
          />

          {/* Duration */}
          <EnhancedInput
            label="Duración (minutos) *"
            placeholder="Ej. 30, 60, 90"
            value={formData.durationMinutes}
            onChangeText={(value) => handleFieldChange('durationMinutes', value)}
            icon="time-outline"
            keyboardType="numeric"
            error={errors.durationMinutes}
          />

        </EnhancedCard>
        
        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          <EnhancedButton
            title="Cancelar"
            onPress={onCancel}
            variant="outline"
            style={styles.cancelButton}
          />
          
          <EnhancedButton
            title="Crear Servicio"
            onPress={handleSubmit}
            loading={loading}
            disabled={!isFormValid()}
            icon="add-outline"
            style={styles.submitButton}
          />
        </View>
        
      </ScrollView>

      {/* Loading Overlay */}
      <LoadingOverlay 
        visible={loading} 
        message="Creando servicio..." 
      />
    </KeyboardAvoidingView>
  );
};

// ===== EXAMPLE: ENHANCED BOOKING FORM =====
export const EnhancedBookingForm: React.FC<{
  serviceData: { name: string; price: number; duration: number };
  onSubmit: (data: any) => Promise<void>;
  onCancel: () => void;
}> = ({ serviceData, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    date: '',
    time: '',
    notes: '',
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView style={styles.scrollView}>
        
        {/* Service Info Card */}
        <EnhancedCard variant="elevated" padding="md" style={styles.serviceInfoCard}>
          <Text style={styles.serviceTitle}>{serviceData.name}</Text>
          <View style={styles.serviceDetails}>
            <Text style={styles.servicePrice}>${serviceData.price}</Text>
            <Text style={styles.serviceDuration}>{serviceData.duration} min</Text>
          </View>
        </EnhancedCard>

        {/* Booking Form */}
        <EnhancedCard variant="elevated" padding="lg" style={styles.formCard}>
          
          <EnhancedInput
            label="Fecha de la Cita *"
            placeholder="Seleccionar fecha"
            value={formData.date}
            onChangeText={(value) => setFormData(prev => ({ ...prev, date: value }))}
            icon="calendar-outline"
            error={errors.date}
          />

          <EnhancedInput
            label="Hora de la Cita *"
            placeholder="Seleccionar hora"
            value={formData.time}
            onChangeText={(value) => setFormData(prev => ({ ...prev, time: value }))}
            icon="time-outline"
            error={errors.time}
          />

          <EnhancedInput
            label="Notas (Opcional)"
            placeholder="Comentarios adicionales"
            value={formData.notes}
            onChangeText={(value) => setFormData(prev => ({ ...prev, notes: value }))}
            icon="chatbubble-outline"
            multiline
            numberOfLines={2}
          />

        </EnhancedCard>

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          <EnhancedButton
            title="Cancelar"
            onPress={onCancel}
            variant="outline"
            style={styles.cancelButton}
          />
          
          <EnhancedButton
            title="Confirmar Cita"
            onPress={() => onSubmit(formData)}
            loading={loading}
            icon="checkmark-outline"
            style={styles.submitButton}
          />
        </View>
        
      </ScrollView>

      <LoadingOverlay 
        visible={loading} 
        message="Confirmando cita..." 
      />
    </KeyboardAvoidingView>
  );
};

// ===== STYLES =====
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  scrollView: {
    flex: 1,
    padding: DesignTokens.spacing.lg,
  },
  formCard: {
    marginBottom: DesignTokens.spacing.lg,
  },
  serviceInfoCard: {
    marginBottom: DesignTokens.spacing.md,
    backgroundColor: Colors.light.primaryBg,
    borderColor: Colors.light.primary,
    borderWidth: 1,
  },
  serviceTitle: {
    fontSize: DesignTokens.typography.fontSizes.xl,
    fontWeight: DesignTokens.typography.fontWeights.semibold,
    color: Colors.light.text,
    marginBottom: DesignTokens.spacing.sm,
  },
  serviceDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  servicePrice: {
    fontSize: DesignTokens.typography.fontSizes.lg,
    fontWeight: DesignTokens.typography.fontWeights.bold,
    color: Colors.light.primary,
  },
  serviceDuration: {
    fontSize: DesignTokens.typography.fontSizes.base,
    color: Colors.light.textSecondary,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: DesignTokens.spacing.md,
    marginTop: DesignTokens.spacing.lg,
    paddingBottom: DesignTokens.spacing.xl, // Extra space for safe area
  },
  cancelButton: {
    flex: 1,
  },
  submitButton: {
    flex: 2,
  },
});

export default {
  EnhancedServiceCreationForm,
  EnhancedBookingForm,
};