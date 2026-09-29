/**
 * Backend pipeline contracts (Phase 6+).
 *
 *   NEWS SOURCES → INGESTION → CLEANING → DUPLICATE DETECTION → CLUSTERING
 *   → AI ANALYSIS → FACT EXTRACTION → SUMMARY GENERATION → PERSONALIZATION → USER FEED
 *
 * The client-facing shapes (StoryCluster, StorySummary, …) are imported from
 * the app so both sides always agree on the contract.
 */
import type { Article, NewsSource, StoryCluster, StorySummary, TopicId } from '../../src/types/news';

/** 1. Ingestion: exactly what a feed/API returned, before any processing. */
export interface RawArticle {
  sourceId: NewsSource['id'];
  url: string;
  title: string;
  description?: string;
  /** Full text is used transiently for analysis only — never stored or served to clients. */
  body?: string;
  publishedAt: string;
  fetchedAt: string;
  feed: 'rss' | 'api' | 'licensed';
}

/** 2. Cleaning: normalised text, canonical URL, language and a content hash. */
export interface CleanArticle extends Article {
  canonicalUrl: string;
  language: string;
  normalizedTitle: string;
  /** Hash of normalised body; identical hashes are exact duplicates (syndicated copies). */
  contentHash: string;
  bodyForAnalysis?: string;
}

/** 3–4. Duplicate detection & clustering output. */
export interface ClusterCandidate {
  clusterId: string;
  articleIds: string[];
  /** 0–1 average pairwise similarity; low values are sent for review, not auto-published. */
  cohesion: number;
}

/**
 * 5–7. What the LLM must return for one cluster (validated by validate-analysis.ts).
 * `evidence` maps every key point to the article(s) that support it — a key
 * point with no supporting article is dropped, so the app never shows a claim
 * a source didn't make.
 */
export interface LlmClusterAnalysis extends Omit<StorySummary, 'topics'> {
  topics: string[];
  evidence: { keyPoint: number; articleIds: string[] }[];
  importance: number; // 0–100
}

/** 8. Personalization input/output lives in the app for now (src/features/personalization). */
export interface PublishedCluster extends StoryCluster {
  pipelineVersion: string;
}

export type { TopicId };
