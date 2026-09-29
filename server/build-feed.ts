/**
 * Builds Vartify's news feed.
 *
 *   npm run build-feed            → writes server/public/{feed,sources,meta}.json
 *
 * Runs on a schedule in GitHub Actions (.github/workflows/update-feed.yml),
 * which publishes server/public to GitHub Pages. The app downloads feed.json.
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { buildFeedFromArticles } from './pipeline/build-feed-core';
import { ingestAll } from './pipeline/ingest';
import { ALL_SOURCES, FEEDS } from './sources';

const OUT_DIR = join(dirname(fileURLToPath(import.meta.url)), 'public');

async function main() {
  const started = Date.now();
  const { articles, reports } = await ingestAll(FEEDS);
  const stories = buildFeedFromArticles(articles, started);

  const multiSource = stories.filter((s) => s.sources.length > 1);
  const meta = {
    generatedAt: new Date().toISOString(),
    articleCount: articles.length,
    storyCount: stories.length,
    multiSourceStories: multiSource.length,
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
