/**
 * Offline test of the AI step with a FAKE provider (no real API calls).
 * Checks: batching, JSON parsing, citation validation, fallback on errors,
 * and reuse of previous results.
 *   npx tsx scripts/test-ai-pipeline.ts
 */
import type { StoryCluster } from '../../src/types/news';
import { analyseWithAi, PROMPT_VERSION } from '../pipeline/ai-analyze';

function story(id: string, n: number): StoryCluster {
  const articles = Array.from({ length: n }, (_, i) => ({
    id: `${id}-a${i}`,
    sourceId: `src${i}`,
    headline: `Headline ${i} about ${id}`,
    url: `https://example.com/${id}/${i}`,
    publishedAt: new Date().toISOString(),
    excerpt: `Excerpt ${i}.`,
  }));
  return {
    analysisMode: 'extractive',
    clusterId: id,
    canonicalHeadline: `Original ${id}`,
    category: 'world',
    country: null,
    publishedAt: articles[0].publishedAt,
    updatedAt: articles[0].publishedAt,
    importanceScore: 50,
    readMinutes: 1,
    isQuickRead: false,
    analysis: { headline: '', summary: '', whatHappened: '', keyPoints: [], whyItMatters: '', background: '', whatHappensNext: null, topics: ['world'], entities: [], confidence: 'low' },
    articles,
    sources: articles.map((a) => ({ id: a.sourceId, name: `Source ${a.sourceId}`, kind: 'wire', homepage: 'https://example.com', country: 'IN', reliability: 0.9 })),
    isDemo: false,
  };
}

const good = (s: StoryCluster) => ({
  clusterId: s.clusterId,
  headline: `AI headline for ${s.clusterId}`,
  summary: 'A short summary.',
  whatHappened: 'Something happened.',
  keyPoints: ['Point A', 'Point B', 'Point C', 'Made-up point'],
  evidence: [
    { keyPoint: 0, articleIds: [s.articles[0].id] },
    { keyPoint: 1, articleIds: [s.articles[1].id] },
    { keyPoint: 2, articleIds: [s.articles[0].id, s.articles[1].id] },
    { keyPoint: 3, articleIds: ['not-a-real-article'] }, // must be dropped
  ],
  whyItMatters: 'It matters.',
  background: '',
  whatHappensNext: null,
  topics: ['economy', 'not-a-topic'],
  entities: [{ name: 'RBI', type: 'organization' }, { name: 'X', type: 'alien' }],
  confidence: 'high',
  importance: 90,
});

const stories = ['s1', 's2', 's3', 's4', 's5', 's6'].map((id) => story(id, 2));
const previous = [
  { ...story('s5', 2), analysisMode: 'ai' as const, analysisVersion: PROMPT_VERSION, canonicalHeadline: 'Cached s5' },
  { ...story('s6', 2), analysisMode: 'ai' as const, analysisVersion: 1, canonicalHeadline: 'Old Prompt Headline' }, // must be redone
];

let calls = 0;
globalThis.fetch = (async (url: string) => {
  calls++;
  // Model discovery: a realistic list with models we must NOT pick.
  if (String(url).includes('/v1beta/models?')) {
    const m = (name: string) => ({ name: `models/${name}`, supportedGenerationMethods: ['generateContent'] });
    return new Response(
      JSON.stringify({ models: [m('gemini-2.5-pro'), m('gemini-3.8-flash'), m('gemini-3.8-flash-preview-tts'), m('gemini-3.5-flash-lite'), m('gemini-3.1-flash')] }),
      { status: 200 },
    );
  }
  if (String(url).includes('gemini-3.8-flash:')) return new Response('quota', { status: 429 }); // first model rate-limited → fallback
  const body = { stories: stories.filter((s) => s.clusterId !== 's3').map(good) }; // s3 missing → rejected
  return new Response(JSON.stringify({ candidates: [{ content: { parts: [{ text: JSON.stringify(body) }] } }] }), { status: 200 });
}) as typeof fetch;

process.env.GEMINI_API_KEY = 'fake';
const { stories: out, report } = await analyseWithAi(stories, previous);

const byId = Object.fromEntries(out.map((s) => [s.clusterId, s]));
const checks: [string, boolean][] = [
  ['discovery picks newest Flash + Flash-Lite', report.models.join() === 'gemini:gemini-3.8-flash,gemini:gemini-3.5-flash-lite'],
  ['s5 reused from previous feed', report.reused === 1 && byId.s5.canonicalHeadline === 'Cached s5'],
  ['s1 analysed with AI', byId.s1.analysisMode === 'ai' && byId.s1.canonicalHeadline === 'AI headline for s1'],
  ['uncited "Made-up point" dropped', byId.s1.analysis.keyPoints.length === 3 && !byId.s1.analysis.keyPoints.includes('Made-up point')],
  ['invalid topic filtered, category from AI', byId.s1.category === 'economy' && !byId.s1.analysis.topics.includes('not-a-topic' as never)],
  ['invalid entity type normalised', byId.s1.analysis.entities.every((e) => ['person', 'organization', 'company', 'country', 'place'].includes(e.type))],
  ['s3 (no answer) stays headline-only', byId.s3.analysisMode === 'extractive' && report.rejected === 1],
  ['fell back from rate-limited model', report.errors.some((e) => e.includes('rate limited')) && calls >= 2],
  ['importance blended', byId.s1.importanceScore === 70],
  ['old-prompt analysis redone', byId.s6.canonicalHeadline === 'AI headline for s6' && byId.s6.analysisVersion === PROMPT_VERSION],
  ['new analyses tagged with prompt version', byId.s1.analysisVersion === PROMPT_VERSION],
];
checks.forEach(([name, ok]) => console.log(`${ok ? '✓' : '✗'} ${name}`));
console.log('report:', JSON.stringify({ ...report, errors: report.errors.length }));
if (checks.some(([, ok]) => !ok)) process.exit(1);
