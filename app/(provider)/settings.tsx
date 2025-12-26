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
import { BookingService, ProviderSchedulingSettings } from '@/lib/booking-service';
import { LogCategory, useLogger } from '@/lib/logger';
import * as ExpoLocation from 'expo-location';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Switch,
  TouchableOpacity,
  View
} from 'react-native';

interface SettingsFormState {
  bufferBefore: string;
  bufferAfter: string;
  allowOverlaps: boolean;
  cancellationHours: string;
  cancellationMessage: string;
  reminderLeadMinutes: string;
  priceTier: number;
}

const BUFFER_PRESETS = [0, 5, 10, 15, 30];
const REMINDER_PRESETS = [30, 60, 120, 180, 1440];

export default function ProviderSettingsScreen() {
  const { user } = useAuth();
  const { showAlert } = useAlert();
  const log = useLogger(user?.id);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [providerId, setProviderId] = useState<string | null>(null);
  const [providerMissing, setProviderMissing] = useState(false);
  const [form, setForm] = useState<SettingsFormState>({
    bufferBefore: '10',
    bufferAfter: '10',
    allowOverlaps: false,
    cancellationHours: '12',
    cancellationMessage: '',
    reminderLeadMinutes: '60',
    priceTier: 2,
  });

  useEffect(() => {
    if (user?.id) {
      void loadSettings();
    }
  }, [user?.id]);

  const loadSettings = async () => {
    if (!user) return;

    try {
      setLoading(true);
      log.info(LogCategory.DATABASE, 'Loading provider scheduling settings', { screen: 'ProviderSettings' });

      const provider = await BookingService.getProviderById(user.id);
      if (!provider) {
        setProviderMissing(true);
        setProviderId(null);
        return;
      }

      setProviderMissing(false);
      setProviderId(provider.id);

      setProviderId(provider.id);

      const settings = await BookingService.getProviderSchedulingSettings(provider.id);
      applySettingsToForm(settings);

      setForm(prev => ({
        ...prev,
        priceTier: (provider.price_tier as number) || 1
      }));

      log.info(LogCategory.DATABASE, 'Scheduling settings loaded', {
        bufferBefore: settings.bufferBeforeMinutes,
        bufferAfter: settings.bufferAfterMinutes,
        allowOverlaps: settings.allowOverlaps,
      });
    } catch (error) {
      log.error(LogCategory.SERVICE, 'Error loading scheduling settings', error);
      showAlert('Error', 'No se pudieron cargar los ajustes del proveedor.');
    } finally {
      setLoading(false);
    }
  };

  const applySettingsToForm = (settings: ProviderSchedulingSettings) => {
    setForm({
      bufferBefore: String(settings.bufferBeforeMinutes ?? 10),
      bufferAfter: String(settings.bufferAfterMinutes ?? 10),
      allowOverlaps: Boolean(settings.allowOverlaps),
      cancellationHours: String(settings.cancellationPolicyHours ?? 12),
      cancellationMessage: settings.cancellationPolicyMessage || '',
      reminderLeadMinutes: String(settings.reminderLeadTimeMinutes ?? 60),
      priceTier: 2,
    });
  };

  const updateForm = <K extends keyof SettingsFormState>(key: K, value: SettingsFormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const parseNumberValue = (value: string, fallback: number, max = 1440) => {
    const parsed = parseInt(value, 10);
    if (Number.isNaN(parsed) || parsed < 0) {
      return fallback;
    }
    return Math.min(parsed, max);
  };

  const handleSave = async () => {
    if (!user) return;

    try {
      setSaving(true);
      log.userAction('Save scheduling settings', { screen: 'ProviderSettings' });

      const payload: Partial<ProviderSchedulingSettings> = {
        bufferBeforeMinutes: parseNumberValue(form.bufferBefore, 10, 240),
        bufferAfterMinutes: parseNumberValue(form.bufferAfter, 10, 240),
        allowOverlaps: form.allowOverlaps,
        cancellationPolicyHours: parseNumberValue(form.cancellationHours, 12, 168),
        cancellationPolicyMessage: form.cancellationMessage.trim(),
        reminderLeadTimeMinutes: parseNumberValue(form.reminderLeadMinutes, 60, 4320),
      };

      await BookingService.saveProviderSchedulingSettings(user.id, payload);

      // Update provider profile settings (Price Tier)
      await BookingService.updateProvider(user.id, {
        price_tier: form.priceTier as 1 | 2 | 3 | 4
      });

      showAlert('Ajustes guardados', 'Tus preferencias han sido actualizadas correctamente.');
      log.info(LogCategory.SERVICE, 'Scheduling settings saved', payload);
    } catch (error) {
      log.error(LogCategory.SERVICE, 'Error saving scheduling settings', error);
      showAlert('Error', 'No se pudieron guardar los ajustes. Revisa tu conexión e inténtalo nuevamente.');
    } finally {
      setSaving(false);
    }
  };

  const handleUseBufferPreset = (value: number, target: 'bufferBefore' | 'bufferAfter') => {
    updateForm(target, String(value) as SettingsFormState[typeof target]);
  };

  const handleUseReminderPreset = (value: number) => {
    updateForm('reminderLeadMinutes', String(value));
  };

  const handleUpdateLocation = async () => {
    if (!user) return;

    try {
      setSaving(true);
      const { status } = await ExpoLocation.requestForegroundPermissionsAsync();

      if (status !== 'granted') {
        showAlert('Permiso denegado', 'Necesitamos acceso a tu ubicación para actualizar la dirección del negocio.');
        setSaving(false);
        return;
      }

      const location = await ExpoLocation.getCurrentPositionAsync({});

      await BookingService.updateProvider(user.id, {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude
      });

      showAlert('Ubicación Actualizada', 'La ubicación de tu negocio se ha actualizado correctamente.');
      log.userAction('Update provider location', {
        lat: location.coords.latitude,
        lng: location.coords.longitude
      });

    } catch (error) {
      log.error(LogCategory.SERVICE, 'Error updating location', error);
      showAlert('Error', 'No se pudo obtener la ubicación.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <TabSafeAreaView>
      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
        <ThemedView style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <IconSymbol name="chevron.left" size={24} color={Colors.light.text} />
          </TouchableOpacity>
          <ThemedText type="title" style={styles.title}>
            Ajustes del Proveedor
          </ThemedText>
          <View style={styles.headerPlaceholder} />
        </ThemedView>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.light.primary} />
            <ThemedText style={styles.loadingText}>Cargando preferencias...</ThemedText>
          </View>
        ) : providerMissing ? (
          <Card variant="elevated" style={styles.infoCard}>
            <ThemedText type="subtitle" style={styles.infoTitle}>
              Completa tu perfil primero
            </ThemedText>
            <ThemedText style={styles.infoDescription}>
              Necesitamos los datos de tu negocio antes de configurar las preferencias de agenda.
            </ThemedText>
            <Button
              title="Ir a Mi Negocio"
              variant="primary"
              onPress={() => router.push('/(provider)/my-business')}
              style={styles.cardButton}
            />
          </Card>
        ) : (
          <>
            <Card variant="elevated" style={styles.sectionCard}>
              <ThemedText type="subtitle" style={styles.sectionTitle}>
                Ventanas de Protección
              </ThemedText>
              <ThemedText style={styles.sectionDescription}>
                Añade minutos de resguardo antes y después de cada cita para evitar solapamientos accidentales.
              </ThemedText>

              <Input
                label="Buffer antes (minutos)"
                keyboardType="number-pad"
                value={form.bufferBefore}
                onChangeText={(value) => updateForm('bufferBefore', value.replace(/[^0-9]/g, ''))}
                containerStyle={styles.inputContainer}
              />
              <View style={styles.presetRow}>
                {BUFFER_PRESETS.map((preset) => (
                  <Button
                    key={`buffer-before-${preset}`}
                    title={`${preset} min`}
                    variant={form.bufferBefore === String(preset) ? 'primary' : 'outline'}
                    size="small"
                    onPress={() => handleUseBufferPreset(preset, 'bufferBefore')}
                    style={styles.presetButton}
                  />
                ))}
              </View>

              <Input
                label="Buffer después (minutos)"
                keyboardType="number-pad"
                value={form.bufferAfter}
                onChangeText={(value) => updateForm('bufferAfter', value.replace(/[^0-9]/g, ''))}
                containerStyle={styles.inputContainer}
              />
              <View style={styles.presetRow}>
                {BUFFER_PRESETS.map((preset) => (
                  <Button
                    key={`buffer-after-${preset}`}
                    title={`${preset} min`}
                    variant={form.bufferAfter === String(preset) ? 'primary' : 'outline'}
                    size="small"
                    onPress={() => handleUseBufferPreset(preset, 'bufferAfter')}
                    style={styles.presetButton}
                  />
                ))}
              </View>

              <View style={styles.switchRow}>
                <View style={styles.switchTextGroup}>
                  <ThemedText style={styles.switchLabel}>Permitir solapamiento de citas</ThemedText>
                  <ThemedText style={styles.switchDescription}>
                    Úsalo solo si gestionas varios espacios o profesionales en paralelo.
                  </ThemedText>
                </View>
                <Switch
                  value={form.allowOverlaps}
                  onValueChange={(value) => updateForm('allowOverlaps', value)}
                  trackColor={{ true: Colors.light.primary }}
                />
              </View>
            </Card>

            <Card variant="elevated" style={styles.sectionCard}>
              <ThemedText type="subtitle" style={styles.sectionTitle}>
                Política de Cancelación
              </ThemedText>
              <ThemedText style={styles.sectionDescription}>
                Define con cuánta anticipación pueden cancelar sin penalización y comunica el detalle a tus clientes.
              </ThemedText>

              <Input
                label="Aviso mínimo (horas)"
                keyboardType="number-pad"
                value={form.cancellationHours}
                onChangeText={(value) => updateForm('cancellationHours', value.replace(/[^0-9]/g, ''))}
                containerStyle={styles.inputContainer}
              />

              <Input
                label="Mensaje para tus clientes"
                placeholder="Ej: Cancela con 12 horas de anticipación para evitar cargos."
                value={form.cancellationMessage}
                onChangeText={(value) => updateForm('cancellationMessage', value)}
                multiline
                numberOfLines={3}
                containerStyle={styles.inputContainer}
              />
            </Card>

            <Card variant="elevated" style={styles.sectionCard}>
              <ThemedText type="subtitle" style={styles.sectionTitle}>
                Recordatorios Automáticos
              </ThemedText>
              <ThemedText style={styles.sectionDescription}>
                Define cuánto antes quieres notificar a tus clientes sobre sus citas confirmadas.
              </ThemedText>

              <Input
                label="Tiempo previo (minutos)"
                keyboardType="number-pad"
                value={form.reminderLeadMinutes}
                onChangeText={(value) => updateForm('reminderLeadMinutes', value.replace(/[^0-9]/g, ''))}
                containerStyle={styles.inputContainer}
              />
              <View style={styles.presetRow}>
                {REMINDER_PRESETS.map((preset) => (
                  <Button
                    key={`reminder-${preset}`}
                    title={preset >= 60 ? `${preset / 60}h` : `${preset}m`}
                    variant={form.reminderLeadMinutes === String(preset) ? 'primary' : 'outline'}
                    size="small"
                    onPress={() => handleUseReminderPreset(preset)}
                    style={styles.presetButton}
                  />
                ))}
              </View>
            </Card>

            <Card variant="elevated" style={styles.sectionCard}>
              <ThemedText type="subtitle" style={styles.sectionTitle}>
                Nivel de Precio
              </ThemedText>
              <ThemedText style={styles.sectionDescription}>
                Indica el rango de precios de tus servicios para ayudar a los clientes a elegir.
              </ThemedText>

              <View style={styles.presetRow}>
                {[1, 2, 3, 4].map((tier) => (
                  <Button
                    key={`price-tier-${tier}`}
                    title={Array(tier).fill('$').join('')}
                    variant={form.priceTier === tier ? 'primary' : 'outline'}
                    size="small"
                    onPress={() => updateForm('priceTier', tier)}
                    containerStyle={{ minWidth: 60, flex: 1 }}
                  />
                ))}
              </View>
            </Card>

            <Card variant="elevated" style={styles.sectionCard}>
              <ThemedText type="subtitle" style={styles.sectionTitle}>
                Ubicación del Negocio
              </ThemedText>
              <ThemedText style={styles.sectionDescription}>
                Actualiza las coordenadas de tu negocio usando tu posición GPS actual para que los clientes cercanos te encuentren.
              </ThemedText>

              <Button
                title="Actualizar con mi GPS"
                variant="outline"
                icon={<IconSymbol name="location.fill" size={18} color={Colors.light.primary} />}
                onPress={handleUpdateLocation}
                disabled={saving}
                style={styles.secondaryButton}
              />
            </Card>

            <Card variant="elevated" style={styles.sectionCard}>
              <ThemedText type="subtitle" style={styles.sectionTitle}>
                Horarios de Atención
              </ThemedText>
              <ThemedText style={styles.sectionDescription}>
                Ajusta tus horas disponibles por día de la semana para mantener la agenda sincronizada.
              </ThemedText>
              <Button
                title="Editar horarios"
                variant="outline"
                icon={<IconSymbol name="clock.arrow.circlepath" size={20} color={Colors.light.primary} />}
                onPress={() => router.push('/(provider)/availability')}
                style={styles.secondaryButton}
              />
            </Card>

            <Button
              title={saving ? 'Guardando...' : 'Guardar ajustes'}
              variant="primary"
              onPress={handleSave}
              disabled={saving}
              style={styles.primaryButton}
            />
          </>
        )}
      </ScrollView>
    </TabSafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.surface,
  },
  contentContainer: {
    paddingBottom: DesignTokens.spacing['5xl'],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: DesignTokens.spacing.xl,
    paddingVertical: DesignTokens.spacing.lg,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: DesignTokens.radius.full,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.light.surfaceContainer,
  },
  headerPlaceholder: {
    width: 40,
  },
  title: {
    fontSize: DesignTokens.typography.fontSizes.xl,
    fontWeight: DesignTokens.typography.fontWeights.semibold as any,
    color: Colors.light.text,
  },
  loadingContainer: {
    padding: DesignTokens.spacing['3xl'],
    alignItems: 'center',
    gap: DesignTokens.spacing.md,
  },
  loadingText: {
    fontSize: DesignTokens.typography.fontSizes.sm,
    color: Colors.light.textSecondary,
  },
  infoCard: {
    marginHorizontal: DesignTokens.spacing.xl,
    padding: DesignTokens.spacing.xl,
    gap: DesignTokens.spacing.md,
  },
  infoTitle: {
    marginBottom: DesignTokens.spacing.xs,
  },
  infoDescription: {
    fontSize: DesignTokens.typography.fontSizes.sm,
    color: Colors.light.textSecondary,
    lineHeight: DesignTokens.typography.lineHeights.relaxed * DesignTokens.typography.fontSizes.sm,
  },
  cardButton: {
    alignSelf: 'flex-start',
    marginTop: DesignTokens.spacing.sm,
  },
  sectionCard: {
    marginHorizontal: DesignTokens.spacing.xl,
    marginBottom: DesignTokens.spacing['2xl'],
    padding: DesignTokens.spacing.xl,
    gap: DesignTokens.spacing.lg,
  },
  sectionTitle: {
    marginBottom: DesignTokens.spacing.xs,
  },
  sectionDescription: {
    fontSize: DesignTokens.typography.fontSizes.sm,
    color: Colors.light.textSecondary,
    lineHeight: DesignTokens.typography.lineHeights.relaxed * DesignTokens.typography.fontSizes.sm,
  },
  inputContainer: {
    marginTop: DesignTokens.spacing.lg,
  },
  presetRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: DesignTokens.spacing.sm,
  },
  presetButton: {
    flexGrow: 1,
    minWidth: 80,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: DesignTokens.spacing.md,
  },
  switchTextGroup: {
    flex: 1,
    marginRight: DesignTokens.spacing.md,
  },
  switchLabel: {
    fontSize: DesignTokens.typography.fontSizes.sm,
    fontWeight: DesignTokens.typography.fontWeights.semibold as any,
    color: Colors.light.text,
    marginBottom: DesignTokens.spacing.xs,
  },
  switchDescription: {
    fontSize: DesignTokens.typography.fontSizes.xs,
    color: Colors.light.textSecondary,
    lineHeight: DesignTokens.typography.lineHeights.relaxed * DesignTokens.typography.fontSizes.xs,
  },
  primaryButton: {
    marginHorizontal: DesignTokens.spacing.xl,
    marginBottom: DesignTokens.spacing['2xl'],
  },
  secondaryButton: {
    marginTop: DesignTokens.spacing.md,
  },
});
