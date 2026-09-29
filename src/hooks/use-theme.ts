import { useColorScheme } from 'react-native';

import { Colors, type ThemeColors } from '@/constants/theme';

export function useTheme(): { colors: ThemeColors; isDark: boolean } {
  const isDark = useColorScheme() === 'dark';
  return { colors: isDark ? Colors.dark : Colors.light, isDark };
}
