import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, View } from 'react-native';

import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

import { AppText } from './text';

/** Shown while the app runs on demo data, so nobody mistakes it for real reporting. */
export function DemoNotice() {
  const { colors } = useTheme();
  return (
    <View style={[styles.box, { borderColor: colors.border, backgroundColor: colors.surfaceMuted }]} accessibilityRole="summary">
      <Ionicons name="flask-outline" size={16} color={colors.textSecondary} />
      <AppText variant="caption" style={styles.flex}>
        Demo edition — stories and publishers are illustrative, not real reporting. Live sources connect in a later phase.
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    flexDirection: 'row',
    gap: Spacing.sm,
    alignItems: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: Radius.md,
    padding: Spacing.md,
  },
  flex: { flex: 1 },
});
