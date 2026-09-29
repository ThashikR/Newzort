import AsyncStorage from '@react-native-async-storage/async-storage';

import type { StoryCluster } from '@/types/news';

const KEY = 'newzort:feed-cache:v1';

export interface CachedFeed {
  stories: StoryCluster[];
  /** When this copy was downloaded (ms since epoch). */
  fetchedAt: number;
}

/**
 * Keeps the last successfully downloaded feed on the device, so the app can
 * show recent news instantly on launch and when there's no internet.
 */
export const feedCache = {
  async read(): Promise<CachedFeed | null> {
    try {
      const raw = await AsyncStorage.getItem(KEY);
      return raw ? (JSON.parse(raw) as CachedFeed) : null;
    } catch {
      return null;
    }
  },
  async write(stories: StoryCluster[]): Promise<void> {
    try {
      await AsyncStorage.setItem(KEY, JSON.stringify({ stories, fetchedAt: Date.now() } satisfies CachedFeed));
    } catch {
      // Cache is best-effort; a full disk must never break the app.
    }
  },
};
