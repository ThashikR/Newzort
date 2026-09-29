import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { StoryRow } from '@/components/story/story-row';
import { Button } from '@/components/ui/button';
import { Card, Divider, EmptyState, Screen } from '@/components/ui/layout';
import { Segmented } from '@/components/ui/segmented';
import { AppText } from '@/components/ui/text';
import { Radius, Spacing } from '@/constants/theme';
import { topicLabel } from '@/constants/topics';
import { buildBriefing } from '@/features/briefing/build-briefing';
import { BRIEFING_LENGTH_OPTIONS } from '@/features/onboarding/options';
import { useTheme } from '@/hooks/use-theme';
import { usePersonalizedFeed } from '@/state/news-store';
import { useUser } from '@/state/user-store';
import { longDate } from '@/utils/time';

const LENGTH_OPTIONS = BRIEFING_LENGTH_OPTIONS.map((o) => ({ value: o.value, label: `${o.value} min` }));

export default function BriefingScreen() {
  const { colors } = useTheme();
  const { profile, setBriefingLength } = useUser();
  const { sections } = usePersonalizedFeed();
  const briefing = buildBriefing(sections, profile);

  const total = briefing.storyIds.length;
  const readCount = briefing.storyIds.filter((id) => profile.readIds.includes(id)).length;
  const nextUnread = briefing.storyIds.find((id) => !profile.readIds.includes(id));
  const done = total > 0 && readCount === total;

  // Running story number across sections (1, 2, 3 … not restarting per topic).
  const offsets = briefing.sections.map((_, i) =>
    briefing.sections.slice(0, i).reduce((n, s) => n + s.stories.length, 0),
  );

  return (
    <Screen>
      <View style={styles.header}>
        <AppText variant="caption" style={styles.date}>
          {longDate()}
        </AppText>
        <AppText variant="eyebrow" color="accent">
          Your {profile.briefingLength}-minute briefing
        </AppText>
        <AppText variant="title" accessibilityRole="header">
          Daily Briefing
        </AppText>
      </View>

      <Segmented
        options={LENGTH_OPTIONS}
        value={profile.briefingLength}
        onChange={setBriefingLength}
        accessibilityLabel="Briefing length"
      />

      <View style={styles.stats}>
        <Stat value={briefing.counts.mustKnow} label="Must Know" color={colors.mustKnow} />
        <Stat value={briefing.counts.forYou} label="For You" color={colors.accent} />
        <Stat value={briefing.counts.quickReads} label="Quick Reads" color={colors.text} />
        {briefing.counts.more > 0 && <Stat value={briefing.counts.more} label="More" color={colors.textSecondary} />}
      </View>

      <View style={styles.progressBlock}>
        <View style={styles.progressLabels}>
          <AppText variant="caption">
            {readCount} of {total} read
          </AppText>
          <AppText variant="caption">About {briefing.totalMinutes} min</AppText>
        </View>
        <View style={[styles.track, { backgroundColor: colors.border }]}>
          <View
            style={[styles.fill, { backgroundColor: colors.positive, width: total ? `${(readCount / total) * 100}%` : '0%' }]}
          />
        </View>
        {total > 0 && (
          <Button
            label={readCount === 0 ? 'Start briefing' : nextUnread ? 'Continue briefing' : 'Read again from the start'}
            icon={nextUnread ? 'play' : 'refresh'}
            variant={nextUnread ? 'primary' : 'secondary'}
            onPress={() =>
              router.push({ pathname: '/story/[id]', params: { id: nextUnread ?? briefing.storyIds[0], from: 'briefing' } })
            }
          />
        )}
      </View>

      {total === 0 && (
        <EmptyState
          icon="newspaper-outline"
          title="Nothing to brief yet"
          message="Add a few interests in Profile, or pull to refresh on Home."
        />
      )}

      {briefing.sections.map((section, i) => (
        <View key={section.topic} style={styles.section}>
          <AppText variant="headlineSm" accessibilityRole="header">
            {i + 1}. {topicLabel(section.topic)}
          </AppText>
          <Card>
            {section.stories.map((r, j) => (
              <View key={r.story.clusterId}>
                {j > 0 && <Divider />}
                <StoryRow story={r.story} index={offsets[i] + j + 1} showSave={false} from="briefing" />
              </View>
            ))}
          </Card>
        </View>
      ))}

      {total > 0 && (
        <View style={[styles.end, { borderColor: colors.border }]}>
          <Ionicons name={done ? 'checkmark-circle' : 'cafe-outline'} size={28} color={done ? colors.positive : colors.textSecondary} />
          <AppText variant="headlineSm" style={styles.center}>
            That’s your briefing for today.
          </AppText>
          <AppText variant="bodySm" color="textSecondary" style={styles.center}>
            {done ? 'You’re all caught up.' : 'Tap any story to read the full summary and its sources.'}
          </AppText>
        </View>
      )}
    </Screen>
  );
}

function Stat({ value, label, color }: { value: number; label: string; color: string }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.stat, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <AppText variant="title" style={{ color }}>
        {value}
      </AppText>
      <AppText variant="caption">{label}</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { gap: Spacing.xs },
  date: { textTransform: 'uppercase', letterSpacing: 1, fontWeight: '600' },
  stats: { flexDirection: 'row', gap: Spacing.sm },
  stat: {
    flex: 1,
    borderRadius: Radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  progressBlock: { gap: Spacing.sm },
  progressLabels: { flexDirection: 'row', justifyContent: 'space-between' },
  track: { height: 4, borderRadius: 2, overflow: 'hidden' },
  fill: { height: 4, borderRadius: 2 },
  section: { gap: Spacing.sm, marginTop: Spacing.md },
  end: { alignItems: 'center', gap: Spacing.sm, borderTopWidth: StyleSheet.hairlineWidth, paddingTop: Spacing.xl, marginTop: Spacing.lg },
  center: { textAlign: 'center' },
});
