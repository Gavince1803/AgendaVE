import React from 'react';
import {
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    ViewStyle,
} from 'react-native';

interface ScrollableInputViewProps {
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
  keyboardVerticalOffset = Platform.OS === 'ios' ? 0 : 20,
  showsVerticalScrollIndicator = false,
}: ScrollableInputViewProps) {
  return (
    <KeyboardAvoidingView 
      style={[{ flex: 1 }, style]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={keyboardVerticalOffset}
    >
      <ScrollView 
        contentContainerStyle={contentContainerStyle}
        showsVerticalScrollIndicator={showsVerticalScrollIndicator}
        keyboardShouldPersistTaps="handled"
        bounces={false}
        scrollEventThrottle={16}
        automaticallyAdjustKeyboardInsets={Platform.OS === 'ios'}
      >
        {children}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
