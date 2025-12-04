import { Colors } from '@/constants/Colors';
import { useState } from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

interface CalendarProps {
  selectedDate?: string;
  onDateSelect: (date: string) => void;
  availableDates?: string[];
  bookedDates?: string[];
  minDate?: Date;
  maxDate?: Date;
}

export function Calendar({
  selectedDate,
  onDateSelect,
  availableDates = [],
  bookedDates = [],
  minDate = new Date(),
  maxDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 días desde hoy
}: CalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];

    // Helper to format date as YYYY-MM-DD in local time
    const formatDateLocal = (d: Date) => {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${y}-${m}-${day}`;
    };

    // Días del mes anterior para completar la primera semana
    const prevMonth = new Date(year, month - 1, 0);
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      const d = new Date(year, month - 1, prevMonth.getDate() - i);
      days.push({
        date: d.getDate(),
        isCurrentMonth: false,
        isToday: false,
        isSelected: false,
        isAvailable: false,
        isBooked: false,
        fullDate: formatDateLocal(d),
      });
    }

    // Días del mes actual
    const todayDate = new Date();
    const today = formatDateLocal(todayDate);

    for (let day = 1; day <= daysInMonth; day++) {
      const d = new Date(year, month, day);
      const fullDate = formatDateLocal(d);
      const isToday = fullDate === today;
      const isSelected = fullDate === selectedDate;
      const isAvailable = availableDates.includes(fullDate);
      const isBooked = bookedDates.includes(fullDate);

      // Compare dates without time components
      const dateObj = new Date(fullDate + 'T00:00:00');
      const todayObj = new Date(today + 'T00:00:00');
      const isPast = dateObj < todayObj;

      days.push({
        date: day,
        isCurrentMonth: true,
        isToday,
        isSelected,
        isAvailable,
        isBooked,
        isPast,
        fullDate,
      });
    }

    // Días del mes siguiente para completar la última semana
    const remainingDays = 42 - days.length; // 6 semanas * 7 días
    for (let day = 1; day <= remainingDays; day++) {
      const d = new Date(year, month + 1, day);
      days.push({
        date: day,
        isCurrentMonth: false,
        isToday: false,
        isSelected: false,
        isAvailable: false,
        isBooked: false,
        fullDate: formatDateLocal(d),
      });
    }

    return days;
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newMonth = new Date(currentMonth);
    if (direction === 'prev') {
      newMonth.setMonth(currentMonth.getMonth() - 1);
    } else {
      newMonth.setMonth(currentMonth.getMonth() + 1);
    }
    setCurrentMonth(newMonth);
  };

  const formatMonthYear = (date: Date) => {
    return date.toLocaleDateString('es-ES', {
      month: 'long',
      year: 'numeric'
    });
  };

  const days = getDaysInMonth(currentMonth);
  const weekDays = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

  return (
    <View style={styles.container}>
      {/* Header del calendario */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.navButton}
          onPress={() => navigateMonth('prev')}
        >
          <Text style={styles.navButtonText}>‹</Text>
        </TouchableOpacity>

        <Text style={styles.monthYear}>
          {formatMonthYear(currentMonth)}
        </Text>

        <TouchableOpacity
          style={styles.navButton}
          onPress={() => navigateMonth('next')}
        >
          <Text style={styles.navButtonText}>›</Text>
        </TouchableOpacity>
      </View>

      {/* Días de la semana */}
      <View style={styles.weekDaysContainer}>
        {weekDays.map((day) => (
          <Text key={day} style={styles.weekDay}>
            {day}
          </Text>
        ))}
      </View>

      {/* Días del calendario */}
      <View style={styles.daysContainer}>
        {days.map((day, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.dayButton,
              !day.isCurrentMonth && styles.dayButtonInactive,
              day.isPast && styles.dayButtonPast,
              day.isAvailable && day.isCurrentMonth && !day.isPast && styles.dayButtonAvailable,
              day.isBooked && styles.dayButtonBooked,
              day.isToday && styles.dayButtonToday,
              day.isSelected && styles.dayButtonSelected,
            ]}
            onPress={() => {
              if (day.isCurrentMonth && !day.isPast && (day.isAvailable || availableDates.length === 0)) {
                onDateSelect(day.fullDate);
              }
            }}
            disabled={!day.isCurrentMonth || day.isPast || (availableDates.length > 0 && !day.isAvailable)}
          >
            <Text
              style={[
                styles.dayText,
                !day.isCurrentMonth && styles.dayTextInactive,
                day.isPast && styles.dayTextPast,
                day.isAvailable && day.isCurrentMonth && !day.isPast && styles.dayTextAvailable,
                day.isBooked && styles.dayTextBooked,
                day.isToday && styles.dayTextToday,
                day.isSelected && styles.dayTextSelected,
              ]}
            >
              {day.date}
            </Text>
            {day.isBooked && <View style={styles.bookedIndicator} />}
          </TouchableOpacity>
        ))}
      </View>

      {/* Leyenda */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, styles.legendToday]} />
          <Text style={styles.legendText}>Hoy</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, styles.legendAvailable]} />
          <Text style={styles.legendText}>Disponible</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, styles.legendBooked]} />
          <Text style={styles.legendText}>Ocupado</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, styles.legendSelected]} />
          <Text style={styles.legendText}>Seleccionado</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.light.background,
    borderRadius: 16,
    padding: 16,
    margin: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  navButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.light.surfaceVariant,
    justifyContent: 'center',
    alignItems: 'center',
  },
  navButtonText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.light.primary,
  },
  monthYear: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.light.text,
    textTransform: 'capitalize',
  },
  weekDaysContainer: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  weekDay: {
    flex: 1,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '600',
    color: Colors.light.textSecondary,
    paddingVertical: 8,
  },
  daysContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayButton: {
    width: '14.28%',
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    marginVertical: 2,
  },
  dayButtonInactive: {
    opacity: 0.3,
  },
  dayButtonToday: {
    backgroundColor: Colors.light.primary + '20',
    borderRadius: 6,
    margin: 2,
  },
  dayButtonSelected: {
    backgroundColor: Colors.light.primary,
    borderRadius: 6,
    margin: 2,
  },
  dayButtonAvailable: {
    backgroundColor: Colors.light.success + '20',
    borderRadius: 6,
    margin: 2,
  },
  dayButtonBooked: {
    backgroundColor: Colors.light.error + '20',
    borderRadius: 6,
    margin: 2,
  },
  dayButtonPast: {
    opacity: 0.5,
  },
  dayText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.light.text,
  },
  dayTextInactive: {
    color: Colors.light.textTertiary,
  },
  dayTextToday: {
    color: Colors.light.primary,
    fontWeight: 'bold',
  },
  dayTextSelected: {
    color: '#ffffff',
    fontWeight: 'bold',
  },
  dayTextAvailable: {
    color: Colors.light.success,
    fontWeight: '600',
  },
  dayTextBooked: {
    color: Colors.light.error,
    fontWeight: '600',
  },
  dayTextPast: {
    color: Colors.light.textTertiary,
  },
  bookedIndicator: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.light.error,
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.light.borderLight,
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
  legendToday: {
    backgroundColor: Colors.light.primary + '60',
  },
  legendText: {
    fontSize: 12,
    color: Colors.light.textSecondary,
  },
});
