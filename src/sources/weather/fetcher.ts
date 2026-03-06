/**
 * OpenWeatherMap API fetcher.
 */

import { fetchWithTimeout } from '@/lib/fetcher';
import { logger } from '@/lib/logger';
import type { OwmResponse } from './types';
import { WEATHER_CONFIG, WEATHER_CITIES } from './config';

const SOURCE = 'weather';

export async function fetchWeather(): Promise<
  | { ok: true; data: Array<{ city: string; lat: number; lng: number; data: OwmResponse }> }
  | { ok: false; error: { source: string; message: string } }
> {
  const key = process.env.OWM_API_KEY;
  if (!key) {
    logger.warn('OWM_API_KEY not set, skipping fetch');
    return { ok: false, error: { source: SOURCE, message: 'OWM_API_KEY not configured' } };
  }

  const results: Array<{ city: string; lat: number; lng: number; data: OwmResponse }> = [];

  for (const city of WEATHER_CITIES) {
    try {
      const params = new URLSearchParams({
        lat: String(city.lat),
        lon: String(city.lng),
        appid: key,
        units: 'metric',
      });
      const url = `${WEATHER_CONFIG.baseUrl}?${params.toString()}`;

      const result = await fetchWithTimeout(url, {}, {
        timeoutMs: 10_000,
        source: SOURCE,
      });

      if (result.ok) {
        const data = (await result.data.json()) as OwmResponse;
        results.push({ city: city.name, lat: city.lat, lng: city.lng, data });
      }
    } catch {
      // Skip failed city
    }
  }

  logger.info('Weather fetch completed', { source: SOURCE, cityCount: results.length });
  return { ok: true, data: results };
}
