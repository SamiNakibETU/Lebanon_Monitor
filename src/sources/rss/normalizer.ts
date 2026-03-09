/**
 * Normalizes RSS items to LebanonEvent[].
 */

import type { LebanonEvent } from '@/types/events';
import { classifyByKeywords } from '@/lib/classification/classifier';
import { LEBANON_CITIES } from '@/config/lebanon';
import { normalizeText } from '@/lib/text-normalize';
import { resolveCityCoords } from './config';
import type { RssItem } from './types';
import { RSS_CONFIG } from './config';

const CULTURE_FEEDS = new Set(['Agenda Culturel', 'Beirut.com', 'Mondanite', "L'Orient Littéraire"]);
const SOLIDARITY_FEEDS = new Set(['UNDP Lebanon', 'UNICEF Lebanon', 'UNRWA', 'UNHCR Lebanon', 'WFP Lebanon', 'ICRC']);

const CULTURE_KEYWORDS = /(concert|exposition|festival|vernissage|th[ée][âa]tre|cin[ée]ma|musique|spectacle|performance|gallery|exhibit)/i;
const SOLIDARITY_KEYWORDS = /(aid|humanitarian|distribution|relief|food|medical|vaccin|school|cash assistance|displaced|support)/i;

function classifyRssContent(input: {
  feedName?: string;
  text: string;
  baseClassification: LebanonEvent['classification'];
  baseConfidence: number;
}): {
  classification: LebanonEvent['classification'];
  confidence: number;
  category: LebanonEvent['category'];
} {
  const feed = input.feedName ?? '';
  const text = input.text;

  if (CULTURE_FEEDS.has(feed) || CULTURE_KEYWORDS.test(text)) {
    return { classification: 'lumiere', confidence: Math.max(input.baseConfidence, 0.82), category: 'cultural_event' };
  }
  if (SOLIDARITY_FEEDS.has(feed) || SOLIDARITY_KEYWORDS.test(text)) {
    return { classification: 'lumiere', confidence: Math.max(input.baseConfidence, 0.8), category: 'solidarity' };
  }
  if (/(reconstruction|rehabilitation|rebuild|project launch|inauguration)/i.test(text)) {
    return { classification: 'lumiere', confidence: Math.max(input.baseConfidence, 0.78), category: 'reconstruction' };
  }

  if (input.baseClassification === 'lumiere') {
    return { classification: 'lumiere', confidence: input.baseConfidence, category: 'cultural_event' };
  }
  if (input.baseClassification === 'ombre') {
    return { classification: 'ombre', confidence: input.baseConfidence, category: 'political_tension' };
  }
  return { classification: 'neutre', confidence: input.baseConfidence, category: 'neutral' };
}

export function normalize(
  items: Array<RssItem & { feedName?: string }>,
  fetchedAt: Date
): LebanonEvent[] {
  const events: LebanonEvent[] = [];

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const title = normalizeText(item.title) || 'Untitled';
    const snippet = normalizeText(item.contentSnippet ?? '');
    const text = `${title} ${snippet}`;
    const { classification: baseClassification, confidence: baseConfidence } = classifyByKeywords(text);
    const { classification, confidence, category } = classifyRssContent({
      feedName: item.feedName,
      text,
      baseClassification,
      baseConfidence,
    });
    const resolved = resolveCityCoords(title, snippet);
    const lat = resolved?.lat ?? LEBANON_CITIES.Beirut.lat;
    const lng = resolved?.lng ?? LEBANON_CITIES.Beirut.lng;

    const id = `rss-${(item.link ?? title).replace(/[^a-zA-Z0-9]/g, '_').slice(0, 60)}-${i}`;

    events.push({
      id,
      source: 'rss',
      title,
      description: snippet || undefined,
      url: item.link,
      timestamp: item.pubDate ? new Date(item.pubDate) : new Date(),
      latitude: lat,
      longitude: lng,
      classification,
      confidence,
      category,
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
        extractedEntities: {
          persons: [],
          parties: [],
          cities: resolved?.resolvedPlaceName ? [resolved.resolvedPlaceName] : [],
          organizations: item.feedName ? [item.feedName] : [],
        },
      },
    });
  }

  return events;
}
