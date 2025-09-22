/**
 * AgendaVE - Premium Wellness & Beauty Design System
 * Sistema de diseño premium para aplicaciones de reservas de servicios
 * Inspirado en la elegancia y profesionalismo del sector wellness
 * 
 * Design Philosophy:
 * - Premium yet approachable aesthetic
 * - High contrast for accessibility
 * - Warm and trustworthy feel
 * - Modern gradients and sophisticated color transitions
 */

// ===== COLORES PRINCIPALES =====
// Paleta premium inspirada en wellness y belleza profesional
const primary = {
  50: '#f0f9ff',
  100: '#e0f2fe', 
  200: '#bae6fd',
  300: '#7dd3fc',
  400: '#38bdf8',
  500: '#0ea5e9', // Azul profesional confiable
  600: '#0284c7',
  700: '#0369a1',
  800: '#075985',
  900: '#0c4a6e',
  950: '#082f49',
};

const secondary = {
  50: '#fefce8',
  100: '#fef9c3',
  200: '#fef08a',
  300: '#fde047',
  400: '#facc15',
  500: '#eab308', // Dorado elegante para highlights
  600: '#ca8a04',
  700: '#a16207',
  800: '#854d0e',
  900: '#713f12',
  950: '#422006',
};

const accent = {
  50: '#fdf2f8',
  100: '#fce7f3',
  200: '#fbcfe8',
  300: '#f9a8d4',
  400: '#f472b6',
  500: '#ec4899', // Rosa elegante para acciones especiales
  600: '#db2777',
  700: '#be185d',
  800: '#9d174d',
  900: '#831843',
  950: '#500724',
};

// ===== ESCALA DE GRISES PREMIUM =====
const gray = {
  50: '#fafafa',
  100: '#f4f4f5',
  200: '#e4e4e7',
  300: '#d4d4d8',
  400: '#a1a1aa',
  500: '#71717a',
  600: '#52525b',
  700: '#3f3f46',
  800: '#27272a',
  900: '#18181b',
  950: '#09090b',
};

// ===== COLORES WELLNESS & BEAUTY =====
const wellness = {
  // Verde natural y relajante
  mint: {
    50: '#f0fdfa',
    100: '#ccfbf1',
    200: '#99f6e4',
    300: '#5eead4',
    400: '#2dd4bf',
    500: '#14b8a6',
    600: '#0d9488',
    700: '#0f766e',
    800: '#115e59',
    900: '#134e4a',
  },
  // Púrpura elegante y sofisticado
  lavender: {
    50: '#faf5ff',
    100: '#f3e8ff',
    200: '#e9d5ff',
    300: '#d8b4fe',
    400: '#c084fc',
    500: '#a855f7',
    600: '#9333ea',
    700: '#7c3aed',
    800: '#6b21a8',
    900: '#581c87',
  },
  // Rosa suave y femenino
  blush: {
    50: '#fdf2f8',
    100: '#fce7f3',
    200: '#fbcfe8',
    300: '#f9a8d4',
    400: '#f472b6',
    500: '#ec4899',
    600: '#db2777',
    700: '#be185d',
    800: '#9d174d',
    900: '#831843',
  },
};

// ===== COLORES SEMÁNTICOS =====
const semantic = {
  success: {
    50: '#f0fdf4',
    100: '#dcfce7',
    200: '#bbf7d0',
    300: '#86efac',
    400: '#4ade80',
    500: '#22c55e',
    600: '#16a34a',
    700: '#15803d',
    800: '#166534',
    900: '#14532d',
  },
  warning: {
    50: '#fffbeb',
    100: '#fef3c7',
    200: '#fde68a',
    300: '#fcd34d',
    400: '#fbbf24',
    500: '#f59e0b',
    600: '#d97706',
    700: '#b45309',
    800: '#92400e',
    900: '#78350f',
  },
  error: {
    50: '#fef2f2',
    100: '#fee2e2',
    200: '#fecaca',
    300: '#fca5a5',
    400: '#f87171',
    500: '#ef4444',
    600: '#dc2626',
    700: '#b91c1c',
    800: '#991b1b',
    900: '#7f1d1d',
  },
  info: {
    50: '#eff6ff',
    100: '#dbeafe',
    200: '#bfdbfe',
    300: '#93c5fd',
    400: '#60a5fa',
    500: '#3b82f6',
    600: '#2563eb',
    700: '#1d4ed8',
    800: '#1e40af',
    900: '#1e3a8a',
  },
};

