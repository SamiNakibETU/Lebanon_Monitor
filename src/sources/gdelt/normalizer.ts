/**
 * Normalizes GDELT articles to LebanonEvent[].
 */

import type { LebanonEvent } from '@/types/events';
import { DEFAULT_COORDS, LEBANON_BBOX } from '@/config/lebanon';
import { classifyGdeltEvent } from './classifier';
import type { GdeltArticle } from './types';
import { GDELT_CONFIG } from './config';

const DOMAIN_COORDS: Record<string, [number, number]> = {
  'lorientlejour.com': [33.8938, 35.5018],
  'nna-leb.gov.lb': [33.8938, 35.5018],
  'dailystar.com.lb': [33.8938, 35.5018],
  'mtv.com.lb': [33.8938, 35.5018],
  'almanar.com.lb': [33.8938, 35.5018],
};

function parseSeenDate(seendate?: string): Date {
  if (!seendate) return new Date();
  // Format: 20250301T120000Z
  const match = seendate.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z/);
  if (!match) return new Date();
  const [, y, m, d, h, min, s] = match;
  return new Date(Date.UTC(
    parseInt(y!, 10),
    parseInt(m!, 10) - 1,
    parseInt(d!, 10),
    parseInt(h!, 10),
    parseInt(min!, 10),
    parseInt(s!, 10)
  ));
}

function getCoords(domain?: string): { lat: number; lng: number } {
  const key = domain?.toLowerCase();
  if (key && DOMAIN_COORDS[key]) {
    const [lat, lng] = DOMAIN_COORDS[key];
    return { lat, lng };
  }
  return DEFAULT_COORDS;
}

function clampToBbox(lat: number, lng: number): [number, number] {
  return [
    Math.max(LEBANON_BBOX.minLat, Math.min(LEBANON_BBOX.maxLat, lat)),
    Math.max(LEBANON_BBOX.minLng, Math.min(LEBANON_BBOX.maxLng, lng)),
  ];
}

/**
 * Normalizes GDELT articles to LebanonEvent array.
 */
export function normalize(articles: GdeltArticle[], fetchedAt: Date): LebanonEvent[] {
  const events: LebanonEvent[] = [];

  for (let i = 0; i < articles.length; i++) {
    const article = articles[i];
    const { classification, confidence, category } = classifyGdeltEvent(article);
    const { lat, lng } = getCoords(article.domain);
    const [latitude, longitude] = clampToBbox(lat, lng);

    const id = `gdelt-${article.url.replace(/[^a-zA-Z0-9]/g, '_').slice(0, 80)}-${i}`;

    events.push({
      id,
      source: 'gdelt',
      title: article.title || 'Untitled',
      url: article.url,
      timestamp: parseSeenDate(article.seendate),
      latitude,
      longitude,
      classification,
      confidence,
      category,
      severity: 'low',
      rawData: article.tone != null ? { tone: article.tone } : undefined,
      metadata: {
        fetchedAt,
        ttlSeconds: GDELT_CONFIG.ttlSeconds,
        sourceReliability: 'medium',
      },
    });
  }

  return events;
}
