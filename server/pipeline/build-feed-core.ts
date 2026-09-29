import type { StoryCluster } from '../../src/types/news';

import { clusterIngested, toStoryCluster } from './build-stories';
import type { IngestedArticle } from './ingest';

const MAX_STORIES = 150;

/** Articles → grouped, categorised, ranked stories (pure, easy to test). */
export function buildFeedFromArticles(articles: IngestedArticle[], now = Date.now()): StoryCluster[] {
  return clusterIngested(articles)
    .map((group) => toStoryCluster(group, now))
    .sort((a, b) => b.importanceScore - a.importanceScore || Date.parse(b.updatedAt) - Date.parse(a.updatedAt))
    .slice(0, MAX_STORIES);
}
