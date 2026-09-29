import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { StoryRow } from '@/components/story/story-row';
import { Chip } from '@/components/ui/chip';
import { Card, Divider, EmptyState, Screen, SectionHeader } from '@/components/ui/layout';
import { AppText } from '@/components/ui/text';
import { Radius, Spacing } from '@/constants/theme';
import { TOPICS, topicLabel } from '@/constants/topics';
import { useTheme } from '@/hooks/use-theme';
import { newsService, type SearchResult, type SearchScope } from '@/services';
import { useNews } from '@/state/news-store';
import { useUser } from '@/state/user-store';
import type { TopicId } from '@/types/news';

const SCOPES: { value: SearchScope; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'topics', label: 'Topics' },
  { value: 'companies', label: 'Companies & orgs' },
  { value: 'people', label: 'People' },
  { value: 'countries', label: 'Countries' },
];

const SUGGESTIONS = ['India semiconductor', 'RBI inflation', 'Cybersecurity', 'AI safety', 'Space', 'Climate'];

export default function ExploreScreen() {
  const { colors } = useTheme();
  const { stories } = useNews();
  const { profile } = useUser();
  const params = useLocalSearchParams<{ topic?: string }>();
  const topic = TOPICS.some((t) => t.id === params.topic) ? (params.topic as TopicId) : undefined;

  const [query, setQuery] = useState('');
  const [scope, setScope] = useState<SearchScope>('all');
  const [results, setResults] = useState<SearchResult[] | null>(null);

  const trimmed = query.trim();

  useEffect(() => {
    if (!trimmed) return;
    let cancelled = false;
    const timer = setTimeout(() => {
      newsService
        .search(trimmed, scope)
        .then((r) => !cancelled && setResults(r))
        .catch(() => !cancelled && setResults([]));
    }, 200);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [trimmed, scope]);

  const hidden = new Set(profile.dislikedIds);
  const visible = stories.filter((s) => !hidden.has(s.clusterId));
  const countFor = (id: TopicId) => visible.filter((s) => s.category === id || s.analysis.topics.includes(id)).length;
  const topicStories = topic
    ? visible
        .filter((s) => s.category === topic || s.analysis.topics.includes(topic))
        .sort((a, b) => b.importanceScore - a.importanceScore)
    : [];

  return (
    <Screen>
      <View style={styles.header}>
        <AppText variant="title" accessibilityRole="header">
          Explore
        </AppText>
        <AppText variant="body" color="textSecondary">
          Search stories, topics, organisations, people and countries.
        </AppText>
      </View>

      <View style={[styles.searchBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Ionicons name="search" size={18} color={colors.textTertiary} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Try “India semiconductor”"
          placeholderTextColor={colors.textTertiary}
          returnKeyType="search"
          autoCorrect={false}
          accessibilityLabel="Search news"
          style={[styles.input, { color: colors.text }]}
        />
        {query.length > 0 && (
          <Pressable onPress={() => setQuery('')} accessibilityRole="button" accessibilityLabel="Clear search" hitSlop={8}>
            <Ionicons name="close-circle" size={18} color={colors.textTertiary} />
          </Pressable>
        )}
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
        {SCOPES.map((s) => (
          <Chip key={s.value} label={s.label} selected={scope === s.value} onPress={() => setScope(s.value)} />
        ))}
      </ScrollView>

      <Pressable
        onPress={() => router.push('/ask')}
        accessibilityRole="button"
        accessibilityLabel="Ask Vartify AI about today's news"
        style={({ pressed }) => [styles.askCard, { backgroundColor: colors.accentSoft, opacity: pressed ? 0.8 : 1 }]}>
        <Ionicons name="sparkles-outline" size={22} color={colors.accent} />
        <View style={styles.flex}>
          <AppText variant="label" color="accent">
            Ask Vartify AI
          </AppText>
          <AppText variant="bodySm" color="textSecondary">
            “Explain today’s AI news to me”
          </AppText>
        </View>
        <Ionicons name="chevron-forward" size={18} color={colors.accent} />
      </Pressable>

      {trimmed ? (
        <>
          <SectionHeader title={results ? `${results.length} result${results.length === 1 ? '' : 's'}` : 'Searching…'} />
          {results && results.length === 0 && (
            <EmptyState
              icon="search-outline"
              title="No matching stories"
              message="Try fewer words, a broader topic, or switch the filter to All."
            />
          )}
          {results && results.length > 0 && (
            <Card>
              {results.map((r, i) => (
                <View key={r.story.clusterId}>
                  {i > 0 && <Divider />}
                  <StoryRow story={r.story} note={r.matchedOn.join(', ') || undefined} />
                </View>
              ))}
            </Card>
          )}
        </>
      ) : topic ? (
        <>
          <View style={styles.topicHeader}>
            <AppText variant="headline" style={styles.flex}>
              {topicLabel(topic)}
            </AppText>
            <Pressable
              onPress={() => router.setParams({ topic: undefined })}
              accessibilityRole="button"
              accessibilityLabel="Show all topics"
              style={[styles.clearTopic, { borderColor: colors.border }]}>
              <AppText variant="bodySm" color="textSecondary">
                All topics
              </AppText>
              <Ionicons name="close" size={14} color={colors.textSecondary} />
            </Pressable>
          </View>
          {topicStories.length === 0 ? (
            <EmptyState icon="newspaper-outline" title="No stories today" message={`Nothing on ${topicLabel(topic)} in today’s feed yet.`} />
          ) : (
            <Card>
              {topicStories.map((s, i) => (
                <View key={s.clusterId}>
                  {i > 0 && <Divider />}
                  <StoryRow story={s} />
                </View>
              ))}
            </Card>
          )}
        </>
      ) : (
        <>
          <SectionHeader title="Suggested searches" />
          <View style={styles.wrap}>
            {SUGGESTIONS.map((s) => (
              <Chip key={s} label={s} onPress={() => setQuery(s)} />
            ))}
          </View>

          <SectionHeader title="Browse topics" />
          <View style={styles.grid}>
            {TOPICS.map((t) => {
              const n = countFor(t.id);
              return (
                <Pressable
                  key={t.id}
                  onPress={() => router.setParams({ topic: t.id })}
                  accessibilityRole="button"
                  accessibilityLabel={`${t.label}, ${n} stories`}
                  style={({ pressed }) => [
                    styles.tile,
                    { backgroundColor: colors.surface, borderColor: colors.border, opacity: pressed ? 0.7 : n === 0 ? 0.55 : 1 },
                  ]}>
                  <AppText variant="label" numberOfLines={2}>
                    {t.label}
                  </AppText>
                  <AppText variant="caption">{n === 0 ? 'No stories today' : `${n} ${n === 1 ? 'story' : 'stories'}`}</AppText>
                </Pressable>
              );
            })}
          </View>
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: { gap: Spacing.xs },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    borderWidth: 1,
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.lg,
    minHeight: 48,
  },
  input: { flex: 1, fontSize: 16, paddingVertical: Spacing.sm },
  chipRow: { gap: Spacing.sm, paddingRight: Spacing.lg },
  askCard: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, borderRadius: Radius.lg, padding: Spacing.lg },
  topicHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, marginTop: Spacing.md },
  clearTopic: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.md,
    minHeight: 34,
  },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  tile: {
    width: '48.5%',
    flexGrow: 1,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: Radius.md,
    padding: Spacing.md,
    gap: 2,
    minHeight: 70,
  },
});
