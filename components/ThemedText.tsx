import { Text, TextProps, TextStyle } from 'react-native';

import { useTheme } from '@/theme';

interface ThemedTextProps extends TextProps {
  type?: 'title' | 'subtitle' | 'defaultSemiBold' | 'default' | 'link';
}

const typeStyles: Record<string, TextStyle> = {
  title: {
    fontSize: 24,
    fontWeight: '600' as any,
    lineHeight: 32,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '500' as any,
    lineHeight: 24,
  },
  defaultSemiBold: {
    fontSize: 16,
    fontWeight: '600' as any,
    lineHeight: 22,
  },
  default: {
    fontSize: 16,
    fontWeight: '400' as any,
    lineHeight: 22,
  },
  link: {
    fontSize: 16,
    fontWeight: '500' as any,
    lineHeight: 22,
  },
};

export function ThemedText({ style, type = 'default', ...props }: ThemedTextProps) {
  const { colors } = useTheme();
  const typeStyle = typeStyles[type] || typeStyles.default;
  const defaultColor = type === 'link' ? colors.primary : colors.text;
  
  return (
    <Text 
      style={[
        { color: defaultColor },
        typeStyle,
        style
      ]} 
      {...props} 
    />
  );
}
