import { Stack, router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
    FlatList,
    Platform,
    RefreshControl,
    StyleSheet,
    TouchableOpacity,
    View
} from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { TabSafeAreaView } from '@/components/ui/SafeAreaView';
import { Colors } from '@/constants/Colors';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface Notification {
    id: string;
    title: string;
    body: string;
    is_read: boolean;
    created_at: string;
    data: any;
}

export default function NotificationsScreen() {
    const { user } = useAuth();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [refreshing, setRefreshing] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user) loadNotifications();
    }, [user]);

    const loadNotifications = async () => {
        try {
            if (!user) return;
            const { data, error } = await supabase
                .from('notifications')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })
                .limit(50);

            if (error) throw error;
            setNotifications(data || []);
        } catch (error) {
            console.error('Error loading notifications:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const markAsRead = async (notification: Notification) => {
        if (notification.is_read) return;

        try {
            await supabase
                .from('notifications')
                .update({ is_read: true })
                .eq('id', notification.id);

            // Optimistic update
            setNotifications(prev =>
                prev.map(n => (n.id === notification.id ? { ...n, is_read: true } : n))
            );
        } catch (error) {
            console.error('Error marking as read:', error);
        }
    };

    const handlePress = async (notification: Notification) => {
        markAsRead(notification);

        // Handle specific notification types logic here if needed
        // e.g. navigate to appointment details
        if (notification.data?.appointment_id) {
            // Ideally navigate to details
            console.log('Navigate to appointment:', notification.data.appointment_id);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        loadNotifications();
    };

    const renderItem = ({ item }: { item: Notification }) => (
        <TouchableOpacity
            style={[styles.notificationItem, !item.is_read && styles.unreadItem]}
            onPress={() => handlePress(item)}
        >
            <View style={styles.iconContainer}>
                <IconSymbol
                    name={item.is_read ? "bell" : "bell.badge"}
                    size={24}
                    color={item.is_read ? Colors.light.textSecondary : Colors.light.primary}
                />
            </View>
            <View style={styles.contentContainer}>
                <View style={styles.headerRow}>
                    <ThemedText style={[styles.title, !item.is_read && styles.unreadText]}>
                        {item.title}
                    </ThemedText>
                    <ThemedText style={styles.date}>
                        {format(new Date(item.created_at), 'd MMM', { locale: es })}
                    </ThemedText>
                </View>
                <ThemedText style={styles.body} numberOfLines={2}>
                    {item.body}
                </ThemedText>
            </View>
        </TouchableOpacity>
    );

    return (
        <TabSafeAreaView style={styles.container}>
            <Stack.Screen options={{ headerShown: false }} />

            <View style={styles.customHeader}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <IconSymbol name="chevron.left" size={24} color={Colors.light.text} />
                </TouchableOpacity>
                <ThemedText type="title" style={styles.headerTitle}>Notificaciones</ThemedText>
                <View style={styles.headerRight} />
            </View>

            <FlatList
                data={notifications}
                renderItem={renderItem}
                keyExtractor={item => item.id}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
                contentContainerStyle={styles.listContent}
                ListEmptyComponent={
                    !loading ? (
                        <View style={styles.emptyState}>
                            <IconSymbol name="bell.slash" size={48} color={Colors.light.textTertiary} />
                            <ThemedText style={styles.emptyText}>No tienes notificaciones</ThemedText>
                        </View>
                    ) : null
                }
            />
        </TabSafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.light.background,
    },
    listContent: {
        padding: 16,
    },
    notificationItem: {
        flexDirection: 'row',
        padding: 16,
        backgroundColor: Colors.light.surface,
        borderRadius: 12,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: Colors.light.border,
    },
    unreadItem: {
        backgroundColor: Colors.light.surfaceVariant,
        borderColor: Colors.light.primary,
    },
    iconContainer: {
        marginRight: 16,
        justifyContent: 'center',
    },
    contentContainer: {
        flex: 1,
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 4,
    },
    title: {
        fontSize: 16,
        fontWeight: '600',
        color: Colors.light.text,
        flex: 1,
        marginRight: 8,
    },
    unreadText: {
        color: Colors.light.primary,
        fontWeight: '700',
    },
    date: {
        fontSize: 12,
        color: Colors.light.textSecondary,
    },
    body: {
        fontSize: 14,
        color: Colors.light.textSecondary,
        lineHeight: 20,
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: 40,
        marginTop: 40,
    },
    emptyText: {
        marginTop: 16,
        fontSize: 16,
        color: Colors.light.textSecondary,
    },
    customHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingTop: Platform.OS === 'ios' ? 8 : 12,
        paddingBottom: 12,
        backgroundColor: Colors.light.background,
        borderBottomWidth: 1,
        borderBottomColor: Colors.light.border,
    },
    backButton: {
        padding: 8,
        marginLeft: -8,
        borderRadius: 20,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: Colors.light.text,
    },
    headerRight: {
        width: 40,
    },
});
