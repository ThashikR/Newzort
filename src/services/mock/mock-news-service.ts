import { ALL_DEMO_SOURCES } from '@/data/mock/sources';
import { DEMO_STORIES } from '@/data/mock/stories';
import { searchStories } from '@/features/search/search-stories';

import type { NewsService } from '../types';

/** Serves the bundled demo clusters. Same contract as the HTTP service. */
export const mockNewsService: NewsService = {
  async getFeed() {
    return DEMO_STORIES;
  },
  async getStory(clusterId) {
    return DEMO_STORIES.find((s) => s.clusterId === clusterId) ?? null;
  },
  async search(query, scope) {
    return searchStories(DEMO_STORIES, query, scope);
  },
  async listSources() {
    return ALL_DEMO_SOURCES;
  },
};
