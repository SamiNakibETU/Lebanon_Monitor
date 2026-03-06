/**
 * Normalizes GDACS disaster alerts to LebanonEvent[].
 */

import type { LebanonEvent } from '@/types/events';
import { GDACS_CONFIG } from './config';
import type { GdacsFeature } from './types';

function alertToSeverity(alertlevel?: string): LebanonEvent['severity'] {
  if (!alertlevel) return 'medium';
  const level = alertlevel.toLowerCase();
  if (level === 'green') return 'low';
  if (level === 'orange') return 'high';
  if (level === 'red') return 'critical';
  return 'medium';
}

export function normalize(features: GdacsFeature[], fetchedAt: Date): LebanonEvent[] {
  const events: LebanonEvent[] = [];

  for (let i = 0; i < features.length; i++) {
    const f = features[i];
    const [lng, lat] = f.geometry.coordinates;
    const id = `gdacs-${f.properties.name ?? i}-${i}`.replace(/[^a-zA-Z0-9-]/g, '_');

    events.push({
      id,
      source: 'gdacs',
      title: f.properties.name ?? `${f.properties.eventtype ?? 'Disaster'} alert`,
      description: f.properties.description,
      timestamp: new Date(f.properties.fromdate ?? Date.now()),
      latitude: lat,
      longitude: lng,
      classification: 'ombre',
      confidence: 1,
      category: 'environmental_negative',
      severity: alertToSeverity(f.properties.alertlevel),
      metadata: {
        fetchedAt,
        ttlSeconds: GDACS_CONFIG.ttlSeconds,
        sourceReliability: 'high',
      },
    });
  }

  return events;
}
