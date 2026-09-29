/**
 * Ask-AI answer format. Answers are always structured so the UI can show
 * facts, analysis and uncertainty separately — never one blob of model text.
 */

export interface AssistantFact {
  text: string;
  /** The story this fact comes from; every fact must be traceable. */
  clusterId: string;
  sourceNames: string[];
}

export interface AssistantAnswer {
  question: string;
  intro: string;
  facts: AssistantFact[];
  analysis: string[];
  uncertainty: string[];
  relatedClusterIds: string[];
  /** e.g. "demo" when answered from local data without an LLM. */
  generatedBy: 'demo' | 'llm';
}

export interface AssistantMessage {
  id: string;
  role: 'user' | 'assistant';
  text?: string;
  answer?: AssistantAnswer;
}
