/**
 * Worker indicators — persist LBP, weather, AQI to indicator_snapshot.
 */

import { persistIndicatorSnapshots } from '@/analytics/persist';
import { logger } from '@/lib/logger';

export interface IndicatorPayload {
  lbp?: number | null;
  weatherBeirut?: string | null;
  aqi?: number | null;
}

export async function runIndicators(indicators: IndicatorPayload): Promise<void> {
  if (!indicators.lbp && !indicators.weatherBeirut && !indicators.aqi) {
    return;
  }
  try {
    const now = new Date();
    await persistIndicatorSnapshots(
      {
        lbp: indicators.lbp,
        weatherBeirut: indicators.weatherBeirut,
        aqi: indicators.aqi,
      },
      now
    );
    logger.info('Indicators persisted', {
      lbp: indicators.lbp ?? undefined,
      weather: indicators.weatherBeirut != null ? 'ok' : 'null',
      aqi: indicators.aqi ?? undefined,
    });
  } catch (err) {
    logger.warn('Indicators failed', {
      error: err instanceof Error ? err.message : String(err),
    });
  }
}
