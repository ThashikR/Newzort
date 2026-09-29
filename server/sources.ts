/**
 * Publishers Newzort reads. Each feed was checked to respond before being added.
 * We use only headline, a short excerpt, time and link — never full articles —
 * and every story links back to the publisher.
 *
 * `reliability` is an editorial setting (not AI). `topics` are hints used when
 * a headline alone doesn't reveal the subject.
 */
import type { NewsSource, TopicId } from '../src/types/news';

export interface FeedConfig {
  source: NewsSource;
  url: string;
  topics: TopicId[];
}

const src = (
  id: string,
  name: string,
  kind: NewsSource['kind'],
  country: string,
  homepage: string,
  reliability: number,
): NewsSource => ({ id, name, kind, country, homepage, reliability });

const HINDU = src('the-hindu', 'The Hindu', 'national', 'IN', 'https://www.thehindu.com', 0.9);
const EXPRESS = src('indian-express', 'The Indian Express', 'national', 'IN', 'https://indianexpress.com', 0.88);
const MINT = src('livemint', 'Mint', 'business', 'IN', 'https://www.livemint.com', 0.86);
const BBC = src('bbc', 'BBC News', 'national', 'GB', 'https://www.bbc.com/news', 0.92);
const ALJAZEERA = src('al-jazeera', 'Al Jazeera', 'national', 'QA', 'https://www.aljazeera.com', 0.85);
const GUARDIAN = src('the-guardian', 'The Guardian', 'national', 'GB', 'https://www.theguardian.com', 0.88);
const TECHCRUNCH = src('techcrunch', 'TechCrunch', 'technology', 'US', 'https://techcrunch.com', 0.84);
const VERGE = src('the-verge', 'The Verge', 'technology', 'US', 'https://www.theverge.com', 0.83);
const ARS = src('ars-technica', 'Ars Technica', 'technology', 'US', 'https://arstechnica.com', 0.86);
const BLEEPING = src('bleepingcomputer', 'BleepingComputer', 'technology', 'US', 'https://www.bleepingcomputer.com', 0.86);
const THN = src('the-hacker-news', 'The Hacker News', 'technology', 'IN', 'https://thehackernews.com', 0.8);
const SCIENCEDAILY = src('sciencedaily', 'ScienceDaily', 'science', 'US', 'https://www.sciencedaily.com', 0.82);
const NASA = src('nasa', 'NASA', 'science', 'US', 'https://www.nasa.gov', 0.95);

export const FEEDS: FeedConfig[] = [
  { source: HINDU, url: 'https://www.thehindu.com/news/national/feeder/default.rss', topics: ['india'] },
  { source: HINDU, url: 'https://www.thehindu.com/business/feeder/default.rss', topics: ['business', 'india'] },
  { source: EXPRESS, url: 'https://indianexpress.com/section/india/feed/', topics: ['india'] },
  { source: MINT, url: 'https://www.livemint.com/rss/economy', topics: ['economy', 'india'] },
  { source: MINT, url: 'https://www.livemint.com/rss/news', topics: ['india'] },
  { source: BBC, url: 'https://feeds.bbci.co.uk/news/world/rss.xml', topics: ['world'] },
  { source: BBC, url: 'https://feeds.bbci.co.uk/news/business/rss.xml', topics: ['business'] },
  { source: ALJAZEERA, url: 'https://www.aljazeera.com/xml/rss/all.xml', topics: ['world'] },
  { source: GUARDIAN, url: 'https://www.theguardian.com/world/rss', topics: ['world'] },
  { source: TECHCRUNCH, url: 'https://techcrunch.com/feed/', topics: ['technology', 'startups'] },
  { source: VERGE, url: 'https://www.theverge.com/rss/index.xml', topics: ['technology'] },
  { source: ARS, url: 'https://feeds.arstechnica.com/arstechnica/index', topics: ['technology', 'science'] },
  { source: BLEEPING, url: 'https://www.bleepingcomputer.com/feed/', topics: ['cybersecurity'] },
  { source: THN, url: 'https://feeds.feedburner.com/TheHackersNews', topics: ['cybersecurity'] },
  { source: SCIENCEDAILY, url: 'https://www.sciencedaily.com/rss/all.xml', topics: ['science'] },
  { source: NASA, url: 'https://www.nasa.gov/news-release/feed/', topics: ['space', 'science'] },
];

export const ALL_SOURCES: NewsSource[] = [...new Map(FEEDS.map((f) => [f.source.id, f.source])).values()];
