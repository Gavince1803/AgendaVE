// Agregar Servicio - Pantalla para que el proveedor agregue nuevos servicios
// Permite configurar nombre, descripción, precio y duración del servicio

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Button } from '@/components/ui/Button';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Input } from '@/components/ui/Input';
import { BookingSafeAreaView } from '@/components/ui/SafeAreaView';
import { Colors, DesignTokens } from '@/constants/Colors';
import { useAuth } from '@/contexts/AuthContext';
import { BookingService } from '@/lib/booking-service';
import { useLogger, LogCategory } from '@/lib/logger';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Platform, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';

export default function AddServiceScreen() {
  const { user } = useAuth();
  const log = useLogger();
  const [saving, setSaving] = useState(false);

  const [serviceData, setServiceData] = useState({
    name: '',
    description: '',
    price_amount: '',
    duration_minutes: '',
  });

  const handleSave = async () => {
    console.log('🔴 [ADD-SERVICE] handleSave called');
    
    if (!user) {
      console.log('🔴 [ADD-SERVICE] No user found');
      return;
    }

    console.log('🔴 [ADD-SERVICE] Service data:', serviceData);

    // Validaciones
    if (!serviceData.name.trim()) {
      console.log('🔴 [ADD-SERVICE] Name validation failed');
      const message = 'El nombre del servicio es requerido';
      Platform.OS === 'web' ? window.alert(message) : Alert.alert('Error', message);
      return;
    }

    if (!serviceData.price_amount.trim()) {
      console.log('🔴 [ADD-SERVICE] Price validation failed');
      const message = 'El precio es requerido';
      Platform.OS === 'web' ? window.alert(message) : Alert.alert('Error', message);
      return;
    }

    if (!serviceData.duration_minutes.trim()) {
      console.log('🔴 [ADD-SERVICE] Duration validation failed');
      const message = 'La duración es requerida';
      Platform.OS === 'web' ? window.alert(message) : Alert.alert('Error', message);
      return;
    }

    const price = parseFloat(serviceData.price_amount);
    const duration = parseInt(serviceData.duration_minutes);

    console.log('🔴 [ADD-SERVICE] Parsed values - price:', price, 'duration:', duration);

    if (isNaN(price) || price <= 0) {
      console.log('🔴 [ADD-SERVICE] Price number validation failed');
      const message = 'El precio debe ser un número válido mayor a 0';
      Platform.OS === 'web' ? window.alert(message) : Alert.alert('Error', message);
      return;
    }

    if (isNaN(duration) || duration <= 0) {
      console.log('🔴 [ADD-SERVICE] Duration number validation failed');
      const message = 'La duración debe ser un número válido mayor a 0';
      Platform.OS === 'web' ? window.alert(message) : Alert.alert('Error', message);
      return;
    }

    console.log('🔴 [ADD-SERVICE] Showing confirmation dialog');
    
    // Web-compatible confirmation dialog
    if (Platform.OS === 'web') {
      const confirmed = window.confirm(
        `¿Estás seguro de que quieres crear el servicio "${serviceData.name.trim()}" por $${price} USD (${duration} min)?`
      );
      
      if (confirmed) {
        console.log('🔴 [ADD-SERVICE] User confirmed (web), creating service');
        createService(price, duration);
      } else {
        console.log('🔴 [ADD-SERVICE] User cancelled (web)');
      }
    } else {
      // Native Alert for mobile
      Alert.alert(
        'Confirmar Creación de Servicio',
        `¿Estás seguro de que quieres crear el servicio "${serviceData.name.trim()}" por $${price} USD (${duration} min)?`,
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
    }
  };

  const createService = async (price: number, duration: number) => {
    console.log('🔴 [ADD-SERVICE] createService called with:', { price, duration });
    
    try {
      if (!user) {
        throw new Error('Usuario no autenticado');
      }

      setSaving(true);
      console.log('🔴 [ADD-SERVICE] Setting saving state to true');
      
      log.userAction('Add new service', { 
        providerId: user.id,
        serviceName: serviceData.name,
        price: price,
        duration: duration
      });

      console.log('🔴 [ADD-SERVICE] Calling BookingService.createService...');
      
      // Create the service using BookingService
      const newService = await BookingService.createService(user.id, {
        name: serviceData.name,
        description: serviceData.description,
        price_amount: price,
        price_currency: 'USD',
        duration_minutes: duration,
        is_active: true
      });
      
      console.log('🔴 [ADD-SERVICE] Service created successfully:', newService);

      if (Platform.OS === 'web') {
        const createAnother = window.confirm(
          `¡Servicio Creado! ✅\n\nEl servicio "${serviceData.name}" ha sido creado exitosamente y estará disponible para tus clientes inmediatamente.\n\n¿Quieres crear otro servicio?`
        );
        
        if (createAnother) {
          // Reset form
          setServiceData({
            name: '',
            description: '',
            price_amount: '',
            duration_minutes: '',
          });
        } else {
          router.back();
        }
      } else {
        Alert.alert(
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
      }
    } catch (error) {
      log.error(LogCategory.SERVICE, 'Error creating service', { error: error instanceof Error ? error.message : String(error) });
      
      if (Platform.OS === 'web') {
        window.alert('Error: No se pudo crear el servicio');
      } else {
        Alert.alert('Error', 'No se pudo crear el servicio');
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <BookingSafeAreaView>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
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
          <Input
            label="Nombre del Servicio *"
            value={serviceData.name}
            onChangeText={(text) => setServiceData({...serviceData, name: text})}
            placeholder="Ej: Corte de Cabello"
            autoCapitalize="words"
          />

          <Input
            label="Descripción"
            value={serviceData.description}
            onChangeText={(text) => setServiceData({...serviceData, description: text})}
            placeholder="Describe el servicio..."
            multiline
            numberOfLines={4}
          />

          <View style={styles.row}>
            <View style={styles.halfWidth}>
              <Input
                label="Precio ($) *"
                value={serviceData.price_amount}
                onChangeText={(text) => setServiceData({...serviceData, price_amount: text})}
                placeholder="0.00"
                keyboardType="numeric"
              />
            </View>
            <View style={styles.halfWidth}>
              <Input
                label="Duración (min) *"
                value={serviceData.duration_minutes}
                onChangeText={(text) => setServiceData({...serviceData, duration_minutes: text})}
                placeholder="30"
                keyboardType="numeric"
              />
            </View>
          </View>

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
      </ScrollView>
    </BookingSafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
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
});
