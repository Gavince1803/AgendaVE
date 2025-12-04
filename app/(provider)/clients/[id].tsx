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
import { Image as ExpoImage } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
    Alert,
    ScrollView,
    StyleSheet,
    TextInput,
    View
} from 'react-native';

export default function ClientProfileScreen() {
    const { id, name, avatar, phone } = useLocalSearchParams<{ id: string; name: string; avatar: string; phone: string }>();
    const [history, setHistory] = useState<Appointment[]>([]);
    const [notes, setNotes] = useState('');
    const [loading, setLoading] = useState(true);
    const [savingNotes, setSavingNotes] = useState(false);
    const { user, employeeProfile } = useAuth();
    const log = useLogger(user?.id);
    const router = useRouter();

    useEffect(() => {
        loadClientData();
    }, [id]);

    const loadClientData = async () => {
        try {
            setLoading(true);
            const providerId = employeeProfile?.provider_id;
            if (!providerId || !id) return;

            const [historyData, notesData] = await Promise.all([
                BookingService.getClientHistory(providerId, id),
                BookingService.getClientNotes(providerId, id)
            ]);

            setHistory(historyData);
            setNotes(notesData);
        } catch (error) {
            log.error(LogCategory.SERVICE, 'Error loading client data', error);
            Alert.alert('Error', 'No se pudo cargar la información del cliente');
        } finally {
            setLoading(false);
        }
    };

    const handleSaveNotes = async () => {
        try {
            setSavingNotes(true);
            const providerId = employeeProfile?.provider_id;
            if (!providerId || !id) return;

            await BookingService.saveClientNotes(providerId, id, notes);
            Alert.alert('Éxito', 'Notas guardadas correctamente');
        } catch (error) {
            log.error(LogCategory.SERVICE, 'Error saving notes', error);
            Alert.alert('Error', 'No se pudieron guardar las notas');
        } finally {
            setSavingNotes(false);
        }
    };

    const totalSpent = history.reduce((sum, apt) => {
        if (apt.status === 'confirmed' || apt.status === 'done') {
            return sum + ((apt as any).services?.price_amount || 0);
        }
        return sum;
    }, 0);

    const visitCount = history.filter(apt =>
        apt.status === 'confirmed' || apt.status === 'done'
    ).length;

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
                <ThemedText type="title" style={styles.headerTitle}>Perfil del Cliente</ThemedText>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
                {/* Profile Header */}
                <View style={styles.profileHeader}>
                    <ExpoImage
                        source={avatar || 'https://via.placeholder.com/150'}
                        style={styles.avatar}
                        contentFit="cover"
                    />
                    <ThemedText style={styles.clientName}>{name || 'Cliente'}</ThemedText>
                    <ThemedText style={styles.clientPhone}>{phone || 'Sin teléfono'}</ThemedText>
                </View>

                {/* Stats Grid */}
                <View style={styles.statsGrid}>
                    <Card variant="elevated" style={styles.statCard}>
                        <IconSymbol name="creditcard" size={24} color={Colors.light.primary} />
                        <ThemedText style={styles.statValue}>${totalSpent.toFixed(2)}</ThemedText>
                        <ThemedText style={styles.statLabel}>Total Gastado</ThemedText>
                    </Card>
                    <Card variant="elevated" style={styles.statCard}>
                        <IconSymbol name="calendar" size={24} color={Colors.light.secondary} />
                        <ThemedText style={styles.statValue}>{visitCount}</ThemedText>
                        <ThemedText style={styles.statLabel}>Visitas</ThemedText>
                    </Card>
                </View>

                {/* Private Notes */}
                <View style={styles.section}>
                    <ThemedText type="subtitle" style={styles.sectionTitle}>Notas Privadas 🔒</ThemedText>
                    <Card variant="outlined" style={styles.notesCard}>
                        <TextInput
                            style={styles.notesInput}
                            multiline
                            placeholder="Escribe notas privadas sobre este cliente (preferencias, alergias, etc)..."
                            value={notes}
                            onChangeText={setNotes}
                            textAlignVertical="top"
                        />
                        <Button
                            title={savingNotes ? "Guardando..." : "Guardar Notas"}
                            onPress={handleSaveNotes}
                            disabled={savingNotes}
                            style={styles.saveButton}
                        />
                    </Card>
                </View>

                {/* History */}
                <View style={styles.section}>
                    <ThemedText type="subtitle" style={styles.sectionTitle}>Historial de Citas</ThemedText>
                    {loading ? (
                        <Skeleton width="100%" height={100} borderRadius={12} />
                    ) : history.length === 0 ? (
                        <ThemedText style={styles.emptyText}>No hay historial de citas.</ThemedText>
                    ) : (
                        <View style={styles.historyList}>
                            {history.map((apt) => (
                                <Card key={apt.id} variant="elevated" style={styles.historyCard}>
                                    <View style={styles.historyHeader}>
                                        <ThemedText style={styles.serviceName}>{(apt as any).services?.name || 'Servicio'}</ThemedText>
                                        <ThemedText style={[
                                            styles.statusText,
                                            { color: apt.status === 'confirmed' ? Colors.light.success : Colors.light.textSecondary }
                                        ]}>
                                            {apt.status === 'confirmed' ? 'Confirmada' : apt.status}
                                        </ThemedText>
                                    </View>
                                    <ThemedText style={styles.dateText}>
                                        {new Date(apt.appointment_date).toLocaleDateString()} - {apt.appointment_time}
                                    </ThemedText>
                                    <ThemedText style={styles.priceText}>
                                        ${(apt as any).services?.price_amount?.toFixed(2)}
                                    </ThemedText>
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
        paddingBottom: DesignTokens.spacing['4xl'],
    },
    profileHeader: {
        alignItems: 'center',
        marginBottom: DesignTokens.spacing.xl,
    },
    avatar: {
        width: 100,
        height: 100,
        borderRadius: 50,
        marginBottom: DesignTokens.spacing.md,
        backgroundColor: Colors.light.border,
    },
    clientName: {
        fontSize: DesignTokens.typography.fontSizes['2xl'],
        fontWeight: 'bold',
        color: Colors.light.text,
        marginBottom: DesignTokens.spacing.xs,
    },
    clientPhone: {
        fontSize: DesignTokens.typography.fontSizes.lg,
        color: Colors.light.textSecondary,
    },
    statsGrid: {
        flexDirection: 'row',
        gap: DesignTokens.spacing.md,
        marginBottom: DesignTokens.spacing.xl,
    },
    statCard: {
        flex: 1,
        alignItems: 'center',
        padding: DesignTokens.spacing.lg,
        gap: DesignTokens.spacing.xs,
    },
    statValue: {
        fontSize: DesignTokens.typography.fontSizes['2xl'],
        fontWeight: 'bold',
        color: Colors.light.text,
    },
    statLabel: {
        fontSize: DesignTokens.typography.fontSizes.sm,
        color: Colors.light.textSecondary,
    },
    section: {
        marginBottom: DesignTokens.spacing.xl,
    },
    sectionTitle: {
        marginBottom: DesignTokens.spacing.md,
    },
    notesCard: {
        padding: DesignTokens.spacing.md,
    },
    notesInput: {
        minHeight: 100,
        fontSize: DesignTokens.typography.fontSizes.base,
        color: Colors.light.text,
        marginBottom: DesignTokens.spacing.md,
    },
    saveButton: {
        alignSelf: 'flex-end',
    },
    historyList: {
        gap: DesignTokens.spacing.md,
    },
    historyCard: {
        padding: DesignTokens.spacing.md,
    },
    historyHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: DesignTokens.spacing.xs,
    },
    serviceName: {
        fontSize: DesignTokens.typography.fontSizes.lg,
        fontWeight: '600',
        color: Colors.light.text,
    },
    statusText: {
        fontSize: DesignTokens.typography.fontSizes.sm,
        fontWeight: '500',
    },
    dateText: {
        fontSize: DesignTokens.typography.fontSizes.sm,
        color: Colors.light.textSecondary,
        marginBottom: DesignTokens.spacing.xs,
    },
    priceText: {
        fontSize: DesignTokens.typography.fontSizes.base,
        fontWeight: 'bold',
        color: Colors.light.primary,
    },
    emptyText: {
        textAlign: 'center',
        color: Colors.light.textSecondary,
        marginTop: DesignTokens.spacing.lg,
    },
});
