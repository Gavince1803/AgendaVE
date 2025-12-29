import { ThemedText } from '@/components/ThemedText';
import { Card } from '@/components/ui/Card';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors, DesignTokens } from '@/constants/Colors';
import { Appointment } from '@/lib/booking-service';
import { useMemo, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
  useWindowDimensions
} from 'react-native';

export type CalendarViewMode = 'month' | 'week';

export interface CalendarViewProps {
  appointments: Appointment[];
  viewMode?: CalendarViewMode;
  onAppointmentPress?: (appointment: Appointment) => void;
  onDatePress?: (date: Date) => void;
  selectedDate?: Date;
}

interface DayCell {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
  appointments: Appointment[];
}

const DAYS_SHORT = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const MONTHS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

export function CalendarView({
  appointments,
  viewMode = 'month',
  onAppointmentPress,
  onDatePress,
  selectedDate,
}: CalendarViewProps) {
  const { width } = useWindowDimensions();
  const isDesktop = width > 768;
  const [currentDate, setCurrentDate] = useState(selectedDate || new Date());
  const [mode, setMode] = useState<CalendarViewMode>(viewMode);

  // Get appointments grouped by date
  const appointmentsByDate = useMemo(() => {
    const map = new Map<string, Appointment[]>();

    appointments.forEach(apt => {
      const dateKey = apt.appointment_date; // Format: YYYY-MM-DD
      if (!map.has(dateKey)) {
        map.set(dateKey, []);
      }
      map.get(dateKey)!.push(apt);
    });

    return map;
  }, [appointments]);

  // Generate calendar days for month view
  const monthDays = useMemo((): DayCell[] => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    // First day of the month
    const firstDay = new Date(year, month, 1);
    const firstDayOfWeek = firstDay.getDay();

    // Last day of the month
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();

    // Previous month's trailing days
    const prevMonthLastDay = new Date(year, month, 0).getDate();

    const days: DayCell[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Add previous month's days
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      const date = new Date(year, month - 1, prevMonthLastDay - i);
      const dateKey = formatDateKey(date);
      days.push({
        date,
        isCurrentMonth: false,
        isToday: false,
        isSelected: false,
        appointments: appointmentsByDate.get(dateKey) || [],
      });
    }

    // Add current month's days
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dateKey = formatDateKey(date);
      const isToday = date.getTime() === today.getTime();
      const isSelected = selectedDate ?
        date.getTime() === new Date(selectedDate).setHours(0, 0, 0, 0) : false;

      days.push({
        date,
        isCurrentMonth: true,
        isToday,
        isSelected,
        appointments: appointmentsByDate.get(dateKey) || [],
      });
    }

    // Add next month's days to fill the grid
    const remainingDays = 42 - days.length; // 6 rows * 7 days
    for (let day = 1; day <= remainingDays; day++) {
      const date = new Date(year, month + 1, day);
      const dateKey = formatDateKey(date);
      days.push({
        date,
        isCurrentMonth: false,
        isToday: false,
        isSelected: false,
        appointments: appointmentsByDate.get(dateKey) || [],
      });
    }

    return days;
  }, [currentDate, appointmentsByDate, selectedDate]);

  // Generate week days
  const weekDays = useMemo((): DayCell[] => {
    const startOfWeek = getStartOfWeek(currentDate);
    const days: DayCell[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      const dateKey = formatDateKey(date);
      const isToday = date.getTime() === today.getTime();
      const isSelected = selectedDate ?
        date.getTime() === new Date(selectedDate).setHours(0, 0, 0, 0) : false;

      days.push({
        date,
        isCurrentMonth: true,
        isToday,
        isSelected,
        appointments: appointmentsByDate.get(dateKey) || [],
      });
    }

    return days;
  }, [currentDate, appointmentsByDate, selectedDate]);

  const handlePrevious = () => {
    const newDate = new Date(currentDate);
    if (mode === 'month') {
      newDate.setMonth(currentDate.getMonth() - 1);
    } else {
      newDate.setDate(currentDate.getDate() - 7);
    }
    setCurrentDate(newDate);
  };

  const handleNext = () => {
    const newDate = new Date(currentDate);
    if (mode === 'month') {
      newDate.setMonth(currentDate.getMonth() + 1);
    } else {
      newDate.setDate(currentDate.getDate() + 7);
    }
    setCurrentDate(newDate);
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const handleDayPress = (dayCell: DayCell) => {
    if (onDatePress) {
      onDatePress(dayCell.date);
    }
  };

  const renderDayCell = (dayCell: DayCell) => {
    const hasAppointments = dayCell.appointments.length > 0;
    const appointmentCount = dayCell.appointments.length;

    return (
      <TouchableOpacity
        key={dayCell.date.toISOString()}
        style={[
          styles.dayCell,
          isDesktop && styles.dayCellDesktop,
          isDesktop && dayCell.isSelected && { height: 'auto', minHeight: 120, overflow: 'visible', zIndex: 10 },
          !dayCell.isCurrentMonth && styles.dayCellInactive,
          dayCell.isToday && styles.dayCellToday,
          dayCell.isSelected && styles.dayCellSelected,
        ]}
        onPress={() => handleDayPress(dayCell)}
      >
        <View style={[styles.dayHeaderContainer, isDesktop && { alignSelf: 'flex-start', marginBottom: 4 }]}>
          <ThemedText
            style={[
              styles.dayText,
              !dayCell.isCurrentMonth && styles.dayTextInactive,
              dayCell.isToday && styles.dayTextToday,
              dayCell.isSelected && styles.dayTextSelected,
            ]}
          >
            {dayCell.date.getDate()}
          </ThemedText>
        </View>

        {isDesktop ? (
          <View style={styles.desktopAppointmentsContainer}>
            {(dayCell.isSelected ? dayCell.appointments : dayCell.appointments.slice(0, 3)).map((apt, i) => (
              <View key={apt.id} style={[
                styles.desktopAppointmentChip,
                { backgroundColor: getStatusColor(apt.status) + (dayCell.isSelected ? '' : '20') }
              ]}>
                <ThemedText
                  numberOfLines={1}
                  style={[
                    styles.desktopAppointmentText,
                    { color: dayCell.isSelected ? '#fff' : getStatusColor(apt.status) }
                  ]}
                >
                  {apt.appointment_time.slice(0, 5)} {apt.profiles?.display_name || apt.client_name || 'Cliente'}
                </ThemedText>
              </View>
            ))}
            {!dayCell.isSelected && dayCell.appointments.length > 3 && (
              <ThemedText style={[
                styles.moreAppointmentsText,
                dayCell.isSelected && { color: '#fff' }
              ]}>
                +{dayCell.appointments.length - 3} más
              </ThemedText>
            )}
          </View>
        ) : (
          hasAppointments && (
            <View style={styles.appointmentIndicator}>
              <View style={[
                styles.appointmentDot,
                dayCell.isSelected && styles.appointmentDotSelected,
              ]} />
              {appointmentCount > 1 && (
                <ThemedText style={[
                  styles.appointmentCount,
                  dayCell.isSelected && styles.appointmentCountSelected,
                ]}>
                  {appointmentCount}
                </ThemedText>
              )}
            </View>
          )
        )}
      </TouchableOpacity>
    );
  };

  const renderMonthView = () => (
    <View style={styles.monthGrid}>
      {/* Day headers */}
      <View style={styles.dayHeaderRow}>
        {DAYS_SHORT.map((day, index) => (
          <View key={index} style={styles.dayHeaderCell}>
            <ThemedText style={styles.dayHeaderText}>{day}</ThemedText>
          </View>
        ))}
      </View>

      {/* Calendar grid */}
      <View style={styles.calendarGrid}>
        {monthDays.map((dayCell) => renderDayCell(dayCell))}
      </View>
    </View>
  );

  const renderWeekView = () => (
    <View style={styles.weekContainer}>
      <View style={styles.weekHeader}>
        {weekDays.map((dayCell) => (
          <TouchableOpacity
            key={dayCell.date.toISOString()}
            style={[
              styles.weekDayHeader,
              dayCell.isToday && styles.weekDayHeaderToday,
              dayCell.isSelected && styles.weekDayHeaderSelected,
            ]}
            onPress={() => handleDayPress(dayCell)}
          >
            <ThemedText style={[
              styles.weekDayName,
              dayCell.isSelected && styles.weekDayNameSelected,
            ]}>
              {DAYS_SHORT[dayCell.date.getDay()]}
            </ThemedText>
            <ThemedText style={[
              styles.weekDayNumber,
              dayCell.isToday && styles.weekDayNumberToday,
              dayCell.isSelected && styles.weekDayNumberSelected,
            ]}>
              {dayCell.date.getDate()}
            </ThemedText>
            {dayCell.appointments.length > 0 && (
              <View style={[
                styles.weekAppointmentDot,
                dayCell.isSelected && styles.weekAppointmentDotSelected,
              ]} />
            )}
          </TouchableOpacity>
        ))}
      </View>

      {/* Appointments list for selected day */}
      <ScrollView style={styles.weekAppointmentsList} showsVerticalScrollIndicator={false}>
        {weekDays.map((dayCell) => {
          if (dayCell.appointments.length === 0) return null;

          return (
            <View key={dayCell.date.toISOString()} style={styles.dayAppointmentsSection}>
              <ThemedText style={styles.dayAppointmentsTitle}>
                {formatDateLabel(dayCell.date)}
              </ThemedText>
              {dayCell.appointments.map((appointment) => (
                <Card
                  key={appointment.id}
                  variant="elevated"
                  style={styles.appointmentCard}
                  onPress={() => onAppointmentPress?.(appointment)}
                >
                  <View style={styles.appointmentCardContent}>
                    <View style={styles.appointmentTime}>
                      <IconSymbol name="clock" size={16} color={Colors.light.primary} />
                      <ThemedText style={styles.appointmentTimeText}>
                        {appointment.appointment_time}
                      </ThemedText>
                    </View>
                    <ThemedText style={styles.appointmentService} numberOfLines={1}>
                      {appointment.services?.name || 'Servicio'}
                    </ThemedText>
                    <ThemedText style={styles.appointmentClient} numberOfLines={1}>
                      {appointment.profiles?.display_name || appointment.client_name || 'Cliente'}
                    </ThemedText>
                    <View style={[
                      styles.appointmentStatus,
                      { backgroundColor: getStatusColor(appointment.status) + '20' }
                    ]}>
                      <ThemedText style={[
                        styles.appointmentStatusText,
                        { color: getStatusColor(appointment.status) }
                      ]}>
                        {getStatusLabel(appointment.status)}
                      </ThemedText>
                    </View>
                  </View>
                </Card>
              ))}
            </View>
          );
        })}

        {
          weekDays.every(d => d.appointments.length === 0) && (
            <View style={styles.emptyState}>
              <IconSymbol name="calendar" size={48} color={Colors.light.textSecondary} />
              <ThemedText style={styles.emptyStateText}>
                No hay citas esta semana
              </ThemedText>
            </View>
          )
        }
      </ScrollView >
    </View >
  );

  return (
    <View style={[styles.container, isDesktop && styles.containerDesktop]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <ThemedText style={styles.headerTitle}>
            {mode === 'month'
              ? `${MONTHS[currentDate.getMonth()]} ${currentDate.getFullYear()}`
              : getWeekRange(currentDate)
            }
          </ThemedText>
          <TouchableOpacity style={styles.todayButton} onPress={handleToday}>
            <ThemedText style={styles.todayButtonText}>Hoy</ThemedText>
          </TouchableOpacity>
        </View>

        <View style={styles.headerRight}>
          <View style={styles.viewModeToggle}>
            <TouchableOpacity
              style={[styles.viewModeButton, mode === 'month' && styles.viewModeButtonActive]}
              onPress={() => setMode('month')}
            >
              <IconSymbol
                name="calendar"
                size={18}
                color={mode === 'month' ? Colors.light.primary : Colors.light.textSecondary}
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.viewModeButton, mode === 'week' && styles.viewModeButtonActive]}
              onPress={() => setMode('week')}
            >
              <IconSymbol
                name="list.bullet"
                size={18}
                color={mode === 'week' ? Colors.light.primary : Colors.light.textSecondary}
              />
            </TouchableOpacity>
          </View>

          <View style={styles.navigationButtons}>
            <TouchableOpacity style={styles.navButton} onPress={handlePrevious}>
              <IconSymbol name="chevron.left" size={20} color={Colors.light.text} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.navButton} onPress={handleNext}>
              <IconSymbol name="chevron.right" size={20} color={Colors.light.text} />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Calendar content */}
      {mode === 'month' ? (
        <>
          {renderMonthView()}
          <View style={styles.monthAppointmentsContainer}>
            <ThemedText style={styles.sectionTitle}>
              {selectedDate ? formatDateLabel(selectedDate) : 'Selecciona una fecha'}
            </ThemedText>
            {(() => {
              const targetDate = selectedDate || new Date();
              const dateKey = formatDateKey(targetDate);
              const dayAppointments = appointmentsByDate.get(dateKey) || [];

              if (dayAppointments.length === 0) {
                return (
                  <View style={styles.emptyStateCompact}>
                    <ThemedText style={styles.emptyStateTextCompact}>
                      No hay citas para este día
                    </ThemedText>
                  </View>
                );
              }

              return dayAppointments.map((appointment) => (
                <Card
                  key={appointment.id}
                  variant="elevated"
                  style={styles.appointmentCard}
                  onPress={() => onAppointmentPress?.(appointment)}
                >
                  <View style={styles.appointmentCardContent}>
                    <View style={styles.appointmentTime}>
                      <IconSymbol name="clock" size={16} color={Colors.light.primary} />
                      <ThemedText style={styles.appointmentTimeText}>
                        {appointment.appointment_time}
                      </ThemedText>
                    </View>
                    <ThemedText style={styles.appointmentService} numberOfLines={1}>
                      {appointment.services?.name || 'Servicio'}
                    </ThemedText>
                    <ThemedText style={styles.appointmentClient} numberOfLines={1}>
                      {appointment.profiles?.display_name || appointment.client_name || 'Cliente'}
                    </ThemedText>
                    <View style={[
                      styles.appointmentStatus,
                      { backgroundColor: getStatusColor(appointment.status) + '20' }
                    ]}>
                      <ThemedText style={[
                        styles.appointmentStatusText,
                        { color: getStatusColor(appointment.status) }
                      ]}>
                        {getStatusLabel(appointment.status)}
                      </ThemedText>
                    </View>
                  </View>
                </Card>
              ));
            })()}
          </View>
        </>
      ) : renderWeekView()}
    </View >
  );
}

