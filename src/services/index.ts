/**
 * Service registry — the ONLY place that decides demo vs. real backend.
 * UI code imports services from here and never from an implementation file.
 */
import { env } from '@/config/env';
import { buildHomeSections } from '@/features/personalization/sections';
import { rankStories } from '@/features/personalization/score';

import { remoteAiService } from './http/ask-service';
import { httpNewsService } from './http/http-services';
import { mockAiService } from './mock/mock-ai-service';
import { mockNewsService } from './mock/mock-news-service';
import { localUserService } from './storage/local-user-service';
import type { AIService, NewsService, PersonalizationService, UserService } from './types';

export const newsService: NewsService = env.useMockData ? mockNewsService : httpNewsService;

// Live news → real Ask AI (Cloudflare Worker, falls back to the demo engine).
// Demo stories → the on-device demo assistant, which knows the demo data.
export const aiService: AIService = env.useMockData ? mockAiService : remoteAiService;

export { AskLimitError } from './http/ask-service';

export const personalizationService: PersonalizationService = {
  rank: rankStories,
  homeSections: buildHomeSections,
};

export const userService: UserService = localUserService;

export * from './types';
