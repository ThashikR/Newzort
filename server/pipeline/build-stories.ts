/**
 * Steps 3–4 (+ extractive summary): DUPLICATE DETECTION, STORY CLUSTERING,
 * CATEGORISATION and IMPORTANCE — no AI yet.
 *
 * Similarity uses IDF weighting: words that appear in many headlines
 * ("India", "says", "new") count for little; rare shared words
 * ("semiconductor", "Nvidia", a person's name) count for a lot. This stops
 * unrelated "India …" headlines from being merged.
 */
import type { NewsSource, StoryCluster, TopicId } from '../../src/types/news';

import { tokens } from './clustering';
import type { IngestedArticle } from './ingest';

// Tuned on real feeds (scripts/inspect-similarity.ts): same-event pairs from
// different publishers score ≥ 0.19; the first false pairs appear ≈ 0.16–0.18.
const SIMILARITY_THRESHOLD = 0.19;
const WINDOW_HOURS = 36;

// ── Similarity ────────────────────────────────────────────────────────────────

function docTokens(a: IngestedArticle): Set<string> {
  // Headline words, plus the first words of the excerpt for extra context.
  const lead = a.excerpt.split(' ').slice(0, 20).join(' ');
  return new Set([...tokens(a.title), ...tokens(lead)]);
}

function weightedJaccard(a: Set<string>, b: Set<string>, idf: Map<string, number>): number {
  let inter = 0;
  let union = 0;
  for (const t of new Set([...a, ...b])) {
    const w = idf.get(t) ?? 0;
    union += w;
    if (a.has(t) && b.has(t)) inter += w;
  }
  return union === 0 ? 0 : inter / union;
}

export function clusterIngested(articles: IngestedArticle[]): IngestedArticle[][] {
  const docs = articles.map(docTokens);
  const df = new Map<string, number>();
  docs.forEach((d) => d.forEach((t) => df.set(t, (df.get(t) ?? 0) + 1)));
  const idf = new Map([...df].map(([t, n]) => [t, Math.log((articles.length + 1) / n)]));

  const parent = articles.map((_, i) => i);
  const find = (i: number): number => (parent[i] === i ? i : (parent[i] = find(parent[i])));

  for (let i = 0; i < articles.length; i++) {
    for (let j = i + 1; j < articles.length; j++) {
      const hours = Math.abs(Date.parse(articles[i].publishedAt) - Date.parse(articles[j].publishedAt)) / 3_600_000;
      if (hours > WINDOW_HOURS) continue;
      if (weightedJaccard(docs[i], docs[j], idf) >= SIMILARITY_THRESHOLD) parent[find(i)] = find(j);
    }
  }

  const groups = new Map<number, IngestedArticle[]>();
  articles.forEach((a, i) => groups.set(find(i), [...(groups.get(find(i)) ?? []), a]));
  return [...groups.values()];
}

// ── Categorisation ────────────────────────────────────────────────────────────

/** Stricter than the app's search keywords: these decide a story's category. Order = priority. */
const CATEGORY_RULES: [TopicId, RegExp][] = [
  ['cybersecurity', /\b(cyber|ransomware|malware|phishing|hack(ers?|ed)?|breach|vulnerabilit(y|ies)|zero-day|exploit|CVE-\d+)/i],
  ['ai', /\b(AI|A\.I\.|artificial intelligence|machine learning|LLMs?|chatbots?|OpenAI|ChatGPT|Anthropic|Claude|Gemini|generative)\b/],
  ['space', /\b(ISRO|NASA|spacecraft|satellite|orbit|astronaut|rocket|lunar|Mars|moon mission|space station)\b/i],
  ['health', /\b(health|hospital|disease|virus|vaccine|cancer|patients?|medical|WHO|outbreak)\b/i],
  ['environment', /\b(climate|monsoon|flood|heatwave|emissions|pollution|wildfire|renewable|solar power|cyclone)\b/i],
  ['sports', /\b(cricket|football|IPL|Olympic|FIFA|tennis|hockey|T20|World Cup|Test match)\b/i],
  ['entertainment', /\b(film|movie|Bollywood|actor|actress|box office|Netflix|album|singer)\b/i],
  ['education', /\b(school|university|students?|exam|NEET|JEE|UGC|CBSE|education)\b/i],
  ['startups', /\b(startup|start-up|funding round|Series [A-D]|venture capital|unicorn|founders?)\b/i],
  ['finance', /\b(Sensex|Nifty|stock market|shares|investors|IPO|bond|mutual fund|SEBI)\b/i],
  ['economy', /\b(economy|economic|inflation|GDP|RBI|interest rates?|repo rate|fiscal|tariffs?|recession|trade deficit|trade war|cash rate|central bank)\b/i],
  ['geopolitics', /\b(summit|diplomat(ic|s)?|sanctions|treaty|border|ceasefire|NATO|UN Security Council|bilateral|war|missiles?|drone strikes?|airstrikes?|troops|military|invasion)\b/i],
  ['politics', /\b(election|minister|parliament|Lok Sabha|Rajya Sabha|BJP|Congress party|opposition|MPs?|MLAs?|polls?)\b/],
  ['science', /\b(scientists?|researchers?|study finds|physics|biology|species|fossil|genome)\b/i],
  ['technology', /\b(tech|smartphone|software|chips?|semiconductor|Apple|Google|Microsoft|Meta|Samsung|app)\b/],
];

