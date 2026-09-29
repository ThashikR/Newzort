import type { HomeSections } from '@/services/types';
import type { RankedStory, TopicId } from '@/types/news';
import type { BriefingLength, UserProfile } from '@/types/user';

export interface BriefingSection {
  topic: TopicId;
  stories: RankedStory[];
}

export interface Briefing {
  lengthMinutes: BriefingLength;
  totalMinutes: number;
  counts: { mustKnow: number; forYou: number; quickReads: number; more: number };
  /** Stories grouped by topic, ordered by the user's priorities. */
  sections: BriefingSection[];
  storyIds: string[];
}

const PRIORITY_RANK = { high: 0, medium: 1, low: 2 } as const;

/** Share of the time budget reserved for quick reads, so every briefing has some. */
const QUICK_READ_SHARE = 0.2;

/**
 * Fits stories into the chosen time budget, in order:
 * Must Know → a slice of Quick Reads → For You → remaining Quick Reads → Explore.
 */
export function buildBriefing(home: HomeSections, profile: UserProfile): Briefing {
  const budget = profile.briefingLength;
  const picked: { r: RankedStory; bucket: keyof Briefing['counts'] }[] = [];
  const pickedIds = new Set<string>();
  let minutes = 0;

  const fill = (list: RankedStory[], bucket: keyof Briefing['counts'], limit: number, always = false) => {
    for (const r of list) {
      if (pickedIds.has(r.story.clusterId)) continue;
      if (!always && minutes + r.story.readMinutes > limit) continue;
      picked.push({ r, bucket });
      pickedIds.add(r.story.clusterId);
      minutes += r.story.readMinutes;
    }
  };

  fill(home.mustKnow, 'mustKnow', budget, true);
  fill(home.quickReads, 'quickReads', Math.min(budget, minutes + budget * QUICK_READ_SHARE));
  fill(home.forYou, 'forYou', budget);
  fill(home.quickReads, 'quickReads', budget);
  fill(home.explore, 'more', budget);

  const counts = { mustKnow: 0, forYou: 0, quickReads: 0, more: 0 };
  picked.forEach((p) => counts[p.bucket]++);

  const priorityOf = (t: TopicId) => {
    const i = profile.interests.find((x) => x.topic === t);
    return i ? PRIORITY_RANK[i.priority] : 3;
  };

  const groups = new Map<TopicId, RankedStory[]>();
  for (const { r } of picked) {
    const list = groups.get(r.story.category) ?? [];
    list.push(r);
    groups.set(r.story.category, list);
  }
  const sections = [...groups.entries()]
    .map(([topic, stories]) => ({ topic, stories }))
    .sort((a, b) => priorityOf(a.topic) - priorityOf(b.topic) || b.stories.length - a.stories.length);

  return {
    lengthMinutes: budget,
    totalMinutes: Math.round(minutes),
    counts,
    sections,
    storyIds: sections.flatMap((s) => s.stories.map((r) => r.story.clusterId)),
  };
}
