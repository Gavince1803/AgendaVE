import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { InviteCodeModal } from '@/components/ui/InviteCodeModal';
import { TabSafeAreaView } from '@/components/ui/SafeAreaView';
import { Skeleton } from '@/components/ui/Skeleton';
import { Colors, DesignTokens } from '@/constants/Colors';
import { useAuth } from '@/contexts/AuthContext';
import { BookingService, Employee } from '@/lib/booking-service';
import { LogCategory, useLogger } from '@/lib/logger';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  View
} from 'react-native';

import { useAlert } from '@/contexts/GlobalAlertContext';

export default function EmployeeManagementScreen() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Invitation Modal State
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteData, setInviteData] = useState<{
    token: string;
    url: string;
    employeeName: string;
    businessName: string;
  } | null>(null);

  const { user } = useAuth();
  const { showAlert } = useAlert();
  const log = useLogger();
  const inviteBaseUrl = process.env.EXPO_PUBLIC_EMPLOYEE_INVITE_URL ?? 'https://agendave.app/invite';

  useFocusEffect(
    useCallback(() => {
      if (user?.profile?.role === 'provider') {
        loadEmployees();
      }
    }, [user])
  );

  const loadEmployees = async () => {
    if (!user?.id) {
      console.log('🔴 [EMPLOYEE MANAGEMENT] No user ID available');
      setLoading(false);
      return;
    }

    let timeoutId: ReturnType<typeof setTimeout> | undefined;

    try {
      // Only set loading to true if we don't have employees yet to avoid flash
      if (employees.length === 0) {
        setLoading(true);
      }

      // Add timeout to prevent infinite loading
      timeoutId = setTimeout(() => {
        console.warn('⚠️ [EMPLOYEE MANAGEMENT] Loading timeout - forcing loading to false');
        setLoading(false);
      }, 10000); // 10 second timeout

      // Get provider info first
      const provider = await BookingService.getProviderById(user.id);
      if (!provider) {
        throw new Error('Provider not found');
      }

      // Load employees
      const employeeList = await BookingService.getProviderEmployees(provider.id);
      setEmployees(employeeList);

      log.info(LogCategory.DATABASE, 'Employees loaded', {
        count: employeeList.length,
        providerId: provider.id
      });
    } catch (error) {
      console.error('🔴 [EMPLOYEE MANAGEMENT] Error loading employees:', error);
      log.error(LogCategory.SERVICE, 'Error loading employees', error);

      showAlert('Error', 'No se pudieron cargar los empleados. Verifica tu conexión.');
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

  const handleDeleteEmployee = async (employee: Employee) => {
    if (employee.is_owner) {
      showAlert('Error', 'No puedes eliminar al propietario del negocio');
      return;
    }

    const confirmMessage = `¿Estás seguro de que quieres eliminar a ${employee.name}? Esta acción no se puede deshacer.`;

    showAlert(
      'Confirmar Eliminación',
      confirmMessage,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Eliminar', style: 'destructive', onPress: () => deleteEmployee(employee) }
      ]
    );
  };

  const ensureInviteDetails = async (employee: Employee, forceResend = false) => {
    const isExpired = employee.invite_token_expires_at
      ? Date.now() > new Date(employee.invite_token_expires_at).getTime()
      : false;

    if (!forceResend && employee.invite_status === 'pending' && employee.invite_token && !isExpired) {
      return {
        inviteToken: employee.invite_token,
        inviteUrl: `${inviteBaseUrl}?token=${employee.invite_token}`,
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

  const openInviteModal = async (employee: Employee, forceResend: boolean) => {
    try {
      const invite = await ensureInviteDetails(employee, forceResend);
      const provider = await BookingService.getProviderById(user?.id!); // Should be cached/available

      setInviteData({
        token: invite.inviteToken,
        url: invite.inviteUrl,
        employeeName: employee.name,
        businessName: provider?.business_name || provider?.name || 'MiCita',
      });
      setShowInviteModal(true);
    } catch (error) {
      console.error('Error preparing invite:', error);
      showAlert('Error', 'No se pudo generar la invitación.');
    }
  };

  const handleShareInvite = (employee: Employee) => {
    // Just share existing (or refresh if expired)
    openInviteModal(employee, false);
  };

  const handleResendInvite = (employee: Employee) => {
    // Force regeneration of token
    showAlert(
      'Reenviar Invitación',
      '¿Quieres generar un nuevo código de invitación? El anterior dejará de funcionar.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Generar Nuevo',
          onPress: () => openInviteModal(employee, true)
        }
      ]
    );
  };

  const deleteEmployee = async (employee: Employee) => {
    try {
      log.userAction('Delete employee', {
        employeeId: employee.id,
        employeeName: employee.name
      });

      await BookingService.deactivateEmployee(employee.id);

      setEmployees(prev => prev.filter(e => e.id !== employee.id));

      showAlert('Éxito', `${employee.name} ha sido eliminado correctamente`);
    } catch (error) {
      log.error(LogCategory.SERVICE, 'Error deleting employee', error);
      showAlert('Error', 'No se pudo eliminar el empleado');
    }
  };

  return (
    <TabSafeAreaView style={styles.container}>
      {loading ? (
        <View style={styles.loadingContainer}>
          <Skeleton width="100%" height={100} borderRadius={16} style={{ marginBottom: 16 }} />
          <Skeleton width="100%" height={100} borderRadius={16} style={{ marginBottom: 16 }} />
          <Skeleton width="100%" height={100} borderRadius={16} style={{ marginBottom: 16 }} />
        </View>
      ) : (
        <>
          <View style={styles.header}>
            <View style={styles.headerContent}>
              <Text style={styles.title}>Mi equipo</Text>
              <Text style={styles.subtitle}>Gestiona tus empleados y sus horarios</Text>
            </View>
            <Button title="Agregar" size="small" onPress={handleAddEmployee} />
          </View>

          <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            {employees.length === 0 ? (
              <Card variant="elevated" style={styles.emptyStateCard}>
                <Text style={styles.emptyStateTitle}>Aún no tienes empleados</Text>
                <Text style={styles.emptyStateText}>
                  Invita a tu equipo para que puedan gestionar sus horarios y citas.
                </Text>
                <Button title="Agregar empleado" onPress={handleAddEmployee} fullWidth />
              </Card>
            ) : (
              <View style={styles.employeeList}>
                {employees.map((employee) => (
                  <Card key={employee.id} variant="elevated" style={styles.employeeCard}>
                    <View style={styles.employeeHeader}>
                      <View style={styles.employeeInfo}>
                        <Text style={styles.employeeName}>{employee.name}</Text>
                        {employee.position ? (
                          <Text style={styles.employeeDetail}>{employee.position}</Text>
                        ) : null}
                        {employee.email ? (
                          <Text style={styles.employeeDetail}>{employee.email}</Text>
                        ) : null}
                        {employee.phone ? (
                          <Text style={styles.employeeDetail}>{employee.phone}</Text>
                        ) : null}
                      </View>
                      <View style={styles.employeeBadges}>
                        {employee.is_owner ? (
                          <View style={styles.ownerBadge}>
                            <Text style={styles.ownerBadgeText}>Propietario</Text>
                          </View>
                        ) : null}
                        <View
                          style={[
                            styles.statusBadge,
                            employee.is_active ? styles.activeBadge : styles.inactiveBadge,
                          ]}
                        >
                          <Text
                            style={[
                              styles.statusBadgeText,
                              employee.is_active ? styles.activeText : styles.inactiveText,
                            ]}
                          >
                            {employee.is_active ? 'Activo' : 'Inactivo'}
                          </Text>
                        </View>
                        <View
                          style={[
                            styles.statusBadge,
                            employee.profile_id ? styles.connectedBadge : styles.pendingBadge,
                          ]}
                        >
                          <Text
                            style={[
                              styles.statusBadgeText,
                              employee.profile_id ? styles.connectedText : styles.pendingText,
                            ]}
                          >
                            {employee.profile_id ? 'Conectado' : 'Invitado'}
                          </Text>
                        </View>
                      </View>
                    </View>

                    {!employee.profile_id ? (
                      <View style={styles.inviteContainer}>
                        <View style={styles.inviteInfoRow}>
                          <Text style={styles.inviteText}>
                            Invitación pendiente
                            {employee.invite_token_expires_at && (
                              <Text style={{ fontSize: 10, color: Colors.light.error }}>
                                {'\n'}Expira: {new Date(employee.invite_token_expires_at).toLocaleDateString()} {new Date(employee.invite_token_expires_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </Text>
                            )}
                          </Text>
                        </View>
                        <View style={styles.inviteButtons}>
                          <Button
                            title="Reenviar"
                            size="small"
                            variant="outline"
                            onPress={() => handleResendInvite(employee)}
                          />
                          <Button
                            title="Compartir"
                            size="small"
                            onPress={() => handleShareInvite(employee)}
                          />
                        </View>
                      </View>
                    ) : null}

                    <View style={styles.employeeActions}>
                      <Button
                        title="Editar"
                        variant="outline"
                        size="small"
                        onPress={() => handleEditEmployee(employee)}
                        style={styles.actionButton}
                      />
                      <Button
                        title="Eliminar"
                        variant="outline"
                        size="small"
                        onPress={() => handleDeleteEmployee(employee)}
                        style={[styles.actionButton, styles.deleteButton]}
                      />
                    </View>
                  </Card>
                ))}
              </View>
            )}
          </ScrollView>

          {inviteData && (
            <InviteCodeModal
              visible={showInviteModal}
              onClose={() => setShowInviteModal(false)}
              inviteToken={inviteData.token}
              inviteUrl={inviteData.url}
              employeeName={inviteData.employeeName}
              businessName={inviteData.businessName}
            />
          )}
        </>
      )}
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
    justifyContent: 'space-between',
  },
  employeeActions: {
    flexDirection: 'row',
    gap: DesignTokens.spacing.sm,
    justifyContent: 'flex-start',
    alignItems: 'stretch',
  },
  deleteButton: {
    borderColor: Colors.light.error,
  },
  actionButton: {
    flex: 1,
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
