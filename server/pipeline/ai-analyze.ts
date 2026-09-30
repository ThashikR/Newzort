/**
 * Steps 5–7: AI ANALYSIS → FACT EXTRACTION → SUMMARY GENERATION.
 *
 * - Only NEW important stories are sent to the AI; earlier results are reused
 *   from the previously published feed (keeps us inside free-tier limits).
 * - Providers: Gemini first, Groq as fallback. Keys come from environment
 *   variables (GitHub Actions secrets) — never from the app or the repo.
 * - The AI sees only headlines + excerpts with article ids, must return JSON,
 *   and every key point must cite article ids. validate-analysis.ts drops
 *   uncited points and rejects weak answers; rejected stories simply stay
 *   headline-only ("extractive").
 */
import type { StoryCluster } from '../../src/types/news';

import { validateAnalysis } from './validate-analysis';

const MAX_NEW_PER_RUN = Number(process.env.AI_MAX_STORIES_PER_RUN ?? 16);
/**
 * Bump whenever SYSTEM_PROMPT changes meaningfully: cached analyses from an
 * older prompt are then redone (still at most MAX_NEW_PER_RUN per run).
 */
export const PROMPT_VERSION = 2;
const BATCH_SIZE = 4;

export interface AiReport {
  enabled: boolean;
  reused: number;
  attempted: number;
  analysed: number;
  rejected: number;
  /** Models chosen for this run (after discovery). */
  models: string[];
  providerCalls: Record<string, number>;
  errors: string[];
}

interface Provider {
  name: string;
  call(prompt: string): Promise<string>;
}

// ── Prompt ────────────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are Newzort's news analyst. You write short, neutral, accurate briefings.

STRICT RULES
- Use ONLY the headlines and excerpts provided. Never add facts, numbers, names, quotes or dates that are not in them.
- Every key point must cite the ids of the articles that support it in "evidence".
- "whyItMatters" is interpretation: explain plainly why this could matter to readers, without stating new facts.
- "background": 1–2 sentences of widely known, uncontroversial context. If unsure, use "".
- "whatHappensNext": only if the sources describe next steps; otherwise null. Never speculate.
- No sensational language, no clickbait. Plain English a busy reader understands.
- Pick topics by what the story is about: a hack, breach or security flaw is "cybersecurity"; AI models or AI policy is "ai".
- confidence: "high" if sources agree on the core facts, "medium" if details differ or coverage is thin, "low" if unclear.
- importance: 0–100 for a general audience (major national/world impact ≈ 80+, routine ≈ 30–50).

