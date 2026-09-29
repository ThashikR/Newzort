import type { NewsSource } from '@/types/news';

/**
 * DEMO PUBLISHERS — fictional outlets used only for development.
 * Links point to example.com (a domain reserved for documentation) so the
 * app never shows a fabricated URL for a real publisher.
 */
const demo = (id: string, name: string, kind: NewsSource['kind'], country: string, reliability: number): NewsSource => ({
  id,
  name,
  kind,
  country,
  reliability,
  homepage: `https://example.com/demo/${id}`,
});

export const DEMO_SOURCES = {
  meridian: demo('daily-meridian', 'The Daily Meridian', 'national', 'IN', 0.9),
  globalWire: demo('global-wire', 'Global Wire Service', 'wire', 'INTL', 0.95),
  capitalLedger: demo('capital-ledger', 'Capital Ledger', 'business', 'IN', 0.88),
  bharatChronicle: demo('bharat-chronicle', 'Bharat Chronicle', 'national', 'IN', 0.86),
  marketReview: demo('market-review', 'Market Review', 'business', 'INTL', 0.84),
  circuit: demo('the-circuit', 'The Circuit', 'technology', 'INTL', 0.82),
  secureLine: demo('secureline', 'SecureLine', 'technology', 'INTL', 0.83),
  scienceFrontier: demo('science-frontier', 'Science Frontier', 'science', 'INTL', 0.9),
  greenPlanet: demo('green-planet', 'Green Planet Report', 'science', 'INTL', 0.8),
  eastAsiaObserver: demo('east-asia-observer', 'East Asia Observer', 'regional', 'INTL', 0.8),
  policyWatch: demo('policy-watch', 'Policy Watch', 'national', 'IN', 0.82),
} satisfies Record<string, NewsSource>;

export const ALL_DEMO_SOURCES: NewsSource[] = Object.values(DEMO_SOURCES);
