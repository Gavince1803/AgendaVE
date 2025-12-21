import { Colors } from '@/constants/Colors';
import { useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

interface CalendarProps {
  selectedDate?: string;
  onDateSelect: (date: string) => void;
  availableDates?: ({ date: string; slots: number } | string)[];
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
        slots: 0,
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
      const availabilityInfo = availableDates.find(a => {
        if (typeof a === 'string') return a === fullDate;
        return a.date === fullDate;
      });
      const isAvailable = !!availabilityInfo;
      const slots = typeof availabilityInfo === 'object' ? availabilityInfo.slots : (availabilityInfo ? 1 : 0);
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
        slots,
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
        slots: 0,
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

  // Helper to determine indicator color
  const getIndicatorColor = (slots: number) => {
    if (slots > 10) return Colors.light.success; // Green
    if (slots >= 6) return '#F59E0B'; // Yellow/Amber
    if (slots >= 1) return '#EA580C'; // Darker Orange for better contrast
    return 'transparent';
  };

  // DEBUG: Check dates mismatch
  useEffect(() => {
    if (availableDates.length > 0) {
      console.log('🔴 [CALENDAR DEBUG] Available Dates Prop:', JSON.stringify(availableDates.slice(0, 3)));
      const sampleDay = days.find(d => d.isCurrentMonth && !d.isPast);
      if (sampleDay) {
        console.log('🔴 [CALENDAR DEBUG] Sample Calendar Day:', sampleDay.fullDate, 'Is Available:', sampleDay.isAvailable);
        const match = availableDates.find(a => {
          if (typeof a === 'string') return a === sampleDay.fullDate;
          return a.date === sampleDay.fullDate;
        });
        console.log('🔴 [CALENDAR DEBUG] Match found?:', match);
      }
    }
  }, [availableDates, currentMonth]);

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
        {days.map((day, index) => {
          const indicatorColor = getIndicatorColor(day.slots);

          return (
            <TouchableOpacity
              key={index}
              style={[
                styles.dayButton,
                // Only keep layout styles on the touchable
              ]}
              onPress={() => {
                if (day.isCurrentMonth && !day.isPast && (day.isAvailable || availableDates.length === 0)) {
                  onDateSelect(day.fullDate);
                }
              }}
              disabled={!day.isCurrentMonth || day.isPast || (availableDates.length > 0 && !day.isAvailable)}
            >
              <View style={[
                styles.dayInnerCircle,
                !day.isCurrentMonth && styles.dayButtonInactive,
                day.isPast && styles.dayButtonPast,
                // Unavailable days (greyed out)
                day.isCurrentMonth && !day.isPast && availableDates.length > 0 && !day.isAvailable && styles.dayButtonUnavailable,
                day.isSelected && styles.dayButtonSelected,
                // Circular border if today but not selected
                day.isToday && !day.isSelected && styles.dayButtonTodayBorder,
              ]}>
                <Text
                  style={[
                    styles.dayText,
                    !day.isCurrentMonth && styles.dayTextInactive,
                    day.isPast && styles.dayTextPast,
                    // Unavailable text (greyed out)
                    day.isCurrentMonth && !day.isPast && availableDates.length > 0 && !day.isAvailable && styles.dayTextUnavailable,
                    day.isToday && styles.dayTextToday,
                    day.isSelected && styles.dayTextSelected,
                  ]}
                >
                  {day.date}
                </Text>

                {/* Availability Indicator (Small Bar) */}
                {day.isCurrentMonth && !day.isPast && day.slots > 0 && (
                  <View style={[
                    styles.availabilityIndicator,
                    { backgroundColor: indicatorColor },
                    day.isSelected && styles.availabilityIndicatorSelected
                  ]} />
                )}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Leyenda */}
      <View style={styles.legendContainer}>
        <Text style={styles.legendLabel}>Disponibilidad:</Text>
        <View style={styles.legendItems}>
          <View style={styles.legendItem}>
            <View style={[styles.legendBar, { backgroundColor: Colors.light.success }]} />
            <Text style={styles.legendText}>+10</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendBar, { backgroundColor: '#F59E0B' }]} />
            <Text style={styles.legendText}>6-10</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendBar, { backgroundColor: '#EA580C' }]} />
            <Text style={styles.legendText}>1-5</Text>
          </View>
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
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
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
    height: 48, // Increased height for indicator
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 2,
  },
  dayInnerCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  dayButtonUnavailable: {
    opacity: 0.3,
    backgroundColor: Colors.light.surfaceVariant,
  },
  dayButtonInactive: {
    opacity: 0.3,
  },
  dayButtonPast: {
    opacity: 0.3,
  },
  dayButtonSelected: {
    backgroundColor: Colors.light.primary + '15', // Light background for selection
    borderWidth: 2,
    borderColor: Colors.light.primary,
    borderRadius: 20, // Match inner circle radius
    opacity: 1, // Encode opacity to override unavailable style
  },
  dayButtonTodayBorder: {
    borderWidth: 1,
    borderColor: Colors.light.primary,
    borderRadius: 20, // Match inner circle radius
    opacity: 1,
  },
  dayText: {
    fontSize: 15,
    fontWeight: '400',
    color: Colors.light.text,
  },
  dayTextUnavailable: {
    color: Colors.light.textTertiary,
  },
  dayTextInactive: {
    color: Colors.light.textTertiary,
  },
  dayTextPast: {
    color: Colors.light.textTertiary,
  },
  dayTextToday: {
    color: Colors.light.primary,
    fontWeight: 'bold',
  },
  dayTextSelected: {
    color: Colors.light.text,
    fontWeight: '600',
  },
  availabilityIndicator: {
    position: 'absolute',
    bottom: 2, // Adjusted for inner circle
    width: 4, // Small dot
    height: 4, // Small dot
    borderRadius: 2, // Circular dot
  },
  availabilityIndicatorSelected: {
    backgroundColor: Colors.light.primary, // Force specific color if needed
  },
  legendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.light.borderLight,
    gap: 12,
  },
  legendLabel: {
    fontSize: 13,
    color: Colors.light.text,
    fontWeight: '500',
  },
  legendItems: {
    flexDirection: 'row',
    gap: 16,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendBar: {
    width: 12,
    height: 3,
    borderRadius: 1.5,
  },
  legendText: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    fontWeight: '500',
  },
});
