import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet, View } from 'react-native';

import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

import { AppText } from './text';

interface OptionCardProps {
  label: string;
  description?: string;
  selected: boolean;
  onPress: () => void;
}

/** Large radio-style choice used in onboarding and settings. */
export function OptionCard({ label, description, selected, onPress }: OptionCardProps) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ checked: selected }}
      accessibilityLabel={description ? `${label}. ${description}` : label}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: selected ? colors.accentSoft : colors.surface,
          borderColor: selected ? colors.accent : colors.border,
          opacity: pressed ? 0.8 : 1,
        },
      ]}>
      <View style={styles.text}>
        <AppText variant="label">{label}</AppText>
        {description ? (
          <AppText variant="bodySm" color="textSecondary">
            {description}
          </AppText>
        ) : null}
      </View>
      <Ionicons
        name={selected ? 'radio-button-on' : 'radio-button-off'}
        size={22}
        color={selected ? colors.accent : colors.textTertiary}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.lg,
    borderRadius: Radius.lg,
    borderWidth: 1.5,
  },
  text: { flex: 1, gap: 2 },
});
