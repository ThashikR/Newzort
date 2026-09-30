/**
 * Ask AI via the Newzort Worker (worker/src/index.ts). The Worker reads the
 * live feed itself and answers only from those stories, citing each fact.
 * If it's unreachable or busy, we fall back to the on-device demo assistant
 * so Ask AI never simply breaks.
 */
import { env } from '@/config/env';
import type { AssistantAnswer } from '@/types/ai';

import { mockAiService } from '../mock/mock-ai-service';
import type { AIService } from '../types';

export class AskLimitError extends Error {}

export const remoteAiService: AIService = {
  async ask(question, context) {
    if (!env.askApiUrl) return mockAiService.ask(question, context);
    const focus = context.focusClusterId ? context.stories.find((s) => s.clusterId === context.focusClusterId) : undefined;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 30_000);
    try {
      const res = await fetch(`${env.askApiUrl}/ask`, {
        method: 'POST',
        signal: controller.signal,
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          question,
          focusClusterId: context.focusClusterId,
          // Only needed if the story has left the live feed (e.g. an old saved story).
          focusStory: focus,
        }),
      });
      if (res.status === 429) throw new AskLimitError('Too many questions — please wait a minute.');
      if (!res.ok) throw new Error(`Ask API HTTP ${res.status}`);
      return (await res.json()) as AssistantAnswer;
    } catch (e) {
      if (e instanceof AskLimitError) throw e;
      // Offline / server down → the demo assistant still gives a sourced answer.
      return mockAiService.ask(question, context);
    } finally {
      clearTimeout(timer);
    }
  },
};
