/**
 * Normalizes FIRMS fire data to LebanonEvent[].
 */

import type { LebanonEvent } from '@/types/events';
import { FIRMS_CONFIG } from './config';
import type { FirmsRow } from './types';

function frpToSeverity(frp: number): LebanonEvent['severity'] {
  if (frp < 10) return 'low';
  if (frp < 50) return 'medium';
  return 'high';
}

function parseDate(acq_date?: string, acq_time?: string): Date {
  if (!acq_date) return new Date();
  const [y, m, d] = acq_date.split('-').map(Number);
  let hours = 0;
  let mins = 0;
  if (acq_time) {
    const h = acq_time.slice(0, 2);
    const min = acq_time.slice(2, 4);
    hours = parseInt(h, 10);
    mins = parseInt(min, 10);
  }
  return new Date(y!, m! - 1, d!, hours, mins);
}

export function normalize(rows: FirmsRow[], fetchedAt: Date): LebanonEvent[] {
  const events: LebanonEvent[] = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const frp = row.frp ?? 0;
    const id = `firms-${row.latitude}-${row.longitude}-${row.acq_date}-${i}`;

    events.push({
      id,
      source: 'firms',
      title: `Fire hotspot (FRP: ${frp.toFixed(1)})`,
      timestamp: parseDate(row.acq_date, row.acq_time),
      latitude: row.latitude,
      longitude: row.longitude,
      classification: 'ombre',
      confidence: 1,
      category: 'environmental_negative',
      severity: frpToSeverity(frp),
      metadata: {
        fetchedAt,
        ttlSeconds: FIRMS_CONFIG.ttlSeconds,
        sourceReliability: 'high',
      },
    });
  }

  return events;
}
