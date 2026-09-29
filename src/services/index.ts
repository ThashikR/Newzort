/**
 * Service registry — the ONLY place that decides demo vs. real backend.
 * UI code imports services from here and never from an implementation file.
 */
import { env } from '@/config/env';
import { buildHomeSections } from '@/features/personalization/sections';
import { rankStories } from '@/features/personalization/score';

import { httpNewsService } from './http/http-services';
import { mockAiService } from './mock/mock-ai-service';
import { mockNewsService } from './mock/mock-news-service';
import { localUserService } from './storage/local-user-service';
import type { AIService, NewsService, PersonalizationService, UserService } from './types';

export const newsService: NewsService = env.useMockData ? mockNewsService : httpNewsService;

// Ask AI answers from whatever stories are loaded (demo or live) without an
// LLM until the AI backend exists (Phase 8). It never needs an API key.
export const aiService: AIService = mockAiService;

export const personalizationService: PersonalizationService = {
  rank: rankStories,
  homeSections: buildHomeSections,
};

export const userService: UserService = localUserService;

export * from './types';
