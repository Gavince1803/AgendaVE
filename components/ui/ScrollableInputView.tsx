import React from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ScrollViewProps, // Add this
  ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface ScrollableInputViewProps extends ScrollViewProps { // Extend here
  children: React.ReactNode;
  style?: ViewStyle;
  contentContainerStyle?: ViewStyle;
  keyboardVerticalOffset?: number;
  showsVerticalScrollIndicator?: boolean;
}

export function ScrollableInputView({
  children,
  style,
  contentContainerStyle,
  keyboardVerticalOffset,
  showsVerticalScrollIndicator = false,
  ...props // Capture rest
}: ScrollableInputViewProps) {
  const insets = useSafeAreaInsets();

  const defaultOffset = Platform.OS === 'ios' ? insets.top || 16 : 0;
  const behavior = Platform.OS === 'ios' ? 'padding' : undefined;

  return (
    <KeyboardAvoidingView
      style={[{ flex: 1 }, style]}
      behavior={behavior}
      enabled={Platform.OS === 'ios'}
      keyboardVerticalOffset={keyboardVerticalOffset ?? defaultOffset}
    >
      <ScrollView
        contentContainerStyle={contentContainerStyle}
        showsVerticalScrollIndicator={showsVerticalScrollIndicator}
        keyboardShouldPersistTaps="handled"
        bounces={false}
        scrollEventThrottle={16}
        automaticallyAdjustKeyboardInsets={Platform.OS === 'ios'}
        {...props} // Pass rest
      >
        {children}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
