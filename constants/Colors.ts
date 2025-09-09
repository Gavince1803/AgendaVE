/**
 * AgendaVE - Modern Color System
 * Diseño optimizado para móviles con colores que reflejan la identidad venezolana
 */

// Colores principales - Inspirados en la bandera venezolana
const primary = '#2563eb'; // Azul moderno
const primaryDark = '#1d4ed8';
const secondary = '#f59e0b'; // Amarillo dorado
const accent = '#ef4444'; // Rojo vibrante

// Colores neutros modernos
const gray50 = '#f9fafb';
const gray100 = '#f3f4f6';
const gray200 = '#e5e7eb';
const gray300 = '#d1d5db';
const gray400 = '#9ca3af';
const gray500 = '#6b7280';
const gray600 = '#4b5563';
const gray700 = '#374151';
const gray800 = '#1f2937';
const gray900 = '#111827';

// Estados
const success = '#10b981';
const warning = '#f59e0b';
const error = '#ef4444';
const info = '#3b82f6';

export const Colors = {
  light: {
    // Colores principales
    primary,
    primaryDark,
    secondary,
    accent,
    
    // Fondo y superficie
    background: '#ffffff',
    surface: gray50,
    surfaceVariant: gray100,
    
    // Texto
    text: gray900,
    textSecondary: gray600,
    textTertiary: gray500,
    
    // Bordes y divisores
    border: gray200,
    borderLight: gray100,
    
    // Estados
    success,
    warning,
    error,
    info,
    
    // Componentes específicos
    tint: primary,
    icon: gray500,
    tabIconDefault: gray400,
    tabIconSelected: primary,
    
    // Sombras
    shadow: 'rgba(0, 0, 0, 0.1)',
    shadowDark: 'rgba(0, 0, 0, 0.2)',
  },
  dark: {
    // Colores principales (ajustados para modo oscuro)
    primary: '#3b82f6',
    primaryDark: '#2563eb',
    secondary: '#fbbf24',
    accent: '#f87171',
    
    // Fondo y superficie
    background: gray900,
    surface: gray800,
    surfaceVariant: gray700,
    
    // Texto
    text: gray100,
    textSecondary: gray300,
    textTertiary: gray400,
    
    // Bordes y divisores
    border: gray600,
    borderLight: gray700,
    
    // Estados
    success: '#34d399',
    warning: '#fbbf24',
    error: '#f87171',
    info: '#60a5fa',
    
    // Componentes específicos
    tint: '#60a5fa',
    icon: gray400,
    tabIconDefault: gray500,
    tabIconSelected: '#60a5fa',
    
    // Sombras
    shadow: 'rgba(0, 0, 0, 0.3)',
    shadowDark: 'rgba(0, 0, 0, 0.5)',
  },
};

// Colores adicionales para componentes específicos
export const ComponentColors = {
  // Botones
  button: {
    primary: primary,
    primaryPressed: primaryDark,
    secondary: gray200,
    secondaryPressed: gray300,
    success: success,
    warning: warning,
    error: error,
  },
  
  // Cards y contenedores
  card: {
    background: '#ffffff',
    border: gray200,
    shadow: 'rgba(0, 0, 0, 0.1)',
  },
  
  // Inputs
  input: {
    background: '#ffffff',
    border: gray300,
    borderFocused: primary,
    placeholder: gray400,
  },
  
  // Estados de citas
  appointment: {
    pending: warning,
    confirmed: success,
    cancelled: error,
    completed: gray500,
  },
};
