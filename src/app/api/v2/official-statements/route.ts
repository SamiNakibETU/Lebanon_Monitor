import { NextResponse } from 'next/server';
import { cachedFetch } from '@/lib/cache';
import Parser from 'rss-parser';

interface StatementItem {
  id: string;
  title: string;
  url: string | null;
  date: string | null;
  source: string;
  type: 'diplomacy' | 'institutional';
  latitude: number;
  longitude: number;
}

const FEEDS = [
  { url: 'http://nna-leb.gov.lb/en/rss', source: 'NNA', type: 'institutional' as const },
  { url: 'https://news.google.com/rss/search?q=Lebanon+presidency+statement&hl=en-US&gl=US&ceid=US:en', source: 'GoogleNews Presidency', type: 'institutional' as const },
  { url: 'https://news.google.com/rss/search?q=Lebanon+foreign+minister+statement&hl=en-US&gl=US&ceid=US:en', source: 'GoogleNews Diplomacy', type: 'diplomacy' as const },
  { url: 'https://news.google.com/rss/search?q=Lebanon+parliament+statement&hl=en-US&gl=US&ceid=US:en', source: 'GoogleNews Parliament', type: 'institutional' as const },
];

const parser = new Parser({ timeout: 10_000 });

function normalizeTitleKey(title: string): string {
  return title.toLowerCase().replace(/[^a-z0-9\u0600-\u06ff]+/gi, ' ').trim().slice(0, 140);
}

export async function GET() {
  try {
    const payload = await cachedFetch(
      'lm:official-statements:v1',
      async () => {
        const out: StatementItem[] = [];
        for (const feed of FEEDS) {
          try {
            const parsed = await parser.parseURL(feed.url);
            for (const item of parsed.items ?? []) {
              const title = String(item.title ?? '').trim();
              if (!title) continue;
              out.push({
                id: `stmt-${normalizeTitleKey(title)}`,
                title,
                url: item.link ?? null,
                date: item.pubDate ? new Date(item.pubDate).toISOString() : null,
                source: feed.source,
                type: feed.type,
                latitude: 33.8938,
                longitude: 35.5018,
              });
            }
          } catch {
            // non-fatal by feed
          }
        }
        const dedup = new Map<string, StatementItem>();
        for (const item of out) {
          const key = normalizeTitleKey(item.title);
          if (!dedup.has(key)) dedup.set(key, item);
        }
        const items = Array.from(dedup.values())
          .sort((a, b) => (new Date(b.date ?? 0).getTime() - new Date(a.date ?? 0).getTime()))
          .slice(0, 60);
        return {
          generatedAt: new Date().toISOString(),
          count: items.length,
          items,
        };
      },
      { ttl: 900 }
    );

    return NextResponse.json(payload, {
      headers: { 'Cache-Control': 's-maxage=900, stale-while-revalidate=1800' },
    });
  } catch (err) {
    return NextResponse.json({
      generatedAt: new Date().toISOString(),
      count: 0,
      items: [],
      error: err instanceof Error ? err.message : String(err),
    });
  }
}

