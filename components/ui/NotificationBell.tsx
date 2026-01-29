import { ThemedText } from '@/components/ThemedText';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

export default function NotificationBell() {
    const { user } = useAuth();
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        if (!user) return;

        // Subscribe to Realtime (Push)
        const channel = supabase
            .channel('notification_count')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'notifications',
                },
                () => {
                    fetchUnreadCount();
                }
            )
            .subscribe((status) => {
                if (status === 'SUBSCRIBED') {
                    console.log('✅ [BELL] Realtime connected');
                }
            });

        // 🛡️ Backup: Polling (Pull) every 15 seconds
        // Ensures notification appears even if Realtime socket drops or is blocked
        const intervalId = setInterval(() => {
            fetchUnreadCount();
        }, 15000);

        return () => {
            supabase.removeChannel(channel);
            clearInterval(intervalId);
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
        top: -5,
        right: -5,
        backgroundColor: Colors.light.error,
        borderRadius: 12,
        minWidth: 20,
        height: 20,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 4,
        borderWidth: 2,
        borderColor: Colors.light.background,
        zIndex: 10,
        elevation: 5, // Android shadow to ensure visibility
    },
    badgeText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: 'bold',
        textAlign: 'center',
        lineHeight: 12,
    },
});