const INDIA = /\b(India|Indian|Delhi|Mumbai|Bengaluru|Chennai|Kolkata|Hyderabad|Kerala|Gujarat|Punjab|Centre|Modi)\b/;

const countMatches = (re: RegExp, s: string) => (s.match(new RegExp(re.source, re.flags + 'g')) ?? []).length;

function categorise(group: IngestedArticle[]): { category: TopicId; topics: TopicId[]; country: string | null } {
  const titles = group.map((a) => a.title).join(' ');
  const excerpts = group.map((a) => a.excerpt).join(' ');
  const text = `${titles} ${excerpts}`;

  // Score each category: a headline match counts 3×, an excerpt match 1×.
  // A category needs a headline match or 2+ excerpt matches to count.
  const scored = CATEGORY_RULES.map(([topic, re], order) => ({
    topic,
    order,
    score: 3 * countMatches(re, titles) + countMatches(re, excerpts),
  }))
    .filter((c) => c.score >= 2)
    .sort((a, b) => b.score - a.score || a.order - b.order);
  const matched = scored.map((c) => c.topic);

  const hinted = group.flatMap((a) => a.feed.topics);
  const isIndia = INDIA.test(text) || group.every((a) => a.feed.source.country === 'IN' && a.feed.topics.includes('india'));

  const topics = [...new Set<TopicId>([...matched, ...hinted.filter((t) => t !== 'india' || isIndia), ...(isIndia ? (['india'] as TopicId[]) : [])])];
  // Category: strongest keyword match; otherwise the feed's own topic; otherwise India/World.
  const category =
    matched[0] ?? hinted.find((t) => t !== 'india' && t !== 'world') ?? (isIndia ? 'india' : 'world');
  return { category, topics: [category, ...topics.filter((t) => t !== category)], country: isIndia ? 'IN' : null };
}

// ── Story assembly ────────────────────────────────────────────────────────────

function hashId(s: string): string {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) >>> 0;
  return h.toString(36);
}

/**
 * Importance without AI: how many independent publishers covered it,
 * how reliable they are, and how recent it is. 0–100.
 */
function importance(group: IngestedArticle[], sources: NewsSource[], now: number): number {
  // Independent coverage is the strongest signal: 2 publishers ≈ "Must Know" territory.
  const breadth = Math.min(sources.length - 1, 4) * 15;
  const bestReliability = Math.max(...sources.map((s) => s.reliability));
  const newestHours = Math.min(...group.map((a) => (now - Date.parse(a.publishedAt)) / 3_600_000));
  const recency = newestHours < 6 ? 8 : newestHours < 12 ? 4 : 0;
  return Math.round(Math.min(95, 42 + breadth + (bestReliability - 0.8) * 60 + recency));
}

export function toStoryCluster(group: IngestedArticle[], now = Date.now()): StoryCluster {
  const sources = [...new Map(group.map((a) => [a.feed.source.id, a.feed.source])).values()];
  const byReliability = [...group].sort(
    (a, b) => b.feed.source.reliability - a.feed.source.reliability || Date.parse(b.publishedAt) - Date.parse(a.publishedAt),
  );
  const lead = byReliability[0];
  const summary = lead.excerpt || byReliability.find((a) => a.excerpt)?.excerpt || '';
  const { category, topics, country } = categorise(group);
  const times = group.map((a) => Date.parse(a.publishedAt));
  const earliest = group.find((a) => Date.parse(a.publishedAt) === Math.min(...times))!;

  // Extractive "key points": what each OTHER publisher's headline says (never invented).
  const coverage = byReliability
    .filter((a) => a !== lead)
    .map((a) => `${a.feed.source.name}: ${a.title}`)
    .filter((line, i, arr) => arr.indexOf(line) === i)
    .slice(0, 5);

  return {
    analysisMode: 'extractive',
    clusterId: `c-${hashId(earliest.url)}`,
    canonicalHeadline: lead.title,
    category,
    country,
    publishedAt: new Date(Math.min(...times)).toISOString(),
    updatedAt: new Date(Math.max(...times)).toISOString(),
    importanceScore: importance(group, sources, now),
    readMinutes: Math.min(2, (summary ? 0.75 : 0.5) + 0.25 * (group.length - 1)),
    // Headline-only items (no excerpt) are the 30-second reads.
    isQuickRead: !summary && sources.length === 1,
    analysis: {
      headline: lead.title,
      summary,
      whatHappened: '',
      keyPoints: coverage,
      whyItMatters: '',
      background: '',
      whatHappensNext: null,
      topics,
      entities: [],
      confidence: sources.length >= 3 ? 'high' : sources.length === 2 ? 'medium' : 'low',
    },
    articles: byReliability.map((a) => ({
      id: a.id,
      sourceId: a.feed.source.id,
      headline: a.title,
      url: a.url,
      publishedAt: a.publishedAt,
      excerpt: a.excerpt || undefined,
    })),
    sources,
    isDemo: false,
  };
}
