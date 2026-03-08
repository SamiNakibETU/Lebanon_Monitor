/**
 * Persist indicator snapshots to DB when DATABASE_URL is set.
 * Phase F — fire-and-forget, non-blocking.
 */

import { withClient, isDbConfigured } from '@/db/client';
import { createSnapshot } from '@/db/repositories/indicator-snapshot-repository';
import { logger } from '@/lib/logger';

const SNAPSHOT_WINDOW_MS = 60 * 60 * 1000; // 1h

export interface IndicatorPayload {
  lbp?: number | null;
  weatherBeirut?: string | null;
  aqi?: number | null;
}

/**
 * Persists live indicator values to indicator_snapshot.
 * Call after fetchAll; runs async, ignores errors.
 */
export async function persistIndicatorSnapshots(
  indicators: IndicatorPayload,
  computedAt: Date
): Promise<void> {
  if (!isDbConfigured()) return;

  const periodEnd = computedAt;
  const periodStart = new Date(periodEnd.getTime() - SNAPSHOT_WINDOW_MS);

  try {
    await withClient(async (client) => {
      if (indicators.lbp != null) {
        await createSnapshot(client, {
          indicator_key: 'lbp',
          period_start: periodStart,
          period_end: periodEnd,
          payload: { value: indicators.lbp },
        });
      }
      if (indicators.weatherBeirut != null) {
        await createSnapshot(client, {
          indicator_key: 'weather_beirut',
          period_start: periodStart,
          period_end: periodEnd,
          payload: { value: indicators.weatherBeirut },
        });
      }
      if (indicators.aqi != null) {
        await createSnapshot(client, {
          indicator_key: 'aqi',
          period_start: periodStart,
          period_end: periodEnd,
          payload: { value: indicators.aqi },
        });
      }
    });
  } catch (err) {
    logger.warn('Failed to persist indicator snapshots', {
      error: err instanceof Error ? err.message : String(err),
    });
  }
}
