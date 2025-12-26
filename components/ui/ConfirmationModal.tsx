import { ThemedText } from '@/components/ThemedText';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors, DesignTokens } from '@/constants/Colors';
import { BlurView } from 'expo-blur';
import { Modal, Platform, StyleSheet, View } from 'react-native';

interface ConfirmationModalProps {
    visible: boolean;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    onConfirm: () => void;
    onCancel: () => void;
    type?: 'danger' | 'warning' | 'info' | 'success';
    loading?: boolean;
}

export function ConfirmationModal({
    visible,
    title,
    message,
    confirmText = 'Confirmar',
    cancelText = 'Cancelar',
    onConfirm,
    onCancel,
    type = 'danger',
    loading = false,
}: ConfirmationModalProps) {
    const iconName = type === 'danger' ? 'exclamationmark.triangle.fill' : type === 'success' ? 'checkmark.circle.fill' : 'info.circle';
    const iconColor = type === 'danger' ? Colors.light.error : type === 'success' ? Colors.light.success : Colors.light.primary;

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            statusBarTranslucent
            onRequestClose={onCancel}
        >
            <View style={styles.overlay}>
                {Platform.OS !== 'web' ? (
                    <BlurView intensity={20} style={StyleSheet.absoluteFill} tint="dark" />
                ) : (
                    <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.4)' }]} />
                )}

                <View style={styles.container}>
                    <Card variant="elevated" style={styles.modalCard}>
                        <View style={styles.iconContainer}>
                            <View style={[styles.iconCircle, { backgroundColor: iconColor + '20' }]}>
                                <IconSymbol name={iconName} size={32} color={iconColor} />
                            </View>
                        </View>

                        <ThemedText style={styles.title}>{title}</ThemedText>
                        <ThemedText style={styles.message}>{message}</ThemedText>

                        <View style={styles.buttonContainer}>
                            <Button
                                title={cancelText}
                                variant="outline"
                                onPress={onCancel}
                                style={styles.button}
                                disabled={loading}
                            />
                            <Button
                                title={confirmText}
                                variant={type === 'danger' ? 'error' : 'primary'}
                                onPress={onConfirm}
                                loading={loading}
                                style={styles.button}
                            />
                        </View>
                    </Card>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: Platform.OS === 'web' ? 'rgba(0,0,0,0.5)' : 'transparent',
    },
    container: {
        width: '100%',
        padding: DesignTokens.spacing.xl,
        alignItems: 'center',
        justifyContent: 'center',
    },
    modalCard: {
        width: '100%',
        maxWidth: 360,
        backgroundColor: Colors.light.surface,
        borderRadius: DesignTokens.radius['2xl'],
        padding: DesignTokens.spacing['2xl'],
        alignItems: 'center',
        ...Platform.select({
            web: {
                boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
            },
            default: {
                elevation: 10,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 5 },
                shadowOpacity: 0.25,
                shadowRadius: 10,
            }
        })
    },
    iconContainer: {
        marginBottom: DesignTokens.spacing.lg,
    },
    iconCircle: {
        width: 64,
        height: 64,
        borderRadius: 32,
        alignItems: 'center',
        justifyContent: 'center',
    },
    title: {
        fontSize: DesignTokens.typography.fontSizes.xl,
        fontWeight: DesignTokens.typography.fontWeights.bold as any,
        color: Colors.light.text,
        textAlign: 'center',
        marginBottom: DesignTokens.spacing.sm,
    },
    message: {
        fontSize: DesignTokens.typography.fontSizes.base,
        color: Colors.light.textSecondary,
        textAlign: 'center',
        marginBottom: DesignTokens.spacing['2xl'],
        lineHeight: 22,
    },
    buttonContainer: {
        flexDirection: 'row',
        gap: DesignTokens.spacing.md,
        width: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    button: {
        flex: 1,
    },
});
