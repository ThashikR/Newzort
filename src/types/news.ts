/**
 * Core news domain types. These mirror what the backend pipeline produces
 * (see server/pipeline/types.ts) so the client never depends on raw AI text.
 */

export type TopicId =
  | 'india'
  | 'world'
  | 'politics'
  | 'economy'
  | 'business'
  | 'technology'
  | 'ai'
  | 'cybersecurity'
  | 'science'
  | 'space'
  | 'environment'
  | 'health'
  | 'education'
  | 'finance'
  | 'startups'
  | 'geopolitics'
  | 'sports'
  | 'entertainment';

export type SourceKind = 'wire' | 'national' | 'business' | 'technology' | 'science' | 'regional';

/** A publisher. `reliability` (0–1) comes from an editorial source-quality list, not from AI. */
export interface NewsSource {
  id: string;
  name: string;
  kind: SourceKind;
  homepage: string;
  country: string;
  reliability: number;
}

/** One original article from one publisher. We store metadata and a link, never the full text. */
export interface Article {
  id: string;
  sourceId: string;
  headline: string;
  url: string;
  publishedAt: string; // ISO 8601
  /** Short publisher-provided description, if licensing allows. */
  excerpt?: string;
}

export type EntityType = 'person' | 'organization' | 'company' | 'country' | 'place';

export interface Entity {
  name: string;
  type: EntityType;
}

export type Confidence = 'high' | 'medium' | 'low';

/**
 * Structured AI output for a cluster. The LLM must return exactly this JSON shape;
 * the backend validates it before it ever reaches the client.
 */
export interface StorySummary {
  headline: string;
  summary: string;
  whatHappened: string;
  keyPoints: string[];
  whyItMatters: string;
  background: string;
  /** Null when sources don't support a forward-looking statement. */
  whatHappensNext: string | null;
  topics: TopicId[];
  entities: Entity[];
  confidence: Confidence;
}

/**
 * How the story's text was produced:
 * - 'ai'         — full structured analysis (summary, key points, why it matters…)
 * - 'extractive' — no AI yet: summary is the publisher's own excerpt and
 *                  keyPoints are the headlines each source used. Analysis
 *                  fields (whyItMatters, background, …) are empty strings.
 */
export type AnalysisMode = 'ai' | 'extractive';

/** Several articles about the same underlying event, synthesized into one story. */
export interface StoryCluster {
  analysisMode: AnalysisMode;
  /** Which version of the AI prompt produced `analysis` (server re-analyses when it changes). */
  analysisVersion?: number;
  clusterId: string;
  canonicalHeadline: string;
  category: TopicId;
  country: string | null;
  publishedAt: string; // earliest article
  updatedAt: string; // latest article
  /** Editorial/AI importance, 0–100, independent of any user. */
  importanceScore: number;
  /** Estimated reading time for the Newzort summary, in minutes. */
  readMinutes: number;
  isQuickRead: boolean;
  analysis: StorySummary;
  articles: Article[];
  sources: NewsSource[];
  /** True for development/demo content. */
  isDemo: boolean;
}

/** A cluster plus its per-user ranking. `relevanceScore` is 0–1. */
export interface RankedStory {
  story: StoryCluster;
  relevanceScore: number;
  interestMatch: number;
  matchedTopics: TopicId[];
}