// ===== SISTEMA DE COLORES EXPORTADO =====
export const Colors = {
  light: {
    // Colores principales
    primary: primary[500],
    primaryLight: primary[400],
    primaryDark: primary[600],
    primaryBg: primary[50],
    
    secondary: secondary[500],
    secondaryLight: secondary[400],
    secondaryDark: secondary[600],
    secondaryBg: secondary[50],
    
    accent: accent[500],
    accentLight: accent[400],
    accentDark: accent[600],
    accentBg: accent[50],
    
    // Fondo y superficie
    background: '#ffffff',
    surface: gray[50],
    surfaceVariant: gray[100],
    surfaceContainer: gray[200],
    
    // Texto
    text: gray[900],
    textSecondary: gray[600],
    textTertiary: gray[500],
    textOnPrimary: '#ffffff',
    textOnSecondary: gray[900],
    
    // Bordes y divisores
    border: gray[200],
    borderLight: gray[100],
    borderMedium: gray[300],
    borderStrong: gray[400],
    
    // Estados semánticos
    success: semantic.success[500],
    successLight: semantic.success[400],
    successDark: semantic.success[600],
    successBg: semantic.success[50],
    
    warning: semantic.warning[500],
    warningLight: semantic.warning[400],
    warningDark: semantic.warning[600],
    warningBg: semantic.warning[50],
    
    error: semantic.error[500],
    errorLight: semantic.error[400],
    errorDark: semantic.error[600],
    errorBg: semantic.error[50],
    
    info: semantic.info[500],
    infoLight: semantic.info[400],
    infoDark: semantic.info[600],
    infoBg: semantic.info[50],
    
    // Componentes específicos
    tint: primary[500],
    icon: gray[500],
    iconSecondary: gray[400],
    tabIconDefault: gray[400],
    tabIconSelected: primary[500],
    
    // Sombras y elevación
    shadow: 'rgba(15, 23, 42, 0.08)',
    shadowMedium: 'rgba(15, 23, 42, 0.12)',
    shadowStrong: 'rgba(15, 23, 42, 0.16)',
    shadowColored: 'rgba(59, 130, 246, 0.15)',
  },
  dark: {
    // Colores principales (ajustados para modo oscuro)
    primary: primary[400],
    primaryLight: primary[300],
    primaryDark: primary[500],
    primaryBg: primary[950],
    
    secondary: secondary[400],
    secondaryLight: secondary[300],
    secondaryDark: secondary[500],
    secondaryBg: secondary[950],
    
    accent: accent[400],
    accentLight: accent[300],
    accentDark: accent[500],
    accentBg: accent[950],
    
    // Fondo y superficie
    background: gray[950],
    surface: gray[900],
    surfaceVariant: gray[800],
    surfaceContainer: gray[700],
    
    // Texto
    text: gray[50],
    textSecondary: gray[200],
    textTertiary: gray[300],
    textOnPrimary: gray[900],
    textOnSecondary: gray[50],
    
    // Bordes y divisores
    border: gray[700],
    borderLight: gray[800],
    borderMedium: gray[600],
    borderStrong: gray[500],
    
    // Estados semánticos
    success: semantic.success[400],
    successLight: semantic.success[300],
    successDark: semantic.success[500],
    successBg: semantic.success[950],
    
    warning: semantic.warning[400],
    warningLight: semantic.warning[300],
    warningDark: semantic.warning[500],
    warningBg: semantic.warning[950],
    
    error: semantic.error[400],
    errorLight: semantic.error[300],
    errorDark: semantic.error[500],
    errorBg: semantic.error[950],
    
    info: semantic.info[400],
    infoLight: semantic.info[300],
    infoDark: semantic.info[500],
    infoBg: semantic.info[950],
    
    // Componentes específicos
    tint: primary[400],
    icon: gray[400],
    iconSecondary: gray[500],
    tabIconDefault: gray[500],
    tabIconSelected: primary[400],
    
    // Sombras y elevación
    shadow: 'rgba(0, 0, 0, 0.3)',
    shadowMedium: 'rgba(0, 0, 0, 0.4)',
    shadowStrong: 'rgba(0, 0, 0, 0.5)',
    shadowColored: 'rgba(59, 130, 246, 0.25)',
  },
};

