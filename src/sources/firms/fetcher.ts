/**
 * NASA FIRMS API fetcher.
 * Requires FIRMS_MAP_KEY in .env.local.
 */

import { fetchWithTimeout } from '@/lib/fetcher';
import { logger } from '@/lib/logger';
import { FIRMS_CONFIG } from './config';
import { parseCsv } from './parser';

const SOURCE = 'firms';

export async function fetchFirms(): Promise<
  | { ok: true; data: string }
  | { ok: false; error: { source: string; message: string } }
> {
  const mapKey = process.env.FIRMS_MAP_KEY;
  if (!mapKey) {
    logger.warn('FIRMS_MAP_KEY not set, skipping fetch');
    return { ok: false, error: { source: SOURCE, message: 'FIRMS_MAP_KEY not configured' } };
  }

  const url = `${FIRMS_CONFIG.baseUrl}/${mapKey}/${FIRMS_CONFIG.instrument}/${FIRMS_CONFIG.area}/${FIRMS_CONFIG.days}`;

  const result = await fetchWithTimeout(url, {}, {
    timeoutMs: 15_000,
    source: SOURCE,
  });

  if (!result.ok) {
    logger.error('FIRMS fetch failed', { source: SOURCE, message: result.error.message });
    return { ok: false, error: result.error };
  }

  try {
    const text = await result.data.text();
    logger.info('FIRMS fetch successful', { source: SOURCE, rowCount: text.split('\n').length - 1 });
    return { ok: true, data: text };
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    logger.error('FIRMS parse failed', { source: SOURCE, message });
    return { ok: false, error: { source: SOURCE, message } };
  }
}

export async function fetchFirmsParsed(): Promise<
  | { ok: true; data: ReturnType<typeof parseCsv> }
  | { ok: false; error: { source: string; message: string } }
> {
  const result = await fetchFirms();
  if (!result.ok) return result;
  try {
    const parsed = parseCsv(result.data);
    return { ok: true, data: parsed };
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return { ok: false, error: { source: SOURCE, message } };
  }
}
