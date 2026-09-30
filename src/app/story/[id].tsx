import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BriefingNav } from '@/components/story/briefing-nav';
import { SourceList } from '@/components/story/source-list';
import { Eyebrow } from '@/components/story/story-meta';
import { useStoryActions } from '@/components/story/use-story-actions';
import { Button, IconButton } from '@/components/ui/button';
import { Chip } from '@/components/ui/chip';
import { EmptyState, TopBar } from '@/components/ui/layout';
import { AppText } from '@/components/ui/text';
import { MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { topicLabel } from '@/constants/topics';
import { useTheme } from '@/hooks/use-theme';
import { useNews } from '@/state/news-store';
import { useUser } from '@/state/user-store';
import type { Confidence, StoryCluster } from '@/types/news';
import { relativeTime } from '@/utils/time';

const CONFIDENCE_TEXT: Record<Confidence, string> = {
  high: 'High confidence — sources agree on the main facts.',
  medium: 'Medium confidence — sources differ on some details.',
  low: 'Low confidence — limited or conflicting reporting so far.',
};

export default function StoryScreen() {
  const { id, from } = useLocalSearchParams<{ id: string; from?: string }>();
  const { getStory, status } = useNews();
  const { colors } = useTheme();
  const story = getStory(id);

  if (!story) {
    return (
      <View style={[styles.flex, { backgroundColor: colors.background }]}>
        <TopBar />
        {status !== 'loading' && (
          <EmptyState
            icon="document-text-outline"
            title="Story not available"
            message="This story may have been removed or is no longer in today’s feed."
            action={<Button label="Back to Home" variant="secondary" size="sm" onPress={() => router.replace('/')} />}
          />
        )}
      </View>
    );
  }
  return <StoryDetail story={story} fromBriefing={from === 'briefing'} />;
}

function StoryDetail({ story, fromBriefing }: { story: StoryCluster; fromBriefing: boolean }) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { markRead } = useUser();
  const actions = useStoryActions(story);
  const a = story.analysis;
  const isAi = story.analysisMode === 'ai';

  useEffect(() => {
    markRead(story.clusterId);
  }, [story.clusterId, markRead]);

  const askAbout = () => router.push({ pathname: '/ask', params: { storyId: story.clusterId } });

  return (
    <View style={[styles.flex, { backgroundColor: colors.background }]}>
      <TopBar
        right={
          <>
            <IconButton icon="sparkles-outline" label="Ask AI about this story" onPress={askAbout} tone="accent" />
            <IconButton icon="share-outline" label="Share story" onPress={actions.share} />
            <IconButton
              icon="bookmark-outline"
              activeIcon="bookmark"
              active={actions.saved}
              label={actions.saved ? 'Remove from saved' : 'Save story'}
              onPress={actions.toggleSave}
            />
          </>
        }
      />
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: fromBriefing ? Spacing.xxl : insets.bottom + Spacing.xxxl }]}>
        <View style={styles.inner}>
          <Eyebrow story={story} />
          <AppText variant="display" accessibilityRole="header" style={styles.headline}>
            {story.canonicalHeadline}
          </AppText>
          {a.summary ? (
            <AppText variant="body" color="textSecondary" style={styles.lede}>
              {!isAi && (
                <AppText variant="bodyStrong" color="textSecondary" style={styles.lede}>
                  {story.sources[0]?.name}:{' '}
                </AppText>
              )}
              {a.summary}
            </AppText>
          ) : null}
          <AppText variant="caption">
            Updated {relativeTime(story.updatedAt).toLowerCase()} · Based on {story.sources.length} source
            {story.sources.length === 1 ? '' : 's'}
          </AppText>

          {!isAi && (
            <View style={[styles.confidence, { borderColor: colors.border }]}>
              <Ionicons name="time-outline" size={18} color={colors.textSecondary} />
              <AppText variant="bodySm" style={styles.flex}>
                Newzort hasn’t analysed this story with AI yet. Below is what each publisher reports — open any source for
                the full story.
              </AppText>
            </View>
          )}

          {!isAi && a.keyPoints.length > 0 && (
            <Section title="Also reported">
              {a.keyPoints.map((p, i) => (
                <AppText key={i} variant="body">
                  • {p}
                </AppText>
              ))}
            </Section>
          )}

          {isAi && <AiAnalysis story={story} />}

          <Section title={`Sources (${story.articles.length})`}>
            <AppText variant="bodySm" color="textSecondary">
              {isAi
                ? 'This summary was generated from the articles below. Open them to read the original reporting.'
                : 'Open any article to read the full story on the publisher’s site.'}
            </AppText>
            <SourceList story={story} />
          </Section>

          <Section title="Topics">
            <View style={styles.chips}>
              {[...new Set([story.category, ...a.topics])].map((t) => (
                <Chip key={t} label={topicLabel(t)} onPress={() => router.push({ pathname: '/explore', params: { topic: t } })} />
              ))}
            </View>
          </Section>

          <View style={[styles.feedback, { borderColor: colors.border }]}>
            <AppText variant="label">Was this story useful to you?</AppText>
            <View style={styles.feedbackRow}>
              <Button
                label={actions.liked ? 'Liked' : 'More like this'}
                icon={actions.liked ? 'thumbs-up' : 'thumbs-up-outline'}
                variant="secondary"
                size="sm"
                onPress={actions.toggleLike}
              />
              <Button
                label="Not interested"
                icon="eye-off-outline"
                variant="ghost"
                size="sm"
                onPress={() => {
                  actions.notInterested();
                  router.back();
                }}
              />
            </View>
          </View>

          <Button label="Ask AI about this story" icon="sparkles-outline" variant="secondary" onPress={askAbout} />
        </View>
      </ScrollView>
      {fromBriefing && <BriefingNav currentId={story.clusterId} />}
    </View>
  );
}