Return ONLY JSON: {"stories": [ ... one object per input story ... ]}
Each object:
{
  "clusterId": string,
  "headline": string (clear, neutral, ≤ 14 words, sentence case — capitalise only the first word and proper nouns),
  "summary": string (1–2 sentences),
  "whatHappened": string (2–4 simple sentences),
  "keyPoints": string[] (3–6 short points),
  "evidence": [{"keyPoint": number (0-based index into keyPoints), "articleIds": string[]}],
  "whyItMatters": string,
  "background": string,
  "whatHappensNext": string | null,
  "topics": string[] from [india, world, politics, economy, business, technology, ai, cybersecurity, science, space, environment, health, education, finance, startups, geopolitics, sports, entertainment],
  "entities": [{"name": string, "type": "person"|"organization"|"company"|"country"|"place"}],
  "confidence": "high"|"medium"|"low",
  "importance": number
}`;

function buildPrompt(stories: StoryCluster[]): string {
  const blocks = stories.map((s) => {
    const sourceName = new Map(s.sources.map((src) => [src.id, src.name]));
    const articles = s.articles
      .map((a) => `  - id: ${a.id}\n    source: ${sourceName.get(a.sourceId) ?? a.sourceId}\n    headline: ${a.headline}\n    excerpt: ${a.excerpt ?? '(none)'}`)
      .join('\n');
    return `STORY clusterId=${s.clusterId}\narticles:\n${articles}`;
  });
  return `Analyse these ${stories.length} stories. Return JSON only.\n\n${blocks.join('\n\n')}`;
}

// ── Providers ─────────────────────────────────────────────────────────────────

class RateLimited extends Error {}

function geminiProvider(apiKey: string, model: string): Provider {
  return {
    name: `gemini:${model}`,
    async call(prompt) {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
        method: 'POST',
        signal: AbortSignal.timeout(90_000),
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: 'application/json', temperature: 0.2 },
        }),
      });
      if (res.status === 429) throw new RateLimited(`${model} rate limited`);
      if (!res.ok) throw new Error(`${model} HTTP ${res.status}: ${(await res.text()).slice(0, 200)}`);
      const data = (await res.json()) as { candidates?: { content?: { parts?: { text?: string }[] } }[] };
      return data.candidates?.[0]?.content?.parts?.map((p) => p.text ?? '').join('') ?? '';
    },
  };
}

function groqProvider(apiKey: string, model: string): Provider {
  return {
    name: `groq:${model}`,
    async call(prompt) {
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        signal: AbortSignal.timeout(90_000),
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({
          model,
          temperature: 0.2,
          response_format: { type: 'json_object' },
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            { role: 'user', content: prompt },
          ],
        }),
      });
      if (res.status === 429) throw new RateLimited(`${model} rate limited`);
      if (!res.ok) throw new Error(`${model} HTTP ${res.status}: ${(await res.text()).slice(0, 200)}`);
      const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
      return data.choices?.[0]?.message?.content ?? '';
    },
  };
}

// Providers rename/retire models every few months, so we ASK which models exist
// right now and pick the best match, instead of hard-coding names.
// GEMINI_MODELS / GROQ_MODELS (comma-separated) override the discovery.

const versionOf = (name: string) => Number(name.match(/gemini-(\d+(?:\.\d+)?)/)?.[1] ?? 0);

async function discoverGeminiModels(apiKey: string): Promise<string[]> {
  const res = await fetch('https://generativelanguage.googleapis.com/v1beta/models?pageSize=200', {
    signal: AbortSignal.timeout(20_000),
    headers: { 'x-goog-api-key': apiKey },
  });
  if (!res.ok) throw new Error(`Gemini model list HTTP ${res.status}`);
  const data = (await res.json()) as { models?: { name: string; supportedGenerationMethods?: string[] }[] };
  const names = (data.models ?? [])
    .filter((m) => m.supportedGenerationMethods?.includes('generateContent'))
    .map((m) => m.name.replace(/^models\//, ''))
    // Stable text Flash models only (skip preview/experimental/image/audio/TTS variants).
    .filter((n) => /^gemini-\d+(\.\d+)?-flash(-lite)?$/.test(n));
  // Newest version first; within a version, Flash before Flash-Lite.
  names.sort((a, b) => versionOf(b) - versionOf(a) || Number(a.endsWith('-lite')) - Number(b.endsWith('-lite')));
  const flash = names.find((n) => !n.endsWith('-lite'));
  const lite = names.find((n) => n.endsWith('-lite'));
  return [flash, lite].filter((n): n is string => !!n);
}

const GROQ_PREFERENCE = [/gpt-oss-120b/, /llama.*70b/, /qwen.*32b/, /gpt-oss-20b/, /llama-4/, /llama.*8b/];

async function discoverGroqModels(apiKey: string): Promise<string[]> {
  const res = await fetch('https://api.groq.com/openai/v1/models', {
    signal: AbortSignal.timeout(20_000),
    headers: { Authorization: `Bearer ${apiKey}` },
  });
  if (!res.ok) throw new Error(`Groq model list HTTP ${res.status}`);
  const data = (await res.json()) as { data?: { id: string; active?: boolean }[] };
  const ids = (data.data ?? [])
    .filter((m) => m.active !== false)
    .map((m) => m.id)
    .filter((id) => !/whisper|tts|guard|vision|audio|embed/i.test(id));
  const picked: string[] = [];
  for (const pattern of GROQ_PREFERENCE) {
    const hit = ids.find((id) => pattern.test(id) && !picked.includes(id));
    if (hit) picked.push(hit);
    if (picked.length === 2) break;
  }
  return picked;
}

async function configuredProviders(report: AiReport): Promise<Provider[]> {
  const override = (v: string | undefined) => (v ? v.split(',').map((s) => s.trim()).filter(Boolean) : null);
  const providers: Provider[] = [];

  const geminiKey = process.env.GEMINI_API_KEY;
  if (geminiKey) {
    try {
      const models = override(process.env.GEMINI_MODELS) ?? (await discoverGeminiModels(geminiKey));
      models.forEach((m) => providers.push(geminiProvider(geminiKey, m)));
    } catch (e) {
      report.errors.push(`gemini discovery: ${e instanceof Error ? e.message : String(e)}`);
    }
  }
  const groqKey = process.env.GROQ_API_KEY;
  if (groqKey) {
    try {
      const models = override(process.env.GROQ_MODELS) ?? (await discoverGroqModels(groqKey));
      models.forEach((m) => providers.push(groqProvider(groqKey, m)));
    } catch (e) {
      report.errors.push(`groq discovery: ${e instanceof Error ? e.message : String(e)}`);
    }
  }
  report.models = providers.map((p) => p.name);
  return providers;
}

// ── Orchestration ─────────────────────────────────────────────────────────────

/** Same set of articles ⇒ the earlier analysis is still valid. */
const articleKey = (s: StoryCluster) => s.articles.map((a) => a.url).sort().join('|');

function parseStories(text: string): unknown[] {
  const cleaned = text.trim().replace(/^```(?:json)?\s*|\s*```$/g, '');
  const parsed = JSON.parse(cleaned) as { stories?: unknown[] } | unknown[];
  return Array.isArray(parsed) ? parsed : (parsed.stories ?? []);
}

export async function analyseWithAi(stories: StoryCluster[], previous: StoryCluster[]): Promise<{ stories: StoryCluster[]; report: AiReport }> {
  const report: AiReport = { enabled: false, reused: 0, attempted: 0, analysed: 0, rejected: 0, models: [], providerCalls: {}, errors: [] };
  const providers = await configuredProviders(report);
  report.enabled = providers.length > 0;

  // 1. Reuse earlier AI results for unchanged stories.
  const prevByKey = new Map(
    previous.filter((p) => p.analysisMode === 'ai' && p.analysisVersion === PROMPT_VERSION).map((p) => [articleKey(p), p]),
  );
  // Older-prompt analyses: keep showing them until re-analysed, but queue them for a redo.
  const stale = new Map(
    previous.filter((p) => p.analysisMode === 'ai' && p.analysisVersion !== PROMPT_VERSION).map((p) => [articleKey(p), p]),
  );
  const redo = new Set<string>();
  const out = stories.map((s) => {
    const prev = prevByKey.get(articleKey(s));
    if (prev) {
      report.reused++;
      return { ...s, analysisMode: 'ai' as const, analysisVersion: prev.analysisVersion, analysis: prev.analysis, canonicalHeadline: prev.canonicalHeadline, importanceScore: prev.importanceScore, category: prev.category };
    }
    const old = stale.get(articleKey(s));
    if (old) {
      redo.add(s.clusterId);
      return { ...s, analysisMode: 'ai' as const, analysisVersion: old.analysisVersion, analysis: old.analysis, canonicalHeadline: old.canonicalHeadline, importanceScore: old.importanceScore, category: old.category };
    }
    return s;
  });
  if (!report.enabled) return { stories: out, report };

  // 2. Pick the most important stories still without analysis.
  // New stories first, then redos of older-prompt analyses.
  const todo = out
    .filter((s) => s.analysisMode !== 'ai' || redo.has(s.clusterId))
    .sort(
      (a, b) =>
        Number(redo.has(a.clusterId)) - Number(redo.has(b.clusterId)) ||
        b.sources.length - a.sources.length ||
        b.importanceScore - a.importanceScore,
    )
    .slice(0, MAX_NEW_PER_RUN);
  report.attempted = todo.length;

  const byId = new Map(out.map((s, i) => [s.clusterId, i]));
  let active = [...providers];

  for (let i = 0; i < todo.length && active.length > 0; i += BATCH_SIZE) {
    const batch = todo.slice(i, i + BATCH_SIZE);
    const prompt = buildPrompt(batch);
    let results: unknown[] | null = null;

    // Try providers in order; drop any that are rate-limited for the rest of this run.
    while (!results && active.length > 0) {
      const provider = active[0];
      try {
        report.providerCalls[provider.name] = (report.providerCalls[provider.name] ?? 0) + 1;
        results = parseStories(await provider.call(prompt));
      } catch (e) {
        report.errors.push(`${provider.name}: ${e instanceof Error ? e.message : String(e)}`.slice(0, 240));
        active = active.slice(1);
      }
    }
    if (!results) break;

    for (const story of batch) {
      const raw = results.find((r) => (r as { clusterId?: string })?.clusterId === story.clusterId);
      const check = validateAnalysis(raw, story.articles.map((a) => a.id));
      if (!check.ok) {
        report.rejected++;
        report.errors.push(`rejected ${story.clusterId}: ${check.errors.join('; ')}`.slice(0, 240));
        continue;
      }
      const idx = byId.get(story.clusterId)!;
      const topics = check.summary.topics.length ? check.summary.topics : story.analysis.topics;
      out[idx] = {
        ...story,
        analysisMode: 'ai',
        analysisVersion: PROMPT_VERSION,
        canonicalHeadline: check.summary.headline,
        // Keep our category unless the AI's first topic is more specific than a region.
        category: topics[0] && !['world', 'india'].includes(topics[0]) ? topics[0] : story.category,
        importanceScore: Math.round(0.5 * story.importanceScore + 0.5 * check.importance),
        analysis: { ...check.summary, topics },
      };
      report.analysed++;
    }
  }
  return { stories: out, report };
}
