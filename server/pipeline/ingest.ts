/**
 * Steps 1–2: INGESTION + CLEANING.
 * Fetches each RSS/Atom feed, extracts headline/link/time/excerpt, strips HTML,
 * normalises URLs and drops duplicates and stale items.
 */
import { XMLParser } from 'fast-xml-parser';

import type { FeedConfig } from '../sources';

export interface IngestedArticle {
  id: string;
  feed: FeedConfig;
  title: string;
  url: string;
  excerpt: string;
  publishedAt: string;
}

export interface FeedReport {
  source: string;
  url: string;
  ok: boolean;
  items: number;
  error?: string;
}

const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '@_', textNodeName: '#text' });

const MAX_AGE_HOURS = 36;
const EXCERPT_MAX = 240;

/** Text of an XML node that may be a string, {#text}, or CDATA-wrapped. */
function text(node: unknown): string {
  if (node == null) return '';
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return text(node[0]);
  if (typeof node === 'object') {
    const o = node as Record<string, unknown>;
    return text(o['#text'] ?? o['__cdata'] ?? '');
  }
  return '';
}

const ENTITIES: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', '#39': "'" };

export function cleanText(html: string): string {
  return html
    .replace(/<!\[CDATA\[|\]\]>/g, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&(#x?[0-9a-f]+|\w+);/gi, (m, e: string) => {
      if (ENTITIES[e]) return ENTITIES[e];
      if (e.startsWith('#x')) return String.fromCodePoint(parseInt(e.slice(2), 16));
      if (e.startsWith('#')) return String.fromCodePoint(parseInt(e.slice(1), 10));
      return m;
    })
    .replace(/\s+/g, ' ')
    .trim();
}

/** Cut at a sentence/word boundary so excerpts stay short (and within fair use). */
export function shorten(s: string, max = EXCERPT_MAX): string {
  if (s.length <= max) return s;
  const cut = s.slice(0, max);
  const sentence = cut.lastIndexOf('. ');
  if (sentence > max * 0.5) return cut.slice(0, sentence + 1);
  return cut.slice(0, cut.lastIndexOf(' ')) + '…';
}

/** Remove tracking parameters and fragments so the same article dedupes. */
export function canonicalUrl(raw: string): string {
  try {
    const u = new URL(raw.trim());
    [...u.searchParams.keys()].forEach((k) => {
      if (/^(utm_|fbclid|gclid|ref$|cmpid|ito)/i.test(k)) u.searchParams.delete(k);
    });
    u.hash = '';
    return u.toString();
  } catch {
    return raw.trim();
  }
}

function linkOf(item: Record<string, unknown>): string {
  const link = item.link;
  if (typeof link === 'string') return link;
  if (Array.isArray(link)) {
    const alt = link.find((l) => (l as Record<string, string>)['@_rel'] !== 'self') ?? link[0];
    return (alt as Record<string, string>)['@_href'] ?? text(alt);
  }
  if (link && typeof link === 'object') return (link as Record<string, string>)['@_href'] ?? text(link);
  return text(item.guid);
}

function hashId(s: string): string {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) >>> 0;
  return h.toString(36);
}

async function fetchFeed(feed: FeedConfig, now: number): Promise<{ articles: IngestedArticle[]; report: FeedReport }> {
  const report: FeedReport = { source: feed.source.name, url: feed.url, ok: false, items: 0 };
  try {
    const res = await fetch(feed.url, {
      signal: AbortSignal.timeout(20_000),
      headers: { 'User-Agent': 'VartifyNewsBot/0.1 (personal news reader; links back to publishers)' },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const xml = parser.parse(await res.text());
    const rawItems: Record<string, unknown>[] = [xml?.rss?.channel?.item ?? xml?.feed?.entry ?? xml?.['rdf:RDF']?.item ?? []].flat();

    const articles: IngestedArticle[] = [];
    for (const item of rawItems) {
      const title = cleanText(text(item.title));
      const url = canonicalUrl(linkOf(item));
      if (!title || !url.startsWith('http')) continue;
      const dateStr = text(item.pubDate ?? item.published ?? item.updated ?? item['dc:date']);
      const published = Date.parse(dateStr);
      // Undated items are treated as "now" (feeds list newest first).
      const publishedAt = Number.isFinite(published) ? Math.min(published, now) : now;
      if (now - publishedAt > MAX_AGE_HOURS * 3_600_000) continue;
      const excerpt = shorten(cleanText(text(item.description ?? item.summary ?? item['media:description'] ?? '')));
      articles.push({
        id: `${feed.source.id}-${hashId(url)}`,
        feed,
        title,
        url,
        excerpt: excerpt === title ? '' : excerpt,
        publishedAt: new Date(publishedAt).toISOString(),
      });
    }
    report.ok = true;
    report.items = articles.length;
    return { articles, report };
  } catch (e) {
    report.error = e instanceof Error ? e.message : String(e);
    return { articles: [], report };
  }
}

/** Fetch every feed in parallel; one broken feed never stops the others. */
export async function ingestAll(feeds: FeedConfig[], now = Date.now()) {
  const results = await Promise.all(feeds.map((f) => fetchFeed(f, now)));
  const seenUrls = new Set<string>();
  const seenTitles = new Set<string>();
  const articles: IngestedArticle[] = [];
  for (const a of results.flatMap((r) => r.articles)) {
    const titleKey = `${a.feed.source.id}|${a.title.toLowerCase()}`;
    if (seenUrls.has(a.url) || seenTitles.has(titleKey)) continue; // same article in two feeds
    seenUrls.add(a.url);
    seenTitles.add(titleKey);
    articles.push(a);
  }
  return { articles, reports: results.map((r) => r.report) };
}
