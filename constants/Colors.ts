/**
 * AgendaVE - World-Class Design System
 * Inspired by Apple, Spotify, Booksy, and premium app designs
 * 
 * Design Philosophy:
 * - Sophisticated modern aesthetic like Apple's Human Interface Guidelines
 * - Warm trust-building colors like Booksy's beauty-focused palette
 * - Bold confidence like Spotify's brand personality
 * - Perfect contrast ratios for WCAG AAA accessibility
 * - Psychological color theory for booking confidence
 */

// ===== PREMIUM BRAND COLORS =====
// Sophisticated deep blue - trust, professionalism (Apple-inspired)
// Sophisticated Cherry Red - passion, energy, premium (User requested)
const primary = {
  50: '#fff0f3',
  100: '#ffe3e8',
  200: '#ffcbd6',
  300: '#ff97ae',
  400: '#ff5c7e',
  500: '#d2042d', // Cherry Red - vibrant and premium
  600: '#b00222',
  700: '#8c021b',
  800: '#750519',
  900: '#630818',
  950: '#38020a',
};

// Warm coral - energy, beauty, femininity (Booksy-inspired)
const secondary = {
  50: '#fff7f5',
  100: '#ffeee8',
  200: '#ffd6c4',
  300: '#ffb896',
  400: '#ff8f5f',
  500: '#ff6b35', // Warm coral - inviting and energetic
  600: '#f04f1f',
  700: '#d13a16',
  800: '#ad2f17',
  900: '#8c2a18',
  950: '#4c1309',
};

// Sophisticated purple - luxury, premium services (inspired by premium beauty apps)
const accent = {
  50: '#faf7ff',
  100: '#f3edff',
  200: '#e9ddff',
  300: '#d7c1ff',
  400: '#bb96ff',
  500: '#9b5eff', // Rich purple - luxury and sophistication
  600: '#8b3dff',
  700: '#7c2ae8',
  800: '#6921c4',
  900: '#571ca1',
  950: '#36106e',
};

// ===== SOPHISTICATED NEUTRAL SCALE =====
// Warm-tinted grays for modern, premium feel (Apple/Spotify-inspired)
const gray = {
  50: '#fafbfc',
  100: '#f2f4f7',
  200: '#e5e9ed',
  300: '#d1d8e0',
  400: '#9ca3af',
  500: '#6b7280',
  600: '#4b5563',
  700: '#374151',
  800: '#1f2937',
  900: '#111827',
  950: '#0a0e17',
};

// ===== PREMIUM WELLNESS & BEAUTY PALETTE =====
// Inspired by high-end beauty and wellness brands
const wellness = {
  // Sophisticated sage green - natural, calming, premium
  sage: {
    50: '#f6f8f6',
    100: '#e9f1e9',
    200: '#d4e3d4',
    300: '#b0cdb0',
    400: '#87b087',
    500: '#5e935e', // Premium sage - natural luxury
    600: '#4a7a4a',
    700: '#3e6b3e',
    800: '#345934',
    900: '#2c4a2c',
  },
  // Warm rose gold - feminine, luxury, beauty
  rosegold: {
    50: '#fef9f6',
    100: '#fef1e7',
    200: '#fce0ca',
    300: '#f9c8a2',
    400: '#f5a673',
    500: '#f28b4f', // Premium rose gold
    600: '#e36b32',
    700: '#c15428',
    800: '#9a4423',
    900: '#7d3a21',
  },
  // Deep emerald - trust, growth, wellness
  emerald: {
    50: '#ecfef5',
    100: '#d3fce8',
    200: '#a9f7d4',
    300: '#70efbd',
    400: '#36e0a1',
    500: '#10cc88', // Premium emerald
    600: '#05a56e',
    700: '#09855a',
    800: '#0d6a4a',
    900: '#0f573e',
    950: '#063829',
  },
};

