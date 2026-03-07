/**
 * ACLED events → LebanonEvent.
 * ACLED event_type maps to ombre (violence, conflict).
 */

import type { LebanonEvent } from '@/types/events';
import { ACLED_CONFIG } from './config';
import type { ACLEDEvent } from './types';
import { LEBANON_BBOX } from '@/config/lebanon';

function clampLatLng(lat: number | undefined, lng: number | undefined): { lat: number; lng: number } {
  if (lat != null && lng != null && !Number.isNaN(lat) && !Number.isNaN(lng)) {
    return {
      lat: Math.max(LEBANON_BBOX.minLat, Math.min(LEBANON_BBOX.maxLat, lat)),
      lng: Math.max(LEBANON_BBOX.minLng, Math.min(LEBANON_BBOX.maxLng, lng)),
    };
  }
  return ACLED_CONFIG.defaultCoords;
}

export function normalize(raw: ACLEDEvent, fetchedAt: Date): LebanonEvent[] {
  const events: LebanonEvent[] = [];
  const items = raw.data ?? [];

  for (const item of items) {
    const title = item.notes?.slice(0, 200) ?? `${item.event_type ?? 'Conflict'} in ${item.location ?? 'Lebanon'}`;
    const { lat, lng } = clampLatLng(item.latitude, item.longitude);

    events.push({
      id: `acled-${item.id ?? `${item.event_date}-${item.location}-${Math.random().toString(36).slice(2, 9)}`}`,
      source: 'acled',
      title,
      url: `https://acleddata.com/data/#/dashboard`,
      timestamp: item.event_date ? new Date(item.event_date) : fetchedAt,
      latitude: lat,
      longitude: lng,
      classification: 'ombre',
      confidence: 0.95,
      category: 'armed_conflict',
      severity: (item.fatalities ?? 0) > 10 ? 'high' : (item.fatalities ?? 0) > 0 ? 'medium' : 'low',
      rawData: {
        event_type: item.event_type,
        sub_event_type: item.sub_event_type,
        actor1: item.actor1,
        actor2: item.actor2,
        fatalities: item.fatalities,
      },
      metadata: {
        fetchedAt,
        ttlSeconds: ACLED_CONFIG.ttlSeconds,
        sourceReliability: 'high',
      },
    });
  }

  return events;
}
