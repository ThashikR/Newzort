import { demoAnswer } from '@/features/assistant/demo-assistant';

import type { AIService } from '../types';

/** Answers from local story data only. No LLM, no network, no API keys. */
export const mockAiService: AIService = {
  async ask(question, context) {
    // Small delay so the UI's "thinking" state is visible and realistic.
    await new Promise((r) => setTimeout(r, 450));    return demoAnswer(question, context);
  },
};
