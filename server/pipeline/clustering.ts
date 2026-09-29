/**
 * Reference story clustering (steps 3–4): groups articles about the same event.
 *
 * v1 uses headline token overlap with light synonym normalisation. Example:
 *   "India announces new semiconductor incentives"   (The Hindu)
 *   "Centre expands semiconductor programme"          (Indian Express)
 *   "India boosts semiconductor investment"           (Reuters)
 * → one cluster, because they share "india" + "semiconductor" and fall in the
 *   same time window.
 *
 * Production should replace `similarity` with embedding cosine similarity
 * (plus entity overlap) — the grouping logic below stays the same.
 */

export interface ClusterableArticle {
  id: string;
  title: string;
  publishedAt: string;
}

const STOP_WORDS = new Set(
  'a an the of to in on for and or as at by with from new says said amid after over into its it is are be this that'.split(' '),
);

/** Map different words for the same thing onto one token. */
const SYNONYMS: Record<string, string> = {
  centre: 'india',
  indian: 'india',
  government: 'india',
  chip: 'semiconductor',
  chips: 'semiconductor',
  semiconductors: 'semiconductor',
  programme: 'incentive',
  program: 'incentive',
  incentives: 'incentive',
  scheme: 'incentive',
  investment: 'incentive',
  subsidies: 'incentive',
};

export function tokens(title: string): Set<string> {
  return new Set(
    title
      .toLowerCase()
      .replace(/[’']s\b/g, '')
      .split(/[^a-z0-9]+/)
      .filter((w) => w.length > 2 && !STOP_WORDS.has(w))
      .map((w) => SYNONYMS[w] ?? w),
  );
}

/** Jaccard overlap of normalised headline tokens, 0–1. */
export function similarity(a: string, b: string): number {
  const ta = tokens(a);
  const tb = tokens(b);
  const inter = [...ta].filter((t) => tb.has(t)).length;
  const union = new Set([...ta, ...tb]).size;
  return union === 0 ? 0 : inter / union;
}

/**
 * Single-link clustering with a time window: two articles join if they are
 * similar enough AND published within `windowHours` of each other.
 */
export function clusterArticles<T extends ClusterableArticle>(
  articles: T[],
  { threshold = 0.3, windowHours = 36 }: { threshold?: number; windowHours?: number } = {},
): T[][] {
  const parent = articles.map((_, i) => i);
  const find = (i: number): number => (parent[i] === i ? i : (parent[i] = find(parent[i])));

  for (let i = 0; i < articles.length; i++) {
    for (let j = i + 1; j < articles.length; j++) {
      const hours =
        Math.abs(new Date(articles[i].publishedAt).getTime() - new Date(articles[j].publishedAt).getTime()) / 3_600_000;
      if (hours <= windowHours && similarity(articles[i].title, articles[j].title) >= threshold) {
        parent[find(i)] = find(j);
      }
    }
  }

  const groups = new Map<number, T[]>();
  articles.forEach((a, i) => {
    const root = find(i);
    groups.set(root, [...(groups.get(root) ?? []), a]);
  });
  return [...groups.values()];
}
