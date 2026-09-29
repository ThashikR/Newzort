import type { StoryCluster, TopicId } from './news';

export type InterestPriority = 'high' | 'medium' | 'low';

export interface UserInterest {
  topic: TopicId;
  priority: InterestPriority;
}

export type SummaryStyle = 'brief' | 'balanced' | 'detailed' | 'analysis';

export type BriefingLength = 5 | 10 | 15 | 30;

export type FeedbackKind = 'like' | 'not_interested' | 'save' | 'open_source' | 'read';

/** A single behavioural signal. Sent to the backend later to improve ranking. */
export interface UserFeedback {
  clusterId: string;
  kind: FeedbackKind;
  at: string; // ISO 8601
}

export interface NotificationPreferences {
  enabled: boolean;
  morningBriefing: boolean;
  interestMatches: boolean;
  majorDevelopments: boolean;
  /** Local time, 24h "HH:MM". */
  briefingTime: string;
}

export interface SavedStory {
  clusterId: string;
  savedAt: string;
  /**
   * A copy of the story at save time. Live feeds only keep ~36 hours of news,
   * so saved stories must not depend on still being in the feed.
   */
  story?: StoryCluster;
}

export interface UserProfile {
  name: string;
  onboarded: boolean;
  interests: UserInterest[];
  summaryStyle: SummaryStyle;
  briefingLength: BriefingLength;
  likedIds: string[];
  dislikedIds: string[];
  saved: SavedStory[];
  readIds: string[];
  notifications: NotificationPreferences;
  createdAt: string;
}
