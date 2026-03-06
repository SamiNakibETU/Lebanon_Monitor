/**
 * USGS Earthquake API fetcher.
 */

import { fetchWithTimeout } from '@/lib/fetcher';
import { logger } from '@/lib/logger';
import type { UsgsResponse } from './types';
import { USGS_CONFIG } from './config';

const SOURCE = 'usgs';

export async function fetchUsgs(): Promise<
  { ok: true; data: UsgsResponse } | { ok: false; error: { source: string; message: string } }
> {
  const params = new URLSearchParams(USGS_CONFIG.params);
  const url = `${USGS_CONFIG.baseUrl}?${params.toString()}`;

  const result = await fetchWithTimeout(url, {}, {
    timeoutMs: 15_000,
    source: SOURCE,
  });

  if (!result.ok) {
    logger.error('USGS fetch failed', { source: SOURCE, message: result.error.message });
    return { ok: false, error: result.error };
  }

  try {
    const data = (await result.data.json()) as UsgsResponse;
    const count = data.features?.length ?? 0;
    logger.info('USGS fetch successful', { source: SOURCE, eventCount: count });
    return { ok: true, data };
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    logger.error('USGS parse failed', { source: SOURCE, message });
    return { ok: false, error: { source: SOURCE, message } };
  }
}
