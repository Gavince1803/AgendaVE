import { ThemedText } from '@/components/ThemedText';
import { Button } from '@/components/ui/Button';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors, DesignTokens } from '@/constants/Colors';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const slides = [
    {
        id: '1',
        title: 'Reserva Fácil',
        description: 'Encuentra los mejores servicios y reserva tu cita en segundos.',
        icon: 'calendar.badge.plus',
    },
    {
        id: '2',
        title: 'Modo Offline',
        description: '¿Sin internet? No hay problema. Accede a tus citas y servicios guardados.',
        icon: 'wifi.slash',
    },
    {
        id: '3',
        title: 'Soporte Local',
        description: 'Hecho en Venezuela para Venezuela. Pagos en sitio y soporte directo.',
        icon: 'heart.fill',
    },
];

export default function OnboardingScreen() {
    const [currentIndex, setCurrentIndex] = useState(0);

    const handleNext = async () => {
        if (currentIndex < slides.length - 1) {
            setCurrentIndex(currentIndex + 1);
        } else {
            // Finish onboarding
            try {
                await AsyncStorage.setItem('hasSeenOnboarding', 'true');
                router.replace('/(auth)/login');
            } catch (error) {
                console.error('Error saving onboarding status:', error);
                router.replace('/(auth)/login');
            }
        }
    };

    const currentSlide = slides[currentIndex];

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.content}>
                <View style={styles.iconContainer}>
                    <IconSymbol name={currentSlide.icon as any} size={80} color={Colors.light.primary} />
                </View>
                <ThemedText type="title" style={styles.title}>{currentSlide.title}</ThemedText>
                <ThemedText style={styles.description}>{currentSlide.description}</ThemedText>

                <View style={styles.dots}>
                    {slides.map((_, index) => (
                        <View
                            key={index}
                            style={[
                                styles.dot,
                                index === currentIndex && styles.activeDot,
                            ]}
                        />
                    ))}
                </View>
            </View>

            <View style={styles.footer}>
                <Button
                    title={currentIndex === slides.length - 1 ? "Comenzar" : "Siguiente"}
                    onPress={handleNext}
                    size="large"
                    fullWidth
                />
                {currentIndex < slides.length - 1 && (
                    <Button
                        title="Saltar"
                        variant="ghost"
                        onPress={() => router.replace('/(auth)/login')}
                        style={styles.skipButton}
                    />
                )}
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.light.background,
    },
    content: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: DesignTokens.spacing['2xl'],
    },
    iconContainer: {
        marginBottom: DesignTokens.spacing['2xl'],
        width: 160,
        height: 160,
        borderRadius: 80,
        backgroundColor: Colors.light.surfaceVariant,
        alignItems: 'center',
        justifyContent: 'center',
    },
    title: {
        fontSize: DesignTokens.typography.fontSizes['3xl'],
        textAlign: 'center',
        marginBottom: DesignTokens.spacing.md,
        color: Colors.light.primary,
    },
    description: {
        fontSize: DesignTokens.typography.fontSizes.lg,
        textAlign: 'center',
        color: Colors.light.textSecondary,
        marginBottom: DesignTokens.spacing['2xl'],
        lineHeight: 24,
    },
    dots: {
        flexDirection: 'row',
        gap: DesignTokens.spacing.sm,
        marginTop: DesignTokens.spacing.xl,
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: Colors.light.border,
    },
    activeDot: {
        backgroundColor: Colors.light.primary,
        width: 24,
    },
    footer: {
        padding: DesignTokens.spacing['2xl'],
    },
    skipButton: {
        marginTop: DesignTokens.spacing.sm,
    },
});
