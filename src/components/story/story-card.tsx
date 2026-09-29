import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { Button, IconButton } from '@/components/ui/button';
import { AppText } from '@/components/ui/text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useUser } from '@/state/user-store';
import type { StoryCluster } from '@/types/news';
import type { SummaryStyle } from '@/types/user';

import { Eyebrow, sourceLine } from './story-meta';
import { useStoryActions } from './use-story-actions';

const KEY_POINTS_BY_STYLE: Record<SummaryStyle, number> = { brief: 3, balanced: 3, detailed: 5, analysis: 4 };

/**
 * Full story card. Visual priority: headline → summary → key points →
 * why it matters → sources → actions.
 */
export function StoryCard({ story, mustKnow }: { story: StoryCluster; mustKnow?: boolean }) {
  const { colors } = useTheme();
  const { profile } = useUser();
  const actions = useStoryActions(story);
  const a = story.analysis;
  const points = a.keyPoints.slice(0, KEY_POINTS_BY_STYLE[profile.summaryStyle]);

  return (
    <Animated.View
      entering={FadeIn.duration(250)}
      style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      {/* The story body and the action buttons are siblings, never nested buttons. */}
      <Pressable
        onPress={actions.open}
        accessibilityRole="button"
        accessibilityLabel={`${story.canonicalHeadline}. Open story`}
        style={({ pressed }) => [styles.body, { opacity: pressed ? 0.85 : 1 }]}>
        <Eyebrow story={story} mustKnow={mustKnow} />

        <AppText variant="headline">{story.canonicalHeadline}</AppText>
        <AppText variant="body" color="textSecondary">
          {a.summary}
        </AppText>

        <View style={styles.block}>
          <AppText variant="eyebrow">Key points</AppText>
          {points.map((p, i) => (
            <View key={i} style={styles.bulletRow}>
              <View style={[styles.bullet, { backgroundColor: colors.textTertiary }]} />
              <AppText variant="bodySm" style={styles.flex}>
                {p}
              </AppText>
            </View>
          ))}
        </View>

        <View style={[styles.why, { backgroundColor: colors.accentSoft }]}>
          <AppText variant="eyebrow" color="accent">
            Why it matters
          </AppText>
          <AppText variant="bodySm">{a.whyItMatters}</AppText>
          {profile.summaryStyle === 'analysis' && (
            <AppText variant="bodySm" color="textSecondary">
              {a.background}
            </AppText>
          )}
        </View>

        <AppText variant="caption" numberOfLines={1}>
          {sourceLine(story)}
        </AppText>
      </Pressable>

      <View style={[styles.actions, { borderColor: colors.border }]}>
        <Button label="Read full story" size="sm" onPress={actions.open} iconRight="arrow-forward" />
        <View style={styles.iconRow}>
          <IconButton
            icon="bookmark-outline"
            activeIcon="bookmark"
            active={actions.saved}
            label={actions.saved ? 'Remove from saved' : 'Save story'}
            onPress={actions.toggleSave}
          />
          <IconButton
            icon="thumbs-up-outline"
            activeIcon="thumbs-up"
            active={actions.liked}
            label={actions.liked ? 'Unlike' : 'More like this'}
            onPress={actions.toggleLike}
          />
          <IconButton icon="eye-off-outline" label="Not interested" onPress={actions.notInterested} />
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: Radius.lg, borderWidth: StyleSheet.hairlineWidth, padding: Spacing.lg, gap: Spacing.xs },
  body: { gap: Spacing.md },
  block: { gap: Spacing.sm, marginTop: Spacing.xs },
  bulletRow: { flexDirection: 'row', gap: Spacing.sm, alignItems: 'flex-start' },
  bullet: { width: 5, height: 5, borderRadius: 3, marginTop: 8 },
  flex: { flex: 1 },
  why: { borderRadius: Radius.md, padding: Spacing.md, gap: Spacing.xs },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: Spacing.md,
    marginTop: Spacing.xs,
  },
  iconRow: { flexDirection: 'row', alignItems: 'center' },
});
