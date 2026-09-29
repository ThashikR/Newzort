/**
 * Service contracts. Screens and hooks depend ONLY on these interfaces,
 * never on a concrete implementation, so demo data can be swapped for the
 * real backend without touching UI code (see services/index.ts).
 */
import type { AssistantAnswer } from '@/types/ai';
import type { NewsSource, RankedStory, StoryCluster } from '@/types/news';
import type { UserFeedback, UserProfile } from '@/types/user';

export type SearchScope = 'all' | 'topics' | 'companies' | 'people' | 'countries';

export interface SearchResult {
  story: StoryCluster;
  /** Human-readable reasons, e.g. "Topic: Technology", "Company: …". */
  matchedOn: string[];
  score: number;
}

export interface NewsService {
  /** Today's synthesized story clusters (plus recent ones for context). */
  getFeed(): Promise<StoryCluster[]>;
  getStory(clusterId: string): Promise<StoryCluster | null>;
  search(query: string, scope: SearchScope): Promise<SearchResult[]>;
  listSources(): Promise<NewsSource[]>;
}

export interface AskContext {
  stories: StoryCluster[];
  /** When asked from a story page, "why is this important?" refers to this story. */
  focusClusterId?: string;
  interests: UserProfile['interests'];
}

export interface AIService {
  ask(question: string, context: AskContext): Promise<AssistantAnswer>;
}

export interface HomeSections {
  mustKnow: RankedStory[];
  forYou: RankedStory[];
  quickReads: RankedStory[];
  explore: RankedStory[];
}

/** Ranking is pure and swappable: replace with an ML model behind the same interface. */
export interface PersonalizationService {
  rank(stories: StoryCluster[], profile: UserProfile, now?: number): RankedStory[];
  homeSections(ranked: RankedStory[], profile: UserProfile): HomeSections;
}

export interface UserService {
  load(): Promise<UserProfile | null>;
  save(profile: UserProfile): Promise<void>;
  clear(): Promise<void>;
  /** Behavioural signals; stored locally now, sent to the backend later. */
  recordFeedback(feedback: UserFeedback): Promise<void>;
}
