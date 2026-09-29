/**
 * Live-data implementations.
 *
 * The news backend publishes STATIC files (built on a schedule by
 * server/build-feed.ts and hosted on GitHub Pages):
 *   {EXPO_PUBLIC_API_URL}/feed.json     StoryCluster[]
 *   {EXPO_PUBLIC_API_URL}/sources.json  NewsSource[]
 * So the app downloads the feed once, then finds stories and searches locally.
 */
import { searchStories } from '@/features/search/search-stories';
import type { NewsSource, StoryCluster } from '@/types/news';

import type { NewsService } from '../types';
import { apiFetch } from './api-client';

let cachedFeed: StoryCluster[] | null = null;

async function loadFeed(force = false): Promise<StoryCluster[]> {
  if (!cachedFeed || force) {
    // Cache-busting query so a pull-to-refresh never gets a stale CDN copy.
    cachedFeed = await apiFetch<StoryCluster[]>(`/feed.json?t=${Date.now()}`);
  }
  return cachedFeed;
}

export const httpNewsService: NewsService = {
  getFeed: () => loadFeed(true),
  async getStory(clusterId) {
    return (await loadFeed()).find((s) => s.clusterId === clusterId) ?? null;
  },
  async search(query, scope) {
    return searchStories(await loadFeed(), query, scope);
  },
  listSources: () => apiFetch<NewsSource[]>('/sources.json'),
};
