import Ionicons from '@expo/vector-icons/Ionicons';
import * as WebBrowser from 'expo-web-browser';
import { Pressable, StyleSheet, View } from 'react-native';

import { Divider } from '@/components/ui/layout';
import { AppText } from '@/components/ui/text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { userService } from '@/services';
import type { StoryCluster } from '@/types/news';
import { relativeTime } from '@/utils/time';

/**
 * Every article used to build the story. Tapping opens the publisher's own
 * page — Newzort never reproduces the full article.
 */
export function SourceList({ story }: { story: StoryCluster }) {
  const { colors } = useTheme();
  const sourceById = new Map(story.sources.map((s) => [s.id, s]));

  const open = (url: string) => {
    userService.recordFeedback({ clusterId: story.clusterId, kind: 'open_source', at: new Date().toISOString() });
    WebBrowser.openBrowserAsync(url).catch(() => {});
  };

  return (
    <View style={[styles.box, { borderColor: colors.border, backgroundColor: colors.surface }]}>
      {story.articles.map((a, i) => {
        const source = sourceById.get(a.sourceId);
        return (
          <View key={a.id}>
            {i > 0 && <Divider />}
            <View style={styles.row}>
              <View style={styles.flex}>
                <AppText variant="label">{source?.name ?? 'Unknown source'}</AppText>
                <AppText variant="bodySm" color="textSecondary">
                  {a.headline}
                </AppText>
                <AppText variant="caption" color="textTertiary">
                  {relativeTime(a.publishedAt)}
                </AppText>
              </View>
              <Pressable
                onPress={() => open(a.url)}
                accessibilityRole="link"
                accessibilityLabel={`Open original article from ${source?.name ?? 'source'}`}
                style={({ pressed }) => [styles.open, { borderColor: colors.border, opacity: pressed ? 0.6 : 1 }]}>
                <AppText variant="bodySm" color="accent" style={styles.openText}>
                  Open
                </AppText>
                <Ionicons name="open-outline" size={14} color={colors.accent} />
              </Pressable>
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  box: { borderWidth: StyleSheet.hairlineWidth, borderRadius: Radius.lg, paddingHorizontal: Spacing.lg },
  row: { flexDirection: 'row', gap: Spacing.md, paddingVertical: Spacing.md, alignItems: 'center' },
  flex: { flex: 1, gap: 2 },
  open: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.md,
    minHeight: 36,
  },
  openText: { fontWeight: '600' },
});
