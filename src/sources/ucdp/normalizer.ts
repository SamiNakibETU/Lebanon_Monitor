/**
 * UCDP GED events → LebanonEvent.
 */

import type { LebanonEvent } from '@/types/events';
import { UCDP_CONFIG } from './config';
import { LEBANON_BBOX } from '@/config/lebanon';
import type { UCDPEvent } from './types';

function clampLatLng(lat: number | undefined, lng: number | undefined): { lat: number; lng: number } {
  if (lat != null && lng != null && !Number.isNaN(lat) && !Number.isNaN(lng)) {
    return {
      lat: Math.max(LEBANON_BBOX.minLat, Math.min(LEBANON_BBOX.maxLat, lat)),
      lng: Math.max(LEBANON_BBOX.minLng, Math.min(LEBANON_BBOX.maxLng, lng)),
    };
  }
  return UCDP_CONFIG.defaultCoords;
}

export function normalize(raw: { Results?: UCDPEvent[] }, fetchedAt: Date): LebanonEvent[] {
  const events: LebanonEvent[] = [];
  const items = raw.Results ?? [];

  for (const item of items) {
    const deaths = (item.deaths_a ?? 0) + (item.deaths_b ?? 0) + (item.deaths_civilians ?? 0);
    const title = `Violence event in Lebanon${deaths > 0 ? ` — ${deaths} fatalities` : ''}`;
    const { lat, lng } = clampLatLng(item.latitude, item.longitude);

    events.push({
      id: `ucdp-${item.id ?? `${item.date_start}-${Math.random().toString(36).slice(2, 9)}`}`,
      source: 'ucdp',
      title,
      timestamp: item.date_start ? new Date(item.date_start) : fetchedAt,
      latitude: lat,
      longitude: lng,
      classification: 'ombre',
      confidence: 0.98,
      category: 'violence',
      severity: deaths > 10 ? 'critical' : deaths > 0 ? 'high' : 'medium',
      rawData: {
        type_of_violence: item.type_of_violence,
        deaths_a: item.deaths_a,
        deaths_b: item.deaths_b,
        deaths_civilians: item.deaths_civilians,
      },
      metadata: {
        fetchedAt,
        ttlSeconds: UCDP_CONFIG.ttlSeconds,
        sourceReliability: 'high',
      },
    });
  }

  return events;
}
