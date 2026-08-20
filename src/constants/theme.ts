/**
 * @description Design System tokens for FitPro.
 * Centralizes colors, spacing, and typography to ensure consistency and premium feel.
 */
export const COLORS = {
  // Brand Colors
  primary: '#008E00', // Success / Primary Action
  secondary: '#191511', // Dark / Neutral
  accent: '#F59E0B', // Warning / Streaks
  premium: '#8B5CF6', // Special/premium highlights (ex: badge "Peso Pesado")

  // Neutral Colors
  background: '#FAFAFA',
  white: '#FFFFFF',
  gray100: '#F3F4F6',
  gray200: '#E5E7EB',
  gray400: '#9CA3AF',
  gray500: '#6B7280',
  gray800: '#1F2937',

  // Status Colors
  error: '#EF4444',
  info: '#3B82F6',
  successLight: '#F0FDF4',
  warningLight: 'rgba(245, 158, 11, 0.15)',
  eventBg: '#FFFBEB', // Fundo da tag "Evento Especial" (badges sazonais)
  eventBorder: '#FCD34D',
  eventText: '#D97706',

  // Opacity variants
  whiteOpacity10: 'rgba(255, 255, 255, 0.1)',
  whiteOpacity20: 'rgba(255, 255, 255, 0.2)',
  blackOpacity10: 'rgba(0, 0, 0, 0.1)',
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  huge: 32,
};

export const TYPOGRAPHY = {
  h1: {
    fontSize: 24,
    fontWeight: '800' as const,
    letterSpacing: -0.5,
  },
  h2: {
    fontSize: 22,
    fontWeight: '800' as const,
    letterSpacing: -0.5,
  },
  h3: {
    fontSize: 18,
    fontWeight: '800' as const,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '700' as const,
  },
  body: {
    fontSize: 14,
    fontWeight: '500' as const,
  },
  caption: {
    fontSize: 12,
    fontWeight: '600' as const,
  },
  tiny: {
    fontSize: 10,
    fontWeight: '700' as const,
    textTransform: 'uppercase' as const,
  },
};

export const SHADOWS = {
  default: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  soft: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
};
