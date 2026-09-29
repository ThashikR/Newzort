/**
 * Relevance scoring (v1, rule-based).
 *
 *   relevance = interest match + importance + freshness + source quality + user behaviour
 *
 * Every factor is normalised to 0–1 and combined with explicit weights, so
 * each can be tuned or replaced (e.g. by a learned model) independently.
 */
import type { RankedStory, StoryCluster, TopicId } from '@/types/news';
import type { InterestPriority, UserProfile } from '@/types/user';
import { hoursSince } from '@/utils/time';

export const WEIGHTS = {
  interest: 0.35,
  importance: 0.25,
  freshness: 0.15,
  sourceQuality: 0.1,
  behaviour: 0.15,
} as const;

const PRIORITY_WEIGHT: Record<InterestPriority, number> = { high: 1, medium: 0.65, low: 0.35 };

/** Best-matching interest, with a small bonus for matching several. */
export function interestMatch(story: StoryCluster, profile: UserProfile): { score: number; matched: TopicId[] } {
  const weights = new Map(profile.interests.map((i) => [i.topic, PRIORITY_WEIGHT[i.priority]]));
  const topics = new Set<TopicId>([story.category, ...story.analysis.topics]);
  const matched = [...topics].filter((t) => weights.has(t));
  if (matched.length === 0) return { score: 0, matched };
  const best = Math.max(...matched.map((t) => weights.get(t)!));
  return { score: Math.min(1, best + 0.1 * (matched.length - 1)), matched };
}

/** Half-life of ~18 hours: a story loses half its freshness in that time. */
export function freshness(story: StoryCluster, now: number): number {
  return Math.pow(0.5, hoursSince(story.updatedAt, now) / 18);
}

/** More, and more reliable, independent sources → higher confidence in the story. */
export function sourceQuality(story: StoryCluster): number {
  if (story.sources.length === 0) return 0;
  const avgReliability = story.sources.reduce((s, x) => s + x.reliability, 0) / story.sources.length;
  const breadth = Math.min(1, story.sources.length / 4);
  return 0.6 * avgReliability + 0.4 * breadth;
}

/**
 * Behaviour: topics of liked stories pull similar stories up; topics of
 * "not interested" stories push them down. Returns −1…1.
 */
export function behaviour(story: StoryCluster, profile: UserProfile, allStories: Map<string, StoryCluster>): number {
  const topicsOf = (ids: string[]) =>
    ids.flatMap((id) => {
      const s = allStories.get(id);
      return s ? [s.category, ...s.analysis.topics] : [];
    });
  const liked = topicsOf(profile.likedIds);
  const disliked = topicsOf(profile.dislikedIds);
  if (liked.length === 0 && disliked.length === 0) return 0;

  const mine = new Set([story.category, ...story.analysis.topics]);
  const likedHits = liked.filter((t) => mine.has(t)).length;
  const dislikedHits = disliked.filter((t) => mine.has(t)).length;
  return Math.max(-1, Math.min(1, (likedHits - dislikedHits) / 4));
}

export function rankStories(stories: StoryCluster[], profile: UserProfile, now: number = Date.now()): RankedStory[] {
  const byId = new Map(stories.map((s) => [s.clusterId, s]));
  return stories
    .map((story) => {
      const interest = interestMatch(story, profile);
      const score =
        WEIGHTS.interest * interest.score +
        WEIGHTS.importance * (story.importanceScore / 100) +
        WEIGHTS.freshness * freshness(story, now) +
        WEIGHTS.sourceQuality * sourceQuality(story) +
        WEIGHTS.behaviour * behaviour(story, profile, byId);
      return {
        story,
        relevanceScore: Math.max(0, Math.min(1, score)),
        interestMatch: interest.score,
        matchedTopics: interest.matched,
      };
    })
    .sort((a, b) => b.relevanceScore - a.relevanceScore);
}
