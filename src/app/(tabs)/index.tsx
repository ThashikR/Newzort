import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { StoryCard } from '@/components/story/story-card';
import { StoryRow } from '@/components/story/story-row';
import { Button } from '@/components/ui/button';
import { Chip } from '@/components/ui/chip';
import { DemoNotice } from '@/components/ui/demo-notice';
import { FeedStatus } from '@/components/ui/feed-status';
import { Card, Divider, EmptyState, Screen, SectionHeader } from '@/components/ui/layout';
import { AppText } from '@/components/ui/text';
import { Radius, Spacing } from '@/constants/theme';
import { topicLabel } from '@/constants/topics';
import { buildBriefing } from '@/features/briefing/build-briefing';
import { useTheme } from '@/hooks/use-theme';
import { useNews, usePersonalizedFeed } from '@/state/news-store';
import { useUser } from '@/state/user-store';
import type { TopicId } from '@/types/news';
import { greeting, longDate } from '@/utils/time';

export default function HomeScreen() {
  const { colors } = useTheme();
  const { profile } = useUser();
  const { status, refreshing, refresh, stories, lastUpdated, offline } = useNews();
  const { sections } = usePersonalizedFeed();
  const briefing = buildBriefing(sections, profile);

  const firstName = profile.name.split(' ')[0];
  const exploreTopics = [...new Set(sections.explore.map((r) => r.story.category))] as TopicId[];

  return (
    <Screen refreshing={refreshing} onRefresh={refresh}>
      {/* Masthead */}
      <View style={styles.masthead}>
        <View style={styles.dateRow}>
          <AppText variant="caption" style={[styles.date, styles.flex]}>
            {longDate()}
          </AppText>
          <Pressable
            onPress={() => router.push('/ask')}
            accessibilityRole="button"
            accessibilityLabel="Ask Vartify AI"
            style={({ pressed }) => [styles.askButton, { backgroundColor: colors.accentSoft, opacity: pressed ? 0.7 : 1 }]}>
            <Ionicons name="sparkles-outline" size={16} color={colors.accent} />
            <AppText variant="bodySm" color="accent" style={styles.askText}>
              Ask AI
            </AppText>
          </Pressable>
        </View>
        <AppText variant="title" accessibilityRole="header">
          {greeting()}
          {firstName ? `, ${firstName}` : ''} 👋
        </AppText>
        <AppText variant="body" color="textSecondary">
          Here’s what matters to you today.
        </AppText>
        <FeedStatus lastUpdated={lastUpdated} offline={offline} onRetry={refresh} />
      </View>

      {status === 'loading' && <ActivityIndicator style={styles.loading} color={colors.textSecondary} />}
      {status === 'error' && (
        <EmptyState
          icon="cloud-offline-outline"
          title="Couldn’t load today’s stories"
          message="Check your connection and try again."
          action={<Button label="Try again" onPress={refresh} variant="secondary" size="sm" />}
        />
      )}

      {status === 'ready' && (
        <>
          {stories.some((s) => s.isDemo) && <DemoNotice />}

          {/* Briefing entry point */}
          <Pressable
            onPress={() => router.push('/briefing')}
            accessibilityRole="button"
            accessibilityLabel={`Your ${profile.briefingLength}-minute briefing, ${briefing.storyIds.length} stories. Open briefing`}
            style={({ pressed }) => [styles.briefingStrip, { backgroundColor: colors.accent, opacity: pressed ? 0.9 : 1 }]}>
            <View style={styles.flex}>
              <AppText variant="eyebrow" style={{ color: colors.onAccent, opacity: 0.8 }}>
                Your personalized briefing
              </AppText>
              <AppText variant="headlineSm" style={{ color: colors.onAccent }}>
                {profile.briefingLength} minutes · {briefing.storyIds.length} stories
              </AppText>
            </View>
            <Ionicons name="play-circle" size={34} color={colors.onAccent} />
          </Pressable>

          {sections.mustKnow.length > 0 && (
            <>
              <SectionHeader title="Must know" subtitle="The most important stories right now" accent="mustKnow" />
              {sections.mustKnow.map((r) => (
                <StoryCard key={r.story.clusterId} story={r.story} mustKnow />
              ))}
            </>
          )}

          {sections.forYou.length > 0 && (
            <>
              <SectionHeader
                title="For you"
                subtitle={`Based on ${profile.interests
                  .slice(0, 3)
                  .map((i) => topicLabel(i.topic))
                  .join(', ')}${profile.interests.length > 3 ? ' and more' : ''}`}
                accent="accent"
              />
              {sections.forYou.map((r) => (
                <StoryCard key={r.story.clusterId} story={r.story} />
              ))}
            </>
          )}

          {sections.quickReads.length > 0 && (
            <>
              <SectionHeader title="Quick read" subtitle="Understand these in under a minute" />
              <Card>
                {sections.quickReads.map((r, i) => (
                  <View key={r.story.clusterId}>
                    {i > 0 && <Divider />}
                    <StoryRow story={r.story} />
                  </View>
                ))}
              </Card>
            </>
          )}

          {sections.explore.length > 0 && (
            <>
              <SectionHeader title="Explore" subtitle="More from today, beyond your interests" />
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.topicRow}>
                {exploreTopics.map((t) => (
                  <Chip key={t} label={topicLabel(t)} onPress={() => router.push({ pathname: '/explore', params: { topic: t } })} />
                ))}
              </ScrollView>
              <Card>
                {sections.explore.slice(0, 5).map((r, i) => (
                  <View key={r.story.clusterId}>
                    {i > 0 && <Divider />}
                    <StoryRow story={r.story} />
                  </View>
                ))}
              </Card>
            </>
          )}

          <View style={[styles.footer, { borderColor: colors.border }]}>
            <AppText variant="caption" style={styles.center}>
              Summaries are generated from the listed sources. Always check the original reporting for full details.
            </AppText>
          </View>
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  masthead: { gap: Spacing.xs, marginBottom: Spacing.xs },
  dateRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  date: { textTransform: 'uppercase', letterSpacing: 1, fontWeight: '600' },
  askButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 36,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.pill,
  },
  askText: { fontWeight: '600' },
  loading: { marginTop: Spacing.xxxl },
  briefingStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    borderRadius: Radius.lg,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.lg,
  },
  topicRow: { gap: Spacing.sm, paddingRight: Spacing.lg },
  footer: { borderTopWidth: StyleSheet.hairlineWidth, paddingTop: Spacing.lg, marginTop: Spacing.lg },
  center: { textAlign: 'center' },
});