// ===== TOKENS DE DISEÑO =====
export const DesignTokens = {
  // Espaciado (basado en múltiplos de 4px)
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    '2xl': 24,
    '3xl': 32,
    '4xl': 40,
    '5xl': 48,
    '6xl': 64,
  },
  
  // Border radius
  radius: {
    none: 0,
    xs: 4,
    sm: 6,
    md: 8,
    lg: 12,
    xl: 16,
    '2xl': 20,
    '3xl': 24,
    full: 9999,
  },
  
  // Tipografía Premium
  typography: {
    fontSizes: {
      xs: 11,
      sm: 13,
      base: 15,
      md: 16,
      lg: 18,
      xl: 20,
      '2xl': 22,
      '3xl': 26,
      '4xl': 30,
      '5xl': 36,
      '6xl': 42,
      '7xl': 48,
      '8xl': 56,
      '9xl': 64,
    },
    fontWeights: {
      light: '300',
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
      extrabold: '800',
      black: '900',
    },
    lineHeights: {
      none: 1,
      tight: 1.25,
      snug: 1.375,
      normal: 1.5,
      relaxed: 1.625,
      loose: 2,
    },
    letterSpacing: {
      tighter: '-0.05em',
      tight: '-0.025em',
      normal: '0em',
      wide: '0.025em',
      wider: '0.05em',
      widest: '0.1em',
    },
    // Escalas tipográficas semánticas
    scales: {
      display: {
        fontSize: 48,
        lineHeight: 1.2,
        fontWeight: '700',
        letterSpacing: '-0.025em',
      },
      heading: {
        h1: { fontSize: 36, lineHeight: 1.25, fontWeight: '700', letterSpacing: '-0.025em' },
        h2: { fontSize: 30, lineHeight: 1.3, fontWeight: '600', letterSpacing: '-0.025em' },
        h3: { fontSize: 26, lineHeight: 1.35, fontWeight: '600', letterSpacing: '0em' },
        h4: { fontSize: 22, lineHeight: 1.4, fontWeight: '600', letterSpacing: '0em' },
        h5: { fontSize: 18, lineHeight: 1.45, fontWeight: '600', letterSpacing: '0em' },
        h6: { fontSize: 16, lineHeight: 1.5, fontWeight: '600', letterSpacing: '0em' },
      },
      body: {
        large: { fontSize: 18, lineHeight: 1.6, fontWeight: '400', letterSpacing: '0em' },
        base: { fontSize: 16, lineHeight: 1.625, fontWeight: '400', letterSpacing: '0em' },
        small: { fontSize: 14, lineHeight: 1.5, fontWeight: '400', letterSpacing: '0em' },
        xs: { fontSize: 12, lineHeight: 1.45, fontWeight: '400', letterSpacing: '0.025em' },
      },
      caption: {
        fontSize: 12,
        lineHeight: 1.4,
        fontWeight: '500',
        letterSpacing: '0.05em',
        textTransform: 'uppercase' as const,
      },
      button: {
        large: { fontSize: 16, fontWeight: '600', letterSpacing: '0.025em' },
        medium: { fontSize: 15, fontWeight: '600', letterSpacing: '0.025em' },
        small: { fontSize: 14, fontWeight: '600', letterSpacing: '0.025em' },
      },
    },
  },
  
  // Elevación y sombras
  elevation: {
    none: {
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0,
      shadowRadius: 0,
      elevation: 0,
    },
    sm: {
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 1,
    },
    md: {
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
    lg: {
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
      elevation: 4,
    },
    xl: {
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.2,
      shadowRadius: 16,
      elevation: 8,
    },
  },
  
  // Transiciones
  transitions: {
    fast: 150,
    normal: 250,
    slow: 350,
  },
};

