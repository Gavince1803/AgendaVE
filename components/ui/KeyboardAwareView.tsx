import React from 'react';
import {
    Keyboard,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    TouchableWithoutFeedback,
    ViewStyle,
} from 'react-native';

interface KeyboardAwareViewProps {
  children: React.ReactNode;
  style?: ViewStyle;
  contentContainerStyle?: ViewStyle;
  keyboardVerticalOffset?: number;
  enableOnAndroid?: boolean;
  showsVerticalScrollIndicator?: boolean;
  enableTouchToDismiss?: boolean;
}

export function KeyboardAwareView({
  children,
  style,
  contentContainerStyle,
  keyboardVerticalOffset = Platform.OS === 'ios' ? 0 : 20,
  enableOnAndroid = true,
  showsVerticalScrollIndicator = false,
  enableTouchToDismiss = true,
}: KeyboardAwareViewProps) {
  const content = (
    <KeyboardAvoidingView 
      style={[{ flex: 1 }, style]}
      behavior={Platform.OS === 'ios' ? 'padding' : enableOnAndroid ? 'height' : undefined}
      keyboardVerticalOffset={keyboardVerticalOffset}
    >
      <ScrollView 
        contentContainerStyle={contentContainerStyle}
        showsVerticalScrollIndicator={showsVerticalScrollIndicator}
        keyboardShouldPersistTaps="handled"
        bounces={Platform.OS === 'ios' ? false : true}
        scrollEventThrottle={16}
        automaticallyAdjustKeyboardInsets={Platform.OS === 'ios'}
      >
        {children}
      </ScrollView>
    </KeyboardAvoidingView>
  );

  if (enableTouchToDismiss) {
    return (
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        {content}
      </TouchableWithoutFeedback>
    );
  }

  return content;
}
