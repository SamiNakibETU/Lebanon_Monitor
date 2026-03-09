/**
 * Normalizes Nitter RSS items to LebanonEvent[].
 */

import type { LebanonEvent } from '@/types/events';
import { classifyByKeywords } from '@/lib/classification/classifier';
import { LEBANON_CITIES } from '@/config/lebanon';
import { resolveCityCoords } from '@/sources/rss/config';
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

/** Strip URLs (http://, https://) and hashtags (#xxx) from display text. */
function stripUrlsAndHashtags(s: string): string {
  return s
    .replace(/\s*https?:\/\/[^\s]+/gi, '')
    .replace(/\s*#\w+/g, '')
    .replace(/\s+/g, ' ')
    .trim();
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
    const title = stripUrlsAndHashtags(decodeTitle(rawTitle));
    const text = `${title} ${item.contentSnippet ?? ''} ${item.content ?? ''}`;
    const { classification, confidence, category } = classifyByKeywords(text);
    const tweetId = extractTweetId(item.link, item.guid);
    const url = item.link ?? (tweetId ? `https://x.com/${item.handle}/status/${tweetId}` : undefined);

    const id = `twitter-${item.handle}-${tweetId || i}`;
    const resolved = resolveCityCoords(title, item.contentSnippet ?? item.content);
    const lat = resolved?.lat ?? LEBANON_CITIES.Beirut.lat;
    const lng = resolved?.lng ?? LEBANON_CITIES.Beirut.lng;

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
        geoPrecision: resolved?.geoPrecision ?? 'country',
        resolvedPlaceName: resolved?.resolvedPlaceName ?? 'Lebanon',
        evidence: {
          geocodeMethod: resolved?.geocodeMethod ?? 'country_fallback',
          geocodeConfidence: resolved?.geocodeConfidence ?? 0.3,
        },
      },
    });
  }

  return events;
}
