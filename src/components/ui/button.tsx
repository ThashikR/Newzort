import Ionicons from '@expo/vector-icons/Ionicons';
import type { ComponentProps } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

import { AppText } from './text';

type IconName = ComponentProps<typeof Ionicons>['name'];

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost';
  icon?: IconName;
  iconRight?: IconName;
  disabled?: boolean;
  loading?: boolean;
  size?: 'md' | 'sm';
  style?: StyleProp<ViewStyle>;
  accessibilityHint?: string;
}

export function Button({
  label,
  onPress,
  variant = 'primary',
  icon,
  iconRight,
  disabled,
  loading,
  size = 'md',
  style,
  accessibilityHint,
}: ButtonProps) {
  const { colors } = useTheme();
  const bg = variant === 'primary' ? colors.accentStrong : variant === 'secondary' ? colors.surfaceMuted : 'transparent';
  const fg = variant === 'primary' ? colors.onAccent : colors.accent;

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: !!disabled }}
      style={({ pressed }) => [
        styles.base,
        size === 'sm' ? styles.sm : styles.md,
        { backgroundColor: bg, opacity: disabled ? 0.45 : pressed ? 0.75 : 1 },
        variant === 'ghost' && styles.ghost,
        style,
      ]}>
      {loading ? (
        <ActivityIndicator color={fg} />
      ) : (
        <View style={styles.row}>
          {icon && <Ionicons name={icon} size={size === 'sm' ? 16 : 18} color={fg} />}
          <AppText variant="label" style={[{ color: fg }, size === 'sm' && styles.smText]}>
            {label}
          </AppText>
          {iconRight && <Ionicons name={iconRight} size={size === 'sm' ? 16 : 18} color={fg} />}
        </View>
      )}
    </Pressable>
  );
}

interface IconButtonProps {
  icon: IconName;
  label: string;
  onPress: () => void;
  active?: boolean;
  activeIcon?: IconName;
  tone?: 'default' | 'accent';
}

/** Small round icon action with a proper accessibility label and 44pt target. */
export function IconButton({ icon, label, onPress, active, activeIcon, tone = 'default' }: IconButtonProps) {
  const { colors } = useTheme();
  const color = active ? colors.accent : tone === 'accent' ? colors.accent : colors.textSecondary;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected: !!active }}
      hitSlop={6}
      style={({ pressed }) => [styles.icon, { opacity: pressed ? 0.6 : 1 }]}>
      <Ionicons name={active && activeIcon ? activeIcon : icon} size={20} color={color} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  md: { minHeight: 50, paddingHorizontal: Spacing.xl },
  sm: { minHeight: 38, paddingHorizontal: Spacing.lg },
  smText: { fontSize: 14 },
  ghost: { paddingHorizontal: Spacing.sm },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  icon: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', borderRadius: Radius.pill },
});
