import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { AppState } from 'react-native';

import { newsService, personalizationService, type HomeSections } from '@/services';
import { feedCache } from '@/services/storage/feed-cache';
import type { RankedStory, StoryCluster } from '@/types/news';

import { useUser } from './user-store';

/** Returning to the app after this long fetches fresh news automatically. */
const STALE_AFTER_MS = 10 * 60_000;

interface NewsStore {
  stories: StoryCluster[];
  /** 'error' only when there is nothing at all to show (no network AND no saved copy). */
  status: 'loading' | 'ready' | 'error';
  refreshing: boolean;
  /** When the stories on screen were downloaded (ms), or null if never. */
  lastUpdated: number | null;
  /** True when the latest download failed and we're showing the saved copy. */
  offline: boolean;
  refresh(): Promise<void>;
  getStory(id: string): StoryCluster | undefined;
}

const NewsContext = createContext<NewsStore | null>(null);

export function NewsProvider({ children }: { children: ReactNode }) {
  const { profile } = useUser();
  const [stories, setStories] = useState<StoryCluster[]>([]);
  const [status, setStatus] = useState<NewsStore['status']>('loading');
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);
  const [offline, setOffline] = useState(false);
  const lastAttempt = useRef(0);

  /** Download the latest feed; on failure keep whatever is already on screen. */
  const fetchLatest = useCallback(async () => {
    lastAttempt.current = Date.now();
    try {
      const feed = await newsService.getFeed();
      setStories(feed);
      setLastUpdated(Date.now());
      setOffline(false);
      setStatus('ready');
      feedCache.write(feed);
    } catch {
      setOffline(true);
      setStatus((s) => (s === 'ready' ? 'ready' : 'error'));
    }
  }, []);

  // Launch: show the saved copy instantly, then fetch fresh news.
  useEffect(() => {
    let active = true;
    feedCache.read().then((cached) => {
      if (!active) return;
      if (cached && cached.stories.length > 0) {
        setStories(cached.stories);
        setLastUpdated(cached.fetchedAt);
        setStatus('ready');
      }
      return fetchLatest();
    });
    return () => {
      active = false;
    };
  }, [fetchLatest]);

  // Coming back to the app after a while → refresh quietly.
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active' && Date.now() - lastAttempt.current > STALE_AFTER_MS) fetchLatest();
    });
    return () => sub.remove();
  }, [fetchLatest]);

  const store = useMemo<NewsStore>(
    () => ({
      stories,
      status,
      refreshing,
      lastUpdated,
      offline,
      refresh: async () => {
        setRefreshing(true);
        await fetchLatest();
        setRefreshing(false);
      },
      // Today's feed first; otherwise the copy kept when the user saved it.
      getStory: (id) => stories.find((s) => s.clusterId === id) ?? profile.saved.find((s) => s.clusterId === id)?.story,
    }),
    [stories, status, refreshing, lastUpdated, offline, fetchLatest, profile.saved],
  );

  return <NewsContext.Provider value={store}>{children}</NewsContext.Provider>;
}

export function useNews(): NewsStore {
  const ctx = useContext(NewsContext);
  if (!ctx) throw new Error('useNews must be used inside <NewsProvider>');
  return ctx;
}

/** Stories ranked for the current user, split into Home sections. */
export function usePersonalizedFeed(): { ranked: RankedStory[]; sections: HomeSections } {
  const { stories } = useNews();
  const { profile } = useUser();
  return useMemo(() => {
    const ranked = personalizationService.rank(stories, profile);
    return { ranked, sections: personalizationService.homeSections(ranked, profile) };
  }, [stories, profile]);
}
