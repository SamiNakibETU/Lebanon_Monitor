/**
 * ReliefWeb API fetcher.
 * Try without appname; add User-Agent if 403.
 */

import { fetchWithTimeout } from '@/lib/fetcher';
import { logger } from '@/lib/logger';
import type { ReliefWebResponse } from './types';

const SOURCE = 'reliefweb';

function buildUrl(): string {
  const base = 'https://api.reliefweb.int/v1/reports';
  const params = new URLSearchParams();
  params.set('appname', process.env.RELIEFWEB_APPNAME ?? 'lebanon-monitor');
  params.set('filter[field]', 'country');
  params.set('filter[value]', 'Lebanon');
  params.set('limit', '20');
  params.set('sort[]', 'date:desc');
  params.append('fields[include][]', 'title');
  params.append('fields[include][]', 'date.original');
  params.append('fields[include][]', 'source');
  params.append('fields[include][]', 'url');
  params.append('fields[include][]', 'theme');
  return `${base}?${params.toString()}`;
}

const RELIEFWEB_HEADERS: HeadersInit = {
  'User-Agent': 'LebanonMonitor/1.0 (academic research project; github.com/lebanon-monitor)',
  Accept: 'application/json',
};

export async function fetchReliefWeb(): Promise<
  | { ok: true; data: ReliefWebResponse }
  | { ok: false; error: { source: string; message: string } }
> {
  const url = buildUrl();

  const result = await fetchWithTimeout(url, { headers: RELIEFWEB_HEADERS }, {
    timeoutMs: 15_000,
    source: SOURCE,
  });

  if (!result.ok) {
    logger.error('ReliefWeb fetch failed', { source: SOURCE, message: result.error.message });
    return { ok: false, error: result.error };
  }

  try {
    const data = (await result.data.json()) as ReliefWebResponse;
    const count = data.data?.length ?? 0;
    logger.info('ReliefWeb fetch successful', { source: SOURCE, reportCount: count });
    return { ok: true, data };
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    logger.error('ReliefWeb parse failed', { source: SOURCE, message });
    return { ok: false, error: { source: SOURCE, message } };
  }
}
