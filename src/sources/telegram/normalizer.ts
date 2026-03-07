/**
 * Normalize Telegram RSS items to LebanonEvent[].
 */

import type { LebanonEvent } from '@/types/events';
import { classifyByKeywords } from '@/lib/classification/classifier';
import { addJitter } from '@/lib/geocoding';
import { LEBANON_CITIES } from '@/config/lebanon';
import { TELEGRAM_CONFIG } from './config';
import type { TelegramFetchResult } from './fetcher';

function getCityCoords(title: string, snippet?: string): { lat: number; lng: number } {
  const text = `${title} ${snippet ?? ''}`.toLowerCase();
  for (const [city, coords] of Object.entries(LEBANON_CITIES)) {
    if (text.includes(city.toLowerCase())) return coords;
  }
  if (text.includes('tripoli')) return LEBANON_CITIES.Tripoli;
  if (text.includes('sidon') || text.includes('saida')) return LEBANON_CITIES.Sidon;
  if (text.includes('tyre') || text.includes('sour')) return LEBANON_CITIES.Tyre;
  if (text.includes('baalbek')) return LEBANON_CITIES.Baalbek;
  return LEBANON_CITIES.Beirut;
}

type TelegramItem = TelegramFetchResult['items'][number];

export function normalize(
  items: Array<Partial<TelegramItem> & { feedName?: string }>,
  fetchedAt: Date
): LebanonEvent[] {
  const events: LebanonEvent[] = [];

  for (let i = 0; i < items.length; i++) {
    const item = items[i]!;
    const title = item.title ?? 'Untitled';
    const text = `${title} ${item.contentSnippet ?? ''}`;
    const { classification, confidence } = classifyByKeywords(text);
    const baseCoords = getCityCoords(title, item.contentSnippet);
    const { lat, lng } = addJitter(baseCoords, `telegram-${item.link ?? title}-${i}`);

    const id = `telegram-${(item.link ?? title).replace(/[^a-zA-Z0-9]/g, '_').slice(0, 60)}-${i}`;

    events.push({
      id,
      source: 'telegram',
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
        ttlSeconds: TELEGRAM_CONFIG.ttlSeconds,
        sourceReliability: 'medium',
      },
    });
  }

  return events;
}
