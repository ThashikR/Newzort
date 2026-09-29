/**
 * Dev tool: shows headline pairs from DIFFERENT publishers ranked by similarity,
 * to help tune SIMILARITY_THRESHOLD in pipeline/build-stories.ts.
 *   npx tsx scripts/inspect-similarity.ts
 */
import { tokens } from '../pipeline/clustering';
import { ingestAll } from '../pipeline/ingest';
import { FEEDS } from '../sources';

const { articles } = await ingestAll(FEEDS);
const docs = articles.map((a) => new Set([...tokens(a.title), ...tokens(a.excerpt.split(' ').slice(0, 20).join(' '))]));
const df = new Map<string, number>();
docs.forEach((d) => d.forEach((t) => df.set(t, (df.get(t) ?? 0) + 1)));
const idf = new Map([...df].map(([t, n]) => [t, Math.log((articles.length + 1) / n)]));

const pairs: { s: number; a: string; b: string }[] = [];
for (let i = 0; i < articles.length; i++) {
  for (let j = i + 1; j < articles.length; j++) {
    if (articles[i].feed.source.id === articles[j].feed.source.id) continue;
    let inter = 0;
    let union = 0;
    for (const t of new Set([...docs[i], ...docs[j]])) {
      const w = idf.get(t)!;
      union += w;
      if (docs[i].has(t) && docs[j].has(t)) inter += w;
    }
    const s = inter / union;
    if (s >= 0.12) pairs.push({ s, a: `[${articles[i].feed.source.name}] ${articles[i].title}`, b: `[${articles[j].feed.source.name}] ${articles[j].title}` });
  }
}
pairs.sort((x, y) => y.s - x.s);
for (const p of pairs.slice(0, 30)) console.log(`${p.s.toFixed(2)}  ${p.a}\n      ${p.b}`);
