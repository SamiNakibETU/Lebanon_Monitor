/**
 * Normalizes USGS GeoJSON to LebanonEvent[].
 */

import type { LebanonEvent } from '@/types/events';
import { USGS_CONFIG } from './config';
import type { UsgsFeature } from './types';

function magnitudeToSeverity(mag: number): LebanonEvent['severity'] {
  if (mag < 3) return 'low';
  if (mag < 4.5) return 'medium';
  if (mag < 6) return 'high';
  return 'critical';
}

export function normalize(features: UsgsFeature[], fetchedAt: Date): LebanonEvent[] {
  const events: LebanonEvent[] = [];

  for (const f of features) {
    const [lng, lat] = f.geometry.coordinates;
    const mag = f.properties.mag ?? 0;
    const time = f.properties.time ?? Date.now();
    const id = `usgs-${f.id ?? f.properties.url ?? `eq-${time}`}`;

    events.push({
      id,
      source: 'usgs',
      title: f.properties.title ?? f.properties.place ?? `M ${mag} earthquake`,
      description: f.properties.place,
      url: f.properties.url,
      timestamp: new Date(time),
      latitude: lat,
      longitude: lng,
      classification: 'ombre',
      confidence: 1,
      category: 'environmental_negative',
      severity: magnitudeToSeverity(mag),
      rawData: f.properties as unknown as Record<string, unknown>,
      metadata: {
        fetchedAt,
        ttlSeconds: USGS_CONFIG.ttlSeconds,
        sourceReliability: 'high',
      },
    });
  }

  return events;
}
