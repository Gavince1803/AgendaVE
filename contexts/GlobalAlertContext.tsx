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
                                            buttons.length > 2 ? styles.buttonVertical : styles.buttonHorizontal
                                        ]}
                                        onPress={() => handleButtonPress(btn)}
                                    >
                                        <ThemedText
                                            style={[
                                                styles.buttonText,
                                                btn.style === 'cancel' && styles.textCancel,
                                                btn.style === 'destructive' && styles.textDestructive
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
        borderRadius: 16,
        padding: 24,
        width: '100%',
        maxWidth: 320,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 10,
        elevation: 5
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 8,
        textAlign: 'center',
        color: Colors.light.text
    },
    message: {
        fontSize: 14,
        color: Colors.light.textSecondary,
        textAlign: 'center',
        marginBottom: 24
    },
    buttonContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'flex-end',
        width: '100%',
        gap: 8
    },
    button: {
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 8,
        minWidth: 80,
        alignItems: 'center'
    },
    buttonHorizontal: {
        flex: 1
    },
    buttonVertical: {
        width: '100%',
        marginBottom: 8
    },
    buttonText: {
        fontSize: 16,
        fontWeight: '600',
        color: Colors.light.primary
    },
    textCancel: {
        color: Colors.light.textSecondary
    },
    textDestructive: {
        color: Colors.light.error
    }
});