// Helper functions
function formatDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatDateLabel(date: Date): string {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const compareDate = new Date(date);
  compareDate.setHours(0, 0, 0, 0);

  if (compareDate.getTime() === today.getTime()) {
    return 'Hoy';
  }

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  if (compareDate.getTime() === tomorrow.getTime()) {
    return 'Mañana';
  }

  return date.toLocaleDateString('es-VE', {
    weekday: 'long',
    day: 'numeric',
    month: 'long'
  });
}

function getStartOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day; // Sunday is 0
  return new Date(d.setDate(diff));
}

function getWeekRange(date: Date): string {
  const start = getStartOfWeek(date);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);

  const startMonth = MONTHS[start.getMonth()];
  const endMonth = MONTHS[end.getMonth()];

  if (start.getMonth() === end.getMonth()) {
    return `${start.getDate()} - ${end.getDate()} ${startMonth}`;
  } else {
    return `${start.getDate()} ${startMonth} - ${end.getDate()} ${endMonth}`;
  }
}

function getStatusColor(status: string): string {
  switch (status) {
    case 'confirmed':
      return Colors.light.success;
    case 'pending':
      return Colors.light.warning;
    case 'cancelled':
      return Colors.light.error;
    case 'done':
      return Colors.light.primary;
    default:
      return Colors.light.textSecondary;
  }
}

