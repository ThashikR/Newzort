import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet } from 'react-native';

import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

import { AppText } from './text';

interface ChipProps {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  showCheck?: boolean;
}

export function Chip({ label, selected, onPress, showCheck }: ChipProps) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole={onPress ? 'checkbox' : 'text'}
      accessibilityState={{ checked: !!selected }}
      accessibilityLabel={label}
      style={({ pressed }) => [
        styles.chip,
        {
          backgroundColor: selected ? colors.accent : colors.surface,
          borderColor: selected ? colors.accent : colors.border,
          opacity: pressed ? 0.75 : 1,
        },
      ]}>
      {showCheck && selected && <Ionicons name="checkmark" size={16} color={colors.onAccent} />}
      <AppText variant="bodySm" style={{ color: selected ? colors.onAccent : colors.text, fontWeight: '600' }}>
        {label}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.lg,
    minHeight: 40,
    borderRadius: Radius.pill,
    borderWidth: 1,
  },
});
