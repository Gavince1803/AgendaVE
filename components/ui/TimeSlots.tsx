import { Colors } from '@/constants/Colors';
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

interface TimeSlot {
  time: string;
  isAvailable: boolean;
  isSelected?: boolean;
  isBooked?: boolean;
  duration?: number; // en minutos
}

interface TimeSlotsProps {
  slots: TimeSlot[];
  selectedTime?: string;
  onTimeSelect: (time: string) => void;
  slotDuration?: number; // duración por defecto en minutos
  startTime?: string; // hora de inicio (ej: "09:00")
  endTime?: string; // hora de fin (ej: "18:00")
}

export function TimeSlots({
  slots,
  selectedTime,
  onTimeSelect,
  slotDuration = 30,
  startTime = "09:00",
  endTime = "18:00",
}: TimeSlotsProps) {
  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const minute = parseInt(minutes);
    
    if (hour === 0) return `12:${minutes} AM`;
    if (hour < 12) return `${hour}:${minutes} AM`;
    if (hour === 12) return `12:${minutes} PM`;
    return `${hour - 12}:${minutes} PM`;
  };

  const getSlotStatus = (slot: TimeSlot) => {
    if (slot.isBooked) return 'booked';
    if (slot.isSelected) return 'selected';
    if (slot.isAvailable) return 'available';
    return 'unavailable';
  };

  const getSlotStyle = (slot: TimeSlot) => {
    const status = getSlotStatus(slot);
    
    switch (status) {
      case 'selected':
        return [styles.timeSlot, styles.timeSlotSelected];
      case 'booked':
        return [styles.timeSlot, styles.timeSlotBooked];
      case 'available':
        return [styles.timeSlot, styles.timeSlotAvailable];
      default:
        return [styles.timeSlot, styles.timeSlotUnavailable];
    }
  };

  const getSlotTextStyle = (slot: TimeSlot) => {
    const status = getSlotStatus(slot);
    
    switch (status) {
      case 'selected':
        return [styles.timeSlotText, styles.timeSlotTextSelected];
      case 'booked':
        return [styles.timeSlotText, styles.timeSlotTextBooked];
      case 'available':
        return [styles.timeSlotText, styles.timeSlotTextAvailable];
      default:
        return [styles.timeSlotText, styles.timeSlotTextUnavailable];
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Horarios Disponibles</Text>
        <Text style={styles.subtitle}>
          Selecciona una franja de {slotDuration} minutos
        </Text>
      </View>

      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.slotsGrid}>
          {slots.map((slot, index) => (
            <TouchableOpacity
              key={`${slot.time}-${index}`}
              style={getSlotStyle(slot)}
              onPress={() => {
                if (slot.isAvailable && !slot.isBooked) {
                  onTimeSelect(slot.time);
                }
              }}
              disabled={!slot.isAvailable || slot.isBooked}
            >
              <Text style={getSlotTextStyle(slot)}>
                {formatTime(slot.time)}
              </Text>
              {slot.isBooked && (
                <View style={styles.bookedOverlay}>
                  <Text style={styles.bookedText}>Ocupado</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>

        {slots.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>
              No hay horarios disponibles para esta fecha
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Leyenda removida para evitar duplicación con la guía del calendario */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.borderLight,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.light.textSecondary,
  },
  scrollView: {
    flex: 1,
  },
  slotsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    gap: 12,
  },
  timeSlot: {
    width: '30%',
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    position: 'relative',
    marginVertical: 4,
  },
  timeSlotAvailable: {
    backgroundColor: Colors.light.surface,
    borderColor: Colors.light.primary,
    shadowColor: Colors.light.primary,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  timeSlotBooked: {
    backgroundColor: Colors.light.error + '15',
    borderColor: Colors.light.error,
  },
  timeSlotSelected: {
    backgroundColor: Colors.light.primary,
    borderColor: Colors.light.primary,
    shadowColor: Colors.light.primary,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
  },
  timeSlotUnavailable: {
    backgroundColor: Colors.light.surfaceVariant,
    borderColor: Colors.light.borderLight,
    opacity: 0.5,
  },
  timeSlotText: {
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  timeSlotTextAvailable: {
    color: Colors.light.primary,
  },
  timeSlotTextBooked: {
    color: Colors.light.error,
  },
  timeSlotTextSelected: {
    color: '#ffffff',
  },
  timeSlotTextUnavailable: {
    color: Colors.light.textTertiary,
  },
  bookedOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(239, 68, 68, 0.8)',
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bookedText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#ffffff',
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: Colors.light.textSecondary,
    textAlign: 'center',
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.light.borderLight,
    backgroundColor: Colors.light.surface,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 6,
  },
  legendAvailable: {
    backgroundColor: Colors.light.success,
  },
  legendBooked: {
    backgroundColor: Colors.light.error,
  },
  legendSelected: {
    backgroundColor: Colors.light.primary,
  },
  legendText: {
    fontSize: 12,
    color: Colors.light.textSecondary,
  },
});
