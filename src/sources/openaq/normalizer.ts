/**
 * Normalizes OpenAQ results to LebanonEvent[].
 */

import type { LebanonEvent } from '@/types/events';
import { OPENAQ_CONFIG } from './config';
import type { OpenAQResult, OpenAQMeasurement } from './types';

function pm25ToClassification(pm25: number): { classification: LebanonEvent['classification']; confidence: number } {
  if (pm25 > 35) return { classification: 'ombre', confidence: 0.9 };
  if (pm25 <= 12) return { classification: 'lumiere', confidence: 0.8 };
  return { classification: 'neutre', confidence: 0.5 };
}

export function normalize(results: OpenAQResult[], fetchedAt: Date): LebanonEvent[] {
  const events: LebanonEvent[] = [];

  for (const r of results) {
    const pm25 = r.measurements?.find((m: OpenAQMeasurement) => m.parameter === 'pm25')?.value ?? 0;
    const lat = r.coordinates?.latitude ?? 33.89;
    const lng = r.coordinates?.longitude ?? 35.5;

    const { classification, confidence } = pm25ToClassification(pm25);

    events.push({
      id: `openaq-${r.location ?? r.city ?? 'unknown'}-${lat}-${lng}`,
      source: 'openaq',
      title: `${r.location ?? r.city ?? 'Station'}: PM2.5 ${pm25.toFixed(1)} µg/m³`,
      rawData: { pm25 },
      timestamp: fetchedAt,
      latitude: lat,
      longitude: lng,
      classification,
      confidence,
      category: classification === 'ombre' ? 'environmental_negative' : classification === 'lumiere' ? 'environmental_positive' : 'neutral',
      severity: pm25 > 35 ? 'high' : pm25 > 12 ? 'medium' : 'low',
      metadata: {
        fetchedAt,
        ttlSeconds: OPENAQ_CONFIG.ttlSeconds,
        sourceReliability: 'medium',
      },
    });
  }

  return events;
}