/** The structured AI sections — only for stories with analysisMode 'ai'. */
function AiAnalysis({ story }: { story: StoryCluster }) {
  const { colors } = useTheme();
  const a = story.analysis;
  return (
    <>
      <Section title="What happened?">
        <AppText variant="body">{a.whatHappened}</AppText>
      </Section>

      <Section title="Key points">
        {a.keyPoints.map((p, i) => (
          <View key={i} style={styles.pointRow}>
            <AppText variant="bodyStrong" color="accent" style={styles.pointNum}>
              {i + 1}
            </AppText>
            <AppText variant="body" style={styles.flex}>
              {p}
            </AppText>
          </View>
        ))}
      </Section>

      <View style={[styles.why, { backgroundColor: colors.accentSoft }]}>
        <AppText variant="eyebrow" color="accent">
          Why it matters
        </AppText>
        <AppText variant="body">{a.whyItMatters}</AppText>
      </View>

      {a.background ? (
        <Section title="Background">
          <AppText variant="body">{a.background}</AppText>
        </Section>
      ) : null}

      <Section title="What happens next?">
        <AppText variant="body" color={a.whatHappensNext ? 'text' : 'textSecondary'}>
          {a.whatHappensNext ?? 'The sources don’t yet say what happens next. We won’t speculate.'}
        </AppText>
        <AppText variant="caption" color="textTertiary">
          Based only on what the sources report — not a prediction.
        </AppText>
      </Section>

      <View style={[styles.confidence, { borderColor: colors.border }]}>
        <Ionicons
          name={a.confidence === 'high' ? 'shield-checkmark-outline' : 'alert-circle-outline'}
          size={18}
          color={a.confidence === 'high' ? colors.positive : colors.warning}
        />
        <AppText variant="bodySm" style={styles.flex}>
          {CONFIDENCE_TEXT[a.confidence]}
        </AppText>
      </View>

      {!story.isDemo && (
        <AppText variant="caption" color="textTertiary">
          This summary was written by AI using only the headlines and excerpts of the sources below, and every key point is
          checked against them. AI can still make mistakes — open the original articles for the full story.
        </AppText>
      )}
    </>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <AppText variant="eyebrow" color="text" accessibilityRole="header">
        {title}
      </AppText>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scroll: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.lg, alignItems: 'center' },
  inner: { width: '100%', maxWidth: MaxContentWidth, gap: Spacing.md },
  headline: { marginTop: Spacing.xs },
  lede: { fontSize: 18, lineHeight: 27 },
  section: { gap: Spacing.sm, marginTop: Spacing.lg },
  pointRow: { flexDirection: 'row', gap: Spacing.md },
  pointNum: { width: 16 },
  why: { borderRadius: Radius.lg, padding: Spacing.lg, gap: Spacing.xs, marginTop: Spacing.lg },
  confidence: {
    flexDirection: 'row',
    gap: Spacing.sm,
    alignItems: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginTop: Spacing.lg,
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  feedback: { borderTopWidth: StyleSheet.hairlineWidth, paddingTop: Spacing.lg, marginTop: Spacing.xl, gap: Spacing.md },
  feedbackRow: { flexDirection: 'row', gap: Spacing.sm, flexWrap: 'wrap' },
});
