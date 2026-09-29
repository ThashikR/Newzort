import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet, View } from 'react-native';

import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { relativeTime } from '@/utils/time';

import { AppText } from './text';

interface FeedStatusProps {
  lastUpdated: number | null;
  offline: boolean;
  onRetry: () => void;
}

/** "Updated 5m ago", or a clear offline notice when showing the saved copy. */
export function FeedStatus({ lastUpdated, offline, onRetry }: FeedStatusProps) {
  const { colors } = useTheme();
  if (!lastUpdated) return null;
  const when = relativeTime(new Date(lastUpdated).toISOString()).toLowerCase();

  if (!offline) {
    return (
      <AppText variant="caption" color="textTertiary" accessibilityLiveRegion="polite">
        Updated {when} · pull down to refresh
      </AppText>
    );
  }

  return (
    <Pressable
      onPress={onRetry}
      accessibilityRole="button"
      accessibilityLabel={`You're offline. Showing news from ${when}. Tap to try again.`}
      style={({ pressed }) => [
        styles.offline,
        { backgroundColor: colors.surfaceMuted, borderColor: colors.border, opacity: pressed ? 0.7 : 1 },
      ]}>
      <Ionicons name="cloud-offline-outline" size={18} color={colors.warning} />
      <View style={styles.flex}>
        <AppText variant="label">You’re offline</AppText>
        <AppText variant="caption">Showing news saved {when}. Tap to try again.</AppText>
      </View>
      <Ionicons name="refresh" size={18} color={colors.textSecondary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  offline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: Radius.md,
    padding: Spacing.md,
  },
  flex: { flex: 1 },
});
