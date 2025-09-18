import { Colors } from '@/constants/Colors';
import { Text, TextProps } from 'react-native';

export function ThemedText({ style, ...props }: TextProps) {
  return (
    <Text 
      style={[
        { color: Colors.light.text },
        style
      ]} 
      {...props} 
    />
  );
}