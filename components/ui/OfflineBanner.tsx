import { Colors, DesignTokens } from '@/constants/Colors';
import NetInfo from '@react-native-community/netinfo';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { IconSymbol } from './IconSymbol';

export function OfflineBanner() {
    const [isConnected, setIsConnected] = useState(true);
    const insets = useSafeAreaInsets();

    useEffect(() => {
        const unsubscribe = NetInfo.addEventListener((state) => {
            setIsConnected(state.isConnected ?? true);
        });

        return () => unsubscribe();
    }, []);

    if (isConnected) return null;

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <View style={styles.content}>
                <IconSymbol name="wifi.slash" size={16} color={Colors.light.textOnPrimary} />
                <Text style={styles.text}>Modo sin conexión</Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: Colors.light.error,
        width: '100%',
        zIndex: 9999,
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
    },
    content: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 8,
        paddingHorizontal: 16,
    },
    text: {
        color: Colors.light.textOnPrimary,
        fontSize: DesignTokens.typography.fontSizes.sm,
        fontWeight: '600',
    },
});
