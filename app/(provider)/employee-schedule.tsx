import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { TabSafeAreaView } from '@/components/ui/SafeAreaView';
import { TimePicker } from '@/components/ui/TimePicker';
import { Colors, DesignTokens } from '@/constants/Colors';
import { BookingService, EmployeeAvailability } from '@/lib/booking-service';
import { LogCategory, useLogger } from '@/lib/logger';

const WEEKDAYS = [
  { key: 'monday', label: 'Lunes', short: 'L', dayOfWeek: 1 },
  { key: 'tuesday', label: 'Martes', short: 'M', dayOfWeek: 2 },
  { key: 'wednesday', label: 'Miércoles', short: 'X', dayOfWeek: 3 },
  { key: 'thursday', label: 'Jueves', short: 'J', dayOfWeek: 4 },
  { key: 'friday', label: 'Viernes', short: 'V', dayOfWeek: 5 },
  { key: 'saturday', label: 'Sábado', short: 'S', dayOfWeek: 6 },
  { key: 'sunday', label: 'Domingo', short: 'D', dayOfWeek: 0 },
];

import { useAuth } from '@/contexts/AuthContext';
import { useAlert } from '@/contexts/GlobalAlertContext';

export default function EmployeeScheduleScreen() {
  const params = useLocalSearchParams();
  const { showAlert } = useAlert();
  const log = useLogger();
  const { employeeProfile, activeRole } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // If activeRole is employee, use the logged-in employee's ID
  const isEmployeeMode = activeRole === 'employee';
  const employeeId = isEmployeeMode ? employeeProfile?.id : (params.employeeId as string);
  const employeeName = isEmployeeMode ? 'Mí' : (params.employeeName as string);

  const [customScheduleEnabled, setCustomScheduleEnabled] = useState(
    params.customScheduleEnabled === 'true'
  );

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

  useEffect(() => {
    if (employeeId) {
      loadEmployeeAvailability();
    } else if (isEmployeeMode && !employeeProfile) {
      // Wait for profile to load
    } else {
      setLoading(false);
    }
  }, [employeeId]);

  const loadEmployeeAvailability = async () => {
    if (!employeeId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      console.log('🔴 [EMPLOYEE SCHEDULE] Loading availability for:', employeeId);

      const employeeAvailabilities = await BookingService.getEmployeeWeeklyAvailability(employeeId);
      console.log('🔴 [EMPLOYEE SCHEDULE] Loaded availabilities:', employeeAvailabilities);

      // Convert database format to form format
      const newAvailability = { ...availability };

      employeeAvailabilities.forEach((avail: EmployeeAvailability) => {
        const weekday = WEEKDAYS.find(w => w.dayOfWeek === avail.day_of_week);
        if (weekday) {
          // Convert database time format (HH:MM:SS) to picker format (HH:MM)
          const convertTimeFormat = (timeStr: string) => {
            if (!timeStr) return '09:00';
            const parts = timeStr.split(':');
            return parts.length >= 2 ? `${parts[0]}:${parts[1]}` : timeStr;
          };

          newAvailability[weekday.key] = {
            enabled: avail.is_available,
            startTime: convertTimeFormat(avail.start_time),
            endTime: convertTimeFormat(avail.end_time),
          };
        }
      });

      setAvailability(newAvailability);

      log.info(LogCategory.DATABASE, 'Employee availability loaded', {
        employeeId,
        availabilityCount: employeeAvailabilities.length
      });
    } catch (error) {
      console.error('🔴 [EMPLOYEE SCHEDULE] Error loading availability:', error);
      log.error(LogCategory.SERVICE, 'Error loading employee availability', error);

      if (Platform.OS === 'web') {
        console.error('🔴 [EMPLOYEE SCHEDULE] Full error details:', error);
      }

      showAlert('Error', 'No se pudo cargar la disponibilidad del empleado.');
    } finally {
      setLoading(false);
    }
  };

  const handleCustomScheduleToggle = async (enabled: boolean) => {
    try {
      if (!employeeId) {
        throw new Error('ID de empleado inválido');
      }
      console.log('🔴 [EMPLOYEE SCHEDULE] Toggling custom schedule:', { employeeId, enabled });

      await BookingService.updateEmployeeCustomSchedule(employeeId, enabled);
      setCustomScheduleEnabled(enabled);

      if (!enabled) {
        // Reset availability to default when disabling custom schedule
        const resetAvailability = { ...availability };
        WEEKDAYS.forEach(day => {
          resetAvailability[day.key] = {
            ...resetAvailability[day.key],
            enabled: false,
          };
        });
        setAvailability(resetAvailability);
      }

      const message = enabled
        ? 'Horario personalizado habilitado. Ahora puedes configurar horarios específicos para este empleado.'
        : 'El empleado ahora usará el horario general del negocio.';

      showAlert('Éxito', message);

      log.userAction('Toggle employee custom schedule', { employeeId, enabled });
    } catch (error) {
      log.error(LogCategory.SERVICE, 'Error toggling custom schedule', error);
      showAlert('Error', 'No se pudo cambiar la configuración de horario personalizado.');
    }
  };

  const handleDayToggle = (dayKey: string) => {
    if (!customScheduleEnabled) return;

    setAvailability(prev => ({
      ...prev,
      [dayKey]: {
        ...prev[dayKey],
        enabled: !prev[dayKey].enabled,
      }
    }));
  };

  const handleTimeChange = (dayKey: string, timeType: 'startTime' | 'endTime', time: string) => {
    if (!customScheduleEnabled) return;

    setAvailability(prev => ({
      ...prev,
      [dayKey]: {
        ...prev[dayKey],
        [timeType]: time,
      }
    }));
  };

  const handleSave = async () => {
    if (!customScheduleEnabled) {
      router.back();
      return;
    }

    // Verificar que al menos un día esté habilitado
    const enabledDays = Object.values(availability).filter((day: any) => day.enabled);
    if (enabledDays.length === 0) {
      const message = 'Debes habilitar al menos un día de la semana';
      showAlert('Error', message);
      return;
    }

    // Crear resumen de días habilitados para el diálogo
    const enabledDaysText = WEEKDAYS
      .filter(day => availability[day.key].enabled)
      .map(day => `${day.label}: ${availability[day.key].startTime} - ${availability[day.key].endTime}`)
      .join('\n');

    // Diálogo de confirmación
    showAlert(
      'Confirmar Horarios',
      `¿Estás seguro de que quieres guardar estos horarios para ${employeeName}?\n\n${enabledDaysText}\n\nLos clientes podrán reservar citas con este empleado en estos horarios.`,
      [
        {
          text: 'Cancelar',
          style: 'cancel'
        },
        {
          text: 'Guardar Horarios',
          style: 'default',
          onPress: () => saveAvailability()
        }
      ]
    );
  };

  const saveAvailability = async () => {
    try {
      setSaving(true);
      log.userAction('Save employee availability', {
        employeeId,
        employeeName,
        enabledDays: Object.values(availability).filter((day: any) => day.enabled).length
      });

      if (!employeeId) throw new Error('No employee ID found');

      await BookingService.updateEmployeeAvailability(employeeId, availability);

      showAlert(
        'Éxito',
        'Horarios del empleado actualizados exitosamente',
        [
          {
            text: 'OK',
            onPress: () => router.back()
          }
        ]
      );
    } catch (error) {
      log.error(LogCategory.SERVICE, 'Error saving employee availability', { error: error instanceof Error ? error.message : String(error) });

      let errorMessage = 'No se pudieron guardar los horarios del empleado';
      if (error instanceof Error) {
        if (error.message.includes('row-level security')) {
          errorMessage = 'Error de permisos en la base de datos.';
        } else {
          errorMessage = `Error: ${error.message}`;
        }
      }

      showAlert('Error al Guardar Horarios', errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const handleQuickSetup = (type: 'weekdays' | 'weekends' | 'all') => {
    if (!customScheduleEnabled) return;

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

  if (loading) {
    return (
      <TabSafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Cargando horarios del empleado...</Text>
        </View>
      </TabSafeAreaView>
    );
  }

  return (
    <TabSafeAreaView style={styles.container}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <IconSymbol name="chevron.left" size={24} color={Colors.light.text} />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <Text style={styles.title}>
              Horarios de {employeeName}
            </Text>
            <Text style={styles.subtitle}>
              Configura los horarios específicos de este empleado
            </Text>
          </View>
          <View style={styles.placeholder} />
        </View>

        {/* Custom Schedule Toggle */}
        <Card variant="elevated" style={styles.section}>
          <View style={styles.toggleSection}>
            <View style={styles.toggleInfo}>
              <Text style={styles.toggleTitle}>
                Horario Personalizado
              </Text>
              <Text style={styles.toggleDescription}>
                {customScheduleEnabled
                  ? 'Este empleado tiene horarios específicos diferentes al negocio'
                  : 'Este empleado usa los horarios generales del negocio'
                }
              </Text>
            </View>
            <Switch
              value={customScheduleEnabled}
              onValueChange={handleCustomScheduleToggle}
              trackColor={{ false: Colors.light.surfaceVariant, true: Colors.light.primary }}
              thumbColor={Colors.light.surface}
            />
          </View>
        </Card>

        {/* Schedule Configuration */}
        {customScheduleEnabled && (
          <>
            {/* Quick Setup */}
            <Card variant="elevated" style={styles.section}>
              <Text style={styles.sectionTitle}>
                Configuración Rápida
              </Text>

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

            {/* Daily Configuration */}
            <Card variant="elevated" style={styles.section}>
              <Text style={styles.sectionTitle}>
                Configuración por Día
              </Text>

              <View style={styles.daysList}>
                {WEEKDAYS.map((day) => (
                  <View key={day.key} style={styles.dayItem}>
                    <View style={styles.dayHeader}>
                      <View style={styles.dayInfo}>
                        <View style={[
                          styles.dayCircle,
                          { backgroundColor: availability[day.key].enabled ? Colors.light.primary : Colors.light.surfaceVariant }
                        ]}>
                          <Text style={[
                            styles.dayShort,
                            { color: availability[day.key].enabled ? Colors.light.surface : Colors.light.textSecondary }
                          ]}>
                            {day.short}
                          </Text>
                        </View>
                        <Text style={styles.dayLabel}>{day.label}</Text>
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
          </>
        )}

        {/* Information */}
        <Card variant="elevated" style={styles.section}>
          <View style={styles.infoCard}>
            <IconSymbol name="info.circle" size={20} color={Colors.light.primary} />
            <View style={styles.infoText}>
              <Text style={styles.infoTitle}>
                Información importante
              </Text>
              <Text style={styles.infoDescription}>
                {customScheduleEnabled
                  ? '• Los clientes podrán reservar con este empleado solo en los horarios configurados\n• Si deshabilitas el horario personalizado, se usarán los horarios del negocio\n• Los cambios se aplicarán inmediatamente a nuevas reservas'
                  : '• Este empleado usa los horarios generales del negocio\n• Los clientes podrán reservar en todos los horarios disponibles del negocio\n• Puedes habilitar horarios personalizados si necesitas horarios específicos'
                }
              </Text>
            </View>
          </View>
        </Card>

        {/* Buttons */}
        <View style={styles.buttons}>
          <Button
            title="Cancelar"
            variant="outline"
            onPress={() => router.back()}
            style={styles.cancelButton}
          />
          <Button
            title={customScheduleEnabled ? "Guardar Horarios" : "Finalizar"}
            onPress={handleSave}
            loading={saving}
            style={styles.saveButton}
          />
        </View>

        {/* Bottom spacing */}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: DesignTokens.typography.fontSizes.lg,
    color: Colors.light.textSecondary,
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
  headerContent: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: DesignTokens.spacing.md,
  },
  title: {
    fontSize: DesignTokens.typography.fontSizes.lg,
    fontWeight: DesignTokens.typography.fontWeights.bold as any,
    color: Colors.light.text,
    textAlign: 'center',
    marginBottom: DesignTokens.spacing.xs,
  },
  subtitle: {
    fontSize: DesignTokens.typography.fontSizes.sm,
    color: Colors.light.textSecondary,
    textAlign: 'center',
  },
  placeholder: {
    width: 40,
  },
  section: {
    margin: DesignTokens.spacing.lg,
    marginBottom: DesignTokens.spacing.md,
  },
  toggleSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  toggleInfo: {
    flex: 1,
    marginRight: DesignTokens.spacing.md,
  },
  toggleTitle: {
    fontSize: DesignTokens.typography.fontSizes.base,
    fontWeight: DesignTokens.typography.fontWeights.semibold as any,
    color: Colors.light.text,
    marginBottom: DesignTokens.spacing.xs,
  },
  toggleDescription: {
    fontSize: DesignTokens.typography.fontSizes.sm,
    color: Colors.light.textSecondary,
    lineHeight: 18,
  },
  sectionTitle: {
    fontSize: DesignTokens.typography.fontSizes.base,
    fontWeight: DesignTokens.typography.fontWeights.semibold as any,
    color: Colors.light.text,
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
