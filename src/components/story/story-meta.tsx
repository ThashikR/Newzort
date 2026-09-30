import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/text';
import { Radius, Spacing } from '@/constants/theme';
import { topicShortLabel } from '@/constants/topics';
import { useTheme } from '@/hooks/use-theme';
import type { StoryCluster } from '@/types/news';
import { relativeTime } from '@/utils/time';

const COUNTRY_LABEL: Record<string, string> = { IN: 'India' };

/** "INDIA · ECONOMY" */
export function storyEyebrow(story: StoryCluster): string {
  const country = story.country ? COUNTRY_LABEL[story.country] : undefined;
  const category = topicShortLabel(story.category);
  return country && story.category !== 'india' ? `${country} · ${category}` : category;
}

export function Eyebrow({ story, mustKnow }: { story: StoryCluster; mustKnow?: boolean }) {
  return (
    <View style={styles.row}>
      <AppText variant="eyebrow" color={mustKnow ? 'mustKnow' : 'accent'} numberOfLines={1} style={styles.shrink}>
        {storyEyebrow(story)}
      </AppText>
      <AppText variant="caption" color="textTertiary">
        {relativeTime(story.updatedAt)}
      </AppText>
      {story.isDemo ? (
        <Badge label="DEMO" a11y="Demo story, not real news" />
      ) : story.analysisMode === 'ai' ? (
        <Badge label="AI SUMMARY" a11y="Summary written by AI from the listed sources" accent />
      ) : null}
    </View>
  );
}

function Badge({ label, a11y, accent }: { label: string; a11y: string; accent?: boolean }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.badge, { borderColor: accent ? colors.accent : colors.border }]} accessibilityLabel={a11y}>
      <AppText variant="caption" color={accent ? 'accent' : 'textTertiary'} style={styles.badgeText}>
        {label}
      </AppText>
    </View>
  );
}

/** "Based on 3 sources · The Daily Meridian, Global Wire Service +1" */
export function sourceLine(story: StoryCluster, max = 2): string {
  const names = story.sources.map((s) => s.name);
  const shown = names.slice(0, max).join(', ');
  const more = names.length > max ? ` +${names.length - max}` : '';
  const count = `Based on ${names.length} source${names.length === 1 ? '' : 's'}`;
  return `${count} · ${shown}${more}`;
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  shrink: { flexShrink: 1 },
  badge: { borderWidth: 1, borderRadius: Radius.sm, paddingHorizontal: 5 },
  badgeText: { fontSize: 9.5, lineHeight: 14, fontWeight: '700', letterSpacing: 0.8 },
});
