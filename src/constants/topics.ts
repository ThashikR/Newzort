import type { TopicId } from '@/types/news';

export interface TopicInfo {
  id: TopicId;
  label: string;
  /** Extra words that should match this topic in search and Ask AI. */
  keywords: string[];
}

export const TOPICS: TopicInfo[] = [
  { id: 'india', label: 'India', keywords: ['india', 'indian', 'delhi', 'mumbai', 'centre'] },
  { id: 'world', label: 'World', keywords: ['world', 'global', 'international'] },
  { id: 'politics', label: 'Politics', keywords: ['politics', 'political', 'election', 'parliament', 'government'] },
  { id: 'economy', label: 'Economy', keywords: ['economy', 'economic', 'inflation', 'gdp', 'rates', 'monetary'] },
  { id: 'business', label: 'Business', keywords: ['business', 'company', 'companies', 'corporate', 'industry'] },
  { id: 'technology', label: 'Technology', keywords: ['technology', 'tech', 'semiconductor', 'chips', 'software', 'digital'] },
  { id: 'ai', label: 'Artificial Intelligence', keywords: ['ai', 'artificial intelligence', 'machine learning', 'model', 'models'] },
  { id: 'cybersecurity', label: 'Cybersecurity', keywords: ['cyber', 'cybersecurity', 'security', 'ransomware', 'breach', 'hack'] },
  { id: 'science', label: 'Science', keywords: ['science', 'research', 'scientists', 'study'] },
  { id: 'space', label: 'Space', keywords: ['space', 'satellite', 'isro', 'orbit', 'launch', 'moon'] },
  { id: 'environment', label: 'Environment', keywords: ['environment', 'climate', 'monsoon', 'emissions', 'renewable', 'solar'] },
  { id: 'health', label: 'Health', keywords: ['health', 'medical', 'hospital', 'disease', 'vaccine'] },
  { id: 'education', label: 'Education', keywords: ['education', 'school', 'schools', 'university', 'students', 'exam'] },
  { id: 'finance', label: 'Finance', keywords: ['finance', 'markets', 'stocks', 'bank', 'banking', 'investors'] },
  { id: 'startups', label: 'Startups', keywords: ['startup', 'startups', 'funding', 'founders', 'venture'] },
  { id: 'geopolitics', label: 'Geopolitics', keywords: ['geopolitics', 'diplomacy', 'trade', 'summit', 'treaty'] },
  { id: 'sports', label: 'Sports', keywords: ['sports', 'cricket', 'football', 'olympics', 'match'] },
  { id: 'entertainment', label: 'Entertainment', keywords: ['entertainment', 'film', 'music', 'streaming', 'cinema'] },
];

const byId = Object.fromEntries(TOPICS.map((t) => [t.id, t])) as Record<TopicId, TopicInfo>;

export function topicLabel(id: TopicId): string {
  return byId[id]?.label ?? id;
}

/** Short labels for tight spaces like card eyebrows. */
export function topicShortLabel(id: TopicId): string {
  return id === 'ai' ? 'AI' : topicLabel(id);
}
