/**
 * Builds Newzort's news feed.
 *
 *   npm run build-feed            → writes server/public/{feed,sources,meta}.json
 *
 * Runs on a schedule in GitHub Actions (.github/workflows/update-feed.yml),
 * which publishes server/public to GitHub Pages. The app downloads feed.json.
 *
 * AI analysis runs only when GEMINI_API_KEY and/or GROQ_API_KEY are set
 * (GitHub secrets). Without keys, stories stay headline-only.
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import type { StoryCluster } from '../src/types/news';

import { analyseWithAi } from './pipeline/ai-analyze';
import { buildFeedFromArticles } from './pipeline/build-feed-core';
import { ingestAll } from './pipeline/ingest';
import { ALL_SOURCES, FEEDS } from './sources';

const OUT_DIR = join(dirname(fileURLToPath(import.meta.url)), 'public');
/** The currently published feed — its AI results are reused for unchanged stories. */
const PREVIOUS_FEED_URL = process.env.PREVIOUS_FEED_URL ?? 'https://thashikr.github.io/Newzort/feed.json';

async function loadPreviousFeed(): Promise<StoryCluster[]> {
  try {
    const res = await fetch(`${PREVIOUS_FEED_URL}?t=${Date.now()}`, { signal: AbortSignal.timeout(20_000) });
    return res.ok ? ((await res.json()) as StoryCluster[]) : [];
  } catch {
    return [];
  }
}

async function main() {
  const started = Date.now();
  const [{ articles, reports }, previous] = await Promise.all([ingestAll(FEEDS), loadPreviousFeed()]);
  const grouped = buildFeedFromArticles(articles, started);
  const { stories: analysed, report: ai } = await analyseWithAi(grouped, previous);
  const stories = [...analysed].sort((a, b) => b.importanceScore - a.importanceScore);

  const multiSource = stories.filter((s) => s.sources.length > 1);
  const meta = {
    generatedAt: new Date().toISOString(),
    articleCount: articles.length,
    storyCount: stories.length,
    multiSourceStories: multiSource.length,
    aiStories: stories.filter((s) => s.analysisMode === 'ai').length,
    ai,
    feeds: reports,
  };

  await mkdir(OUT_DIR, { recursive: true });
  await writeFile(join(OUT_DIR, 'feed.json'), JSON.stringify(stories));
  await writeFile(join(OUT_DIR, 'sources.json'), JSON.stringify(ALL_SOURCES));
  await writeFile(join(OUT_DIR, 'meta.json'), JSON.stringify(meta, null, 2));
  // GitHub Pages: serve files as-is (no Jekyll processing).
  await writeFile(join(OUT_DIR, '.nojekyll'), '');

  const failed = reports.filter((r) => !r.ok);
  console.log(`Fetched ${articles.length} articles from ${reports.length - failed.length}/${reports.length} feeds`);
  failed.forEach((r) => console.warn(`  ! ${r.source}: ${r.error}`));
  console.log(`Built ${stories.length} stories (${multiSource.length} covered by 2+ publishers) in ${Date.now() - started} ms`);
  console.log(
    ai.enabled
      ? `AI: ${ai.analysed} analysed, ${ai.reused} reused, ${ai.rejected} rejected of ${ai.attempted} attempted · calls ${JSON.stringify(ai.providerCalls)}`
      : 'AI: disabled (no GEMINI_API_KEY / GROQ_API_KEY) — stories stay headline-only',
  );
  ai.errors.slice(0, 10).forEach((e) => console.warn(`  ! ${e}`));
  console.log(`Output: ${OUT_DIR}`);

  // Fail the run (so GitHub marks it red) only if almost everything broke.
  if (articles.length < 20) {
    console.error('Too few articles — not publishing a nearly empty feed.');
    process.exit(1);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
