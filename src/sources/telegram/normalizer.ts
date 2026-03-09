/**
 * Normalize Telegram RSS items to LebanonEvent[].
 */

import type { LebanonEvent } from '@/types/events';
import { classifyByKeywords } from '@/lib/classification/classifier';
import { LEBANON_CITIES } from '@/config/lebanon';
import { normalizeText } from '@/lib/text-normalize';
import { resolveCityCoords } from '@/sources/rss/config';
import { TELEGRAM_CONFIG } from './config';
import type { TelegramFetchResult } from './fetcher';

type TelegramItem = TelegramFetchResult['items'][number];

export function normalize(
  items: Array<Partial<TelegramItem> & { feedName?: string }>,
  fetchedAt: Date
): LebanonEvent[] {
  const events: LebanonEvent[] = [];

  for (let i = 0; i < items.length; i++) {
    const item = items[i]!;
    const title = normalizeText(item.title) || 'Untitled';
    const snippet = normalizeText(item.contentSnippet ?? '');
    const text = `${title} ${snippet}`;
    const { classification, confidence } = classifyByKeywords(text);
    const resolved = resolveCityCoords(title, snippet);
    const lat = resolved?.lat ?? LEBANON_CITIES.Beirut.lat;
    const lng = resolved?.lng ?? LEBANON_CITIES.Beirut.lng;

    const id = `telegram-${(item.link ?? title).replace(/[^a-zA-Z0-9]/g, '_').slice(0, 60)}-${i}`;

    events.push({
      id,
      source: 'telegram',
      title,
      description: snippet || undefined,
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
        ttlSeconds: TELEGRAM_CONFIG.ttlSeconds,
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
