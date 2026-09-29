/**
 * Demo "Ask AI" engine — answers strictly from the story clusters in the app,
 * without an LLM. It demonstrates the answer contract the real backend must
 * follow: facts (traceable to a story + its sources), analysis, uncertainty.
 */
import { TOPICS, topicLabel } from '@/constants/topics';
import type { AskContext } from '@/services/types';
import type { AssistantAnswer, AssistantFact } from '@/types/ai';
import type { StoryCluster, TopicId } from '@/types/news';
import { hoursSince } from '@/utils/time';

const has = (q: string, ...needles: string[]) => needles.some((n) => new RegExp(`\\b${n}`, 'i').test(q));

function detectTopics(question: string): TopicId[] {
  const q = question.toLowerCase();
  return TOPICS.filter((t) =>
    [t.label.toLowerCase(), ...t.keywords].some((k) => new RegExp(`\\b${k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`).test(q)),
  ).map((t) => t.id);
}

const sourceNames = (s: StoryCluster) => s.sources.map((x) => x.name);
const byImportance = (a: StoryCluster, b: StoryCluster) => b.importanceScore - a.importanceScore;
const isRecent = (s: StoryCluster) => hoursSince(s.updatedAt) < 24;

function storyFacts(s: StoryCluster, count: number): AssistantFact[] {
  return s.analysis.keyPoints.slice(0, count).map((text) => ({ text, clusterId: s.clusterId, sourceNames: sourceNames(s) }));
}

function uncertaintyFor(stories: StoryCluster[]): string[] {
  const notes: string[] = [];
  for (const s of stories) {
    if (s.analysis.confidence !== 'high') {
      notes.push(`“${s.canonicalHeadline}” has ${s.analysis.confidence} confidence — sources differ on some details.`);
    }
    if (s.sources.length === 1) {
      notes.push(`“${s.canonicalHeadline}” is based on a single source so far.`);
    }
  }
  return notes;
}