// ===== COLORES DE COMPONENTES =====
export const ComponentColors = {
  // Botones
  button: {
    primary: primary[500],
    primaryPressed: primary[600],
    primaryDisabled: primary[300],
    secondary: gray[200],
    secondaryPressed: gray[300],
    secondaryDisabled: gray[100],
    success: semantic.success[500],
    successPressed: semantic.success[600],
    warning: semantic.warning[500],
    warningPressed: semantic.warning[600],
    error: semantic.error[500],
    errorPressed: semantic.error[600],
  },
  
  // Cards y contenedores
  card: {
    background: '#ffffff',
    backgroundDark: gray[900],
    border: gray[200],
    borderDark: gray[700],
    shadow: 'rgba(15, 23, 42, 0.08)',
    shadowDark: 'rgba(0, 0, 0, 0.3)',
  },
  
  // Surface colors
  surface: '#ffffff',
  border: gray[200],
  
  // Inputs
  input: {
    background: '#ffffff',
    backgroundDark: gray[800],
    border: gray[300],
    borderDark: gray[600],
    borderFocused: primary[500],
    borderFocusedDark: primary[400],
    placeholder: gray[400],
    placeholderDark: gray[500],
  },
  
  // Estados de citas
  appointment: {
    pending: semantic.warning[500],
    pendingBg: semantic.warning[50],
    pendingBgDark: semantic.warning[950],
    confirmed: semantic.success[500],
    confirmedBg: semantic.success[50],
    confirmedBgDark: semantic.success[950],
    cancelled: semantic.error[500],
    cancelledBg: semantic.error[50],
    cancelledBgDark: semantic.error[950],
    completed: gray[500],
    completedBg: gray[50],
    completedBgDark: gray[800],
  },
  
  // Badges y etiquetas
  badge: {
    primary: primary[100],
    primaryDark: primary[900],
    secondary: gray[100],
    secondaryDark: gray[800],
    success: semantic.success[100],
    successDark: semantic.success[900],
    warning: semantic.warning[100],
    warningDark: semantic.warning[900],
    error: semantic.error[100],
    errorDark: semantic.error[900],
  },
};

// ===== GRADIENTES PREMIUM =====
export const Gradients = {
  // Gradientes principales
  primary: ['#0ea5e9', '#0284c7'],
  secondary: ['#eab308', '#ca8a04'],
  accent: ['#ec4899', '#db2777'],
  
  // Gradientes wellness & beauty
  oceanBreeze: ['#0ea5e9', '#14b8a6'], // Azul a mint
  goldenHour: ['#eab308', '#f97316'], // Dorado a naranja
  blooming: ['#ec4899', '#a855f7'], // Rosa a lavanda
  serenity: ['#14b8a6', '#a855f7'], // Mint a lavanda
  
  // Gradientes semánticos
  success: ['#22c55e', '#16a34a'],
  warning: ['#eab308', '#f59e0b'],
  error: ['#ef4444', '#dc2626'],
  
  // Gradientes sutiles para fondos
  lightBlue: ['#f0f9ff', '#e0f2fe'],
  lightGold: ['#fefce8', '#fef9c3'],
  lightPink: ['#fdf2f8', '#fce7f3'],
  lightMint: ['#f0fdfa', '#ccfbf1'],
  lightLavender: ['#faf5ff', '#f3e8ff'],
  
  // Gradientes para estados
  pending: ['#fefce8', '#fef3c7'],
  confirmed: ['#f0fdf4', '#dcfce7'],
  cancelled: ['#fef2f2', '#fee2e2'],
  completed: ['#f8fafc', '#f1f5f9'],
};
