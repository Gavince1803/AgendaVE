import { createContext, useContext, useMemo } from 'react';

import {
  Colors,
  ComponentColors,
  DesignTokens,
  Gradients,
} from '@/constants/Colors';

type ThemeMode = 'light';

export interface Theme {
  mode: ThemeMode;
  colors: typeof Colors.light;
  tokens: typeof DesignTokens;
  components: typeof ComponentColors;
  gradients: typeof Gradients;
}

const ThemeContext = createContext<Theme>({
  mode: 'light',
  colors: Colors.light,
  tokens: DesignTokens,
  components: ComponentColors,
  gradients: Gradients,
});

interface DesignSystemProviderProps {
  mode?: ThemeMode;
  children: React.ReactNode;
}

export function DesignSystemProvider({
  mode = 'light',
  children,
}: DesignSystemProviderProps) {
  const value = useMemo<Theme>(() => {
    switch (mode) {
      case 'light':
      default:
        return {
          mode: 'light',
          colors: Colors.light,
          tokens: DesignTokens,
          components: ComponentColors,
          gradients: Gradients,
        };
    }
  }, [mode]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): Theme {
  return useContext(ThemeContext);
}
