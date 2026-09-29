import { Image, type ImageStyle, type StyleProp } from 'react-native';

import { Brand } from '@/constants/brand';
import { useTheme } from '@/hooks/use-theme';

// Generated from assets/brand/newzort-logo.webp by scripts/make-brand-assets.py.
const SOURCES = {
  full: { light: require('@/assets/images/logo-full.png'), dark: require('@/assets/images/logo-full-dark.png'), ratio: 720 / 442 },
  mark: { light: require('@/assets/images/logo-mark.png'), dark: require('@/assets/images/logo-mark-dark.png'), ratio: 1 },
};

interface BrandLogoProps {
  variant?: keyof typeof SOURCES;
  height: number;
  style?: StyleProp<ImageStyle>;
}

/** The Newzort logo; navy parts switch to light ink in dark mode. */
export function BrandLogo({ variant = 'full', height, style }: BrandLogoProps) {
  const { isDark } = useTheme();
  const src = SOURCES[variant];
  return (
    <Image
      source={isDark ? src.dark : src.light}
      style={[{ height, width: height * src.ratio }, style]}
      resizeMode="contain"
      accessibilityRole="image"
      accessibilityLabel={Brand.name}
    />
  );
}
