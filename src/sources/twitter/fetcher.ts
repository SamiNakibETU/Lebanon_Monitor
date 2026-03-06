/**
 * Nitter RSS fetcher for Twitter/X profiles.
 * Fetches timeline RSS from Nitter instances (no API key).
 */

import Parser from 'rss-parser';
import { logger } from '@/lib/logger';
import { NITTER_INSTANCES, LEBANON_HANDLES, TWITTER_CONFIG } from './config';
import type { NitterRssItem } from './types';

const SOURCE = 'twitter';
const parser = new Parser({
  timeout: 12_000,
  headers: {
    'User-Agent': 'Mozilla/5.0 (compatible; LebanonMonitor/1.0)',
  },
});

export interface TwitterFetchResult {
  items: Array<NitterRssItem & { handle: string }>;
}

/**
 * Fetches RSS feed for a single handle from the first working instance.
 */
async function fetchHandleRss(handle: string): Promise<NitterRssItem[]> {
  for (const instance of NITTER_INSTANCES) {
    try {
      const url = `${instance.replace(/\/$/, '')}/${handle}/rss`;
      const feed = await parser.parseURL(url);
      return feed.items ?? [];
    } catch {
      continue;
    }
  }
  return [];
}

/**
 * Fetches tweets from Lebanon-related Twitter handles via Nitter RSS.
 */
export async function fetchTwitter(): Promise<
  | { ok: true; data: TwitterFetchResult }
  | { ok: false; error: { source: string; message: string } }
> {
  const allItems: Array<NitterRssItem & { handle: string }> = [];

  for (const handle of LEBANON_HANDLES) {
    try {
      const items = await fetchHandleRss(handle);
      const limited = items.slice(0, TWITTER_CONFIG.maxItemsPerHandle);
      for (const item of limited) {
        allItems.push({ ...item, handle });
      }
      if (items.length > 0) {
        logger.info('Twitter handle fetched', {
          source: SOURCE,
          handle,
          count: limited.length,
        });
      }
    } catch (e) {
      logger.warn('Twitter handle failed', {
        source: SOURCE,
        handle,
        message: (e as Error).message,
      });
    }
  }

  logger.info('Twitter fetch completed', { source: SOURCE, itemCount: allItems.length });
  return { ok: true, data: { items: allItems } };
}
