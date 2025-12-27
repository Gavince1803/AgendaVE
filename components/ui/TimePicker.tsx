import { Colors, DesignTokens } from '@/constants/Colors';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useEffect, useState } from 'react';
import {
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { IconSymbol } from './IconSymbol';

interface TimePickerProps {
  value: string; // Format: "HH:MM"
  onTimeChange: (time: string) => void;
  label?: string;
  disabled?: boolean;
}

export function TimePicker({
  value,
  onTimeChange,
  label,
  disabled = false,
}: TimePickerProps) {
  const [showPicker, setShowPicker] = useState(false);

  // Web-specific state
  const [webTime, setWebTime] = useState({ hour: '', minute: '', period: 'AM' });

  // Initialize web state from value
  useEffect(() => {
    if (Platform.OS === 'web') {
      try {
        const [h, m] = value.split(':').map(Number);
        if (!isNaN(h) && !isNaN(m)) {
          const period = h >= 12 ? 'PM' : 'AM';
          const hour = h === 0 ? 12 : h > 12 ? h - 12 : h;
          setWebTime({
            hour: hour.toString().padStart(2, '0'),
            minute: m.toString().padStart(2, '0'),
            period
          });
        }
      } catch (e) {
        // Fallback or ignore
      }
    }
  }, [value]);

  // Convert time string to Date object
  const timeToDate = (timeStr: string): Date => {
    try {
      const parts = timeStr.split(':');
      if (parts.length !== 2) {
        throw new Error('Invalid time format');
      }

      const [hours, minutes] = parts.map(Number);

      if (isNaN(hours) || isNaN(minutes) || hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
        throw new Error('Invalid time values');
      }

      const date = new Date();
      date.setHours(hours, minutes, 0, 0);
      return date;
    } catch (error) {
      console.warn('Invalid time string:', timeStr, error);
      // Return default time (9:00 AM) if parsing fails
      const date = new Date();
      date.setHours(9, 0, 0, 0);
      return date;
    }
  };

  // Convert Date object to time string
  const dateToTime = (date: Date): string => {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  const handleTimeChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowPicker(false);
    }

    if (selectedDate) {
      const timeStr = dateToTime(selectedDate);
      onTimeChange(timeStr);
    }
  };

  const handleModalClose = () => {
    setShowPicker(false);
  };

  const formatTimeDisplay = (timeStr: string): string => {
    try {
      const parts = timeStr.split(':');
      if (parts.length !== 2) {
        return '9:00 AM';
      }

      const [hours, minutes] = parts.map(Number);

      if (isNaN(hours) || isNaN(minutes) || hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
        return '9:00 AM';
      }

      const hour = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
      const period = hours >= 12 ? 'PM' : 'AM';
      return `${hour}:${minutes.toString().padStart(2, '0')} ${period}`;
    } catch (error) {
      console.warn('Error formatting time display:', timeStr, error);
      return '9:00 AM';
    }
  };

  // Web handlers
  const updateWebTime = (newTime: { hour: string; minute: string; period: string }) => {
    setWebTime(newTime);

    // Validate and propagate if complete
    if (newTime.hour.length > 0 && newTime.minute.length > 0) {
      let h = parseInt(newTime.hour, 10);
      const m = parseInt(newTime.minute, 10);

      if (!isNaN(h) && !isNaN(m)) {
        // Normalize 12h to 24h
        if (newTime.period === 'PM' && h < 12) h += 12;
        if (newTime.period === 'AM' && h === 12) h = 0;

        // Clamp values
        h = Math.min(23, Math.max(0, h));
        const validM = Math.min(59, Math.max(0, m));

        const timeStr = `${h.toString().padStart(2, '0')}:${validM.toString().padStart(2, '0')}`;
        onTimeChange(timeStr);
      }
    }
  };

  if (Platform.OS === 'web') {
    return (
      <View style={styles.container}>
        {label && (
          <Text style={styles.label}>{label}</Text>
        )}
        <View style={[
          styles.button,
          disabled && styles.buttonDisabled,
          {
            paddingVertical: 0,
            paddingHorizontal: 0,
            backgroundColor: Colors.light.background,
            width: 140,
            justifyContent: 'center',
            overflow: 'hidden'
          }
        ]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', flex: 1 }}>
            <TextInput
              style={[
                styles.timeText,
                disabled && styles.timeTextDisabled,
                {
                  width: 32,
                  textAlign: 'center',
                  height: 44,
                  outlineStyle: 'none',
                  backgroundColor: 'transparent'
                } as any
              ]}
              value={webTime.hour}
              onChangeText={(text) => {
                const numeric = text.replace(/[^0-9]/g, '');
                if (numeric.length <= 2) {
                  updateWebTime({ ...webTime, hour: numeric });
                }
              }}
              placeholder="HH"
              placeholderTextColor={Colors.light.textTertiary}
              editable={!disabled}
              maxLength={2}
            />
            <Text style={{ color: Colors.light.textSecondary, marginHorizontal: 2, fontWeight: 'bold' }}>:</Text>
            <TextInput
              style={[
                styles.timeText,
                disabled && styles.timeTextDisabled,
                {
                  width: 32,
                  textAlign: 'center',
                  height: 44,
                  outlineStyle: 'none',
                  backgroundColor: 'transparent'
                } as any
              ]}
              value={webTime.minute}
              onChangeText={(text) => {
                const numeric = text.replace(/[^0-9]/g, '');
                if (numeric.length <= 2) updateWebTime({ ...webTime, minute: numeric });
              }}
              placeholder="MM"
              placeholderTextColor={Colors.light.textTertiary}
              editable={!disabled}
              maxLength={2}
            />
          </View>

          <View style={{ width: 1, height: '60%', backgroundColor: Colors.light.border }} />

          <TouchableOpacity
            style={[
              {
                paddingHorizontal: 12,
                height: '100%',
                justifyContent: 'center',
                backgroundColor: 'transparent', // Removed grey background
              },
              disabled && { opacity: 0.5 }
            ]}
            onPress={() => !disabled && updateWebTime({ ...webTime, period: webTime.period === 'AM' ? 'PM' : 'AM' })}
          >
            <Text style={[
              styles.timeText,
              {
                color: Colors.light.primary,
                fontWeight: 'bold',
                fontSize: 14
              }
            ]}>
              {webTime.period}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {label && (
        <Text style={styles.label}>{label}</Text>
      )}

      <TouchableOpacity
        style={[
          styles.button,
          disabled && styles.buttonDisabled
        ]}
        onPress={() => !disabled && setShowPicker(true)}
        disabled={disabled}
      >
        <Text style={[
          styles.timeText,
          disabled && styles.timeTextDisabled
        ]}>
          {formatTimeDisplay(value)}
        </Text>
        <IconSymbol
          name="clock"
          size={16}
          color={disabled ? Colors.light.textTertiary : Colors.light.textSecondary}
        />
      </TouchableOpacity>

      {showPicker && (
        <>
          {Platform.OS === 'ios' ? (
            <Modal
              transparent
              animationType="slide"
              visible={showPicker}
              onRequestClose={handleModalClose}
              presentationStyle="overFullScreen"
            >
              <View style={styles.modalOverlay}>
                <TouchableOpacity
                  style={styles.modalBackdrop}
                  activeOpacity={1}
                  onPress={handleModalClose}
                />
                <View style={styles.modalContent}>
                  <View style={styles.modalHeader}>
                    <TouchableOpacity
                      style={styles.modalButton}
                      onPress={handleModalClose}
                    >
                      <Text style={styles.modalButtonText}>Cancelar</Text>
                    </TouchableOpacity>
                    <Text style={styles.modalTitle}>
                      {label || 'Seleccionar Hora'}
                    </Text>
                    <TouchableOpacity
                      style={styles.modalButton}
                      onPress={handleModalClose}
                    >
                      <Text style={[styles.modalButtonText, styles.modalButtonDone]}>
                        Listo
                      </Text>
                    </TouchableOpacity>
                  </View>

                  <View style={styles.pickerContainer}>
                    <DateTimePicker
                      value={timeToDate(value)}
                      mode="time"
                      display="spinner"
                      onChange={handleTimeChange}
                      style={styles.picker}
                      textColor={Colors.light.text}
                      locale="es-VE" // Force locale if supported
                      // Force 12h format if possible (Android only, iOS uses device locale usually)
                      is24Hour={false}
                    />
                  </View>
                </View>
              </View>
            </Modal>
          ) : (
            <DateTimePicker
              value={timeToDate(value)}
              mode="time"
              display="default"
              onChange={handleTimeChange}
              is24Hour={false}
            />
          )}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  label: {
    fontSize: DesignTokens.typography.fontSizes.sm,
    color: Colors.light.textSecondary,
    marginBottom: DesignTokens.spacing.sm,
    fontWeight: DesignTokens.typography.fontWeights.medium as any,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: DesignTokens.spacing.md,
    backgroundColor: Colors.light.background,
    borderRadius: DesignTokens.radius.md,
    borderWidth: 1,
    borderColor: Colors.light.border,
    minHeight: 44,
  },
  buttonDisabled: {
    backgroundColor: Colors.light.surfaceVariant,
    opacity: 0.6,
  },
  timeText: {
    fontSize: DesignTokens.typography.fontSizes.base,
    fontWeight: DesignTokens.typography.fontWeights.medium as any,
    color: Colors.light.text,
  },
  timeTextDisabled: {
    color: Colors.light.textTertiary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    flex: 1,
  },
  modalContent: {
    backgroundColor: Colors.light.background,
    borderTopLeftRadius: DesignTokens.radius.xl,
    borderTopRightRadius: DesignTokens.radius.xl,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: DesignTokens.spacing.xl,
    paddingVertical: DesignTokens.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.borderLight,
  },
  modalTitle: {
    fontSize: DesignTokens.typography.fontSizes.lg,
    fontWeight: DesignTokens.typography.fontWeights.semibold as any,
    color: Colors.light.text,
  },
  modalButton: {
    paddingVertical: DesignTokens.spacing.sm,
    paddingHorizontal: DesignTokens.spacing.md,
  },
  modalButtonText: {
    fontSize: DesignTokens.typography.fontSizes.base,
    color: Colors.light.primary,
  },
  modalButtonDone: {
    fontWeight: DesignTokens.typography.fontWeights.semibold as any,
  },
  pickerContainer: {
    paddingHorizontal: DesignTokens.spacing.xl,
    paddingVertical: DesignTokens.spacing.lg,
  },
  picker: {
    backgroundColor: Colors.light.background,
    height: 200,
  },
  periodToggle: {
    marginLeft: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
    backgroundColor: Colors.light.surfaceVariant,
    borderRadius: 4,
  }
});