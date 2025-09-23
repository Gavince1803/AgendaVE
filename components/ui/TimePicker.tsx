import { Colors, DesignTokens } from '@/constants/Colors';
import DateTimePicker from '@react-native-community/datetimepicker';
import React, { useState } from 'react';
import {
  Modal,
  Platform,
  StyleSheet,
  Text,
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
              onRequestClose={() => setShowPicker(false)}
            >
              <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                  <View style={styles.modalHeader}>
                    <TouchableOpacity
                      style={styles.modalButton}
                      onPress={() => setShowPicker(false)}
                    >
                      <Text style={styles.modalButtonText}>Cancelar</Text>
                    </TouchableOpacity>
                    <Text style={styles.modalTitle}>
                      {label || 'Seleccionar Hora'}
                    </Text>
                    <TouchableOpacity
                      style={styles.modalButton}
                      onPress={() => setShowPicker(false)}
                    >
                      <Text style={[styles.modalButtonText, styles.modalButtonDone]}>
                        Listo
                      </Text>
                    </TouchableOpacity>
                  </View>
                  
                  <DateTimePicker
                    value={timeToDate(value)}
                    mode="time"
                    display="wheels"
                    onChange={handleTimeChange}
                    style={styles.picker}
                  />
                </View>
              </View>
            </Modal>
          ) : (
            <DateTimePicker
              value={timeToDate(value)}
              mode="time"
              display="default"
              onChange={handleTimeChange}
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
  picker: {
    backgroundColor: Colors.light.background,
  },
});