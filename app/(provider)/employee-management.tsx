import { Skeleton } from '@/components/ui/Skeleton';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  Alert,
  Platform,
  Share,
  StyleSheet,
  View
} from 'react-native';

import { TabSafeAreaView } from '@/components/ui/SafeAreaView';
import { Colors, DesignTokens } from '@/constants/Colors';
import { useAuth } from '@/contexts/AuthContext';
import { BookingService, Employee } from '@/lib/booking-service';
import { LogCategory, useLogger } from '@/lib/logger';

export default function EmployeeManagementScreen() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { user } = useAuth();
  const log = useLogger();
  const inviteBaseUrl = process.env.EXPO_PUBLIC_EMPLOYEE_INVITE_URL ?? 'https://agendave.app/invite';

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

    let timeoutId: ReturnType<typeof setTimeout> | undefined;

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
      if (timeoutId !== undefined) {
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

  const handleDeleteEmployee = async (employee: Employee) => {
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

  const ensureInviteDetails = async (employee: Employee) => {
    if (employee.invite_status === 'pending' && employee.invite_token) {
      return {
        inviteToken: employee.invite_token,
        inviteUrl: `${inviteBaseUrl}?token = ${employee.invite_token} `,
        expiresAt: employee.invite_token_expires_at ?? '',
      };
    }

    const refreshed = await BookingService.resendEmployeeInvite(employee.id);

    setEmployees(prev => prev.map((item) =>
      item.id === employee.id
        ? {
          ...item,
          invite_token: refreshed.inviteToken,
          invite_status: 'pending',
          invite_token_expires_at: refreshed.expiresAt,
        }
        : item
    ));

    return refreshed;
  };

  const handleShareInvite = async (employee: Employee) => {
    try {
      const invite = await ensureInviteDetails(employee);
      const message = `Hola ${employee.name}, \nTe invitamos a unirte al equipo en AgendaVE.\n\nEnlace: ${invite.inviteUrl} \nCódigo: ${invite.inviteToken} `;
      await Share.share({ message });
    } catch (error) {
      console.error('Error sharing invite:', error);
      Alert.alert('Error', 'No se pudo compartir la invitación.');
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

  return (
    <TabSafeAreaView style={styles.container}>
      <View style={styles.loadingContainer}>
        <Skeleton width="100%" height={100} borderRadius={16} style={{ marginBottom: 16 }} />
        <Skeleton width="100%" height={100} borderRadius={16} style={{ marginBottom: 16 }} />
        <Skeleton width="100%" height={100} borderRadius={16} style={{ marginBottom: 16 }} />
      </View>
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
  connectedBadge: {
    backgroundColor: Colors.light.primary + '20',
  },
  connectedText: {
    color: Colors.light.primary,
  },
  pendingBadge: {
    backgroundColor: Colors.light.warning + '25',
  },
  pendingText: {
    color: Colors.light.warning,
  },
  inviteContainer: {
    paddingVertical: DesignTokens.spacing.sm,
    paddingHorizontal: DesignTokens.spacing.md,
    borderRadius: DesignTokens.radius.sm,
    borderWidth: 1,
    borderColor: Colors.light.borderLight,
    backgroundColor: Colors.light.surface,
    gap: DesignTokens.spacing.sm,
    marginBottom: DesignTokens.spacing.sm,
  },
  inviteInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DesignTokens.spacing.sm,
  },
  inviteText: {
    fontSize: DesignTokens.typography.fontSizes.xs,
    color: Colors.light.textSecondary,
    flex: 1,
  },
  inviteButtons: {
    flexDirection: 'row',
    gap: DesignTokens.spacing.sm,
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
