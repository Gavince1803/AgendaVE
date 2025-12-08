import { Colors } from '@/constants/Colors';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { IconSymbol } from './IconSymbol';

interface ConfirmationModalProps {
    visible: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    onCancel: () => void; // Used for "Ver Mis Citas" or primary specific action if needed
    confirmText?: string;
    cancelText?: string;
    type?: 'success' | 'error' | 'info';
}

export function ConfirmationModal({
    visible,
    title,
    message,
    onConfirm,
    onCancel,
    confirmText = 'OK',
    cancelText,
    type = 'success',
}: ConfirmationModalProps) {
    return (
        <Modal
            animationType="fade"
            transparent={true}
            visible={visible}
            onRequestClose={onCancel}
        >
            <View style={styles.centeredView}>
                <View style={styles.modalView}>
                    <View style={[
                        styles.iconContainer,
                        type === 'success' ? styles.iconSuccess : styles.iconError
                    ]}>
                        <IconSymbol
                            name={type === 'success' ? 'checkmark' : 'exclamationmark.triangle'}
                            size={32}
                            color={Colors.light.surface}
                        />
                    </View>

                    <Text style={styles.modalTitle}>{title}</Text>
                    <Text style={styles.modalText}>{message}</Text>

                    <View style={styles.buttonContainer}>
                        {/* Primary Action (e.g., Go to Home) */}
                        <TouchableOpacity
                            style={[styles.button, styles.buttonConfirm]}
                            onPress={onConfirm}
                        >
                            <Text style={styles.textStyle}>{confirmText}</Text>
                        </TouchableOpacity>

                        {/* Secondary Action (e.g., View Bookings) */}
                        {cancelText && (
                            <TouchableOpacity
                                style={[styles.button, styles.buttonCancel]}
                                onPress={onCancel}
                            >
                                <Text style={styles.textStyleCancel}>{cancelText}</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    centeredView: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalView: {
        margin: 20,
        backgroundColor: Colors.light.surface,
        borderRadius: 24, // Rounded like the screenshot
        padding: 30, // Spacious padding
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
        width: '85%',
        maxWidth: 340,
    },
    iconContainer: {
        width: 64,
        height: 64,
        borderRadius: 32,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
        elevation: 4,
        shadowColor: Colors.light.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
    },
    iconSuccess: {
        backgroundColor: Colors.light.primary, // #0c8ce8 or similar
    },
    iconError: {
        backgroundColor: Colors.light.error,
    },
    modalTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        textAlign: 'center',
        color: Colors.light.text,
        marginBottom: 10,
    },
    modalText: {
        marginBottom: 24,
        textAlign: 'center', // CENTERED TEXT as requested
        fontSize: 16,
        color: Colors.light.textSecondary,
        lineHeight: 22,
    },
    buttonContainer: {
        width: '100%',
        gap: 12, // Gap between stacked buttons
    },
    button: {
        borderRadius: 12,
        padding: 16,
        elevation: 2,
        width: '100%',
        alignItems: 'center',
    },
    buttonConfirm: {
        backgroundColor: Colors.light.primary,
    },
    buttonCancel: {
        backgroundColor: Colors.light.surfaceVariant,
    },
    textStyle: {
        color: 'white',
        fontWeight: 'bold',
        textAlign: 'center',
        fontSize: 16,
    },
    textStyleCancel: {
        color: Colors.light.text,
        fontWeight: '600',
        textAlign: 'center',
        fontSize: 16,
    },
});
