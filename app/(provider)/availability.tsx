// Configurar Disponibilidad - Pantalla para que el proveedor configure sus horarios
// Permite definir días de la semana y horarios de atención

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { TabSafeAreaView } from '@/components/ui/SafeAreaView';
import { TimePicker } from '@/components/ui/TimePicker';
import { Colors, DesignTokens } from '@/constants/Colors';
import { useAuth } from '@/contexts/AuthContext';
import { BookingService } from '@/lib/booking-service';
import { LogCategory, useLogger } from '@/lib/logger';
import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Platform, ScrollView, StyleSheet, Switch, TouchableOpacity, View } from 'react-native';

const WEEKDAYS = [
  { key: 'monday', label: 'Lunes', short: 'L' },
  { key: 'tuesday', label: 'Martes', short: 'M' },
  { key: 'wednesday', label: 'Miércoles', short: 'X' },
  { key: 'thursday', label: 'Jueves', short: 'J' },
  { key: 'friday', label: 'Viernes', short: 'V' },
  { key: 'saturday', label: 'Sábado', short: 'S' },
  { key: 'sunday', label: 'Domingo', short: 'D' },
];

export default function AvailabilityScreen() {
  const { user } = useAuth();
  const log = useLogger();
  const [saving, setSaving] = useState(false);

  const [availability, setAvailability] = useState<Record<string, { enabled: boolean; startTime: string; endTime: string }>>(() => {
    const initial: Record<string, { enabled: boolean; startTime: string; endTime: string }> = {};
    WEEKDAYS.forEach(day => {
      initial[day.key] = {
        enabled: false,
        startTime: '09:00',
        endTime: '18:00',
      };
    });
    return initial;
  });

  const handleDayToggle = (dayKey: string) => {
    setAvailability(prev => ({
      ...prev,
      [dayKey]: {
        ...prev[dayKey],
        enabled: !prev[dayKey].enabled,
      }
    }));
  };

  const handleTimeChange = (dayKey: string, timeType: 'startTime' | 'endTime', time: string) => {
    setAvailability(prev => ({
      ...prev,
      [dayKey]: {
        ...prev[dayKey],
        [timeType]: time,
      }
    }));
  };

  const handleSave = async () => {
    if (!user) return;

    // Verificar que al menos un día esté habilitado
    const enabledDays = Object.values(availability).filter((day: any) => day.enabled);
    if (enabledDays.length === 0) {
      const message = 'Debes habilitar al menos un día de la semana';
      Platform.OS === 'web' ? window.alert(message) : Alert.alert('Error', message);
      return;
    }

    // Crear resumen de días habilitados para el diálogo
    const enabledDaysText = WEEKDAYS
      .filter(day => availability[day.key].enabled)
      .map(day => `${day.label}: ${availability[day.key].startTime} - ${availability[day.key].endTime}`)
      .join('\n');

    // Diálogo de confirmación
    if (Platform.OS === 'web') {
      const confirmed = window.confirm(
        `¿Estás seguro de que quieres guardar estos horarios?\n\n${enabledDaysText}\n\nLos clientes podrán reservar citas en estos horarios.`
      );
      
      if (confirmed) {
        saveAvailability(enabledDays);
      }
    } else {
      Alert.alert(
        'Confirmar Horarios de Atención',
        `¿Estás seguro de que quieres guardar estos horarios?\n\n${enabledDaysText}\n\nLos clientes podrán reservar citas en estos horarios.`,
        [
          {
            text: 'Cancelar',
            style: 'cancel'
          },
          {
            text: 'Guardar Horarios',
            style: 'default',
            onPress: () => saveAvailability(enabledDays)
          }
        ]
      );
    }
  };

  const saveAvailability = async (enabledDays: any[]) => {
    try {
      setSaving(true);
      log.userAction('Save availability', { 
        providerId: user!.id,
        enabledDays: enabledDays.length
      });

      // Actualizar disponibilidades en la base de datos usando el user ID
      // El método updateAvailability ahora maneja internamente obtener el provider
      await BookingService.updateAvailability(user!.id, availability);

      if (Platform.OS === 'web') {
        window.alert('Éxito: Horarios actualizados exitosamente');
        router.push('/(provider)/my-business');
      } else {
        Alert.alert(
          'Éxito', 
          'Horarios actualizados exitosamente',
          [
            {
              text: 'OK',
              onPress: () => router.push('/(provider)/my-business')
            }
          ]
        );
      }
    } catch (error) {
      log.error(LogCategory.SERVICE, 'Error saving availability', { error: error instanceof Error ? error.message : String(error) });
      
      let errorMessage = 'No se pudieron guardar los horarios';
      if (error instanceof Error) {
        if (error.message.includes('row-level security')) {
          errorMessage = 'Error de permisos en la base de datos.\n\nPor favor:\n1. Ve a tu panel de Supabase\n2. Ejecuta las consultas del archivo supabase_fixes.sql\n3. Inténtalo de nuevo';
        } else if (error.message.includes('Provider not found')) {
          errorMessage = 'No se encontró tu perfil de proveedor.\n\nPor favor configura tu negocio desde "Mi Negocio" primero.';
        } else {
          errorMessage = `Error: ${error.message}`;
        }
      }
      
      Platform.OS === 'web' ? window.alert(`Error al Guardar Horarios: ${errorMessage}`) : Alert.alert('Error al Guardar Horarios', errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const handleQuickSetup = (type: 'weekdays' | 'weekends' | 'all') => {
    const newAvailability = { ...availability };
    
    WEEKDAYS.forEach(day => {
      let shouldEnable = false;
      
      switch (type) {
        case 'weekdays':
          shouldEnable = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'].includes(day.key);
          break;
        case 'weekends':
          shouldEnable = ['saturday', 'sunday'].includes(day.key);
          break;
        case 'all':
          shouldEnable = true;
          break;
      }
      
      newAvailability[day.key] = {
        ...newAvailability[day.key],
        enabled: shouldEnable,
      };
    });
    
    setAvailability(newAvailability);
  };

  return (
    <TabSafeAreaView>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <ThemedView style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.push('/(provider)/my-business')}
          >
            <IconSymbol name="chevron.left" size={24} color={Colors.light.text} />
          </TouchableOpacity>
          <ThemedText type="title" style={styles.title}>
            Horarios de Atención
          </ThemedText>
          <View style={styles.placeholder} />
        </ThemedView>

        {/* Configuración rápida */}
        <Card variant="elevated" style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Configuración Rápida
          </ThemedText>
          
          <View style={styles.quickSetup}>
            <Button
              title="Días Laborales"
              variant="outline"
              size="small"
              onPress={() => handleQuickSetup('weekdays')}
              style={styles.quickButton}
            />
            <Button
              title="Fines de Semana"
              variant="outline"
              size="small"
              onPress={() => handleQuickSetup('weekends')}
              style={styles.quickButton}
            />
            <Button
              title="Todos los Días"
              variant="outline"
              size="small"
              onPress={() => handleQuickSetup('all')}
              style={styles.quickButton}
            />
          </View>
        </Card>

        {/* Configuración por día */}
        <Card variant="elevated" style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Configuración Detallada
          </ThemedText>
          
          <View style={styles.daysList}>
            {WEEKDAYS.map((day) => (
              <View key={day.key} style={styles.dayItem}>
                <View style={styles.dayHeader}>
                  <View style={styles.dayInfo}>
                    <View style={[
                      styles.dayCircle,
                      { backgroundColor: availability[day.key].enabled ? Colors.light.primary : Colors.light.surfaceVariant }
                    ]}>
                      <ThemedText style={[
                        styles.dayShort,
                        { color: availability[day.key].enabled ? Colors.light.surface : Colors.light.textSecondary }
                      ]}>
                        {day.short}
                      </ThemedText>
                    </View>
                    <ThemedText style={styles.dayLabel}>{day.label}</ThemedText>
                  </View>
                  <Switch
                    value={availability[day.key].enabled}
                    onValueChange={() => handleDayToggle(day.key)}
                    trackColor={{ false: Colors.light.surfaceVariant, true: Colors.light.primary }}
                    thumbColor={Colors.light.surface}
                  />
                </View>
                
                {availability[day.key].enabled && (
                  <View style={styles.timeRow}>
                    <TimePicker
                      label="Desde:"
                      value={availability[day.key].startTime}
                      onTimeChange={(time) => handleTimeChange(day.key, 'startTime', time)}
                    />
                    <View style={styles.timeSeparator} />
                    <TimePicker
                      label="Hasta:"
                      value={availability[day.key].endTime}
                      onTimeChange={(time) => handleTimeChange(day.key, 'endTime', time)}
                    />
                  </View>
                )}
              </View>
            ))}
          </View>
        </Card>

        {/* Información adicional */}
        <Card variant="elevated" style={styles.section}>
          <ThemedView style={styles.infoCard}>
            <IconSymbol name="info.circle" size={20} color={Colors.light.primary} />
            <View style={styles.infoText}>
              <ThemedText style={styles.infoTitle}>
                Información importante
              </ThemedText>
              <ThemedText style={styles.infoDescription}>
                • Los clientes solo podrán reservar en los horarios configurados{'\n'}
                • Puedes cambiar estos horarios en cualquier momento{'\n'}
                • Los cambios se aplicarán inmediatamente a nuevas reservas
              </ThemedText>
            </View>
          </ThemedView>
        </Card>

        {/* Botones */}
        <ThemedView style={styles.buttons}>
          <Button
            title="Cancelar"
            variant="outline"
            onPress={() => router.push('/(provider)/my-business')}
            style={styles.cancelButton}
          />
          <Button
            title="Guardar Horarios"
            onPress={handleSave}
            loading={saving}
            style={styles.saveButton}
          />
        </ThemedView>

        {/* Espacio adicional */}
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
  section: {
    margin: DesignTokens.spacing.lg,
    marginBottom: DesignTokens.spacing.md,
  },
  sectionTitle: {
    marginBottom: DesignTokens.spacing.lg,
  },
  quickSetup: {
    flexDirection: 'row',
    gap: DesignTokens.spacing.sm,
  },
  quickButton: {
    flex: 1,
  },
  daysList: {
    gap: DesignTokens.spacing.lg,
  },
  dayItem: {
    padding: DesignTokens.spacing.lg,
    backgroundColor: Colors.light.surfaceVariant,
    borderRadius: DesignTokens.radius.md,
  },
  dayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: DesignTokens.spacing.md,
  },
  dayInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dayCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: DesignTokens.spacing.md,
  },
  dayShort: {
    fontSize: DesignTokens.typography.fontSizes.sm,
    fontWeight: DesignTokens.typography.fontWeights.bold as any,
  },
  dayLabel: {
    fontSize: DesignTokens.typography.fontSizes.base,
    fontWeight: DesignTokens.typography.fontWeights.medium as any,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: DesignTokens.spacing.md,
    marginTop: DesignTokens.spacing.md,
  },
  timeSeparator: {
    width: DesignTokens.spacing.md,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
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
