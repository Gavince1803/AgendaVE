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
import { useLogger } from '@/lib/logger';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';

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
    if (!user) return;

    // Validaciones
    if (!serviceData.name.trim()) {
      Alert.alert('Error', 'El nombre del servicio es requerido');
      return;
    }

    if (!serviceData.price_amount.trim()) {
      Alert.alert('Error', 'El precio es requerido');
      return;
    }

    if (!serviceData.duration_minutes.trim()) {
      Alert.alert('Error', 'La duración es requerida');
      return;
    }

    const price = parseFloat(serviceData.price_amount);
    const duration = parseInt(serviceData.duration_minutes);

    if (isNaN(price) || price <= 0) {
      Alert.alert('Error', 'El precio debe ser un número válido mayor a 0');
      return;
    }

    if (isNaN(duration) || duration <= 0) {
      Alert.alert('Error', 'La duración debe ser un número válido mayor a 0');
      return;
    }

    try {
      setSaving(true);
      log.userAction('Add new service', { 
        providerId: user.id,
        serviceName: serviceData.name,
        price: price,
        duration: duration
      });

      // Aquí implementarías la creación del servicio
      // await BookingService.createService(user.id, {
      //   name: serviceData.name,
      //   description: serviceData.description,
      //   price_amount: price,
      //   duration_minutes: duration,
      //   is_active: true
      // });

      Alert.alert(
        'Éxito', 
        'Servicio creado exitosamente',
        [
          {
            text: 'OK',
            onPress: () => router.back()
          }
        ]
      );
    } catch (error) {
      log.error('Error creating service', { error: error.message });
      Alert.alert('Error', 'No se pudo crear el servicio');
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
                • Puedes editarlo o desactivarlo desde "Mi Negocio"{'\n'}
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
