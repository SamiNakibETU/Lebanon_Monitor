/**
 * Telegram fetcher via RSS bridge.
 * Fetches from configurable RSS URLs (Telegram channels converted to RSS).
 */

import Parser from 'rss-parser';
import { logger } from '@/lib/logger';
import { TELEGRAM_RSS_URLS, TELEGRAM_CONFIG } from './config';

const SOURCE = 'telegram';

const parser = new Parser({
  timeout: 15_000,
  headers: { 'User-Agent': TELEGRAM_CONFIG.userAgent },
});

const LEBANON_KEYWORDS = ['lebanon', 'lebanese', 'liban', 'libanais', 'beirut', 'beyrouth', 'tripoli', 'tyre', 'sidon', 'baalbek', 'لبنان'];

function mentionsLebanon(text: string): boolean {
  const lower = text.toLowerCase();
  return LEBANON_KEYWORDS.some((kw) => lower.includes(kw.toLowerCase()));
}

export interface TelegramFetchResult {
  items: Array<{ title?: string; link?: string; pubDate?: string; contentSnippet?: string; feedName: string }>;
}

export async function fetchTelegram(): Promise<
  | { ok: true; data: TelegramFetchResult }
  | { ok: false; error: { source: string; message: string } }
> {
  if (TELEGRAM_RSS_URLS.length === 0) {
    return {
      ok: false,
      error: { source: SOURCE, message: 'TELEGRAM_RSS_URLS not configured' },
    };
  }

  const allItems: TelegramFetchResult['items'] = [];

  for (const url of TELEGRAM_RSS_URLS) {
    try {
      const parsed = await parser.parseURL(url);
      const feedName = parsed.title ?? new URL(url).hostname;
      const items = (parsed.items ?? []).map((item) => ({
        title: item.title,
        link: item.link,
        pubDate: item.pubDate,
        contentSnippet: item.contentSnippet,
        feedName,
      }));
      const filtered = items.filter(
        (i) => mentionsLebanon(i.title ?? '') || mentionsLebanon(i.contentSnippet ?? '')
      );
      allItems.push(...filtered);
    } catch (e) {
      logger.warn('Telegram RSS feed failed', {
        source: SOURCE,
        url: url.slice(0, 50),
        message: (e as Error).message,
      });
    }
  }

  logger.info('Telegram fetch completed', { source: SOURCE, itemCount: allItems.length });
  return { ok: true, data: { items: allItems } };
}
