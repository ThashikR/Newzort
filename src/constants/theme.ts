import { Platform } from 'react-native';

/**
 * Newzort's visual identity: warm paper, near-black ink, and a single
 * restrained accent ("Newzort indigo"). Colour is used for meaning, not decoration.
 */
export const Colors = {
  light: {
    background: '#F7F5F0',
    surface: '#FFFFFF',
    surfaceMuted: '#EFECE5',
    border: '#E2DED5',
    text: '#16181B',
    textSecondary: '#55595F',
    textTertiary: '#6E737A',
    accent: '#2B4A7E',
    accentSoft: '#E3E9F3',
    onAccent: '#FFFFFF',
    mustKnow: '#9A2A1F',
    positive: '#2F6B45',
    warning: '#8A5A00',
    tabBar: '#FBFAF7',
  },
  dark: {
    background: '#0E1012',
    surface: '#171A1E',
    surfaceMuted: '#1F2328',
    border: '#2A2F35',
    text: '#EEF0F2',
    textSecondary: '#B1B6BD',
    textTertiary: '#8C929A',
    accent: '#9DB8E6',
    accentSoft: '#1E2A3D',
    onAccent: '#0E1012',
    mustKnow: '#F08B7E',
    positive: '#7CC49A',
    warning: '#E0B45C',
    tabBar: '#121417',
  },
} as const;

export type ThemeColors = { [K in keyof typeof Colors.light]: string };

export const Fonts = {
  /** Editorial serif for headlines. Uses built-in system fonts — no download. */
  serif: Platform.select({ ios: 'Georgia', android: 'serif', default: 'Georgia, "Times New Roman", serif' }),
  sans: Platform.select({ ios: 'System', android: 'sans-serif', default: 'system-ui, -apple-system, "Segoe UI", sans-serif' }),
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
} as const;

export const Radius = {
  sm: 8,
  md: 12,
  lg: 16,
  pill: 999,
} as const;

export const MaxContentWidth = 680;
