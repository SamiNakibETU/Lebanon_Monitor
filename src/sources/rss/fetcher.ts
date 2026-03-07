/**
 * RSS feed aggregator fetcher.
 */

import Parser from 'rss-parser';
import { logger } from '@/lib/logger';
import { RSS_FEEDS, RSS_USER_AGENT } from './config';
import type { RssItem } from './types';

const SOURCE = 'rss';
const parser = new Parser({
  timeout: 10_000,
  headers: { 'User-Agent': RSS_USER_AGENT },
});

const LEBANON_KEYWORDS = ['lebanon', 'lebanese', 'beirut', 'tripoli', 'tyre', 'sidon', 'baalbek'];

function mentionsLebanon(text: string): boolean {
  const lower = text.toLowerCase();
  return LEBANON_KEYWORDS.some((kw) => lower.includes(kw));
}

export interface RssFetchResult {
  items: Array<RssItem & { feedName: string }>;
}

export async function fetchRss(): Promise<
  | { ok: true; data: RssFetchResult }
  | { ok: false; error: { source: string; message: string } }
> {
  const allItems: Array<RssItem & { feedName: string }> = [];

  for (const feed of RSS_FEEDS) {
    try {
      const parsed = await parser.parseURL(feed.url);
      const items = (parsed.items ?? []).map((item) => ({
        ...item,
        feedName: feed.name,
      }));

      const isLebaneseSource = ['L\'Orient Today', 'NNA', 'Daily Star Lebanon', 'MTV Lebanon'].includes(feed.name);
      const filtered = isLebaneseSource
        ? items
        : items.filter((i) => mentionsLebanon(i.title ?? '') || mentionsLebanon(i.contentSnippet ?? ''));

      allItems.push(...filtered);
    } catch (e) {
      logger.warn('RSS feed failed', { source: SOURCE, feed: feed.name, message: (e as Error).message });
    }
  }

  logger.info('RSS fetch completed', { source: SOURCE, itemCount: allItems.length });
  return { ok: true, data: { items: allItems } };
}