// ===== PREMIUM SEMANTIC COLORS =====
// Optimized for accessibility and modern aesthetics
const semantic = {
  success: {
    50: '#f0fdf5',
    100: '#dcfce8',
    200: '#bbf7d0',
    300: '#86efac',
    400: '#4ade80',
    500: '#10b981', // Premium success green
    600: '#059669',
    700: '#047857',
    800: '#065f46',
    900: '#064e3b',
    950: '#022c22',
  },
  warning: {
    50: '#fffbeb',
    100: '#fef3c7',
    200: '#fde68a',
    300: '#fcd34d',
    400: '#fbbf24',
    500: '#f59e0b', // Premium amber warning
    600: '#d97706',
    700: '#b45309',
    800: '#92400e',
    900: '#78350f',
    950: '#451a03',
  },
  error: {
    50: '#fef2f2',
    100: '#fee2e2',
    200: '#fecaca',
    300: '#fca5a5',
    400: '#f87171',
    500: '#ef4444', // Clear, accessible red
    600: '#dc2626',
    700: '#b91c1c',
    800: '#991b1b',
    900: '#7f1d1d',
    950: '#431313',
  },
  info: {
    50: '#f0f8ff',
    100: '#e0f0fe',
    200: '#b8e2fd',
    300: '#7cc8fb',
    400: '#36aaf7',
    500: '#0c8ce8', // Matches primary for consistency
    600: '#0070d6',
    700: '#005bb5',
    800: '#004a96',
    900: '#003d7a',
    950: '#001f3a',
  },
};

