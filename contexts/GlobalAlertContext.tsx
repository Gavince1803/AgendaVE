import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/Colors';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { Alert, Modal, Platform, StyleSheet, TouchableOpacity, View } from 'react-native';

// Compatible interface with React Native's Alert.alert
export interface AlertButton {
    text?: string;
    onPress?: (value?: string) => void | Promise<void>;
    style?: 'default' | 'cancel' | 'destructive';
}

export interface AlertOptions {
    cancelable?: boolean;
    onDismiss?: () => void;
}

interface GlobalAlertContextType {
    showAlert: (title: string, message?: string, buttons?: AlertButton[], options?: AlertOptions) => void;
}

const GlobalAlertContext = createContext<GlobalAlertContextType | undefined>(undefined);

export const useAlert = () => {
    const context = useContext(GlobalAlertContext);
    if (!context) {
        throw new Error('useAlert must be used within a GlobalAlertProvider');
    }
    return context;
};

import { errorHandler } from '@/lib/errorHandling';

// ... (existing imports)

export function GlobalAlertProvider({ children }: { children: React.ReactNode }) {
    const [visible, setVisible] = useState(false);
    const [title, setTitle] = useState('');
    const [message, setMessage] = useState<string | undefined>('');
    const [buttons, setButtons] = useState<AlertButton[]>([]);
    const [options, setOptions] = useState<AlertOptions>({});

    const showAlert = React.useCallback((
        newTitle: string,
        newMessage?: string,
        newButtons?: AlertButton[],
        newOptions?: AlertOptions
    ) => {
        // On native mobile, use the standard Alert
        if (Platform.OS !== 'web') {
            Alert.alert(newTitle, newMessage, newButtons, newOptions);
            return;
        }

        // On web, show our custom modal
        setTitle(newTitle);
        setMessage(newMessage);
        setButtons(newButtons || [{ text: 'OK', style: 'default', onPress: () => { } }]);
        setOptions(newOptions || {});
        setVisible(true);
    }, []);

    // Register with global error handler
    useEffect(() => {
        errorHandler.setAlertHandler(showAlert as any);
        return () => errorHandler.setAlertHandler(null as any);
    }, [showAlert]);

    const handleButtonPress = async (button: AlertButton) => {
        setVisible(false);
        if (button.onPress) {
            await button.onPress();
        }
    };

    return (
        <GlobalAlertContext.Provider value={{ showAlert }}>
            {children}
            {Platform.OS === 'web' && (
                <Modal
                    visible={visible}
                    transparent
                    animationType="fade"
                    onRequestClose={() => {
                        if (options.cancelable) {
                            setVisible(false);
                            options.onDismiss?.();
                        }
                    }}
                >
                    <View style={styles.overlay}>
                        <View style={styles.alertBox}>
                            <ThemedText style={styles.title}>{title}</ThemedText>
                            {message && <ThemedText style={styles.message}>{message}</ThemedText>}

                            <View style={styles.buttonContainer}>
                                {buttons.map((btn, index) => (
                                    <TouchableOpacity
                                        key={index}
                                        style={[
                                            styles.button,
                                            buttons.length > 2 ? styles.buttonVertical : styles.buttonHorizontal,
                                            btn.style === 'cancel' ? styles.buttonCancel :
                                                btn.style === 'destructive' ? styles.buttonDestructive :
                                                    styles.buttonDefault
                                        ]}
                                        onPress={() => handleButtonPress(btn)}
                                        activeOpacity={0.8}
                                    >
                                        <ThemedText
                                            style={[
                                                styles.buttonText,
                                                btn.style === 'cancel' ? styles.textCancel :
                                                    btn.style === 'destructive' ? styles.textDestructive :
                                                        styles.textDefault
                                            ]}
                                        >
                                            {btn.text || 'OK'}
                                        </ThemedText>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>
                    </View>
                </Modal>
            )}
        </GlobalAlertContext.Provider>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20
    },
    alertBox: {
        backgroundColor: Colors.light.surface,
        borderRadius: 24,
        padding: 24,
        width: '100%',
        maxWidth: 340,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 8
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 8,
        textAlign: 'center',
        color: Colors.light.text
    },
    message: {
        fontSize: 16,
        color: Colors.light.textSecondary,
        textAlign: 'center',
        marginBottom: 32,
        lineHeight: 22
    },
    buttonContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'flex-end',
        width: '100%',
        gap: 12
    },
    button: {
        paddingVertical: 14,
        paddingHorizontal: 20,
        borderRadius: 12,
        minWidth: 100,
        alignItems: 'center',
        justifyContent: 'center',
    },
    buttonHorizontal: {
        flex: 1
    },
    buttonVertical: {
        width: '100%',
        marginBottom: 8
    },
    // Button Variants
    buttonDefault: {
        backgroundColor: Colors.light.primary,
        shadowColor: Colors.light.primary,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 2,
    },
    buttonCancel: {
        backgroundColor: Colors.light.surfaceVariant,
        borderWidth: 1,
        borderColor: Colors.light.border,
    },
    buttonDestructive: {
        backgroundColor: Colors.light.error,
        shadowColor: Colors.light.error,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 2,
    },
    // Text Styles
    buttonText: {
        fontSize: 16,
        fontWeight: '600',
        textAlign: 'center',
    },
    textDefault: {
        color: '#ffffff',
    },
    textCancel: {
        color: Colors.light.text,
    },
    textDestructive: {
        color: '#ffffff',
    }
});
