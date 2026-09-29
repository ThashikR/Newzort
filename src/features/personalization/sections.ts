import type { HomeSections } from '@/services/types';
import type { RankedStory } from '@/types/news';
import type { BriefingLength, UserProfile } from '@/types/user';

import { sourceQuality } from './score';

const MUST_KNOW_COUNT: Record<BriefingLength, number> = { 5: 3, 10: 4, 15: 5, 30: 6 };

/**
 * Splits ranked stories into Home sections. Each story appears once.
 *   Must Know  — high importance, well sourced, weighted by relevance
 *   For You    — matches the user's interests
 *   Quick Read — short items
 *   Explore    — everything else
 * Stories marked "Not interested" are excluded everywhere.
 */
export function buildHomeSections(ranked: RankedStory[], profile: UserProfile): HomeSections {
  const hidden = new Set(profile.dislikedIds);
  const pool = ranked.filter((r) => !hidden.has(r.story.clusterId));
  const used = new Set<string>();
  const take = (list: RankedStory[]) => {
    list.forEach((r) => used.add(r.story.clusterId));
    return list;
  };

  const mustKnowScore = (r: RankedStory) =>
    0.5 * (r.story.importanceScore / 100) + 0.3 * r.relevanceScore + 0.2 * sourceQuality(r.story);

  const mustKnow = take(
    pool
      .filter((r) => r.story.importanceScore >= 65 && !r.story.isQuickRead)
      .sort((a, b) => mustKnowScore(b) - mustKnowScore(a))
      .slice(0, MUST_KNOW_COUNT[profile.briefingLength]),
  );

  const forYou = take(
    pool.filter((r) => !used.has(r.story.clusterId) && r.interestMatch > 0 && !r.story.isQuickRead).slice(0, 8),
  );

  const quickReads = take(pool.filter((r) => !used.has(r.story.clusterId) && r.story.isQuickRead).slice(0, 6));

  const explore = pool.filter((r) => !used.has(r.story.clusterId));

  return { mustKnow, forYou, quickReads, explore };
}
