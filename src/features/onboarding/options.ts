import type { BriefingLength, InterestPriority, SummaryStyle } from '@/types/user';

export const PRIORITY_OPTIONS: { value: InterestPriority; label: string }[] = [
  { value: 'high', label: 'High' },
  { value: 'medium', label: 'Medium' },
  { value: 'low', label: 'Low' },
];

export const SUMMARY_STYLE_OPTIONS: { value: SummaryStyle; label: string; description: string }[] = [
  { value: 'brief', label: 'Brief summaries', description: 'The essentials in a few lines. Fastest way through the day.' },
  { value: 'balanced', label: 'Balanced', description: 'A short summary, key points and why it matters.' },
  { value: 'detailed', label: 'Detailed summaries', description: 'More key points and fuller explanations.' },
  { value: 'analysis', label: 'More analysis', description: 'Adds background and context to every story.' },
];

export const BRIEFING_LENGTH_OPTIONS: { value: BriefingLength; label: string; description: string }[] = [
  { value: 5, label: '5 minutes', description: 'Just the must-know stories.' },
  { value: 10, label: '10 minutes', description: 'Must-know plus your top interests.' },
  { value: 15, label: '15 minutes', description: 'A complete picture of your day.' },
  { value: 30, label: '30 minutes', description: 'Everything in your feed, with depth.' },
];