function getStatusLabel(status: string): string {
  switch (status) {
    case 'confirmed':
      return 'Confirmada';
    case 'pending':
      return 'Pendiente';
    case 'cancelled':
      return 'Cancelada';
    case 'done':
      return 'Completada';
    default:
      return status;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.surface,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: DesignTokens.spacing.lg,
    paddingVertical: DesignTokens.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DesignTokens.spacing.md,
  },
  headerTitle: {
    fontSize: DesignTokens.typography.fontSizes.lg,
    fontWeight: DesignTokens.typography.fontWeights.semibold as any,
    color: Colors.light.text,
  },
  todayButton: {
    paddingHorizontal: DesignTokens.spacing.md,
    paddingVertical: DesignTokens.spacing.xs,
    borderRadius: DesignTokens.radius.md,
    backgroundColor: Colors.light.primary + '15',
  },
  todayButtonText: {
    fontSize: DesignTokens.typography.fontSizes.sm,
    fontWeight: DesignTokens.typography.fontWeights.medium as any,
    color: Colors.light.primary,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DesignTokens.spacing.md,
  },
  viewModeToggle: {
    flexDirection: 'row',
    backgroundColor: Colors.light.surfaceVariant,
    borderRadius: DesignTokens.radius.md,
    padding: DesignTokens.spacing.xs,
  },
  viewModeButton: {
    padding: DesignTokens.spacing.sm,
    borderRadius: DesignTokens.radius.sm,
  },
  viewModeButtonActive: {
    backgroundColor: Colors.light.surface,
  },
  navigationButtons: {
    flexDirection: 'row',
    gap: DesignTokens.spacing.xs,
  },
  navButton: {
    padding: DesignTokens.spacing.sm,
    borderRadius: DesignTokens.radius.md,
    backgroundColor: Colors.light.surfaceVariant,
  },

  // Month view styles
  monthGrid: {
    paddingHorizontal: DesignTokens.spacing.lg,
    paddingVertical: DesignTokens.spacing.md,
  },
  dayHeaderRow: {
    flexDirection: 'row',
    marginBottom: DesignTokens.spacing.sm,
  },
  dayHeaderCell: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: DesignTokens.spacing.sm,
  },
  dayHeaderText: {
    fontSize: DesignTokens.typography.fontSizes.xs,
    fontWeight: DesignTokens.typography.fontWeights.semibold as any,
    color: Colors.light.textSecondary,
    textTransform: 'uppercase',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    padding: DesignTokens.spacing.xs,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: DesignTokens.radius.md,
  },
  dayCellInactive: {
    opacity: 0.3,
  },
  dayCellToday: {
    backgroundColor: Colors.light.primary + '15',
  },
  dayCellSelected: {
    backgroundColor: Colors.light.primary,
  },
  dayText: {
    fontSize: DesignTokens.typography.fontSizes.sm,
    fontWeight: DesignTokens.typography.fontWeights.medium as any,
    color: Colors.light.text,
  },
  dayTextInactive: {
    color: Colors.light.textSecondary,
  },
  dayTextToday: {
    color: Colors.light.primary,
    fontWeight: DesignTokens.typography.fontWeights.bold as any,
  },
  dayTextSelected: {
    color: Colors.light.textOnPrimary,
  },
  appointmentIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DesignTokens.spacing.xs,
    marginTop: DesignTokens.spacing.xs,
  },
  appointmentDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.light.primary,
  },
  appointmentDotSelected: {
    backgroundColor: Colors.light.textOnPrimary,
  },
  appointmentCount: {
    fontSize: DesignTokens.typography.fontSizes.xs,
    color: Colors.light.primary,
    fontWeight: DesignTokens.typography.fontWeights.semibold as any,
  },
  appointmentCountSelected: {
    color: Colors.light.textOnPrimary,
  },

  // Week view styles
  weekContainer: {
    flex: 1,
  },
  weekHeader: {
    flexDirection: 'row',
    paddingHorizontal: DesignTokens.spacing.md,
    paddingVertical: DesignTokens.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
    backgroundColor: Colors.light.surface,
  },
  weekDayHeader: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: DesignTokens.spacing.sm,
    borderRadius: DesignTokens.radius.md,
  },
  weekDayHeaderToday: {
    backgroundColor: Colors.light.primary + '15',
  },
  weekDayHeaderSelected: {
    backgroundColor: Colors.light.primary,
  },
  weekDayName: {
    fontSize: DesignTokens.typography.fontSizes.xs,
    color: Colors.light.textSecondary,
    textTransform: 'uppercase',
    marginBottom: DesignTokens.spacing.xs,
  },
  weekDayNameSelected: {
    color: Colors.light.textOnPrimary,
  },
  weekDayNumber: {
    fontSize: DesignTokens.typography.fontSizes.lg,
    fontWeight: DesignTokens.typography.fontWeights.semibold as any,
    color: Colors.light.text,
  },
  weekDayNumberToday: {
    color: Colors.light.primary,
  },
  weekDayNumberSelected: {
    color: Colors.light.textOnPrimary,
  },
  weekAppointmentDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.light.primary,
    marginTop: DesignTokens.spacing.xs,
  },
  weekAppointmentDotSelected: {
    backgroundColor: Colors.light.textOnPrimary,
  },
  weekAppointmentsList: {
    flex: 1,
    paddingHorizontal: DesignTokens.spacing.lg,
    paddingTop: DesignTokens.spacing.lg,
  },
  dayAppointmentsSection: {
    marginBottom: DesignTokens.spacing.xl,
  },
  dayAppointmentsTitle: {
    fontSize: DesignTokens.typography.fontSizes.md,
    fontWeight: DesignTokens.typography.fontWeights.semibold as any,
    color: Colors.light.text,
    marginBottom: DesignTokens.spacing.md,
    textTransform: 'capitalize',
  },
  appointmentCard: {
    marginBottom: DesignTokens.spacing.md,
    padding: DesignTokens.spacing.md,
  },
  appointmentCardContent: {
    gap: DesignTokens.spacing.sm,
  },
  appointmentTime: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DesignTokens.spacing.sm,
  },
  appointmentTimeText: {
    fontSize: DesignTokens.typography.fontSizes.md,
    fontWeight: DesignTokens.typography.fontWeights.semibold as any,
    color: Colors.light.primary,
  },
  appointmentService: {
    fontSize: DesignTokens.typography.fontSizes.base,
    fontWeight: DesignTokens.typography.fontWeights.medium as any,
    color: Colors.light.text,
  },
  appointmentClient: {
    fontSize: DesignTokens.typography.fontSizes.sm,
    color: Colors.light.textSecondary,
  },
  appointmentStatus: {
    alignSelf: 'flex-start',
    paddingHorizontal: DesignTokens.spacing.md,
    paddingVertical: DesignTokens.spacing.xs,
    borderRadius: DesignTokens.radius.full,
  },
  appointmentStatusText: {
    fontSize: DesignTokens.typography.fontSizes.xs,
    fontWeight: DesignTokens.typography.fontWeights.medium as any,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: DesignTokens.spacing['4xl'],
  },
  emptyStateText: {
    fontSize: DesignTokens.typography.fontSizes.base,
    color: Colors.light.textSecondary,
    marginTop: DesignTokens.spacing.md,
  },
  monthAppointmentsContainer: {
    padding: DesignTokens.spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
    marginTop: DesignTokens.spacing.sm,
  },
  sectionTitle: {
    fontSize: DesignTokens.typography.fontSizes.lg,
    fontWeight: DesignTokens.typography.fontWeights.semibold as any,
    color: Colors.light.text,
    marginBottom: DesignTokens.spacing.md,
    textTransform: 'capitalize',
  },
  emptyStateCompact: {
    padding: DesignTokens.spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.light.surfaceVariant,
    borderRadius: DesignTokens.radius.md,
  },
  emptyStateTextCompact: {
    color: Colors.light.textSecondary,
    fontSize: DesignTokens.typography.fontSizes.sm,
  },
  dayCellDesktop: {
    height: 120,
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
    padding: 8,
    borderWidth: 1,
    borderColor: Colors.light.border,
    margin: -1,
    borderRadius: 0,
    overflow: 'hidden',
  },
  dayHeaderContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  desktopAppointmentsContainer: {
    width: '100%',
    gap: 4,
  },
  desktopAppointmentChip: {
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
    width: '100%',
    marginBottom: 2,
  },
  desktopAppointmentText: {
    fontSize: 10,
    fontWeight: '600',
  },
  moreAppointmentsText: {
    fontSize: 10,
    color: Colors.light.textSecondary,
    textAlign: 'center',
    marginTop: 2,
  },
  containerDesktop: {
    maxWidth: 1200,
    alignSelf: 'center',
    width: '100%',
  },
});
