export const LIGHT_COLORS = {
  // Backgrounds
  background: '#F8FAFC',
  surface: '#FFFFFF',
  surfaceSecondary: '#F1F5F9',
  surfaceElevated: '#FFFFFF',
  // Navy primary
  navy: '#0B1220',
  // Text
  text: '#111827',
  textSecondary: '#64748B',
  textTertiary: '#94A3B8',
  textInverse: '#FFFFFF',
  // Brand
  primary: '#14B8A6',
  primaryMuted: 'rgba(20,184,166,0.10)',
  primaryDark: '#0D9488',
  // Semantic
  warning: '#F59E0B',
  warningMuted: 'rgba(245,158,11,0.10)',
  danger: '#EF4444',
  dangerMuted: 'rgba(239,68,68,0.10)',
  evidence: '#22C55E',
  evidenceMuted: 'rgba(34,197,94,0.10)',
  // Structure
  border: '#E2E8F0',
  divider: 'rgba(226,232,240,0.8)',
  // Tab bar
  tabBarBackground: '#FFFFFF',
  tabBarBorder: '#E2E8F0',
  tabActive: '#14B8A6',
  tabInactive: '#94A3B8',
};

export const DARK_COLORS = {
  background: '#0B1220',
  surface: '#111827',
  surfaceSecondary: '#1E2A3A',
  surfaceElevated: '#1A2535',
  navy: '#0B1220',
  text: '#F1F5F9',
  textSecondary: '#94A3B8',
  textTertiary: '#64748B',
  textInverse: '#111827',
  primary: '#14B8A6',
  primaryMuted: 'rgba(20,184,166,0.15)',
  primaryDark: '#0D9488',
  warning: '#F59E0B',
  warningMuted: 'rgba(245,158,11,0.15)',
  danger: '#EF4444',
  dangerMuted: 'rgba(239,68,68,0.15)',
  evidence: '#22C55E',
  evidenceMuted: 'rgba(34,197,94,0.15)',
  border: 'rgba(255,255,255,0.08)',
  divider: 'rgba(255,255,255,0.05)',
  tabBarBackground: '#111827',
  tabBarBorder: 'rgba(255,255,255,0.08)',
  tabActive: '#14B8A6',
  tabInactive: '#64748B',
};

export const TYPOGRAPHY = {
  display: { fontSize: 30, fontWeight: '700' as const, letterSpacing: -0.5, lineHeight: 38 },
  h1: { fontSize: 24, fontWeight: '700' as const, letterSpacing: -0.3, lineHeight: 32 },
  h2: { fontSize: 20, fontWeight: '600' as const, letterSpacing: -0.2, lineHeight: 28 },
  h3: { fontSize: 17, fontWeight: '600' as const, letterSpacing: -0.1, lineHeight: 24 },
  body: { fontSize: 15, fontWeight: '400' as const, lineHeight: 22 },
  bodyMedium: { fontSize: 15, fontWeight: '500' as const, lineHeight: 22 },
  caption: { fontSize: 13, fontWeight: '400' as const, lineHeight: 18 },
  label: { fontSize: 12, fontWeight: '600' as const, letterSpacing: 0.3, lineHeight: 16 },
  micro: { fontSize: 11, fontWeight: '600' as const, letterSpacing: 0.5, lineHeight: 14 },
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  xxxl: 64,
};

export const RADIUS = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 9999,
};

export const SHADOWS = {
  sm: '0 1px 2px rgba(0,0,0,0.05)',
  md: '0 1px 3px rgba(0,0,0,0.06), 0 4px 12px rgba(0,0,0,0.04)',
  lg: '0 4px 16px rgba(0,0,0,0.08), 0 1px 4px rgba(0,0,0,0.04)',
};

export const ICON_SIZE = { sm: 16, md: 20, lg: 24, xl: 28 };
export const TOUCH_TARGET = { min: 44 };
