import { ThemedText } from '@/components/ThemedText';
import { Card } from '@/components/ui/Card';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { TabSafeAreaView } from '@/components/ui/SafeAreaView';
import { Skeleton } from '@/components/ui/Skeleton';
import { Colors, DesignTokens } from '@/constants/Colors';
import { useAuth } from '@/contexts/AuthContext';
import { BookingService } from '@/lib/booking-service';
import { LogCategory, useLogger } from '@/lib/logger';
import { Image as ExpoImage } from 'expo-image';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
    RefreshControl,
    ScrollView,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';

export default function ClientListScreen() {
    const [clients, setClients] = useState<any[]>([]);
    const [filteredClients, setFilteredClients] = useState<any[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const { user, employeeProfile } = useAuth();
    const log = useLogger(user?.id);

    useEffect(() => {
        loadClients();
    }, []);

    useEffect(() => {
        if (searchQuery.trim() === '') {
            setFilteredClients(clients);
        } else {
            const query = searchQuery.toLowerCase();
            const filtered = clients.filter(
                (client) =>
                    client.full_name?.toLowerCase().includes(query) ||
                    client.email?.toLowerCase().includes(query) ||
                    client.phone?.includes(query)
            );
            setFilteredClients(filtered);
        }
    }, [searchQuery, clients]);

    const loadClients = async () => {
        try {
            setLoading(true);
            const providerId = employeeProfile?.provider_id;
            if (!providerId) return;

            const data = await BookingService.getProviderClients(providerId);
            setClients(data);
            setFilteredClients(data);
        } catch (error) {
            log.error(LogCategory.SERVICE, 'Error loading clients', error);
        } finally {
            setLoading(false);
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await loadClients();
        setRefreshing(false);
    };

    const handleClientPress = (client: any) => {
        router.push({
            pathname: '/(provider)/clients/[id]',
            params: { id: client.id, name: client.full_name, avatar: client.avatar_url, phone: client.phone }
        });
    };

    return (
        <TabSafeAreaView style={styles.container}>
            <View style={styles.header}>
                <View style={styles.headerContent}>
                    <ThemedText type="title" style={styles.title}>Clientes 📇</ThemedText>
                    <ThemedText style={styles.subtitle}>Gestiona tu base de clientes</ThemedText>
                </View>
            </View>

            <View style={styles.searchContainer}>
                <View style={styles.searchBar}>
                    <IconSymbol name="magnifyingglass" size={20} color={Colors.light.textSecondary} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Buscar por nombre, email o teléfono..."
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        placeholderTextColor={Colors.light.textSecondary}
                    />
                </View>
            </View>

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        colors={[Colors.light.primary]}
                        tintColor={Colors.light.primary}
                    />
                }
            >
                {loading ? (
                    <View style={styles.loadingContainer}>
                        <Skeleton width="100%" height={80} borderRadius={12} style={{ marginBottom: 12 }} />
                        <Skeleton width="100%" height={80} borderRadius={12} style={{ marginBottom: 12 }} />
                        <Skeleton width="100%" height={80} borderRadius={12} style={{ marginBottom: 12 }} />
                    </View>
                ) : filteredClients.length === 0 ? (
                    <View style={styles.emptyState}>
                        <IconSymbol name="person.2" size={48} color={Colors.light.textSecondary} />
                        <ThemedText style={styles.emptyStateText}>
                            {searchQuery ? 'No se encontraron clientes' : 'Aún no tienes clientes registrados'}
                        </ThemedText>
                    </View>
                ) : (
                    <View style={styles.list}>
                        {filteredClients.map((client) => (
                            <TouchableOpacity key={client.id} onPress={() => handleClientPress(client)}>
                                <Card variant="elevated" style={styles.clientCard}>
                                    <ExpoImage
                                        source={client.avatar_url || 'https://via.placeholder.com/150'}
                                        style={styles.avatar}
                                        contentFit="cover"
                                    />
                                    <View style={styles.clientInfo}>
                                        <ThemedText style={styles.clientName}>{client.full_name || 'Cliente sin nombre'}</ThemedText>
                                        <ThemedText style={styles.clientDetail}>{client.phone || client.email || 'Sin contacto'}</ThemedText>
                                        <View style={styles.statsRow}>
                                            <View style={styles.statBadge}>
                                                <IconSymbol name="calendar" size={12} color={Colors.light.primary} />
                                                <ThemedText style={styles.statText}>{client.stats?.totalVisits || 0} visitas</ThemedText>
                                            </View>
                                            {client.stats?.lastVisit && (
                                                <View style={styles.statBadge}>
                                                    <IconSymbol name="clock" size={12} color={Colors.light.textSecondary} />
                                                    <ThemedText style={styles.statText}>
                                                        {new Date(client.stats.lastVisit).toLocaleDateString()}
                                                    </ThemedText>
                                                </View>
                                            )}
                                        </View>
                                    </View>
                                    <IconSymbol name="chevron.right" size={20} color={Colors.light.textSecondary} />
                                </Card>
                            </TouchableOpacity>
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
        paddingHorizontal: DesignTokens.spacing.lg,
        paddingVertical: DesignTokens.spacing.md,
        backgroundColor: Colors.light.background,
    },
    headerContent: {
        marginBottom: DesignTokens.spacing.sm,
    },
    title: {
        fontSize: DesignTokens.typography.fontSizes['2xl'],
        fontWeight: 'bold',
        color: Colors.light.text,
    },
    subtitle: {
        fontSize: DesignTokens.typography.fontSizes.base,
        color: Colors.light.textSecondary,
    },
    searchContainer: {
        paddingHorizontal: DesignTokens.spacing.lg,
        paddingBottom: DesignTokens.spacing.md,
    },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.light.surface,
        paddingHorizontal: DesignTokens.spacing.md,
        paddingVertical: DesignTokens.spacing.sm,
        borderRadius: DesignTokens.radius.md,
        borderWidth: 1,
        borderColor: Colors.light.border,
    },
    searchInput: {
        flex: 1,
        marginLeft: DesignTokens.spacing.sm,
        fontSize: DesignTokens.typography.fontSizes.base,
        color: Colors.light.text,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        padding: DesignTokens.spacing.lg,
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
    clientCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: DesignTokens.spacing.md,
    },
    avatar: {
        width: 50,
        height: 50,
        borderRadius: 25,
        marginRight: DesignTokens.spacing.md,
        backgroundColor: Colors.light.border,
    },
    clientInfo: {
        flex: 1,
    },
    clientName: {
        fontSize: DesignTokens.typography.fontSizes.lg,
        fontWeight: '600',
        color: Colors.light.text,
        marginBottom: 2,
    },
    clientDetail: {
        fontSize: DesignTokens.typography.fontSizes.sm,
        color: Colors.light.textSecondary,
        marginBottom: 4,
    },
    statsRow: {
        flexDirection: 'row',
        gap: DesignTokens.spacing.sm,
    },
    statBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.light.background,
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
        gap: 4,
    },
    statText: {
        fontSize: 10,
        color: Colors.light.textSecondary,
    },
});
