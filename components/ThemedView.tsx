import { View, type ViewProps } from 'react-native';

import { useTheme } from '@/theme';

export type ThemedViewProps = ViewProps & {
  lightColor?: string;
};

export function ThemedView({ style, lightColor, ...otherProps }: ThemedViewProps) {
  const { colors } = useTheme();
  const backgroundColor = lightColor || colors.background;

  return <View style={[{ backgroundColor }, style]} {...otherProps} />;
}
