/**
 * GDACS API fetcher.
 */

import { fetchWithTimeout } from '@/lib/fetcher';
import { logger } from '@/lib/logger';
import type { GdacsResponse } from './types';
import { GDACS_CONFIG } from './config';

const SOURCE = 'gdacs';

export async function fetchGdacs(): Promise<
  | { ok: true; data: GdacsResponse }
  | { ok: false; error: { source: string; message: string } }
> {
  const params = new URLSearchParams(GDACS_CONFIG.params);
  const url = `${GDACS_CONFIG.baseUrl}?${params.toString()}`;

  const result = await fetchWithTimeout(url, {}, {
    timeoutMs: 15_000,
    source: SOURCE,
  });

  if (!result.ok) {
    logger.error('GDACS fetch failed', { source: SOURCE, message: result.error.message });
    return { ok: false, error: result.error };
  }

  if (result.data.status === 204) {
    return { ok: true, data: { type: 'FeatureCollection', features: [] } };
  }

  try {
    const text = await result.data.text();
    if (!text.trim()) {
      return { ok: true, data: { type: 'FeatureCollection', features: [] } };
    }
    const data = JSON.parse(text) as GdacsResponse;
    const count = data.features?.length ?? 0;
    logger.info('GDACS fetch successful', { source: SOURCE, eventCount: count });
    return { ok: true, data };
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    logger.error('GDACS parse failed', { source: SOURCE, message });
    return { ok: true, data: { type: 'FeatureCollection', features: [] } };
  }
}
