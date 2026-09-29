import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { newsService, personalizationService, type HomeSections } from '@/services';
import type { RankedStory, StoryCluster } from '@/types/news';

import { useUser } from './user-store';

interface NewsStore {
  stories: StoryCluster[];
  status: 'loading' | 'ready' | 'error';
  refreshing: boolean;
  refresh(): Promise<void>;
  getStory(id: string): StoryCluster | undefined;
}

const NewsContext = createContext<NewsStore | null>(null);

export function NewsProvider({ children }: { children: ReactNode }) {
  const { profile } = useUser();
  const [stories, setStories] = useState<StoryCluster[]>([]);
  const [status, setStatus] = useState<NewsStore['status']>('loading');
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(
    () =>
      newsService.getFeed().then(
        (feed) => {
          setStories(feed);
          setStatus('ready');
        },
        () => setStatus('error'),
      ),
    [],
  );

  useEffect(() => {
    let active = true;
    newsService.getFeed().then(
      (feed) => {
        if (!active) return;
        setStories(feed);
        setStatus('ready');
      },
      () => active && setStatus('error'),
    );
    return () => {
      active = false;
    };
  }, []);

  const store = useMemo<NewsStore>(
    () => ({
      stories,
      status,
      refreshing,
      refresh: async () => {
        setRefreshing(true);
        await load();
        setRefreshing(false);
      },
      // Today's feed first; otherwise the copy kept when the user saved it.
      getStory: (id) => stories.find((s) => s.clusterId === id) ?? profile.saved.find((s) => s.clusterId === id)?.story,
    }),
    [stories, status, refreshing, load, profile.saved],
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
