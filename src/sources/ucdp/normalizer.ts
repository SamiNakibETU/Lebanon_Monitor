/**
 * Normalizes UCDP GED events to LebanonEvent[].
 * NOT WIRED — for future registry integration when DB is stable.
 */

import type { LebanonEvent } from '@/types/events';
import { classify } from '@/core/classification';
import { UCDP_CONFIG } from './config';
import type { UcdpGedEvent } from './types';

export function normalize(events: UcdpGedEvent[], fetchedAt: Date): LebanonEvent[] {
  const result: LebanonEvent[] = [];

  for (const e of events) {
    const fallback = `${e.side_a ?? ''} - ${e.side_b ?? ''}`.trim();
    const title = e.source_headline ?? (fallback || 'UCDP event');
    const { classification, confidence, category } = classify(title);

    result.push({
      id: `ucdp-${e.relid ?? e.id}`,
      source: 'ucdp',
      title,
      timestamp: new Date(e.date_end ?? e.date_start),
      latitude: e.latitude ?? UCDP_CONFIG.defaultCoords.lat,
      longitude: e.longitude ?? UCDP_CONFIG.defaultCoords.lng,
      classification,
      confidence,
      category: category as LebanonEvent['category'],
      severity: (e.best ?? 0) >= 10 ? 'high' : (e.best ?? 0) >= 1 ? 'medium' : 'low',
      rawData: { ...e },
      metadata: {
        fetchedAt,
        ttlSeconds: UCDP_CONFIG.ttlSeconds,
        sourceReliability: 'high',
      },
    });
  }

  return result;
}
