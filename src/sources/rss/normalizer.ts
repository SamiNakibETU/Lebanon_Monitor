/**
 * Normalizes RSS items to LebanonEvent[].
 */

import type { LebanonEvent } from '@/types/events';
import { classifyByKeywords } from '@/lib/classification/classifier';
import { LEBANON_CITIES } from '@/config/lebanon';
import { resolveCityCoords } from './config';
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
    const resolved = resolveCityCoords(title, item.contentSnippet);
    const lat = resolved?.lat ?? LEBANON_CITIES.Beirut.lat;
    const lng = resolved?.lng ?? LEBANON_CITIES.Beirut.lng;

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
