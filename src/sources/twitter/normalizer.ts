/**
 * Normalizes Nitter RSS items to LebanonEvent[].
 */

import type { LebanonEvent } from '@/types/events';
import { classifyByKeywords } from '@/lib/classification/classifier';
import { addJitter } from '@/lib/geocoding';
import { getCityCoords } from '@/sources/rss/config';
import { TWITTER_CONFIG } from './config';
import type { NitterRssItem } from './types';

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

/** Decode URL-encoded Arabic/Unicode in titles (e.g. %D8%A7%D8%AA...). */
function decodeTitle(s: string): string {
  try {
    return decodeURIComponent(s.replace(/\+/g, ' '));
  } catch {
    return s;
  }
}

function extractTweetId(link: string | undefined, guid: string | undefined): string {
  if (link?.includes('/status/')) {
    const match = link.match(/\/status\/(\d+)/);
    return match ? match[1] : '';
  }
  return (guid ?? '').toString();
}

export function normalize(
  items: Array<NitterRssItem & { handle: string }>,
  fetchedAt: Date
): LebanonEvent[] {
  const events: LebanonEvent[] = [];

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const rawTitle = item.title ?? stripHtml(item.content ?? '') ?? 'Tweet';
    const title = decodeTitle(rawTitle);
    const text = `${title} ${item.contentSnippet ?? ''} ${item.content ?? ''}`;
    const { classification, confidence, category } = classifyByKeywords(text);
    const tweetId = extractTweetId(item.link, item.guid);
    const url = item.link ?? (tweetId ? `https://x.com/${item.handle}/status/${tweetId}` : undefined);

    const id = `twitter-${item.handle}-${tweetId || i}`;
    const baseCoords = getCityCoords(title, item.contentSnippet ?? item.content);
    const { lat, lng } = addJitter(baseCoords, id);

    events.push({
      id,
      source: 'twitter',
      title: title.slice(0, 300),
      description: item.contentSnippet?.slice(0, 500),
      url,
      timestamp: item.pubDate ? new Date(item.pubDate) : fetchedAt,
      latitude: lat,
      longitude: lng,
      classification,
      confidence,
      category,
      severity: 'low',
      rawData: {
        handle: item.handle,
        tweetId,
        creator: item.creator,
      },
      metadata: {
        fetchedAt,
        ttlSeconds: TWITTER_CONFIG.ttlSeconds,
        sourceReliability: 'medium',
      },
    });
  }

  return events;
}
