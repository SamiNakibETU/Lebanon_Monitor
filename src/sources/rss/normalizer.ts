/**
 * Normalizes RSS items to LebanonEvent[].
 */

import type { LebanonEvent } from '@/types/events';
import { classifyByKeywords } from '@/lib/classification/classifier';
import { addJitter } from '@/lib/geocoding';
import { getCityCoords } from './config';
import type { RssItem } from './types';
import { RSS_CONFIG } from './config';

export function normalize(
  items: Array<RssItem & { feedName?: string }>,
  fetchedAt: Date
): LebanonEvent[] {
  const events: LebanonEvent[] = [];

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const title = item.title ?? 'Untitled';
    const text = `${title} ${item.contentSnippet ?? ''}`;
    const { classification, confidence } = classifyByKeywords(text);
    const baseCoords = getCityCoords(title, item.contentSnippet);
    const { lat, lng } = addJitter(baseCoords, `rss-${item.link ?? title}-${i}`);

    const id = `rss-${(item.link ?? title).replace(/[^a-zA-Z0-9]/g, '_').slice(0, 60)}-${i}`;

    events.push({
      id,
      source: 'rss',
      title,
      description: item.contentSnippet,
      url: item.link,
      timestamp: item.pubDate ? new Date(item.pubDate) : new Date(),
      latitude: lat,
      longitude: lng,
      classification,
      confidence,
      category: classification === 'lumiere' ? 'cultural_event' : classification === 'ombre' ? 'political_tension' : 'neutral',
      severity: 'low',
      metadata: {
        fetchedAt,
        ttlSeconds: RSS_CONFIG.ttlSeconds,
        sourceReliability: 'medium',
      },
    });
  }

  return events;
}
