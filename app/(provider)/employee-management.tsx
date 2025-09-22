import React, { useEffect, useState } from 'react';
import {
  Alert,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { router } from 'expo-router';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { TabSafeAreaView } from '@/components/ui/SafeAreaView';
import { Colors, DesignTokens } from '@/constants/Colors';
import { BookingService, Employee } from '@/lib/booking-service';
import { LogCategory, useLogger } from '@/lib/logger';
import { useAuth } from '@/contexts/AuthContext';

export default function EmployeeManagementScreen() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { user } = useAuth();
  const log = useLogger();

  useEffect(() => {
    if (user?.profile?.role === 'provider') {
      loadEmployees();
    }
  }, [user]);

  const loadEmployees = async () => {
    if (!user?.id) {
      console.log('🔴 [EMPLOYEE MANAGEMENT] No user ID available');
      setLoading(false);
      return;
    }

    let timeoutId: NodeJS.Timeout;
    
    try {
      setLoading(true);
      console.log('🔴 [EMPLOYEE MANAGEMENT] Loading employees for user:', user.id);
      
      // Add timeout to prevent infinite loading
      timeoutId = setTimeout(() => {
        console.warn('⚠️ [EMPLOYEE MANAGEMENT] Loading timeout - forcing loading to false');
        setLoading(false);
      }, 10000); // 10 second timeout
      
      // Get provider info first
      const provider = await BookingService.getProviderById(user.id);
      console.log('🔴 [EMPLOYEE MANAGEMENT] Provider found:', provider);
      if (!provider) {
        throw new Error('Provider not found');
      }

      // Load employees
      console.log('🔴 [EMPLOYEE MANAGEMENT] Loading employees for provider:', provider.id);
      const employeeList = await BookingService.getProviderEmployees(provider.id);
      console.log('🔴 [EMPLOYEE MANAGEMENT] Employees loaded:', employeeList);
      setEmployees(employeeList);

      log.info(LogCategory.DATABASE, 'Employees loaded', {
        count: employeeList.length,
        providerId: provider.id
      });
    } catch (error) {
      console.error('🔴 [EMPLOYEE MANAGEMENT] Error loading employees:', error);
      log.error(LogCategory.SERVICE, 'Error loading employees', error);
      
      // More user-friendly error handling
      if (Platform.OS === 'web') {
        console.error('🔴 [EMPLOYEE MANAGEMENT] Full error details:', error);
      }
      
      Alert.alert('Error', 'No se pudieron cargar los empleados. Verifica tu conexión.');
      
      // Set empty array so UI doesn't break
      setEmployees([]);
    } finally {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadEmployees();
    setRefreshing(false);
  };

  const handleAddEmployee = () => {
    router.push('/(provider)/add-employee');
  };

  const handleEditEmployee = (employee: Employee) => {
    router.push({
      pathname: '/(provider)/edit-employee',
      params: {
        employeeId: employee.id,
        name: employee.name,
        email: employee.email || '',
        phone: employee.phone || '',
        isOwner: employee.is_owner.toString(),
        isActive: employee.is_active.toString(),
      }
    });
  };

  const handleManageSchedule = (employee: Employee) => {
    router.push({
      pathname: '/(provider)/employee-schedule',
      params: {
        employeeId: employee.id,
        employeeName: employee.name,
        customScheduleEnabled: employee.custom_schedule_enabled.toString(),
      }
    });
  };

  const handleDeleteEmployee = (employee: Employee) => {
    if (employee.is_owner) {
      Alert.alert('Error', 'No puedes eliminar al propietario del negocio');
      return;
    }

    const confirmMessage = `¿Estás seguro de que quieres eliminar a ${employee.name}? Esta acción no se puede deshacer.`;

    if (Platform.OS === 'web') {
      const confirmed = window.confirm(confirmMessage);
      if (confirmed) {
        await deleteEmployee(employee);
      }
    } else {
      Alert.alert(
        'Confirmar Eliminación',
        confirmMessage,
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Eliminar', style: 'destructive', onPress: () => deleteEmployee(employee) }
        ]
      );
    }
  };

  const deleteEmployee = async (employee: Employee) => {
    try {
      // In a real implementation, you'd call an API to delete the employee
      // For now, we'll just mark them as inactive
      log.userAction('Delete employee', {
        employeeId: employee.id,
        employeeName: employee.name
      });

      // Update the employee list locally
      setEmployees(prev => prev.filter(e => e.id !== employee.id));
      
      Alert.alert('Éxito', `${employee.name} ha sido eliminado correctamente`);
    } catch (error) {
      log.error(LogCategory.SERVICE, 'Error deleting employee', error);
      Alert.alert('Error', 'No se pudo eliminar el empleado');
    }
  };

  if (loading) {
    return (
      <TabSafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Cargando empleados...</Text>
        </View>
      </TabSafeAreaView>
    );
  }

  return (
    <TabSafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <Text style={styles.title}>Gestión de Empleados</Text>
            <Text style={styles.subtitle}>
              Administra tu equipo de trabajo
            </Text>
          </View>
          <Button
            title="Agregar"
            onPress={handleAddEmployee}
            variant="primary"
            size="small"
            icon={<IconSymbol name="plus" size={16} color="#ffffff" />}
          />
        </View>

        {/* Employee List */}
        <View style={styles.content}>
          {employees.length === 0 ? (
            <Card variant="outlined" style={styles.emptyStateCard}>
              <IconSymbol name="person.3" size={48} color={Colors.light.textSecondary} />
              <Text style={styles.emptyStateTitle}>No hay empleados</Text>
              <Text style={styles.emptyStateText}>
                Comienza agregando empleados a tu equipo de trabajo
              </Text>
              <Button
                title="Agregar Primer Empleado"
                onPress={handleAddEmployee}
                variant="primary"
                style={styles.emptyStateButton}
                icon={<IconSymbol name="plus" size={16} color="#ffffff" />}
              />
            </Card>
          ) : (
            <View style={styles.employeeList}>
              {employees.map((employee) => (
                <Card key={employee.id} variant="elevated" style={styles.employeeCard}>
                  <View style={styles.employeeHeader}>
                    <View style={styles.employeeInfo}>
                      <Text style={styles.employeeName}>{employee.name}</Text>
                      {employee.email && (
                        <Text style={styles.employeeDetail}>
                          <IconSymbol name="envelope" size={12} color={Colors.light.textSecondary} />
                          {' '}{employee.email}
                        </Text>
                      )}
                      {employee.phone && (
                        <Text style={styles.employeeDetail}>
                          <IconSymbol name="phone" size={12} color={Colors.light.textSecondary} />
                          {' '}{employee.phone}
                        </Text>
                      )}
                    </View>
                    
                    <View style={styles.employeeBadges}>
                      {employee.is_owner && (
                        <View style={styles.ownerBadge}>
                          <Text style={styles.ownerBadgeText}>Propietario</Text>
                        </View>
                      )}
                      <View style={[
                        styles.statusBadge,
                        employee.is_active ? styles.activeBadge : styles.inactiveBadge
                      ]}>
                        <Text style={[
                          styles.statusBadgeText,
                          employee.is_active ? styles.activeText : styles.inactiveText
                        ]}>
                          {employee.is_active ? 'Activo' : 'Inactivo'}
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* Employee Actions */}
                  {/* Employee Schedule Info */}
                  <View style={styles.employeeSchedule}>
                    <View style={styles.scheduleInfo}>
                      <IconSymbol 
                        name={employee.custom_schedule_enabled ? "clock.fill" : "building"} 
                        size={16} 
                        color={employee.custom_schedule_enabled ? Colors.light.primary : Colors.light.textSecondary} 
                      />
                      <Text style={styles.scheduleText}>
                        {employee.custom_schedule_enabled ? 'Horario personalizado' : 'Horario del negocio'}
                      </Text>
                    </View>
                    <Button
                      title={employee.custom_schedule_enabled ? "Configurar" : "Personalizar"}
                      onPress={() => handleManageSchedule(employee)}
                      variant="outline"
                      size="small"
                      icon={<IconSymbol name="calendar" size={14} color={Colors.light.primary} />}
                    />
                  </View>

                  {/* Employee Actions */}
                  <View style={styles.employeeActions}>
                    <Button
                      title="Editar"
                      onPress={() => handleEditEmployee(employee)}
                      variant="secondary"
                      size="small"
                      icon={<IconSymbol name="pencil" size={14} color={Colors.light.primary} />}
                    />
                    {!employee.is_owner && (
                      <Button
                        title="Eliminar"
                        onPress={() => handleDeleteEmployee(employee)}
                        variant="outline"
                        size="small"
                        style={styles.deleteButton}
                        icon={<IconSymbol name="trash" size={14} color={Colors.light.error} />}
                      />
                    )}
                  </View>
                </Card>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </TabSafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.surface,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: DesignTokens.spacing['6xl'],
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: DesignTokens.spacing.lg,
    paddingVertical: DesignTokens.spacing.xl,
    backgroundColor: Colors.light.background,
  },
  headerContent: {
    flex: 1,
  },
  title: {
    fontSize: DesignTokens.typography.fontSizes['2xl'],
    fontWeight: DesignTokens.typography.fontWeights.bold as any,
    color: Colors.light.text,
    marginBottom: DesignTokens.spacing.xs,
  },
  subtitle: {
    fontSize: DesignTokens.typography.fontSizes.base,
    color: Colors.light.textSecondary,
  },
  content: {
    padding: DesignTokens.spacing.lg,
  },
  emptyStateCard: {
    alignItems: 'center',
    paddingVertical: DesignTokens.spacing['6xl'],
    paddingHorizontal: DesignTokens.spacing.xl,
  },
  emptyStateTitle: {
    fontSize: DesignTokens.typography.fontSizes.xl,
    fontWeight: DesignTokens.typography.fontWeights.semibold as any,
    color: Colors.light.text,
    marginTop: DesignTokens.spacing.lg,
    marginBottom: DesignTokens.spacing.sm,
  },
  emptyStateText: {
    fontSize: DesignTokens.typography.fontSizes.base,
    color: Colors.light.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: DesignTokens.spacing.xl,
  },
  emptyStateButton: {
    alignSelf: 'stretch',
  },
  employeeList: {
    gap: DesignTokens.spacing.lg,
  },
  employeeCard: {
    padding: DesignTokens.spacing.lg,
  },
  employeeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: DesignTokens.spacing.md,
  },
  employeeInfo: {
    flex: 1,
    marginRight: DesignTokens.spacing.md,
  },
  employeeName: {
    fontSize: DesignTokens.typography.fontSizes.lg,
    fontWeight: DesignTokens.typography.fontWeights.semibold as any,
    color: Colors.light.text,
    marginBottom: DesignTokens.spacing.xs,
  },
  employeeDetail: {
    fontSize: DesignTokens.typography.fontSizes.sm,
    color: Colors.light.textSecondary,
    marginBottom: DesignTokens.spacing.xs,
    flexDirection: 'row',
    alignItems: 'center',
  },
  employeeBadges: {
    alignItems: 'flex-end',
    gap: DesignTokens.spacing.xs,
  },
  ownerBadge: {
    backgroundColor: Colors.light.warning,
    paddingHorizontal: DesignTokens.spacing.sm,
    paddingVertical: DesignTokens.spacing.xs,
    borderRadius: DesignTokens.radius.sm,
  },
  ownerBadgeText: {
    fontSize: DesignTokens.typography.fontSizes.xs,
    fontWeight: DesignTokens.typography.fontWeights.semibold as any,
    color: '#ffffff',
  },
  statusBadge: {
    paddingHorizontal: DesignTokens.spacing.sm,
    paddingVertical: DesignTokens.spacing.xs,
    borderRadius: DesignTokens.radius.sm,
  },
  activeBadge: {
    backgroundColor: Colors.light.success + '20',
  },
  inactiveBadge: {
    backgroundColor: Colors.light.error + '20',
  },
  statusBadgeText: {
    fontSize: DesignTokens.typography.fontSizes.xs,
    fontWeight: DesignTokens.typography.fontWeights.medium as any,
  },
  activeText: {
    color: Colors.light.success,
  },
  inactiveText: {
    color: Colors.light.error,
  },
  employeeActions: {
    flexDirection: 'row',
    gap: DesignTokens.spacing.sm,
  },
  deleteButton: {
    borderColor: Colors.light.error,
  },
  employeeSchedule: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: DesignTokens.spacing.sm,
    marginBottom: DesignTokens.spacing.sm,
    backgroundColor: Colors.light.surface,
    paddingHorizontal: DesignTokens.spacing.md,
    borderRadius: DesignTokens.radius.sm,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  scheduleInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DesignTokens.spacing.sm,
  },
  scheduleText: {
    fontSize: DesignTokens.typography.fontSizes.sm,
    color: Colors.light.textSecondary,
    fontWeight: DesignTokens.typography.fontWeights.medium as any,
  },
});
