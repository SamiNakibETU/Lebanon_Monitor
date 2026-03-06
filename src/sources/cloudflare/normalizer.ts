/**
 * Normalizes Cloudflare outage data to LebanonEvent[].
 */

import type { LebanonEvent } from '@/types/events';
import { CLOUDFLARE_CONFIG } from './config';
import type { CloudflareOutage } from './types';

function durationToSeverity(start?: string, end?: string): LebanonEvent['severity'] {
  const startMs = start ? new Date(start).getTime() : 0;
  const endMs = end ? new Date(end).getTime() : Date.now();
  const durationHours = (endMs - startMs) / (1000 * 60 * 60);

  if (durationHours > 6) return 'critical';
  if (durationHours > 1) return 'high';
  return 'medium';
}

export function normalize(outages: CloudflareOutage[], fetchedAt: Date): LebanonEvent[] {
  const events: LebanonEvent[] = [];

  for (let i = 0; i < outages.length; i++) {
    const o = outages[i];
    const severity = durationToSeverity(o.startDate, o.endDate);

    events.push({
      id: `cloudflare-${o.startDate ?? i}-${i}`,
      source: 'cloudflare',
      title: `Internet outage (${o.scope ?? 'Lebanon'})`,
      timestamp: o.startDate ? new Date(o.startDate) : fetchedAt,
      latitude: CLOUDFLARE_CONFIG.defaultCoords.lat,
      longitude: CLOUDFLARE_CONFIG.defaultCoords.lng,
      classification: 'ombre',
      confidence: 1,
      category: 'infrastructure_failure',
      severity,
      metadata: {
        fetchedAt,
        ttlSeconds: CLOUDFLARE_CONFIG.ttlSeconds,
        sourceReliability: 'high',
      },
    });
  }

  return events;
}
