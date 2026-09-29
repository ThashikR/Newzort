import { StyleSheet, Text, type TextProps } from 'react-native';

import { Fonts, type ThemeColors } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type TextVariant =
  | 'display'
  | 'title'
  | 'headline'
  | 'headlineSm'
  | 'body'
  | 'bodyStrong'
  | 'bodySm'
  | 'caption'
  | 'eyebrow'
  | 'label';

interface AppTextProps extends TextProps {
  variant?: TextVariant;
  color?: keyof ThemeColors;
}

export function AppText({ variant = 'body', color, style, ...rest }: AppTextProps) {
  const { colors } = useTheme();
  const defaultColor: keyof ThemeColors =
    variant === 'caption' || variant === 'eyebrow' ? 'textSecondary' : 'text';
  return (
    <Text
      maxFontSizeMultiplier={1.6}
      style={[styles[variant], { color: colors[color ?? defaultColor] }, style]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  display: { fontFamily: Fonts.serif, fontSize: 34, lineHeight: 40, fontWeight: '700', letterSpacing: -0.5 },
  title: { fontFamily: Fonts.serif, fontSize: 26, lineHeight: 32, fontWeight: '700', letterSpacing: -0.3 },
  headline: { fontFamily: Fonts.serif, fontSize: 21, lineHeight: 27, fontWeight: '700', letterSpacing: -0.2 },
  headlineSm: { fontFamily: Fonts.serif, fontSize: 17, lineHeight: 22, fontWeight: '700' },
  body: { fontFamily: Fonts.sans, fontSize: 16, lineHeight: 24 },
  bodyStrong: { fontFamily: Fonts.sans, fontSize: 16, lineHeight: 24, fontWeight: '600' },
  bodySm: { fontFamily: Fonts.sans, fontSize: 14, lineHeight: 20 },
  caption: { fontFamily: Fonts.sans, fontSize: 12.5, lineHeight: 17 },
  eyebrow: { fontFamily: Fonts.sans, fontSize: 11.5, lineHeight: 16, fontWeight: '700', letterSpacing: 1.1, textTransform: 'uppercase' },
  label: { fontFamily: Fonts.sans, fontSize: 15, lineHeight: 20, fontWeight: '600' },
});
