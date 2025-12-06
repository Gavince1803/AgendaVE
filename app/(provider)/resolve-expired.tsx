import { ThemedText } from '@/components/ThemedText';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { TabSafeAreaView } from '@/components/ui/SafeAreaView';
import { Skeleton } from '@/components/ui/Skeleton';
import { Colors, DesignTokens } from '@/constants/Colors';
import { useAuth } from '@/contexts/AuthContext';
import { Appointment, BookingService } from '@/lib/booking-service';
import { LogCategory, useLogger } from '@/lib/logger';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
    Alert,
    ScrollView,
    StyleSheet,
    View
} from 'react-native';

export default function ResolveExpiredScreen() {
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState<string | null>(null);
    const { user, employeeProfile } = useAuth();
    const log = useLogger(user?.id);
    const router = useRouter();

    useEffect(() => {
        loadExpiredAppointments();
    }, []);

    const loadExpiredAppointments = async () => {
        try {
            setLoading(true);
            let providerId = employeeProfile?.provider_id;

            // If no employee profile, check if the user is the provider (owner)
            if (!providerId && user) {
                const provider = await BookingService.getProviderById(user.id);
                if (provider) {
                    providerId = provider.id;
                }
            }

            if (!providerId) return;

            const data = await BookingService.getExpiredPendingAppointments(providerId);
            setAppointments(data);
        } catch (error) {
            log.error(LogCategory.SERVICE, 'Error loading expired appointments', error);
        } finally {
            setLoading(false);
        }
    };

    const handleResolve = async (appointment: Appointment, status: 'done' | 'cancelled' | 'no_show') => {
        try {
            setProcessingId(appointment.id);

            if (status === 'done') {
                await BookingService.markExpiredAsDone(appointment.id);
            } else {
                await BookingService.updateAppointmentStatus(appointment.id, status);
            }

            // Remove from list
            setAppointments(prev => prev.filter(a => a.id !== appointment.id));

            Alert.alert('Éxito', `Cita marcada como ${status === 'done' ? 'Realizada' : status === 'no_show' ? 'No Show' : 'Cancelada'}`);
        } catch (error) {
            log.error(LogCategory.SERVICE, 'Error resolving appointment', error);
            Alert.alert('Error', 'No se pudo actualizar la cita');
        } finally {
            setProcessingId(null);
        }
    };

    const handleMarkAsPaid = (appointment: Appointment) => {
        Alert.alert(
            'Registrar Pago',
            'Selecciona el método de pago:',
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: '💵 Efectivo',
                    onPress: () => processPayment(appointment, 'cash')
                },
                {
                    text: '📱 Pago Móvil',
                    onPress: () => processPayment(appointment, 'pago_movil')
                },
                {
                    text: '🇺🇸 Zelle',
                    onPress: () => processPayment(appointment, 'zelle')
                },
                {
                    text: '💳 Tarjeta / Otro',
                    onPress: () => processPayment(appointment, 'card')
                }
            ]
        );
    };

    const processPayment = async (appointment: Appointment, method: 'cash' | 'zelle' | 'pago_movil' | 'card' | 'other') => {
        try {
            setProcessingId(appointment.id);
            await BookingService.markExpiredAsPaid(appointment.id, method);

            // Remove from list (since it's now done and paid, it's no longer "expired pending")
            setAppointments(prev => prev.filter(a => a.id !== appointment.id));

            Alert.alert('Éxito', 'Pago registrado y cita completada');
        } catch (error) {
            log.error(LogCategory.SERVICE, 'Error updating payment', error);
            Alert.alert('Error', 'No se pudo registrar el pago');
        } finally {
            setProcessingId(null);
        }
    };

    return (
        <TabSafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Button
                    title="Atrás"
                    variant="ghost"
                    size="small"
                    icon={<IconSymbol name="chevron.left" size={20} color={Colors.light.primary} />}
                    onPress={() => router.back()}
                    style={styles.backButton}
                />
                <ThemedText type="title" style={styles.headerTitle}>Citas Vencidas 👻</ThemedText>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
                <ThemedText style={styles.description}>
                    Estas citas quedaron pendientes de días anteriores. Por favor, actualiza su estado para mantener tus estadísticas al día.
                </ThemedText>

                {loading ? (
                    <View style={styles.loadingContainer}>
                        <Skeleton width="100%" height={150} borderRadius={12} style={{ marginBottom: 12 }} />
                        <Skeleton width="100%" height={150} borderRadius={12} style={{ marginBottom: 12 }} />
                    </View>
                ) : appointments.length === 0 ? (
                    <View style={styles.emptyState}>
                        <IconSymbol name="checkmark.circle" size={48} color={Colors.light.success} />
                        <ThemedText style={styles.emptyStateText}>
                            ¡Todo al día! No tienes citas vencidas pendientes.
                        </ThemedText>
                        <Button title="Volver al Dashboard" onPress={() => router.back()} style={{ marginTop: 16 }} />
                    </View>
                ) : (
                    <View style={styles.list}>
                        {appointments.map((apt) => (
                            <Card key={apt.id} variant="elevated" style={styles.card}>
                                <View style={styles.cardHeader}>
                                    <View style={styles.headerRow}>
                                        <ThemedText style={styles.dateText}>
                                            {new Date(apt.appointment_date).toLocaleDateString()} - {apt.appointment_time}
                                        </ThemedText>
                                        <View style={[
                                            styles.paymentBadge,
                                            { backgroundColor: apt.payment_status === 'paid' ? Colors.light.successBg : Colors.light.warningBg }
                                        ]}>
                                            <ThemedText style={[
                                                styles.paymentBadgeText,
                                                { color: apt.payment_status === 'paid' ? Colors.light.success : Colors.light.warning }
                                            ]}>
                                                {apt.payment_status === 'paid' ? 'Pagado' : 'Pendiente'}
                                            </ThemedText>
                                        </View>
                                    </View>
                                    <ThemedText style={styles.serviceName}>{apt.services?.name || apt.service?.name}</ThemedText>
                                </View>

                                <View style={styles.clientInfo}>
                                    <IconSymbol name="person" size={16} color={Colors.light.textSecondary} />
                                    <ThemedText style={styles.clientName}>{apt.profiles?.full_name || apt.profiles?.display_name || apt.client?.display_name || 'Cliente'}</ThemedText>
                                </View>

                                <View style={styles.actions}>
                                    {apt.payment_status !== 'paid' && (
                                        <Button
                                            title="Pagado"
                                            variant="success"
                                            size="small"
                                            onPress={() => handleMarkAsPaid(apt)}
                                            loading={processingId === apt.id}
                                            disabled={!!processingId}
                                            style={styles.actionButton}
                                        />
                                    )}
                                    {/* Realizada button removed as requested */}
                                    <Button
                                        title="No Show"
                                        variant="outline"
                                        size="small"
                                        onPress={() => handleResolve(apt, 'no_show')}
                                        loading={processingId === apt.id}
                                        disabled={!!processingId}
                                        style={styles.noShowButton}
                                    />
                                    <Button
                                        title="Cancelar"
                                        variant="ghost"
                                        size="small"
                                        onPress={() => handleResolve(apt, 'cancelled')}
                                        loading={processingId === apt.id}
                                        disabled={!!processingId}
                                        style={styles.actionButton}
                                    />
                                </View>
                            </Card>
                        ))}
                    </View>
                )}
            </ScrollView>
        </TabSafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.light.background,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: DesignTokens.spacing.md,
        paddingVertical: DesignTokens.spacing.md,
    },
    backButton: {
        padding: 0,
    },
    headerTitle: {
        fontSize: DesignTokens.typography.fontSizes.lg,
        fontWeight: 'bold',
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        padding: DesignTokens.spacing.lg,
    },
    description: {
        fontSize: DesignTokens.typography.fontSizes.base,
        color: Colors.light.textSecondary,
        marginBottom: DesignTokens.spacing.lg,
        textAlign: 'center',
    },
    loadingContainer: {
        gap: DesignTokens.spacing.md,
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: DesignTokens.spacing['4xl'],
        gap: DesignTokens.spacing.md,
    },
    emptyStateText: {
        fontSize: DesignTokens.typography.fontSizes.lg,
        color: Colors.light.textSecondary,
        textAlign: 'center',
    },
    list: {
        gap: DesignTokens.spacing.md,
    },
    card: {
        padding: DesignTokens.spacing.md,
    },
    cardHeader: {
        marginBottom: DesignTokens.spacing.sm,
    },
    dateText: {
        fontSize: DesignTokens.typography.fontSizes.sm,
        color: Colors.light.error,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    serviceName: {
        fontSize: DesignTokens.typography.fontSizes.lg,
        fontWeight: '600',
        color: Colors.light.text,
    },
    clientInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: DesignTokens.spacing.xs,
        marginBottom: DesignTokens.spacing.md,
    },
    clientName: {
        fontSize: DesignTokens.typography.fontSizes.base,
        color: Colors.light.textSecondary,
    },
    actions: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: DesignTokens.spacing.sm,
    },
    actionButton: {
        flexGrow: 1,
        minWidth: '45%',
    },
    doneButton: {
        flexGrow: 1,
        minWidth: '45%',
        backgroundColor: Colors.light.success,
    },
    noShowButton: {
        flexGrow: 1,
        minWidth: '45%',
        borderColor: Colors.light.error,
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    paymentBadge: {
        paddingHorizontal: DesignTokens.spacing.sm,
        paddingVertical: 2,
        borderRadius: DesignTokens.radius.sm,
    },
    paymentBadgeText: {
        fontSize: DesignTokens.typography.fontSizes.xs,
        fontWeight: '600',
    },
});
