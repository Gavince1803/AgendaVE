import { Colors } from '@/constants/Colors';
import { Image, type ImageStyle } from 'expo-image';
import { useState } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { IconSymbol } from './IconSymbol';

interface OptimizedImageProps {
    source: string | null | undefined;
    style?: StyleProp<ImageStyle>;
    contentFit?: 'cover' | 'contain' | 'fill';
    placeholderContent?: React.ReactNode;
    containerStyle?: StyleProp<ViewStyle>;
}

export function OptimizedImage({
    source,
    style,
    contentFit = 'cover',
    placeholderContent,
    containerStyle
}: OptimizedImageProps) {
    const [error, setError] = useState(false);

    if (!source || error) {
        return (
            <View style={[styles.placeholderContainer, style as ViewStyle, containerStyle]}>
                {placeholderContent || (
                    <IconSymbol name="photo" size={24} color={Colors.light.iconSecondary} />
                )}
            </View>
        );
    }

    return (
        <Image
            source={{ uri: source }}
            style={style}
            contentFit={contentFit}
            transition={200}
            onError={() => setError(true)}
            cachePolicy="memory-disk" // Aggressive caching for data saving
        />
    );
}

const styles = StyleSheet.create({
    placeholderContainer: {
        backgroundColor: Colors.light.surfaceVariant,
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
    },
});
