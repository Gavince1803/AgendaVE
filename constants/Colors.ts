/**
 * AgendaVE - Modern Design System
 * Sistema de diseño moderno y accesible para aplicaciones móviles
 * Inspirado en la identidad venezolana con enfoque en UX/UI contemporáneo
 */

// ===== COLORES PRINCIPALES =====
// Paleta principal inspirada en la bandera venezolana con toques modernos
const primary = {
  50: '#eff6ff',
  100: '#dbeafe', 
  200: '#bfdbfe',
  300: '#93c5fd',
  400: '#60a5fa',
  500: '#3b82f6', // Color principal
  600: '#2563eb',
  700: '#1d4ed8',
  800: '#1e40af',
  900: '#1e3a8a',
  950: '#172554',
};

const secondary = {
  50: '#fffbeb',
  100: '#fef3c7',
  200: '#fde68a',
  300: '#fcd34d',
  400: '#fbbf24',
  500: '#f59e0b', // Color secundario
  600: '#d97706',
  700: '#b45309',
  800: '#92400e',
  900: '#78350f',
  950: '#451a03',
};

const accent = {
  50: '#fef2f2',
  100: '#fee2e2',
  200: '#fecaca',
  300: '#fca5a5',
  400: '#f87171',
  500: '#ef4444', // Color de acento
  600: '#dc2626',
  700: '#b91c1c',
  800: '#991b1b',
  900: '#7f1d1d',
  950: '#450a0a',
};

// ===== ESCALA DE GRISES MODERNA =====
const gray = {
  50: '#f8fafc',
  100: '#f1f5f9',
  200: '#e2e8f0',
  300: '#cbd5e1',
  400: '#94a3b8',
  500: '#64748b',
  600: '#475569',
  700: '#334155',
  800: '#1e293b',
  900: '#0f172a',
  950: '#020617',
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
    textSecondary: gray[300],
    textTertiary: gray[400],
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
  
  // Tipografía
  typography: {
    fontSizes: {
      xs: 12,
      sm: 14,
      base: 16,
      lg: 18,
      xl: 20,
      '2xl': 24,
      '3xl': 28,
      '4xl': 32,
      '5xl': 36,
      '6xl': 48,
    },
    fontWeights: {
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
      extrabold: '800',
    },
    lineHeights: {
      tight: 1.2,
      normal: 1.4,
      relaxed: 1.6,
      loose: 1.8,
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

// ===== GRADIENTES =====
export const Gradients = {
  primary: ['#3b82f6', '#2563eb'],
  secondary: ['#f59e0b', '#d97706'],
  accent: ['#ef4444', '#dc2626'],
  success: ['#22c55e', '#16a34a'],
  sunset: ['#f59e0b', '#ef4444'],
  ocean: ['#3b82f6', '#06b6d4'],
  forest: ['#22c55e', '#10b981'],
  purple: ['#8b5cf6', '#7c3aed'],
};