export function demoAnswer(question: string, ctx: AskContext): AssistantAnswer {
  // Every answer passes through here: drop empty analysis text (headline-only
  // stories have none) and say so honestly instead of filling the gap.
  const answer = (q: string, a: Omit<AssistantAnswer, 'question' | 'generatedBy'>): AssistantAnswer => {
    const related = a.relatedClusterIds.map((id) => ctx.stories.find((s) => s.clusterId === id));
    const headlineOnly = related.some((s) => s?.analysisMode === 'extractive');
    return {
      question: q,
      generatedBy: 'demo',
      ...a,
      facts: a.facts.filter((f) => f.text.trim()),
      analysis: a.analysis.filter((x) => x.trim()),
      uncertainty: [
        ...a.uncertainty.filter((x) => x.trim()),
        ...(headlineOnly
          ? ['Some of these stories are headlines only — Vartify hasn’t analysed them with AI yet, so there’s no “why it matters” to share.']
          : []),
      ],
    };
  };

  const q = question.trim();
  const focus = ctx.focusClusterId ? ctx.stories.find((s) => s.clusterId === ctx.focusClusterId) : undefined;

  // 1. Questions about the story the user is looking at.
  if (focus && has(q, 'why', 'important', 'matter', 'significan', 'impact')) {
    return answer(q, {
      intro: `Here's why “${focus.canonicalHeadline}” matters, based on ${focus.sources.length} source${focus.sources.length > 1 ? 's' : ''}.`,
      facts: storyFacts(focus, 3),
      analysis: [focus.analysis.whyItMatters],
      uncertainty: [
        focus.analysis.whatHappensNext ?? 'The sources do not describe what happens next.',
        ...uncertaintyFor([focus]),
      ],
      relatedClusterIds: [focus.clusterId],
    });
  }
  if (focus && has(q, 'background', 'context', 'history', 'explain', 'what happened')) {
    return answer(q, {
      intro: `Background on “${focus.canonicalHeadline}”.`,
      facts: [
        { text: focus.analysis.whatHappened, clusterId: focus.clusterId, sourceNames: sourceNames(focus) },
        ...storyFacts(focus, 2),
      ],
      analysis: [focus.analysis.background],
      uncertainty: uncertaintyFor([focus]),
      relatedClusterIds: [focus.clusterId],
    });
  }

  // 2. Today vs yesterday.
  if (has(q, 'compare', 'yesterday', 'changed', 'difference')) {
    const today = ctx.stories.filter(isRecent).sort(byImportance);
    const earlier = ctx.stories.filter((s) => !isRecent(s)).sort(byImportance);
    const countBy = (list: StoryCluster[]) =>
      list.reduce<Record<string, number>>((m, s) => ((m[topicLabel(s.category)] = (m[topicLabel(s.category)] ?? 0) + 1), m), {});
    const todayCounts = countBy(today);
    const busiest = Object.entries(todayCounts).sort((a, b) => b[1] - a[1])[0];
    return answer(q, {
      intro: `Today's feed has ${today.length} stories; the previous day had ${earlier.length} in Vartify.`,
      facts: [
        ...(today[0] ? [{ text: `Top story today: ${today[0].canonicalHeadline}.`, clusterId: today[0].clusterId, sourceNames: sourceNames(today[0]) }] : []),
        ...(earlier[0] ? [{ text: `Top story yesterday: ${earlier[0].canonicalHeadline}.`, clusterId: earlier[0].clusterId, sourceNames: sourceNames(earlier[0]) }] : []),
      ],
      analysis: busiest ? [`${busiest[0]} has the most coverage today (${busiest[1]} stories).`] : [],
      uncertainty: ['This comparison only covers stories in the Vartify feed, not all news published.'],
      relatedClusterIds: [...today.slice(0, 2), ...earlier.slice(0, 1)].map((s) => s.clusterId),
    });
  }

  // 3. Topic questions ("What happened in India's economy today?") or general top news.
  const topics = detectTopics(q);
  let pool = ctx.stories;
  if (topics.length > 0) {
    // Prefer stories matching ALL mentioned topics; fall back to ANY.
    const tagsOf = (s: StoryCluster) => new Set([s.category, ...s.analysis.topics]);
    const all = pool.filter((s) => topics.every((t) => tagsOf(s).has(t)));
    pool = all.length > 0 ? all : pool.filter((s) => topics.some((t) => tagsOf(s).has(t)));
  }
  if (has(q, 'today')) {
    const recent = pool.filter(isRecent);
    if (recent.length > 0) pool = recent;
  }
  const stories = [...pool].sort(byImportance).slice(0, 3);
  const topicText = topics.map(topicLabel).join(' and ');

  if (stories.length === 0) {
    return answer(q, {
      intro: topicText
        ? `I couldn't find any ${topicText} stories in today's Vartify feed.`
        : `I couldn't find stories in today's feed that answer that.`,
      facts: [],
      analysis: [],
      uncertainty: ['I only answer from stories in the Vartify feed, so I won’t guess beyond them.'],
      relatedClusterIds: [],
    });
  }

  return answer(q, {
    intro: topicText
      ? `The most important ${topicText} ${stories.length > 1 ? 'stories' : 'story'} in your feed:`
      : `The most important stories in your feed right now:`,
    facts: stories.flatMap((s) => [
      { text: `${s.canonicalHeadline}. ${s.analysis.summary}`, clusterId: s.clusterId, sourceNames: sourceNames(s) },
    ]),
    analysis: stories.map((s) => s.analysis.whyItMatters),
    uncertainty: [
      ...stories.map((s) => s.analysis.whatHappensNext).filter((x): x is string => !!x).slice(0, 2),
      ...uncertaintyFor(stories),
    ],
    relatedClusterIds: stories.map((s) => s.clusterId),
  });
}
