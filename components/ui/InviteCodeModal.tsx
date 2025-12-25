import { Button } from '@/components/ui/Button';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors, DesignTokens } from '@/constants/Colors';
import { useAlert } from '@/contexts/GlobalAlertContext';
import { BlurView } from 'expo-blur';
import * as Clipboard from 'expo-clipboard';
import { Linking, Modal, Share, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface InviteCodeModalProps {
    visible: boolean;
    onClose: () => void;
    inviteToken: string;
    inviteUrl: string;
    employeeName: string;
    businessName: string;
}

export function InviteCodeModal({
    visible,
    onClose,
    inviteToken,
    inviteUrl,
    employeeName,
    businessName,
}: InviteCodeModalProps) {
    const insets = useSafeAreaInsets();
    const { showAlert } = useAlert();

    const handleCopyCode = async () => {
        await Clipboard.setStringAsync(inviteToken);
        showAlert('Copiado', 'Código copiado al portapapeles');
    };

    const handleShareWhatsApp = async () => {
        const message = `Hola ${employeeName}, te invito a unirte a ${businessName} en MiCita.\n\n1. Descarga la app\n2. Usa este código de invitación: *${inviteToken}*\n\nEnlace directo: ${inviteUrl}`;
        const url = `whatsapp://send?text=${encodeURIComponent(message)}`;

        try {
            const canOpen = await Linking.canOpenURL(url);
            if (canOpen) {
                await Linking.openURL(url);
            } else {
                // Fallback to native share if WhatsApp is not installed
                await Share.share({ message });
            }
        } catch (error) {
            console.error('Error opening WhatsApp:', error);
            await Share.share({ message });
        }
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <BlurView intensity={20} style={styles.absolute} tint="dark" />

                <View style={styles.container}>
                    <View style={styles.content}>
                        <View style={styles.iconContainer}>
                            <IconSymbol name="person.badge.plus" size={32} color={Colors.light.primary} />
                        </View>

                        <Text style={styles.title}>¡Empleado Agregado!</Text>
                        <Text style={styles.subtitle}>
                            Comparte este código con <Text style={styles.bold}>{employeeName}</Text> para que pueda unirse a tu equipo.
                        </Text>

                        <View style={styles.codeContainer}>
                            <Text style={styles.codeLabel}>CÓDIGO DE INVITACIÓN</Text>
                            <TouchableOpacity onPress={handleCopyCode} style={styles.codeBox}>
                                <Text
                                    style={styles.codeText}
                                    adjustsFontSizeToFit
                                    numberOfLines={1}
                                >
                                    {inviteToken}
                                </Text>
                                <IconSymbol name="doc.on.doc" size={20} color={Colors.light.primary} />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.actions}>
                            <Button
                                title="Compartir por WhatsApp"
                                onPress={handleShareWhatsApp}
                                variant="primary"
                                size="large"
                                icon={<IconSymbol name="message.fill" size={18} color="#fff" />}
                                style={[styles.whatsappButton]}
                            />

                            <Button
                                title="Listo"
                                onPress={onClose}
                                variant="ghost"
                                size="medium"
                            />
                        </View>
                    </View>
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
        backgroundColor: 'rgba(0,0,0,0.5)', // Slightly darker for better contrast
        padding: DesignTokens.spacing.lg, // Reduced padding
    },
    absolute: {
        position: 'absolute',
        top: 0,
        left: 0,
        bottom: 0,
        right: 0,
    },
    container: {
        width: '100%',
        maxWidth: 360, // Slightly narrower max width
        backgroundColor: Colors.light.surface,
        borderRadius: DesignTokens.radius['2xl'],
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.25,
        shadowRadius: 20,
        elevation: 10,
        overflow: 'hidden',
    },
    content: {
        padding: DesignTokens.spacing.xl, // Reduced padding
        alignItems: 'center',
    },
    iconContainer: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: Colors.light.primary + '15',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: DesignTokens.spacing.md,
    },
    title: {
        fontSize: DesignTokens.typography.fontSizes.xl, // Slightly smaller title
        fontWeight: DesignTokens.typography.fontWeights.bold as any,
        color: Colors.light.text,
        marginBottom: DesignTokens.spacing.xs,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: DesignTokens.typography.fontSizes.sm,
        color: Colors.light.textSecondary,
        textAlign: 'center',
        marginBottom: DesignTokens.spacing.lg,
        lineHeight: 20,
        paddingHorizontal: DesignTokens.spacing.md,
    },
    bold: {
        fontWeight: DesignTokens.typography.fontWeights.bold as any,
        color: Colors.light.text,
    },
    codeContainer: {
        width: '100%',
        marginBottom: DesignTokens.spacing.xl,
        backgroundColor: Colors.light.background,
        padding: DesignTokens.spacing.md,
        borderRadius: DesignTokens.radius.lg, // Slightly smaller radius
        borderWidth: 1,
        borderColor: Colors.light.border,
        alignItems: 'center',
    },
    codeLabel: {
        fontSize: 10, // Smaller label
        fontWeight: DesignTokens.typography.fontWeights.bold as any,
        color: Colors.light.textSecondary,
        marginBottom: DesignTokens.spacing.xs,
        textTransform: 'uppercase',
        letterSpacing: 1,
        textAlign: 'center',
    },
    codeBox: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: DesignTokens.spacing.sm,
        width: '100%',
        paddingHorizontal: DesignTokens.spacing.sm,
    },
    codeText: {
        fontSize: 22, // Significantly reduced font size
        fontWeight: DesignTokens.typography.fontWeights.bold as any, // Reduced weight slightly
        color: Colors.light.primary,
        letterSpacing: 0.5,
        textAlign: 'center',
        flexShrink: 1,
    },
    actions: {
        width: '100%',
        gap: DesignTokens.spacing.sm, // Tighter gap
    },
    whatsappButton: {
        backgroundColor: '#25D366',
        borderWidth: 0,
    },
});
