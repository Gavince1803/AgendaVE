import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';

interface TextScaleContextType {
    scale: number;
    isLargeText: boolean;
    toggleLargeText: () => Promise<void>;
}

const TextScaleContext = createContext<TextScaleContextType | undefined>(undefined);

export function TextScaleProvider({ children }: { children: React.ReactNode }) {
    const [scale, setScale] = useState(1);

    useEffect(() => {
        loadPreference();
    }, []);

    const loadPreference = async () => {
        try {
            const stored = await AsyncStorage.getItem('largeTextEnabled');
            if (stored === 'true') {
                setScale(1.3);
            }
        } catch (error) {
            console.warn('Error loading text scale preference:', error);
        }
    };

    const toggleLargeText = async () => {
        const newScale = scale === 1 ? 1.3 : 1;
        setScale(newScale);
        try {
            await AsyncStorage.setItem('largeTextEnabled', newScale > 1 ? 'true' : 'false');
        } catch (error) {
            console.warn('Error saving text scale preference:', error);
        }
    };

    return (
        <TextScaleContext.Provider value={{ scale, isLargeText: scale > 1, toggleLargeText }}>
            {children}
        </TextScaleContext.Provider>
    );
}

export function useTextScale() {
    const context = useContext(TextScaleContext);
    if (context === undefined) {
        throw new Error('useTextScale must be used within a TextScaleProvider');
    }
    return context;
}
