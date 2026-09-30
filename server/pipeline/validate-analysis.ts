/**
 * Guards the boundary between the LLM and the app (steps 5–7).
 * AI output is untrusted: it must be valid JSON of the exact shape, and every
 * key point must cite at least one article from the cluster. Anything else is
 * rejected or trimmed — the app never receives free-form model text.
 */
import type { Confidence, EntityType, StorySummary, TopicId } from '../../src/types/news';

import type { LlmClusterAnalysis } from './types';

const TOPIC_IDS: TopicId[] = [
  'india', 'world', 'politics', 'economy', 'business', 'technology', 'ai', 'cybersecurity', 'science',
  'space', 'environment', 'health', 'education', 'finance', 'startups', 'geopolitics', 'sports', 'entertainment',
];
const CONFIDENCE: Confidence[] = ['high', 'medium', 'low'];
const ENTITY_TYPES: EntityType[] = ['person', 'organization', 'company', 'country', 'place'];

export type ValidationResult =
  | { ok: true; summary: StorySummary; importance: number; droppedKeyPoints: number }
  | { ok: false; errors: string[] };

const isString = (v: unknown): v is string => typeof v === 'string' && v.trim().length > 0;

export function validateAnalysis(raw: unknown, clusterArticleIds: string[]): ValidationResult {
  const errors: string[] = [];
  const a = raw as Partial<LlmClusterAnalysis>;
  if (!a || typeof a !== 'object') return { ok: false, errors: ['Response is not a JSON object'] };

  for (const field of ['headline', 'summary', 'whatHappened', 'whyItMatters'] as const) {
    if (!isString(a[field])) errors.push(`Missing or empty "${field}"`);
  }
  // Background may be empty: better no context than invented context.
  if (a.background != null && typeof a.background !== 'string') errors.push('"background" must be a string');
  if (a.whatHappensNext !== null && a.whatHappensNext !== undefined && !isString(a.whatHappensNext)) {
    errors.push('"whatHappensNext" must be a string or null');
  }
  if (!Array.isArray(a.keyPoints) || !a.keyPoints.every(isString)) errors.push('"keyPoints" must be a list of strings');
  if (!CONFIDENCE.includes(a.confidence as Confidence)) errors.push('"confidence" must be high, medium or low');
  if (!Array.isArray(a.evidence)) errors.push('"evidence" is required');
  if (errors.length) return { ok: false, errors };

  // Keep only key points backed by at least one real article in this cluster.
  const known = new Set(clusterArticleIds);
  const supported = a.keyPoints!.filter((_, i) =>
    a.evidence!.some((e) => e.keyPoint === i && e.articleIds.some((id) => known.has(id))),
  );
  if (supported.length < 3) {
    return { ok: false, errors: [`Only ${supported.length} key points are supported by sources (need 3)`] };
  }

  return {
    ok: true,
    droppedKeyPoints: a.keyPoints!.length - supported.length,
    importance: Math.max(0, Math.min(100, Number(a.importance) || 0)),
    summary: {
      headline: a.headline!.trim(),
      summary: a.summary!.trim(),
      whatHappened: a.whatHappened!.trim(),
      keyPoints: supported.slice(0, 7),
      whyItMatters: a.whyItMatters!.trim(),
      background: (a.background ?? '').trim(),
      whatHappensNext: isString(a.whatHappensNext) ? a.whatHappensNext.trim() : null,
      topics: (a.topics ?? []).filter((t): t is TopicId => TOPIC_IDS.includes(t as TopicId)),
      entities: Array.isArray(a.entities)
        ? a.entities
            .filter((e) => isString(e?.name))
            .map((e) => ({ name: e.name.trim(), type: ENTITY_TYPES.includes(e.type) ? e.type : 'organization' }))
            .slice(0, 8)
        : [],
      confidence: a.confidence!,
    },
  };
}