// ===== SISTEMA DE COLORES EXPORTADO =====
export const Colors = {
  light: {
    // Premium brand colors
    primary: primary[500], // #d2042d - Cherry Red
    primaryLight: primary[400],
    primaryDark: primary[600],
    primaryBg: primary[50],

    secondary: secondary[500], // #ff6b35 - Warm inviting coral
    secondaryLight: secondary[400],
    secondaryDark: secondary[600],
    secondaryBg: secondary[50],

    accent: accent[500], // #9b5eff - Sophisticated luxury purple
    accentLight: accent[400],
    accentDark: accent[600],
    accentBg: accent[50],

    // Modern surface system
    background: '#ffffff', // Clean white backdrop
    surface: '#ffffff', // Cards pop over tinted canvas
    surfaceVariant: '#f8f9fc', // Secondary cards / inputs - LIGHTER GREY
    surfaceContainer: '#e7ebf3', // Elevated containers and highlights

    // Sophisticated text hierarchy
    text: gray[900], // #111827 - Rich, readable black
    textSecondary: gray[600], // #4b5563 - Perfect secondary contrast
    textTertiary: gray[500], // #6b7280 - Subtle tertiary text
    textOnPrimary: '#ffffff',
    textOnSecondary: gray[900],

    // Premium border system
    border: gray[200], // #e5e9ed - Subtle, modern borders
    borderLight: gray[100], // #f2f4f7 - Light dividers
    borderMedium: gray[300], // #d1d8e0 - Medium emphasis
    borderStrong: gray[400], // #9ca3af - Strong definition

    // Enhanced semantic colors
    success: semantic.success[500], // #10b981 - Premium success green
    successLight: semantic.success[400],
    successDark: semantic.success[600],
    successBg: semantic.success[50],

    warning: semantic.warning[500], // #f59e0b - Clear amber warning
    warningLight: semantic.warning[400],
    warningDark: semantic.warning[600],
    warningBg: semantic.warning[50],

    error: semantic.error[500], // #ef4444 - Accessible error red
    errorLight: semantic.error[400],
    errorDark: semantic.error[600],
    errorBg: semantic.error[50],

    info: semantic.info[500], // #0c8ce8 - Consistent with primary
    infoLight: semantic.info[400],
    infoDark: semantic.info[600],
    infoBg: semantic.info[50],

    // Premium component colors
    tint: primary[500], // #d2042d
    icon: gray[500], // #6b7280 - Perfect icon color
    iconSecondary: gray[400], // #9ca3af - Subtle icons
    tabIconDefault: gray[400], // Inactive tabs
    tabIconSelected: primary[500], // Active tab highlight

    // Modern shadow system (warmer, softer)
    shadow: 'rgba(17, 24, 39, 0.06)', // Subtle depth
    shadowMedium: 'rgba(17, 24, 39, 0.10)', // Card elevation
    shadowStrong: 'rgba(17, 24, 39, 0.15)', // Modal/popup shadows
    shadowColored: 'rgba(12, 140, 232, 0.12)', // Primary colored shadow
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
  // Tipografía
  fontFamily: {
    regular: 'Outfit_400Regular',
    medium: 'Outfit_500Medium',
    semibold: 'Outfit_600SemiBold',
    bold: 'Outfit_700Bold',
  },
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

// ===== PREMIUM COMPONENT COLORS =====
export const ComponentColors = {
  // Premium button system
  button: {
    primary: primary[500], // #0c8ce8 - Trustworthy blue
    primaryPressed: primary[600],
    primaryDisabled: primary[300],
    secondary: secondary[500], // #ff6b35 - Warm coral
    secondaryPressed: secondary[600],
    secondaryDisabled: secondary[300],
    success: wellness.emerald[500], // #10cc88 - Premium emerald
    successPressed: wellness.emerald[600],
    warning: semantic.warning[500],
    warningPressed: semantic.warning[600],
    error: semantic.error[500],
    errorPressed: semantic.error[600],
  },

  // Premium card system
  card: {
    background: '#ffffff', // Clean neutral card surface
    backgroundDark: gray[900],
    border: '#e1e6f0',
    borderDark: gray[700],
    shadow: 'rgba(17, 24, 39, 0.06)', // Warm, soft shadows
    shadowDark: 'rgba(0, 0, 0, 0.25)',
  },

  // Modern surfaces
  surface: '#ffffff',
  border: '#e1e6f0',

  // Premium input system
  input: {
    background: '#ffffff',
    backgroundDark: gray[800],
    border: '#d7deeb', // Subtle neutral border
    borderDark: gray[600],
    borderFocused: primary[500], // #0c8ce8 - Premium focus state
    borderFocusedDark: primary[400],
    placeholder: gray[400], // #9ca3af - Perfect placeholder contrast
    placeholderDark: gray[500],
  },

  // Premium appointment status system
  appointment: {
    pending: secondary[500], // #ff6b35 - Warm coral for pending
    pendingBg: secondary[50],
    pendingBgDark: secondary[950],
    confirmed: wellness.emerald[500], // #10cc88 - Premium emerald for confirmed
    confirmedBg: wellness.emerald[50],
    confirmedBgDark: wellness.emerald[950],
    cancelled: semantic.error[500], // #ef4444 - Clear error red
    cancelledBg: semantic.error[50],
    cancelledBgDark: semantic.error[950],
    completed: accent[500], // #9b5eff - Sophisticated purple for completed
    completedBg: accent[50],
    completedBgDark: accent[900],
  },

  // Premium badge system
  badge: {
    primary: primary[100], // Light blue backgrounds
    primaryDark: primary[900],
    secondary: secondary[100], // Light coral backgrounds
    secondaryDark: secondary[900],
    success: wellness.emerald[100], // Light emerald
    successDark: wellness.emerald[900],
    warning: semantic.warning[100],
    warningDark: semantic.warning[900],
    error: semantic.error[100],
    errorDark: semantic.error[900],
  },
};

// ===== WORLD-CLASS GRADIENTS =====
// Inspired by Apple, Spotify, and premium design systems
export const Gradients = {
  // Premium brand gradients
  primary: [primary[500], primary[600]], // #d2042d to #b00222 - Passion & Energy
  secondary: [secondary[400], secondary[600]], // Warm coral gradient
  accent: [accent[400], accent[600]], // Sophisticated purple gradient

  // Premium wellness & beauty combinations
  oceanSage: [primary[400], wellness.sage[500]], // Blue to sage - calming trust
  coralGold: [secondary[400], wellness.rosegold[500]], // Coral to rose gold - beauty & warmth
  luxuryPurple: [accent[400], accent[600]], // Purple gradient - luxury & sophistication
  emeraldBreeze: [wellness.emerald[400], primary[400]], // Emerald to blue - growth & trust

  // Modern semantic gradients
  success: [wellness.emerald[400], wellness.emerald[600]], // Premium emerald success
  warning: [semantic.warning[400], semantic.warning[600]],
  error: [semantic.error[400], semantic.error[600]],
  info: [primary[400], primary[600]], // Consistent with brand

  // Sophisticated background gradients
  lightBlue: [primary[50], primary[100]], // #f0f8ff to #e0f0fe
  lightCoral: [secondary[50], secondary[100]], // Warm coral tints
  lightPurple: [accent[50], accent[100]], // Luxury purple tints
  lightSage: [wellness.sage[50], wellness.sage[100]], // Natural sage tints
  lightEmerald: [wellness.emerald[50], wellness.emerald[100]], // Premium emerald tints

  // Premium appointment status gradients
  pending: [secondary[50], secondary[100]], // Warm coral pending
  confirmed: [wellness.emerald[50], wellness.emerald[100]], // Premium emerald confirmed
  cancelled: [semantic.error[50], semantic.error[100]], // Clear error gradient
  completed: [accent[50], accent[100]], // Sophisticated purple completed

  // Hero section gradients (for premium landing areas)
  heroBlue: [primary[500], primary[700]], // Strong brand presence
  heroWarmth: [secondary[400], wellness.rosegold[500]], // Inviting warmth
  heroLuxury: [accent[400], accent[700]], // Premium luxury feel
};
