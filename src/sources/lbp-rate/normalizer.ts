/**
 * Normalizes LBP rate to LebanonEvent.
 * Classification depends on rate change (requires storing previous value in production).
 */

import type { LebanonEvent } from '@/types/events';
import { LBP_RATE_CONFIG } from './config';

export function normalize(
  rate: number,
  fetchedAt: Date,
  previousRate?: number
): LebanonEvent[] {
  let classification: LebanonEvent['classification'] = 'neutre';
  let confidence = 0.5;

  if (previousRate !== undefined) {
    if (rate < previousRate) {
      classification = 'lumiere';
      confidence = 0.7;
    } else if (rate > previousRate) {
      classification = 'ombre';
      confidence = 0.7;
    }
  }

  return [
    {
      id: `lbp-rate-${fetchedAt.getTime()}`,
      source: 'lbp-rate',
      title: `LBP/USD: ${rate.toLocaleString()}`,
      timestamp: fetchedAt,
      latitude: LBP_RATE_CONFIG.defaultCoords.lat,
      longitude: LBP_RATE_CONFIG.defaultCoords.lng,
      classification,
      confidence,
      category: classification === 'lumiere' ? 'economic_positive' : classification === 'ombre' ? 'economic_crisis' : 'neutral',
      severity: 'low',
      rawData: { rate, previousRate },
      metadata: {
        fetchedAt,
        ttlSeconds: LBP_RATE_CONFIG.ttlSeconds,
        sourceReliability: 'medium',
      },
    },
  ];
}
