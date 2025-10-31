import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView } from 'react-native';
import { Card } from './Card';
import { IconSymbol } from './IconSymbol';
import { Avatar } from './Avatar';
import { Colors, DesignTokens } from '@/constants/Colors';
import { Employee } from '@/lib/booking-service';

interface EmployeeSelectorProps {
  employees: Employee[];
  selectedEmployee?: Employee | null;
  onEmployeeSelect: (employee: Employee) => void;
  loading?: boolean;
  selectedService?: {
    name: string;
    price: number;
    duration: number;
  } | null;
}

export function EmployeeSelector({
  employees,
  selectedEmployee,
  onEmployeeSelect,
  loading = false,
  selectedService = null
}: EmployeeSelectorProps) {
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Cargando empleados...</Text>
      </View>
    );
  }

  if (employees.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <IconSymbol name="person.2" size={32} color={Colors.light.textSecondary} />
        <Text style={styles.emptyText}>No hay empleados disponibles</Text>
        <Text style={styles.debugText}>El proveedor necesita agregar empleados desde el panel de administración</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Seleccionar Empleado</Text>
      <Text style={styles.sectionSubtitle}>
        Elige quién te atenderá durante tu cita
      </Text>

      {/* Service info if available */}
      {selectedService && (
        <View style={styles.serviceInfoCard}>
          <View style={styles.serviceInfoRow}>
            <IconSymbol name="scissors" size={16} color={Colors.light.primary} />
            <Text style={styles.serviceInfoText}>
              {selectedService.name} • {selectedService.duration} min • ${selectedService.price}
            </Text>
          </View>
        </View>
      )}

      <ScrollView 
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.employeesList}
        style={styles.employeesScrollView}
      >
        {employees.map((employee) => (
          <TouchableOpacity
            key={employee.id}
            onPress={() => onEmployeeSelect(employee)}
            style={styles.employeeCardWrapper}
          >
            <Card
              variant={selectedEmployee?.id === employee.id ? "elevated" : "default"}
              style={[
                styles.employeeCard,
                selectedEmployee?.id === employee.id && styles.selectedEmployeeCard
              ]}
            >
              <View style={styles.employeeContent}>
                <Avatar 
                  name={employee.name}
                  size="medium"
                  style={styles.employeeAvatar}
                  source={employee.profile_image_url ? { uri: employee.profile_image_url } : undefined}
                />
                
                <View style={styles.employeeInfo}>
                  <Text style={styles.employeeName}>{employee.name}</Text>
                  {employee.is_owner && (
                    <View style={styles.ownerBadge}>
                      <IconSymbol name="crown" size={10} color={Colors.light.warning} />
                      <Text style={styles.ownerText}>Dueño</Text>
                    </View>
                  )}
                  
                  {employee.position && (
                    <Text style={styles.employeePosition}>{employee.position}</Text>
                  )}
                  
                  {employee.bio && (
                    <Text style={styles.employeeBio} numberOfLines={2}>
                      {employee.bio}
                    </Text>
                  )}
                  
                  {employee.custom_schedule_enabled && (
                    <View style={styles.scheduleIndicator}>
                      <IconSymbol name="clock" size={12} color={Colors.light.info} />
                      <Text style={styles.scheduleText}>Horario personalizado</Text>
                    </View>
                  )}
                </View>

                {selectedEmployee?.id === employee.id && (
                  <View style={styles.selectedIndicator}>
                    <IconSymbol name="checkmark.circle.fill" size={20} color={Colors.light.success} />
                  </View>
                )}
              </View>
            </Card>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {selectedEmployee && (
        <View style={styles.selectionSummary}>
          <Card variant="elevated" style={styles.summaryCard}>
            <View style={styles.summaryContent}>
              <IconSymbol name="checkmark.circle" size={16} color={Colors.light.success} />
              <Text style={styles.summaryText}>
                Serás atendido por <Text style={styles.summaryName}>{selectedEmployee.name}</Text>
                {selectedEmployee.position && ` (${selectedEmployee.position})`}
              </Text>
            </View>
          </Card>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: DesignTokens.spacing['2xl'],
  },
  loadingContainer: {
    padding: DesignTokens.spacing['2xl'],
    alignItems: 'center',
  },
  loadingText: {
    fontSize: DesignTokens.typography.fontSizes.sm,
    color: Colors.light.textSecondary,
  },
  emptyContainer: {
    padding: DesignTokens.spacing['2xl'],
    alignItems: 'center',
  },
  emptyText: {
    fontSize: DesignTokens.typography.fontSizes.sm,
    color: Colors.light.textSecondary,
    marginTop: DesignTokens.spacing.sm,
  },
  debugText: {
    fontSize: DesignTokens.typography.fontSizes.xs,
    color: Colors.light.textSecondary,
    marginTop: DesignTokens.spacing.xs,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: DesignTokens.typography.fontSizes.lg,
    fontWeight: DesignTokens.typography.fontWeights.semibold as any,
    color: Colors.light.text,
    marginBottom: DesignTokens.spacing.xs,
    paddingHorizontal: DesignTokens.spacing['2xl'],
  },
  sectionSubtitle: {
    fontSize: DesignTokens.typography.fontSizes.sm,
    color: Colors.light.textSecondary,
    marginBottom: DesignTokens.spacing.lg,
    paddingHorizontal: DesignTokens.spacing['2xl'],
  },
  employeesScrollView: {
    // Remove height constraint to allow natural scrolling
  },
  employeesList: {
    paddingHorizontal: DesignTokens.spacing['2xl'],
    paddingVertical: DesignTokens.spacing.sm,
    gap: DesignTokens.spacing.md,
  },
  employeeCardWrapper: {
    width: 160,
    minWidth: 140,
    maxWidth: 180,
  },
  employeeCard: {
    padding: DesignTokens.spacing.md,
    minHeight: 180,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedEmployeeCard: {
    borderColor: Colors.light.primary,
    borderWidth: 2,
  },
  employeeContent: {
    position: 'relative',
  },
  employeeAvatar: {
    alignSelf: 'center',
    marginBottom: DesignTokens.spacing.md,
  },
  employeeInfo: {
    alignItems: 'center',
  },
  employeeName: {
    fontSize: DesignTokens.typography.fontSizes.sm,
    fontWeight: DesignTokens.typography.fontWeights.semibold as any,
    color: Colors.light.text,
    textAlign: 'center',
    marginBottom: DesignTokens.spacing.xs,
  },
  ownerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: Colors.light.warning + '20',
    paddingHorizontal: DesignTokens.spacing.xs,
    paddingVertical: 2,
    borderRadius: DesignTokens.radius.sm,
    marginBottom: DesignTokens.spacing.xs,
  },
  ownerText: {
    fontSize: 9,
    fontWeight: DesignTokens.typography.fontWeights.medium as any,
    color: Colors.light.warning,
    marginLeft: 2,
  },
  employeePosition: {
    fontSize: DesignTokens.typography.fontSizes.xs,
    color: Colors.light.primary,
    fontWeight: DesignTokens.typography.fontWeights.medium as any,
    marginBottom: DesignTokens.spacing.xs,
    textAlign: 'center',
  },
  employeeBio: {
    fontSize: DesignTokens.typography.fontSizes.xs,
    color: Colors.light.textSecondary,
    textAlign: 'center',
    lineHeight: 16,
    marginBottom: DesignTokens.spacing.xs,
  },
  scheduleIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.info + '20',
    paddingHorizontal: DesignTokens.spacing.xs,
    paddingVertical: 2,
    borderRadius: DesignTokens.radius.sm,
  },
  scheduleText: {
    fontSize: 10,
    color: Colors.light.info,
    marginLeft: 2,
  },
  selectedIndicator: {
    position: 'absolute',
    top: -DesignTokens.spacing.xs,
    right: -DesignTokens.spacing.xs,
    backgroundColor: Colors.light.surface,
    borderRadius: 10,
    padding: 2,
  },
  selectionSummary: {
    marginTop: DesignTokens.spacing.lg,
    paddingHorizontal: DesignTokens.spacing['2xl'],
  },
  summaryCard: {
    backgroundColor: Colors.light.success + '10',
    borderColor: Colors.light.success + '30',
    borderWidth: 1,
  },
  summaryContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: DesignTokens.spacing.md,
  },
  summaryText: {
    fontSize: DesignTokens.typography.fontSizes.sm,
    color: Colors.light.text,
    marginLeft: DesignTokens.spacing.sm,
    flex: 1,
  },
  summaryName: {
    fontWeight: DesignTokens.typography.fontWeights.semibold as any,
    color: Colors.light.success,
  },
  serviceInfoCard: {
    backgroundColor: Colors.light.primary + '10',
    borderRadius: DesignTokens.radius.md,
    padding: DesignTokens.spacing.md,
    marginHorizontal: DesignTokens.spacing['2xl'],
    marginBottom: DesignTokens.spacing.md,
    borderLeftWidth: 4,
    borderLeftColor: Colors.light.primary,
  },
  serviceInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  serviceInfoText: {
    fontSize: DesignTokens.typography.fontSizes.sm,
    fontWeight: DesignTokens.typography.fontWeights.medium as any,
    color: Colors.light.primary,
    marginLeft: DesignTokens.spacing.sm,
  },
});
