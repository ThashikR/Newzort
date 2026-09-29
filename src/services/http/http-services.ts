/**
 * Backend-backed implementations. Endpoints are documented in docs/ARCHITECTURE.md.
 * Enabled by setting EXPO_PUBLIC_API_URL and EXPO_PUBLIC_USE_MOCK_DATA=false.
 */
import type { AssistantAnswer } from '@/types/ai';
import type { NewsSource, StoryCluster } from '@/types/news';

import type { AIService, NewsService, SearchResult } from '../types';
import { ApiError, apiFetch } from './api-client';

export const httpNewsService: NewsService = {
  getFeed: () => apiFetch<StoryCluster[]>('/v1/feed'),
  async getStory(clusterId) {
    try {
      return await apiFetch<StoryCluster>(`/v1/stories/${encodeURIComponent(clusterId)}`);
    } catch (e) {
      if (e instanceof ApiError && e.status === 404) return null;
      throw e;
    }
  },
  search: (query, scope) =>
    apiFetch<SearchResult[]>(`/v1/search?q=${encodeURIComponent(query)}&scope=${encodeURIComponent(scope)}`),
  listSources: () => apiFetch<NewsSource[]>('/v1/sources'),
};

export const httpAiService: AIService = {
  ask: (question, context) =>
    apiFetch<AssistantAnswer>('/v1/assistant/ask', {
      method: 'POST',
      // Only IDs are sent; the backend re-reads stories from its own store,
      // so answers are grounded in server-side source data.
      body: JSON.stringify({
        question,
        focusClusterId: context.focusClusterId,
        storyIds: context.stories.map((s) => s.clusterId),
        interests: context.interests,
      }),
      timeoutMs: 30_000,
    }),
};
