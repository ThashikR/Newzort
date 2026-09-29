import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/ui/text';
import { MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { buildBriefing } from '@/features/briefing/build-briefing';
import { useTheme } from '@/hooks/use-theme';
import { usePersonalizedFeed } from '@/state/news-store';
import { useUser } from '@/state/user-store';

/**
 * Bottom bar on a story opened from the Daily Briefing:  ‹ Prev · 3 of 13 · Next ›
 * Uses router.replace so Back always returns to the briefing, not through every story.
 */
export function BriefingNav({ currentId }: { currentId: string }) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { profile } = useUser();
  const { sections } = usePersonalizedFeed();
  const ids = buildBriefing(sections, profile).storyIds;
  const index = ids.indexOf(currentId);

  const go = (id: string) => router.replace({ pathname: '/story/[id]', params: { id, from: 'briefing' } });
  const backToBriefing = () => (router.canGoBack() ? router.back() : router.replace('/briefing'));

  const prevId = index > 0 ? ids[index - 1] : undefined;
  const nextId = index >= 0 && index < ids.length - 1 ? ids[index + 1] : undefined;
  const isLast = index === ids.length - 1;

  return (
    <View
      style={[
        styles.bar,
        { paddingBottom: insets.bottom + Spacing.sm, backgroundColor: colors.background, borderColor: colors.border },
      ]}>
      <View style={styles.inner}>
        <NavButton label="Prev" icon="chevron-back" disabled={!prevId} onPress={() => prevId && go(prevId)} />

        <View style={styles.middle} accessibilityRole="progressbar">
          <AppText variant="caption" style={styles.count}>
            {index >= 0 ? `${index + 1} of ${ids.length}` : 'Not in today’s briefing'}
          </AppText>
          {index >= 0 && (
            <View style={[styles.track, { backgroundColor: colors.border }]}>
              <View style={[styles.fill, { backgroundColor: colors.accentStrong, width: `${((index + 1) / ids.length) * 100}%` }]} />
            </View>
          )}
        </View>

        {nextId ? (
          <NavButton label="Next" icon="chevron-forward" iconRight primary onPress={() => go(nextId)} />
        ) : (
          <NavButton label={isLast ? 'Done' : 'Briefing'} icon="checkmark" iconRight primary onPress={backToBriefing} />
        )}
      </View>
    </View>
  );
}

function NavButton({
  label,
  icon,
  onPress,
  disabled,
  primary,
  iconRight,
}: {
  label: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  onPress: () => void;
  disabled?: boolean;
  primary?: boolean;
  iconRight?: boolean;
}) {
  const { colors } = useTheme();
  const fg = primary ? colors.onAccent : colors.text;
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label === 'Prev' ? 'Previous story' : label === 'Next' ? 'Next story' : label}
      accessibilityState={{ disabled: !!disabled }}
      hitSlop={6}
      style={({ pressed }) => [
        styles.navButton,
        { backgroundColor: primary ? colors.accentStrong : colors.surfaceMuted, opacity: disabled ? 0.35 : pressed ? 0.75 : 1 },
      ]}>
      {!iconRight && <Ionicons name={icon} size={18} color={fg} />}
      <AppText variant="label" style={{ color: fg }}>
        {label}
      </AppText>
      {iconRight && <Ionicons name={icon} size={18} color={fg} />}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  bar: { borderTopWidth: StyleSheet.hairlineWidth, paddingTop: Spacing.sm, paddingHorizontal: Spacing.lg, alignItems: 'center' },
  inner: { width: '100%', maxWidth: MaxContentWidth, flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  middle: { flex: 1, alignItems: 'center', gap: 6 },
  count: { fontWeight: '600' },
  track: { width: '100%', height: 3, borderRadius: 2, overflow: 'hidden' },
  fill: { height: 3, borderRadius: 2 },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    minHeight: 44,
    paddingHorizontal: Spacing.lg,
    borderRadius: Radius.pill,
  },
});
