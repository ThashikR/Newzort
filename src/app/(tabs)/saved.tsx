import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { Eyebrow } from '@/components/story/story-meta';
import { Button } from '@/components/ui/button';
import { Card, Divider, EmptyState, Screen } from '@/components/ui/layout';
import { useSnackbar } from '@/components/ui/snackbar';
import { AppText } from '@/components/ui/text';
import { Spacing } from '@/constants/theme';
import { useNews } from '@/state/news-store';
import { useUser } from '@/state/user-store';
import type { StoryCluster } from '@/types/news';
import { shortDate } from '@/utils/time';

export default function SavedScreen() {
  const { profile, toggleSave } = useUser();
  const { getStory } = useNews();
  const snackbar = useSnackbar();

  const items = profile.saved
    .map((s) => ({ saved: s, story: getStory(s.clusterId) }))
    .filter((x): x is { saved: typeof x.saved; story: NonNullable<typeof x.story> } => !!x.story);

  const remove = (story: StoryCluster) => {
    toggleSave(story);
    snackbar('Removed from Saved', { label: 'Undo', onPress: () => toggleSave(story) });
  };

  return (
    <Screen>
      <View style={styles.header}>
        <AppText variant="title" accessibilityRole="header">
          Saved
        </AppText>
        <AppText variant="body" color="textSecondary">
          {items.length === 0 ? 'Stories you save appear here.' : `${items.length} ${items.length === 1 ? 'story' : 'stories'} saved for later`}
        </AppText>
      </View>

      {items.length === 0 ? (
        <EmptyState
          icon="bookmark-outline"
          title="Nothing saved yet"
          message="Tap the bookmark on any story to read it later."
          action={<Button label="Go to Home" variant="secondary" size="sm" onPress={() => router.navigate('/')} />}
        />
      ) : (
        <Card>
          {items.map(({ saved, story }, i) => (
            <View key={story.clusterId}>
              {i > 0 && <Divider />}
              <View style={styles.row}>
                <Pressable
                  onPress={() => router.push({ pathname: '/story/[id]', params: { id: story.clusterId } })}
                  accessibilityRole="button"
                  accessibilityLabel={`${story.canonicalHeadline}. Open story`}
                  style={({ pressed }) => [styles.flex, { opacity: pressed ? 0.7 : 1 }]}>
                  <View style={styles.body}>
                    <Eyebrow story={story} />
                    <AppText variant="headlineSm">{story.canonicalHeadline}</AppText>
                    <AppText variant="caption" color="textTertiary">
                      {story.sources[0]?.name}
                      {story.sources.length > 1 ? ` +${story.sources.length - 1} more` : ''} · Saved {shortDate(saved.savedAt)}
                    </AppText>
                  </View>
                </Pressable>
                <Button label="Remove" variant="ghost" size="sm" onPress={() => remove(story)} />
              </View>
            </View>
          ))}
        </Card>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: { gap: Spacing.xs },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, paddingVertical: Spacing.md },
  body: { gap: Spacing.xs },
});
