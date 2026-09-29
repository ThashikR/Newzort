import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet, View } from 'react-native';

import { IconButton } from '@/components/ui/button';
import { AppText } from '@/components/ui/text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { StoryCluster } from '@/types/news';

import { Eyebrow } from './story-meta';
import { useStoryActions } from './use-story-actions';

interface StoryRowProps {
  story: StoryCluster;
  /** Number shown on the left (briefing order). */
  index?: number;
  /** Extra line, e.g. search match reasons. */
  note?: string;
  showSave?: boolean;
  showSummary?: boolean;
}

/** Compact list row for Quick Reads, Explore, search results and the briefing. */
export function StoryRow({ story, index, note, showSave = true, showSummary = true }: StoryRowProps) {
  const { colors } = useTheme();
  const actions = useStoryActions(story);

  return (
    <View style={styles.row}>
      <Pressable
        onPress={actions.open}
        accessibilityRole="button"
        accessibilityLabel={`${story.canonicalHeadline}${actions.read ? ', read' : ''}`}
        style={({ pressed }) => [styles.main, { opacity: pressed ? 0.7 : 1 }]}>
        {index !== undefined && (
          <View style={[styles.index, { borderColor: actions.read ? colors.positive : colors.border }]}>
            {actions.read ? (
              <Ionicons name="checkmark" size={14} color={colors.positive} />
            ) : (
              <AppText variant="caption" style={{ fontWeight: '700' }}>
                {index}
              </AppText>
            )}
          </View>
        )}
        <View style={styles.body}>
          <Eyebrow story={story} />
          <AppText variant="headlineSm">{story.canonicalHeadline}</AppText>
          {showSummary && (
            <AppText variant="bodySm" color="textSecondary" numberOfLines={2}>
              {story.analysis.summary}
            </AppText>
          )}
          <AppText variant="caption" color="textTertiary">
            {story.sources.length} source{story.sources.length === 1 ? '' : 's'} · {formatMinutes(story.readMinutes)}
            {note ? ` · ${note}` : ''}
          </AppText>
        </View>
      </Pressable>
      {showSave && (
        <IconButton
          icon="bookmark-outline"
          activeIcon="bookmark"
          active={actions.saved}
          label={actions.saved ? 'Remove from saved' : 'Save story'}
          onPress={actions.toggleSave}
        />
      )}
    </View>
  );
}

export function formatMinutes(min: number): string {
  return min < 1 ? `${Math.round(min * 60)} sec read` : `${Math.round(min)} min read`;
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: Spacing.xs, paddingVertical: Spacing.md, alignItems: 'flex-start' },
  main: { flex: 1, flexDirection: 'row', gap: Spacing.md, alignItems: 'flex-start' },
  index: { width: 26, height: 26, borderRadius: 13, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', marginTop: 2 },
  body: { flex: 1, gap: Spacing.xs },
});
