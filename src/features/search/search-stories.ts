import { TOPICS, topicLabel } from '@/constants/topics';
import type { SearchResult, SearchScope } from '@/services/types';
import type { EntityType, StoryCluster } from '@/types/news';

const SCOPE_ENTITY_TYPES: Partial<Record<SearchScope, EntityType[]>> = {
  companies: ['company', 'organization'],
  people: ['person'],
  countries: ['country', 'place'],
};

const words = (text: string) =>
  text
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((w) => w.length > 1);

/**
 * Keyword search over story clusters. Every query word must match somewhere
 * (headline, summary, key points, topics or entities). Ranking favours
 * headline/entity/topic matches. The backend can replace this with full-text
 * or vector search behind NewsService.search().
 */
export function searchStories(stories: StoryCluster[], query: string, scope: SearchScope): SearchResult[] {
  const terms = words(query);
  if (terms.length === 0) return [];

  const results: SearchResult[] = [];
  for (const story of stories) {
    const a = story.analysis;
    const topicIds = [story.category, ...a.topics];
    const topicText = topicIds
      .flatMap((id) => [topicLabel(id), ...(TOPICS.find((t) => t.id === id)?.keywords ?? [])])
      .join(' ');
    const allowedEntityTypes = SCOPE_ENTITY_TYPES[scope];
    const entities = a.entities.filter((e) => !allowedEntityTypes || allowedEntityTypes.includes(e.type));

    const fields = {
      headline: words(a.headline).join(' '),
      body: words([a.summary, a.whatHappened, ...a.keyPoints].join(' ')).join(' '),
      topics: words(topicText).join(' '),
      entities: words(entities.map((e) => e.name).join(' ')).join(' '),
    };

    let score = 0;
    const matchedOn = new Set<string>();
    let allMatched = true;
    for (const term of terms) {
      const hit = (field: string) => field.split(' ').some((w) => w.startsWith(term));
      let termScore = 0;
      if (scope === 'all' || scope === 'topics') {
        if (hit(fields.topics)) {
          termScore += 3;
          const t = topicIds.find((id) =>
            words(`${topicLabel(id)} ${TOPICS.find((x) => x.id === id)?.keywords.join(' ')}`).some((w) => w.startsWith(term)),
          );
          if (t) matchedOn.add(`Topic: ${topicLabel(t)}`);
        }
      }
      if (scope !== 'topics' && hit(fields.entities)) {
        termScore += 3;
        const e = entities.find((x) => words(x.name).some((w) => w.startsWith(term)));
        if (e) matchedOn.add(`${entityLabel(e.type)}: ${e.name}`);
      }
      if (scope === 'all') {
        if (hit(fields.headline)) termScore += 4;
        if (hit(fields.body)) termScore += 1;
      }
      if (termScore === 0) {
        allMatched = false;
        break;
      }
      score += termScore;
    }
    if (allMatched) {
      results.push({ story, matchedOn: [...matchedOn].slice(0, 3), score: score + story.importanceScore / 100 });
    }
  }
  return results.sort((a, b) => b.score - a.score);
}

function entityLabel(type: EntityType): string {
  switch (type) {
    case 'person':
      return 'Person';
    case 'company':
      return 'Company';
    case 'country':
      return 'Country';
    case 'place':
      return 'Place';
    default:
      return 'Organisation';
  }
}
