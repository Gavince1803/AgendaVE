import { Colors } from '@/constants/Colors';
import { useAuth } from '@/contexts/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';

export default function Index() {
    const { user, loading } = useAuth();
    const [isCheckingOnboarding, setIsCheckingOnboarding] = useState(true);
    const [hasSeenOnboarding, setHasSeenOnboarding] = useState(false);

    useEffect(() => {
        checkOnboarding();
    }, []);

    const checkOnboarding = async () => {
        try {
            const value = await AsyncStorage.getItem('hasSeenOnboarding');
            setHasSeenOnboarding(value === 'true');
        } catch (error) {
            console.error('Error checking onboarding status:', error);
        } finally {
            setIsCheckingOnboarding(false);
        }
    };

    if (loading || isCheckingOnboarding) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.light.background }}>
                <ActivityIndicator size="large" color={Colors.light.primary} />
            </View>
        );
    }

    if (!hasSeenOnboarding) {
        return <Redirect href="/(onboarding)" />;
    }

    if (user) {
        return <Redirect href="/(tabs)" />;
    }

    return <Redirect href="/(auth)/login" />;
}
