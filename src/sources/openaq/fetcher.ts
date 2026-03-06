/**
 * OpenAQ API v3 fetcher.
 * Requires OPENAQ_API_KEY from https://explore.openaq.org/register
 */

import { fetchWithTimeout } from '@/lib/fetcher';
import { logger } from '@/lib/logger';
import type { OpenAQResponse, OpenAQResult } from './types';
import type { OpenAQV3LatestResponse } from './types';
import { OPENAQ_CONFIG } from './config';
import { LEBANON_BBOX } from '@/config/lebanon';

const SOURCE = 'openaq';
const PM25_PARAMETER_ID = 2;

function inLebanonBbox(lat: number, lng: number): boolean {
  return lat >= LEBANON_BBOX.minLat && lat <= LEBANON_BBOX.maxLat
    && lng >= LEBANON_BBOX.minLng && lng <= LEBANON_BBOX.maxLng;
}

export async function fetchOpenAQ(): Promise<
  | { ok: true; data: OpenAQResponse }
  | { ok: false; error: { source: string; message: string } }
> {
  const apiKey = process.env.OPENAQ_API_KEY;
  if (!apiKey) {
    logger.warn('OPENAQ_API_KEY not set, v3 requires key from https://explore.openaq.org/register');
    return { ok: false, error: { source: SOURCE, message: 'OPENAQ_API_KEY not configured (v3 required)' } };
  }

  const url = `${OPENAQ_CONFIG.baseUrl}/parameters/${PM25_PARAMETER_ID}/latest?limit=500`;
  const result = await fetchWithTimeout(url, {
    headers: { 'X-API-Key': apiKey },
  }, {
    timeoutMs: 15_000,
    source: SOURCE,
  });

  if (!result.ok) {
    if (result.error.message.includes('401')) {
      return { ok: false, error: { source: SOURCE, message: 'Invalid OPENAQ_API_KEY or unauthorized' } };
    }
    return { ok: false, error: result.error };
  }

  try {
    const data = (await result.data.json()) as OpenAQV3LatestResponse;
    const raw = data.results ?? [];

    const results: OpenAQResult[] = [];
    const seenLocIds = new Set<number>();

    for (const r of raw) {
      const lat = r.coordinates?.latitude ?? 0;
      const lng = r.coordinates?.longitude ?? 0;
      if (!inLebanonBbox(lat, lng) || seenLocIds.has(r.locationsId)) continue;
      seenLocIds.add(r.locationsId);

      results.push({
        location: `Station ${r.locationsId}`,
        coordinates: { latitude: lat, longitude: lng },
        measurements: [{ parameter: 'pm25', value: r.value, unit: 'µg/m³' }],
      });
    }

    logger.info('OpenAQ fetch successful', { source: SOURCE, resultCount: results.length });
    return { ok: true, data: { results } };
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    logger.error('OpenAQ parse failed', { source: SOURCE, message });
    return { ok: false, error: { source: SOURCE, message } };
  }
}
