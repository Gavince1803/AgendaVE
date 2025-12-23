import { ThemedText } from '@/components/ThemedText';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

export function NotificationBell() {
    const { user } = useAuth();
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        if (!user) return;

        // Initial fetch
        fetchUnreadCount();


        // Subscribe to changes
        console.log('🔔 [BELL] Attempting to subscribe to notifications for user:', user.id);
        const channel = supabase
            .channel('notification_count')
            .on(
                'postgres_changes',
                {
                    event: '*', // Listen for INSERT, UPDATE, DELETE
                    schema: 'public',
                    table: 'notifications',
                    // filter: `user_id=eq.${user.id}`, // Filter removed for debugging
                },
                (payload) => {
                    console.log('🔔 [BELL] Realtime EVENT received:', payload);
                    fetchUnreadCount();
                }
            )
            .subscribe((status, err) => {
                console.log(`🔔 [BELL] Subscription status: ${status}`, err ? err : '');
                if (status === 'SUBSCRIBED') {
                    console.log('✅ [BELL] Successfully subscribed to realtime events');
                }
            });

        return () => {
            console.log('🔔 [BELL] Cleaning up subscription');
            supabase.removeChannel(channel);
        };
    }, [user]);

    const fetchUnreadCount = async () => {
        if (!user) return;

        const { count, error } = await supabase
            .from('notifications')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id)
            .eq('is_read', false);

        if (!error && count !== null) {
            setUnreadCount(count);
        }
    };

    const handlePress = () => {
        router.push('/notifications');
    };

    return (
        <TouchableOpacity onPress={handlePress} style={styles.container}>
            <IconSymbol name="bell" size={24} color={Colors.light.text} />
            {unreadCount > 0 && (
                <View style={styles.badge}>
                    <ThemedText style={styles.badgeText}>
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </ThemedText>
                </View>
            )}
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    container: {
        padding: 8,
        position: 'relative',
    },
    badge: {
        position: 'absolute',
        top: 4,
        right: 4,
        backgroundColor: Colors.light.error,
        borderRadius: 8,
        minWidth: 16,
        height: 16,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 2,
        borderWidth: 1,
        borderColor: Colors.light.background,
    },
    badgeText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: 'bold',
    },
});
