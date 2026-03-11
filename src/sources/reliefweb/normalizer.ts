/**
 * Normalizes ReliefWeb reports to LebanonEvent[].
 */

import type { LebanonEvent } from '@/types/events';
import { classifyByKeywords } from '@/lib/classification/classifier';
import { RELIEFWEB_CONFIG } from './config';
import type { ReliefWebReport } from './types';

function getCategoryFromClassification(
  result: ReturnType<typeof classifyByKeywords>
): LebanonEvent['category'] {
  if (result.classification === 'lumiere') return 'aid_delivery_verified';
  if (result.classification === 'ombre') return 'political_tension';
  return 'neutral';
}

export function normalize(reports: ReliefWebReport[], fetchedAt: Date): LebanonEvent[] {
  const events: LebanonEvent[] = [];

  for (const report of reports) {
    const title = report.fields?.title ?? 'Untitled';
    const text = `${title} ${(report.fields?.theme ?? []).map((t) => t.name).join(' ')}`;
    const { classification, confidence } = classifyByKeywords(text);
    const category = getCategoryFromClassification({ classification, confidence, category: 'neutral' });

    const dateStr = report.fields?.date?.original;
    const timestamp = dateStr ? new Date(dateStr) : new Date();

    events.push({
      id: `reliefweb-${report.id}`,
      source: 'reliefweb',
      title,
      url: report.fields?.url,
      timestamp,
      latitude: RELIEFWEB_CONFIG.defaultCoords.lat,
      longitude: RELIEFWEB_CONFIG.defaultCoords.lng,
      classification,
      confidence,
      category,
      severity: 'low',
      metadata: {
        fetchedAt,
        ttlSeconds: RELIEFWEB_CONFIG.ttlSeconds,
        sourceReliability: 'high',
      },
    });
  }

  return events;
}
